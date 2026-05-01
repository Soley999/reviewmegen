import { config } from "../config.js";
import { generateWithAI } from "./aiProvider.js";
import {
  normalizeText,
  splitSentences,
  extractKeyTerms,
  summarize,
  pickTopSentences,
  firstSentenceWithTerm
} from "../utils/text.js";
import {
  buildQuestions,
  buildFlashcards,
  buildOutline
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

function normalizeAiOutput(aiOutput) {
  if (!aiOutput) return null;

  return {
    title: aiOutput.title || "Untitled Reviewer",
    summaryShort: aiOutput.summaryShort || "",
    summaryDetailed: aiOutput.summaryDetailed || "",
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

function buildLocalReviewer(text, subject, difficulty) {
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
  const questions = buildQuestions({
    keyConcepts,
    definitions,
    sentences,
    difficulty
  });

  const flashcards = buildFlashcards(definitions, keyConcepts);
  const outline = buildOutline(summaryShort, keyConcepts, bullets);

  return {
    title: subject || "Untitled Reviewer",
    summaryShort,
    summaryDetailed,
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
  const normalized = normalizeText(text);
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

  const local = buildLocalReviewer(limitedText, subject, difficulty);
  const aiNormalized = normalizeAiOutput(aiOutput);
  const reviewer = aiNormalized
    ? {
        ...local,
        ...aiNormalized,
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
