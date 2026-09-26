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

/**
 * Validate and repair an exam question.
 * Returns null if the question is unrecoverable.
 */
function validateExamQuestion(q) {
  if (!q || typeof q.question !== "string" || !q.question.trim()) return null;

  const options = normalizeArray(q.options).map(String).filter(Boolean);
  if (options.length !== 4) return null;

  let answerIndex = typeof q.answerIndex === "number" ? q.answerIndex : -1;

  // If answerIndex is out of range, try to locate the answer string in options
  if (answerIndex < 0 || answerIndex > 3) {
    const answerText = String(q.answer || "").trim();
    answerIndex = options.findIndex((o) => o.trim() === answerText);
    if (answerIndex === -1) return null; // can't determine correct answer
  }

  // Re-derive answer text from answerIndex (authoritative)
  const answer = options[answerIndex];

  // Ensure all distractors are distinct from the correct answer
  const uniqueOptions = new Set(options.map((o) => o.trim()));
  if (uniqueOptions.size < 4) return null; // duplicate options

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
  const questions = normalizeArray(exam.questions)
    .map(validateExamQuestion)
    .filter(Boolean);
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

function normalizeAiOutput(aiOutput) {
  if (!aiOutput) return null;

  const lessons = normalizeArray(aiOutput.lessons).map(normalizeLesson).filter(Boolean);
  const tableOfContents = normalizeArray(aiOutput.tableOfContents).length
    ? normalizeArray(aiOutput.tableOfContents)
    : lessons.map((l) => `Lesson ${l.lessonNumber}: ${l.title}`);

  return {
    title: (typeof aiOutput.title === "string" && aiOutput.title.trim()) ? aiOutput.title.trim() : null,
    tableOfContents,
    summaryShort: aiOutput.summaryShort || "",
    summaryDetailed: aiOutput.summaryDetailed || "",
    lessons,
    exam: validateExam(aiOutput.exam),
    keyConcepts: normalizeArray(aiOutput.keyConcepts),
    definitions: normalizeArray(aiOutput.definitions),
    bullets: normalizeArray(aiOutput.bullets).filter((b) => typeof b === "string" && b.trim()),
    flashcards: normalizeArray(aiOutput.flashcards).map(normalizeFlashcard).filter(Boolean),
    outline: normalizeArray(aiOutput.outline),
    highlightTerms: normalizeArray(aiOutput.highlightTerms).filter((t) => typeof t === "string" && t.trim())
  };
}

// ─── Large-file chunking ──────────────────────────────────────────────────────

/**
 * Split text into chunks at sentence boundaries so each chunk fits within the
 * per-call character budget.
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
 * Merge multiple AI outputs from chunked processing into a single output.
 * The first chunk provides the primary structure; subsequent chunks add their
 * lessons, concepts, definitions, and flashcards.
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

  let lessonOffset = Math.max(...(merged.lessons.map((l) => l.lessonNumber)), 0);

  for (let i = 1; i < valid.length; i++) {
    const chunk = valid[i];

    // Append new lessons with re-numbered IDs
    for (const lesson of chunk.lessons || []) {
      if (!seenLessonNumbers.has(lesson.lessonNumber + lessonOffset)) {
        const newLesson = { ...lesson, lessonNumber: lesson.lessonNumber + lessonOffset };
        merged.lessons.push(newLesson);
        seenLessonNumbers.add(newLesson.lessonNumber);
      }
    }
    lessonOffset += (chunk.lessons?.length || 0);

    // Extend TOC
    merged.tableOfContents = [
      ...merged.tableOfContents,
      ...(chunk.tableOfContents || []).slice(1) // skip duplicate title
    ];

    // Merge key concepts, deduplicated by term
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

    // Bullets and flashcards
    merged.bullets = [...(merged.bullets || []), ...(chunk.bullets || [])];
    merged.flashcards = [...(merged.flashcards || []), ...(chunk.flashcards || [])];
    merged.highlightTerms = [...new Set([...(merged.highlightTerms || []), ...(chunk.highlightTerms || [])])];

    // Exam: keep the one with more questions
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

function buildLocalLesson(lessonText, lessonNumber, lessonTitle, subject) {
  const sentences = splitSentences(lessonText);
  // Use definition-pattern extraction first, fall back to key term frequency
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

  // Definition-pattern extraction is far more accurate than simple word frequency
  const defPairs = extractDefinitionSentences(normalizedText);
  const keyTermsFromFreq = extractKeyTerms(normalizedText, 15);

  // Build keyConcepts preferring definition-extracted pairs
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
    buildLocalLesson(sec.text, sec.number, sec.title, subject)
  );

  const tableOfContents = lessons.map((l) => `Lesson ${l.lessonNumber}: ${l.title}`);

  const exam = examEnabled
    ? buildLocalExam({ keyConcepts, definitions, sentences, difficulty, examCount })
    : null;

  const flashcards = flashcardsEnabled ? buildLocalFlashcards(definitions, keyConcepts) : [];
  const outline = buildOutline(summaryShort, keyConcepts, bullets);

  return {
    title: subject || "Untitled Reviewer",
    tableOfContents,
    summaryShort,
    summaryDetailed,
    lessons,
    exam,
    keyConcepts,
    definitions,
    bullets,
    flashcards,
    outline,
    highlightTerms: keyConcepts.map((c) => c.term)
  };
}

// ─── Main entry point ─────────────────────────────────────────────────────────

export async function generateReviewer({ text, options, file }) {
  const subject = options.subject?.trim() || "General Studies";
  const tags = options.tags || [];
  const difficulty = VALID_DIFFICULTY.has(options.difficulty) ? options.difficulty : "medium";
  const language = VALID_LANGUAGES.has(options.language) ? options.language : "English";
  const examEnabled = !!options.examEnabled;
  const examCount = typeof options.examCount === "number" ? options.examCount : 20;
  const flashcardsEnabled = options.flashcardsEnabled !== false;

  // ── Handle image input ──────────────────────────────────────────────────────
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

  // ── Handle text input ───────────────────────────────────────────────────────
  const rawText = String(text).replace(/\r\n/g, "\n").trim();
  const normalizedFull = normalizeText(rawText);

  // Build local fallback from full text (always, used as baseline or sole result)
  const local = buildLocalReviewer(rawText, normalizedFull, subject, difficulty, examEnabled, examCount, flashcardsEnabled);

  const warnings = [];

  if (!aiIsConfigured()) {
    warnings.push("AI provider not configured — add GEMINI_API_KEY or GROQ_API_KEY to Backend/.env for richer results.");
    return finalize({ reviewer: local, aiUsed: false, language, subject, tags, difficulty, examEnabled, flashcardsEnabled, file, warnings, textPreview: normalizedFull.slice(0, 600) });
  }

  // ── Chunked AI processing ───────────────────────────────────────────────────
  const chunks = chunkText(normalizedFull, config.maxCharsPerChunk);
  const isLarge = chunks.length > 1;

  if (isLarge) {
    warnings.push(`Document split into ${chunks.length} sections for complete processing.`);
  }

  const aiOutputs = [];
  for (let i = 0; i < chunks.length; i++) {
    console.log(`[reviewerGenerator] Processing chunk ${i + 1}/${chunks.length} (${chunks[i].length} chars)`);
    const out = await generateWithAI({
      text: chunks[i],
      subject, difficulty, language,
      // Only request exam/flashcards on the first chunk to avoid duplicates.
      // For subsequent chunks we only want the content (lessons, concepts, defs).
      examEnabled: i === 0 ? examEnabled : false,
      examCount,
      flashcardsEnabled: i === 0 ? flashcardsEnabled : false
    });
    aiOutputs.push(out);
  }

  const mergedAi = mergeAiOutputs(aiOutputs);
  const aiNormalized = normalizeAiOutput(mergedAi);

  if (!aiNormalized) {
    warnings.push("AI analysis failed — showing local extraction. Check your API keys and network.");
    return finalize({ reviewer: local, aiUsed: false, language, subject, tags, difficulty, examEnabled, flashcardsEnabled, file, warnings, textPreview: normalizedFull.slice(0, 600) });
  }

  // Merge AI over local: AI wins wherever it has content, local fills gaps
  const reviewer = {
    ...local,
    ...aiNormalized,
    title: aiNormalized.title || local.title,
    lessons: aiNormalized.lessons?.length ? aiNormalized.lessons : local.lessons,
    exam: aiNormalized.exam || local.exam,
    keyConcepts: aiNormalized.keyConcepts?.length ? aiNormalized.keyConcepts : local.keyConcepts,
    definitions: aiNormalized.definitions?.length ? aiNormalized.definitions : local.definitions,
    bullets: aiNormalized.bullets?.length ? aiNormalized.bullets : local.bullets,
    flashcards: aiNormalized.flashcards?.length ? aiNormalized.flashcards : local.flashcards,
    outline: aiNormalized.outline?.length ? aiNormalized.outline : local.outline,
    highlightTerms: aiNormalized.highlightTerms?.length ? aiNormalized.highlightTerms : local.highlightTerms
  };

  if (language === "Tagalog" && !aiNormalized) {
    warnings.push("Tagalog output requires an AI provider. The reviewer is in English.");
  }

  return finalize({ reviewer, aiUsed: true, language, subject, tags, difficulty, examEnabled, flashcardsEnabled, file, warnings, textPreview: normalizedFull.slice(0, 600) });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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
