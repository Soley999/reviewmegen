import { config } from "../config.js";
import { generateWithAI } from "./aiProvider.js";
import {
  normalizeText,
  splitSentences,
  extractKeyTerms,
  summarize,
  pickTopSentences,
  firstSentenceWithTerm,
  identifyLessons,
  splitTextIntoLessons
} from "../utils/text.js";
import {
  buildQuestions,
  buildFlashcards,
  buildOutline,
  buildFinalExam
} from "../utils/questions.js";

const VALID_FORMATS = new Set(["flashcards", "qa", "outline"]);
const VALID_DIFFICULTY = new Set(["easy", "medium", "hard"]);
const VALID_LANGUAGES = new Set(["English", "Tagalog"]);

function titleCase(value) {
  return value
    .split(" ")
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1))
    .join(" ");
}

function normalizeArray(value) {
  if (Array.isArray(value)) return value;
  return [];
}

function normalizeLesson(lesson) {
  if (!lesson) return null;

  return {
    lessonNumber: lesson.lessonNumber || 1,
    title: lesson.title || "Untitled Lesson",
    learningObjectives: normalizeArray(lesson.learningObjectives),
    keyConcepts: normalizeArray(lesson.keyConcepts),
    definitions: normalizeArray(lesson.definitions),
    detailedExplanation: lesson.detailedExplanation || "",
    examples: normalizeArray(lesson.examples),
    importantNotes: normalizeArray(lesson.importantNotes),
    importantTerms: normalizeArray(lesson.importantTerms),
    summary: lesson.summary || "",
    questions: {
      multipleChoice: normalizeArray(lesson.questions?.multipleChoice),
      trueFalse: normalizeArray(lesson.questions?.trueFalse),
      identification: normalizeArray(lesson.questions?.identification),
      shortAnswer: normalizeArray(lesson.questions?.shortAnswer)
    }
  };
}

function normalizeFinalExam(finalExam) {
  if (!finalExam) return null;

  return {
    description: finalExam.description || "Comprehensive Final Exam",
    questions: {
      multipleChoice: normalizeArray(finalExam.questions?.multipleChoice),
      trueFalse: normalizeArray(finalExam.questions?.trueFalse),
      identification: normalizeArray(finalExam.questions?.identification),
      shortAnswer: normalizeArray(finalExam.questions?.shortAnswer)
    },
    answerKey: finalExam.answerKey || ""
  };
}

function normalizeAiOutput(aiOutput) {
  if (!aiOutput) return null;

  const lessons = normalizeArray(aiOutput.lessons).map(normalizeLesson).filter(Boolean);
  const finalExam = normalizeFinalExam(aiOutput.finalExam);

  const tableOfContents = normalizeArray(aiOutput.tableOfContents).length
    ? normalizeArray(aiOutput.tableOfContents)
    : lessons.map((l) => `Lesson ${l.lessonNumber}: ${l.title}`);

  return {
    title: aiOutput.title || "Untitled Reviewer",
    tableOfContents,
    summaryShort: aiOutput.summaryShort || "",
    summaryDetailed: aiOutput.summaryDetailed || "",
    lessons: lessons,
    finalExam: finalExam,
    keyConcepts: normalizeArray(aiOutput.keyConcepts),
    definitions: normalizeArray(aiOutput.definitions),
    bullets: normalizeArray(aiOutput.bullets),
    questions: aiOutput.questions || {
      multipleChoice: [],
      identification: [],
      trueFalse: []
    },
    flashcards: normalizeArray(aiOutput.flashcards),
    outline: normalizeArray(aiOutput.outline),
    highlightTerms: normalizeArray(aiOutput.highlightTerms)
  };
}

function buildLocalLesson(lessonText, lessonNumber, lessonTitle, subject, difficulty) {
  const sentences = splitSentences(lessonText);
  const keyTerms = extractKeyTerms(lessonText, 8);
  const keyConcepts = keyTerms.map((term) => {
    const sentence = firstSentenceWithTerm(sentences, term);
    return {
      term: titleCase(term),
      description: sentence || `Key concept related to ${subject}.`
    };
  });

  const definitions = keyConcepts.map((concept) => ({
    term: concept.term,
    definition: concept.description
  }));

  const summary = summarize(sentences, 3);
  const detailedExplanation = summarize(sentences, 5);
  const questions = buildQuestions({
    keyConcepts,
    definitions,
    sentences,
    difficulty
  });

  return {
    lessonNumber,
    title: lessonTitle || `Lesson ${lessonNumber}`,
    learningObjectives: keyConcepts.slice(0, 3).map(c => `Understand ${c.term}`),
    keyConcepts,
    definitions,
    detailedExplanation,
    examples: sentences.slice(0, 2),
    importantTerms: keyTerms.map(titleCase),
    summary,
    questions
  };
}

function buildLocalReviewer(rawText, normalizedText, subject, difficulty) {
  const text = normalizedText;
  const sentences = splitSentences(text);
  const keyTerms = extractKeyTerms(text, 10);
  const keyConcepts = keyTerms.map((term) => {
    const sentence = firstSentenceWithTerm(sentences, term);
    return {
      term: titleCase(term),
      description: sentence || `Key idea related to ${subject}.`
    };
  });

  const definitions = keyConcepts.map((concept) => ({
    term: concept.term,
    definition: concept.description
  }));

  const summaryShort = summarize(sentences, 3);
  const summaryDetailed = summarize(sentences, 7);
  const bullets = pickTopSentences(sentences, 12);

  const lessonMarkers = identifyLessons(rawText);
  const lessonSections = splitTextIntoLessons(rawText, lessonMarkers);

  const lessons = lessonSections.map((section) =>
    buildLocalLesson(section.text, section.number, section.title, subject, difficulty)
  );

  const finalExam = lessons.length > 0
    ? buildFinalExam({ allLessons: lessons, difficulty })
    : null;

  const questions = buildQuestions({
    keyConcepts,
    definitions,
    sentences,
    difficulty
  });

  const flashcards = buildFlashcards(definitions, keyConcepts);
  const outline = buildOutline(summaryShort, keyConcepts, bullets);

  const tableOfContents = lessons.map((l) => `Lesson ${l.lessonNumber}: ${l.title}`);

  return {
    title: subject || "Untitled Reviewer",
    tableOfContents,
    summaryShort,
    summaryDetailed,
    lessons,
    finalExam,
    keyConcepts,
    definitions,
    bullets,
    questions,
    flashcards,
    outline,
    highlightTerms: keyConcepts.map((concept) => concept.term)
  };
}

export async function generateReviewer({ text, options, file }) {
  const rawText = text.replace(/\r\n/g, "\n").trim();
  const normalized = normalizeText(rawText);
  const truncated = normalized.length > config.maxTextChars;
  const limitedText = normalized.slice(0, config.maxTextChars);

  const subject = options.subject?.trim() || "General Studies";
  const tags = options.tags || [];
  const difficulty = VALID_DIFFICULTY.has(options.difficulty)
    ? options.difficulty
    : "medium";
  const language = VALID_LANGUAGES.has(options.language)
    ? options.language
    : "English";
  const format = VALID_FORMATS.has(options.format)
    ? options.format
    : "flashcards";

  const aiOutput = await generateWithAI({
    text: limitedText,
    subject,
    difficulty,
    language,
    format
  });

  const local = buildLocalReviewer(rawText, limitedText, subject, difficulty);
  const aiNormalized = normalizeAiOutput(aiOutput);
  const reviewer = aiNormalized
    ? {
        ...local,
        ...aiNormalized,
        lessons: aiNormalized.lessons?.length ? aiNormalized.lessons : local.lessons,
        finalExam: aiNormalized.finalExam || local.finalExam,
        keyConcepts: aiNormalized.keyConcepts.length
          ? aiNormalized.keyConcepts
          : local.keyConcepts,
        definitions: aiNormalized.definitions.length
          ? aiNormalized.definitions
          : local.definitions,
        bullets: aiNormalized.bullets.length ? aiNormalized.bullets : local.bullets,
        questions: aiNormalized.questions || local.questions,
        flashcards: aiNormalized.flashcards.length
          ? aiNormalized.flashcards
          : local.flashcards,
        outline: aiNormalized.outline.length ? aiNormalized.outline : local.outline,
        highlightTerms: aiNormalized.highlightTerms.length
          ? aiNormalized.highlightTerms
          : local.highlightTerms
      }
    : local;

  const warnings = [];
  if (!aiOutput && language === "Tagalog") {
    warnings.push(
      "Tagalog output requires an AI provider. The reviewer is in English."
    );
  }
  if (truncated) {
    warnings.push("Large file truncated for processing.");
  }

  return {
    ...reviewer,
    subject,
    tags,
    difficulty,
    languageRequested: language,
    languageUsed: aiOutput ? language : "English",
    format,
    warnings,
    source: {
      filename: file.originalname,
      size: file.size,
      mime: file.mimetype
    },
    textPreview: limitedText.slice(0, 600)
  };
}
