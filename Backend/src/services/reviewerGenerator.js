import { config } from "../config.js";
import { generateWithAI, generateWithAIVision, aiIsConfigured } from "./aiProvider.js";
import {
  normalizeText,
  splitSentences,
  extractKeyTerms,
  summarize,
  pickTopSentences,
  firstSentenceWithTerm,
  extractDefinitionSentences,
  identifyLessons,
  splitTextIntoLessons
} from "../utils/text.js";
import {
  buildLocalExam,
  buildLocalFlashcards,
  buildOutline
} from "../utils/questions.js";

const VALID_DIFFICULTY = new Set(["easy", "medium", "hard"]);
const VALID_LANGUAGES = new Set(["English", "Tagalog"]);

// ─── Normalization helpers ────────────────────────────────────────────────────

function normalizeArray(value) {
  return Array.isArray(value) ? value : [];
}

function normalizeLesson(lesson) {
  if (!lesson) return null;
  return {
    lessonNumber: lesson.lessonNumber || 1,
    title: typeof lesson.title === "string" ? lesson.title : "Untitled Lesson",
    learningObjectives: normalizeArray(lesson.learningObjectives),
    keyConcepts: normalizeArray(lesson.keyConcepts),
    definitions: normalizeArray(lesson.definitions),
    detailedExplanation: lesson.detailedExplanation || "",
    examples: normalizeArray(lesson.examples),
    importantNotes: normalizeArray(lesson.importantNotes),
    importantTerms: normalizeArray(lesson.importantTerms),
    summary: lesson.summary || ""
  };
}

function validateExamQuestion(q) {
  if (!q || typeof q.question !== "string" || !q.question.trim()) return null;

  const options = normalizeArray(q.options).map(String).filter(Boolean);
  if (options.length !== 4) return null;

  let answerIndex = typeof q.answerIndex === "number" ? q.answerIndex : -1;
  if (answerIndex < 0 || answerIndex > 3) {
    const answerText = String(q.answer || "").trim();
    answerIndex = options.findIndex((o) => o.trim() === answerText);
    if (answerIndex === -1) return null;
  }

  const answer = options[answerIndex];
  const uniqueOptions = new Set(options.map((o) => o.trim()));
  if (uniqueOptions.size < 4) return null;

  const wrongExplanations = {};
  for (let i = 0; i < 4; i++) {
    if (i !== answerIndex) {
      const raw = q.wrongExplanations?.[String(i)];
      wrongExplanations[String(i)] = (typeof raw === "string" && raw.trim())
        ? raw.trim()
        : `Option "${options[i]}" is not correct for this question.`;
    }
  }

  return {
    question: q.question.trim(),
    options,
    answerIndex,
    answer,
    explanation: (typeof q.explanation === "string" && q.explanation.trim())
      ? q.explanation.trim()
      : `The correct answer is: ${answer}`,
    wrongExplanations
  };
}

function validateExam(exam) {
  if (!exam) return null;
  const questions = normalizeArray(exam.questions).map(validateExamQuestion).filter(Boolean);
  if (!questions.length) return null;
  return { description: exam.description || "Exam", questions };
}

function normalizeFlashcard(fc) {
  if (!fc) return null;
  const front = typeof fc.front === "string" ? fc.front.trim() : "";
  const back = typeof fc.back === "string" ? fc.back.trim() : "";
  if (!front || !back) return null;
  return {
    front,
    back,
    rationale: (typeof fc.rationale === "string" && fc.rationale.trim()) ? fc.rationale.trim() : ""
  };
}

function normalizeAiOutput(raw) {
  if (!raw) return null;

  const lessons = normalizeArray(raw.lessons).map(normalizeLesson).filter(Boolean);
  const tableOfContents = normalizeArray(raw.tableOfContents).length
    ? normalizeArray(raw.tableOfContents)
    : lessons.map((l) => `Lesson ${l.lessonNumber}: ${l.title}`);

  return {
    title: (typeof raw.title === "string" && raw.title.trim()) ? raw.title.trim() : null,
    tableOfContents,
    summaryShort: raw.summaryShort || "",
    summaryDetailed: raw.summaryDetailed || "",
    lessons,
    exam: validateExam(raw.exam),
    keyConcepts: normalizeArray(raw.keyConcepts),
    definitions: normalizeArray(raw.definitions),
    bullets: normalizeArray(raw.bullets).filter((b) => typeof b === "string" && b.trim()),
    flashcards: normalizeArray(raw.flashcards).map(normalizeFlashcard).filter(Boolean),
    outline: normalizeArray(raw.outline),
    highlightTerms: normalizeArray(raw.highlightTerms).filter((t) => typeof t === "string" && t.trim())
  };
}

// ─── Chunking ─────────────────────────────────────────────────────────────────

/**
 * Split text at sentence boundaries so each chunk stays within maxChars.
 */
function chunkText(text, maxChars) {
  if (text.length <= maxChars) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  const chunks = [];
  let current = "";

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence + " ";
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Merge the AI outputs from multiple chunks into one coherent object.
 * First chunk provides the primary structure; later chunks extend it.
 */
function mergeAiOutputs(outputs) {
  const valid = outputs.filter(Boolean);
  if (!valid.length) return null;
  if (valid.length === 1) return valid[0];

  const merged = { ...valid[0] };
  const seenLessonNumbers = new Set(merged.lessons.map((l) => l.lessonNumber));
  const seenTerms = new Set([
    ...merged.keyConcepts.map((c) => c.term?.toLowerCase()),
    ...merged.definitions.map((d) => d.term?.toLowerCase())
  ]);
  let lessonOffset = Math.max(...merged.lessons.map((l) => l.lessonNumber), 0);

  for (let i = 1; i < valid.length; i++) {
    const chunk = valid[i];

    for (const lesson of chunk.lessons || []) {
      const newNum = lesson.lessonNumber + lessonOffset;
      if (!seenLessonNumbers.has(newNum)) {
        merged.lessons.push({ ...lesson, lessonNumber: newNum });
        seenLessonNumbers.add(newNum);
      }
    }
    lessonOffset += (chunk.lessons?.length || 0);

    merged.tableOfContents = [
      ...merged.tableOfContents,
      ...(chunk.tableOfContents || []).slice(1)
    ];

    for (const c of chunk.keyConcepts || []) {
      if (c.term && !seenTerms.has(c.term.toLowerCase())) {
        merged.keyConcepts.push(c);
        seenTerms.add(c.term.toLowerCase());
      }
    }
    for (const d of chunk.definitions || []) {
      if (d.term && !seenTerms.has(d.term.toLowerCase())) {
        merged.definitions.push(d);
        seenTerms.add(d.term.toLowerCase());
      }
    }

    merged.bullets = [...(merged.bullets || []), ...(chunk.bullets || [])];
    merged.flashcards = [...(merged.flashcards || []), ...(chunk.flashcards || [])];
    merged.highlightTerms = [...new Set([...(merged.highlightTerms || []), ...(chunk.highlightTerms || [])])];

    if (!merged.exam && chunk.exam) merged.exam = chunk.exam;
    else if (chunk.exam?.questions?.length > (merged.exam?.questions?.length || 0)) {
      merged.exam = chunk.exam;
    }
  }

  return merged;
}

// ─── Local (no-AI) builder ────────────────────────────────────────────────────

function titleCase(value) {
  return value.split(" ").map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(" ");
}

function buildLocalLesson(lessonText, lessonNumber, lessonTitle) {
  const sentences = splitSentences(lessonText);
  const defPairs = extractDefinitionSentences(lessonText);
  const keyTerms = extractKeyTerms(lessonText, 8);

  const keyConcepts = defPairs.length
    ? defPairs.map((p) => ({ term: p.term, description: p.definition }))
    : keyTerms.map((term) => {
        const sentence = firstSentenceWithTerm(sentences, term);
        return { term: titleCase(term), description: sentence || "" };
      }).filter((c) => c.description);

  const definitions = keyConcepts.map((c) => ({ term: c.term, definition: c.description }));

  return {
    lessonNumber,
    title: lessonTitle || `Lesson ${lessonNumber}`,
    learningObjectives: keyConcepts.slice(0, 3).map((c) => `Understand ${c.term}`),
    keyConcepts,
    definitions,
    detailedExplanation: summarize(sentences, 5),
    examples: sentences.filter((s) => /for example|such as|e\.g\./i.test(s)).slice(0, 3),
    importantNotes: sentences.filter((s) => /important|note that|remember|key|warning/i.test(s)).slice(0, 3),
    importantTerms: keyConcepts.map((c) => c.term),
    summary: summarize(sentences, 3)
  };
}

function buildLocalReviewer(rawText, normalizedText, subject, difficulty, examEnabled, examCount, flashcardsEnabled) {
  const sentences = splitSentences(normalizedText);
  const defPairs = extractDefinitionSentences(normalizedText);
  const keyTermsFromFreq = extractKeyTerms(normalizedText, 15);

  const seenTerms = new Set();
  const keyConcepts = [];

  for (const p of defPairs) {
    if (!seenTerms.has(p.term.toLowerCase())) {
      seenTerms.add(p.term.toLowerCase());
      keyConcepts.push({ term: p.term, description: p.definition });
    }
  }
  for (const term of keyTermsFromFreq) {
    if (!seenTerms.has(term.toLowerCase())) {
      const sentence = firstSentenceWithTerm(sentences, term);
      if (sentence) {
        seenTerms.add(term.toLowerCase());
        keyConcepts.push({ term: titleCase(term), description: sentence });
      }
    }
  }

  const definitions = keyConcepts.map((c) => ({ term: c.term, definition: c.description }));
  const summaryShort = summarize(sentences, 3);
  const summaryDetailed = summarize(sentences, 7);
  const bullets = pickTopSentences(sentences, 12);

  const lessonMarkers = identifyLessons(rawText);
  const lessonSections = splitTextIntoLessons(rawText, lessonMarkers);
  const lessons = lessonSections.map((sec) =>
    buildLocalLesson(sec.text, sec.number, sec.title)
  );

  return {
    title: subject || "Untitled Reviewer",
    tableOfContents: lessons.map((l) => `Lesson ${l.lessonNumber}: ${l.title}`),
    summaryShort,
    summaryDetailed,
    lessons,
    exam: examEnabled ? buildLocalExam({ keyConcepts, definitions, sentences, difficulty, examCount }) : null,
    keyConcepts,
    definitions,
    bullets,
    flashcards: flashcardsEnabled ? buildLocalFlashcards(definitions, keyConcepts) : [],
    outline: buildOutline(summaryShort, keyConcepts, bullets),
    highlightTerms: keyConcepts.map((c) => c.term)
  };
}

// ─── AI chunk processing ──────────────────────────────────────────────────────

/**
 * Run AI on all chunks.
 *
 * Speed improvements over old approach:
 * 1. Chunks run in PARALLEL with Promise.all — no serial waiting.
 * 2. No local build is done before we know whether AI will succeed.
 * 3. Exam/flashcards are only requested on chunk[0]; content-only on rest.
 *
 * Returns array of parsed AI outputs (nulls preserved for merge filtering).
 */
async function processChunksWithAI(chunks, { subject, difficulty, language, examEnabled, examCount, flashcardsEnabled }) {
  const tasks = chunks.map((chunkText, i) =>
    generateWithAI({
      text: chunkText,
      subject,
      difficulty,
      language,
      // Only the first chunk gets exam/flashcards — avoids duplicates across chunks
      examEnabled: i === 0 ? examEnabled : false,
      examCount,
      flashcardsEnabled: i === 0 ? flashcardsEnabled : false
    }).catch((err) => {
      console.warn(`[reviewerGenerator] chunk ${i + 1} failed: ${err.message}`);
      return null;
    })
  );

  console.log(`[reviewerGenerator] Processing ${chunks.length} chunk(s) in parallel`);
  return Promise.all(tasks);
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function generateReviewer({ text, options, file }) {
  const subject = options.subject?.trim() || "General Studies";
  const tags = options.tags || [];
  const difficulty = VALID_DIFFICULTY.has(options.difficulty) ? options.difficulty : "medium";
  const language = VALID_LANGUAGES.has(options.language) ? options.language : "English";
  const examEnabled = !!options.examEnabled;
  const examCount = typeof options.examCount === "number" ? options.examCount : 10;
  const flashcardsEnabled = options.flashcardsEnabled !== false;

  // ── Image input ─────────────────────────────────────────────────────────────
  if (text && typeof text === "object" && text.__isImage) {
    const warnings = [];
    if (!aiIsConfigured()) {
      warnings.push("Image processing requires GEMINI_API_KEY. Please add it to Backend/.env.");
      return emptyResult({ subject, tags, difficulty, language, examEnabled, flashcardsEnabled, file, warnings });
    }

    const aiOutput = await generateWithAIVision({
      base64: text.base64,
      mimeType: text.mimeType,
      subject, difficulty, language, examEnabled, examCount, flashcardsEnabled
    });

    if (!aiOutput) {
      warnings.push("Could not extract content from the image. Please try a clearer image or use a text-based file.");
      return emptyResult({ subject, tags, difficulty, language, examEnabled, flashcardsEnabled, file, warnings });
    }

    const normalized = normalizeAiOutput(aiOutput);
    return {
      ...normalized,
      subject, tags, difficulty,
      languageRequested: language, languageUsed: language,
      examEnabled, flashcardsEnabled, warnings,
      source: { filename: file.originalname, size: file.size, mime: file.mimetype },
      textPreview: "(image file)"
    };
  }

  // ── Text input ──────────────────────────────────────────────────────────────
  const rawText = String(text).replace(/\r\n/g, "\n").trim();
  const normalizedFull = normalizeText(rawText);
  const warnings = [];
  const textPreview = normalizedFull.slice(0, 600);

  // No AI keys — skip directly to local build
  if (!aiIsConfigured()) {
    warnings.push("AI provider not configured — add GEMINI_API_KEY or GROQ_API_KEY to Backend/.env for richer results.");
    const local = buildLocalReviewer(rawText, normalizedFull, subject, difficulty, examEnabled, examCount, flashcardsEnabled);
    return finalize({ reviewer: local, aiUsed: false, language, subject, tags, difficulty, examEnabled, flashcardsEnabled, file, warnings, textPreview });
  }

  // ── Parallel AI chunk processing ────────────────────────────────────────────
  const chunks = chunkText(normalizedFull, config.maxCharsPerChunk);

  if (chunks.length > 1) {
    warnings.push(`Document split into ${chunks.length} sections for complete processing.`);
    console.log(`[reviewerGenerator] ${chunks.length} chunks, sizes: ${chunks.map((c) => c.length).join(", ")} chars`);
  } else {
    console.log(`[reviewerGenerator] Single chunk (${chunks[0].length} chars)`);
  }

  const aiRawOutputs = await processChunksWithAI(chunks, { subject, difficulty, language, examEnabled, examCount, flashcardsEnabled });

  const mergedRaw = mergeAiOutputs(aiRawOutputs);
  const aiNormalized = normalizeAiOutput(mergedRaw);

  // AI failed entirely — fall back to local NLP now (not before)
  if (!aiNormalized) {
    warnings.push("AI analysis failed — showing local extraction. Check your API keys and network.");
    const local = buildLocalReviewer(rawText, normalizedFull, subject, difficulty, examEnabled, examCount, flashcardsEnabled);
    return finalize({ reviewer: local, aiUsed: false, language, subject, tags, difficulty, examEnabled, flashcardsEnabled, file, warnings, textPreview });
  }

  // AI succeeded — use AI output; fill any empty fields from a lightweight local build
  // We only run the local build here, after confirming AI didn't fully cover the output.
  const needsLocalFill =
    !aiNormalized.lessons?.length ||
    !aiNormalized.keyConcepts?.length ||
    !aiNormalized.bullets?.length;

  let local = null;
  if (needsLocalFill) {
    local = buildLocalReviewer(rawText, normalizedFull, subject, difficulty, examEnabled, examCount, flashcardsEnabled);
  }

  const reviewer = {
    ...(local || {}),
    ...aiNormalized,
    title: aiNormalized.title || subject,
    lessons: aiNormalized.lessons?.length ? aiNormalized.lessons : local?.lessons || [],
    exam: aiNormalized.exam || local?.exam || null,
    keyConcepts: aiNormalized.keyConcepts?.length ? aiNormalized.keyConcepts : local?.keyConcepts || [],
    definitions: aiNormalized.definitions?.length ? aiNormalized.definitions : local?.definitions || [],
    bullets: aiNormalized.bullets?.length ? aiNormalized.bullets : local?.bullets || [],
    flashcards: aiNormalized.flashcards?.length ? aiNormalized.flashcards : local?.flashcards || [],
    outline: aiNormalized.outline?.length ? aiNormalized.outline : local?.outline || [],
    highlightTerms: aiNormalized.highlightTerms?.length ? aiNormalized.highlightTerms : local?.highlightTerms || []
  };

  return finalize({ reviewer, aiUsed: true, language, subject, tags, difficulty, examEnabled, flashcardsEnabled, file, warnings, textPreview });
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptyResult({ subject, tags, difficulty, language, examEnabled, flashcardsEnabled, file, warnings }) {
  return {
    title: subject, subject, tags, difficulty,
    languageRequested: language, languageUsed: "English",
    examEnabled, flashcardsEnabled, warnings,
    lessons: [], tableOfContents: [],
    summaryShort: "", summaryDetailed: "",
    keyConcepts: [], definitions: [], bullets: [],
    flashcards: [], outline: [], highlightTerms: [],
    exam: null,
    source: { filename: file.originalname, size: file.size, mime: file.mimetype },
    textPreview: "(image file)"
  };
}

function finalize({ reviewer, aiUsed, language, subject, tags, difficulty, examEnabled, flashcardsEnabled, file, warnings, textPreview }) {
  return {
    ...reviewer,
    subject, tags, difficulty,
    languageRequested: language,
    languageUsed: aiUsed ? language : "English",
    examEnabled,
    flashcardsEnabled,
    warnings,
    source: { filename: file.originalname, size: file.size, mime: file.mimetype },
    textPreview
  };
}
