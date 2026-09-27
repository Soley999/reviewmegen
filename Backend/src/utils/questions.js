import { shuffle } from "./text.js";

// ─── Local exam builder ───────────────────────────────────────────────────────

/**
 * Build a local (no-AI) multiple-choice exam from extracted key concepts.
 * Each question gets a correct answer and explanations for wrong options.
 */
const SWAP_PAIRS = [
  ["is", "was"], ["are", "were"], ["can", "may"], ["will", "could"],
  ["increase", "decrease"], ["before", "after"], ["first", "last"],
  ["high", "low"], ["more", "less"], ["always", "sometimes"],
  ["all", "some"], ["cause", "effect"], ["internal", "external"],
  ["positive", "negative"], ["primary", "secondary"], ["active", "passive"],
  ["direct", "indirect"], ["major", "minor"], ["above", "below"],
  ["input", "output"], ["simple", "complex"], ["rapid", "slow"],
  ["promote", "inhibit"], ["include", "exclude"], ["required", "optional"],
  ["physical", "mental"], ["voluntary", "involuntary"],
  ["single", "multiple"], ["specific", "general"], ["short", "long"],
  ["open", "closed"], ["strong", "weak"], ["true", "false"],
  ["maximum", "minimum"], ["same", "different"], ["within", "outside"],
  ["central", "peripheral"], ["normal", "abnormal"], ["acute", "chronic"],
  ["subjective", "objective"], ["dependent", "independent"],
  ["formal", "informal"], ["individual", "collective"]
];
const SWAP_MAP = new Map();
for (const [a, b] of SWAP_PAIRS) { SWAP_MAP.set(a, b); SWAP_MAP.set(b, a); }

function getFirstSentence(text) {
  const cleaned = text
    .replace(/•/g, " ")
    .replace(/\bo\s/g, " ")
    .replace(/[—–]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const match = cleaned.match(/^(.+?[.!?])\s/);
  if (match && match[1].split(" ").length >= 3 && match[1].split(" ").length <= 20) {
    return match[1];
  }
  const words = cleaned.split(" ");
  if (words.length <= 18) return cleaned;
  return words.slice(0, 15).join(" ") + ".";
}

function swapOneWord(text, swapIndex) {
  const words = text.split(" ");
  const swappable = [];
  for (let i = 0; i < words.length; i++) {
    const clean = words[i].toLowerCase().replace(/[.,;:!?]/g, "");
    if (SWAP_MAP.has(clean)) swappable.push(i);
  }
  if (swappable.length === 0) return null;
  const idx = swappable[swapIndex % swappable.length];
  const result = [...words];
  const clean = result[idx].toLowerCase().replace(/[.,;:!?]/g, "");
  const punct = result[idx].slice(clean.length);
  const swapped = SWAP_MAP.get(clean);
  result[idx] = (result[idx][0] === result[idx][0].toUpperCase()
    ? swapped.charAt(0).toUpperCase() + swapped.slice(1)
    : swapped) + punct;
  return result.join(" ");
}

function replaceContentWord(text, pool, attempt) {
  const words = text.split(" ");
  const stopWords = new Set(["a", "an", "the", "is", "are", "was", "were", "of", "to",
    "in", "for", "on", "by", "it", "as", "at", "or", "and", "that", "this", "with", "also"]);
  const contentIdxs = [];
  for (let i = 0; i < words.length; i++) {
    const w = words[i].toLowerCase().replace(/[.,;:!?]/g, "");
    if (w.length > 3 && !stopWords.has(w)) contentIdxs.push(i);
  }
  if (contentIdxs.length === 0) return null;

  const allTerms = pool
    .map((item) => (item.term || "").toLowerCase())
    .filter((t) => t.length > 3);
  if (allTerms.length === 0) return null;

  const replaceIdx = contentIdxs[attempt % contentIdxs.length];
  const replacement = allTerms[(attempt * 7 + 3) % allTerms.length];
  const result = [...words];
  const punct = result[replaceIdx].replace(/[a-zA-Z]/g, "").slice(-1) || "";
  const orig = result[replaceIdx];
  const isCapitalized = orig[0] === orig[0].toUpperCase();
  result[replaceIdx] = (isCapitalized
    ? replacement.charAt(0).toUpperCase() + replacement.slice(1)
    : replacement) + punct;
  return result.join(" ");
}

export function buildLocalExam({ keyConcepts, definitions, sentences, difficulty, examCount }) {
  const count = typeof examCount === "number" ? examCount : 10;

  const pool = [...keyConcepts, ...definitions].filter((item) => {
    const text = (item.description || item.definition || "").trim();
    return text.length >= 10;
  });

  if (pool.length < 2) {
    return { description: "Exam", questions: [] };
  }

  const shuffled = shuffle(pool);
  const questions = [];
  const usedTerms = new Set();

  for (let i = 0; i < shuffled.length && questions.length < count; i++) {
    const target = shuffled[i];
    if (usedTerms.has(target.term)) continue;

    const rawCorrect = (target.description || target.definition || "").trim();
    if (!rawCorrect || rawCorrect.length < 5) continue;

    const correct = getFirstSentence(rawCorrect);
    if (correct.split(" ").length < 3) continue;

    const distractors = [];
    const seen = new Set([correct.toLowerCase()]);

    const addIfNew = (text) => {
      if (!text) return false;
      const lower = text.toLowerCase();
      if (seen.has(lower) || lower === correct.toLowerCase()) return false;
      seen.add(lower);
      distractors.push(text);
      return true;
    };

    for (let s = 0; s < 5 && distractors.length < 3; s++) {
      addIfNew(swapOneWord(correct, s));
    }

    for (let r = 0; r < 6 && distractors.length < 3; r++) {
      addIfNew(replaceContentWord(correct, pool, r));
    }

    if (distractors.length < 3) continue;

    const allOptions = [correct, ...distractors.slice(0, 3)];
    for (let j = allOptions.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
    }
    const answerIndex = allOptions.indexOf(correct);

    const unique = new Set(allOptions.map((o) => o.trim().toLowerCase()));
    if (unique.size < 4) continue;

    const wrongExplanations = {};
    allOptions.forEach((opt, idx) => {
      if (idx !== answerIndex) {
        wrongExplanations[String(idx)] = `This is incorrect because it does not accurately match the definition of "${target.term}" as stated in the material.`;
      }
    });

    usedTerms.add(target.term);
    questions.push({
      question: `Which of the following best describes "${target.term}"?`,
      options: allOptions,
      answerIndex,
      answer: correct,
      explanation: `"${target.term}" is defined as: ${correct}`,
      wrongExplanations
    });
  }

  return {
    description: `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}-level exam — ${questions.length} questions`,
    questions
  };
}

// ─── Local flashcard builder ──────────────────────────────────────────────────

/**
 * Build flashcards from definitions and key concepts.
 * Each card has front (term), back (definition), and rationale (context/significance).
 */
const TRIVIAL_TERMS = new Set([
  "introduction", "conclusion", "summary", "overview", "example", "note",
  "section", "chapter", "page", "figure", "table", "part", "item", "type",
  "kind", "thing", "way", "point", "area", "case", "fact", "form", "group",
  "hand", "line", "name", "side", "step", "term", "time", "work", "year",
  "also", "just", "like", "much", "only", "such", "very", "well", "back",
  "even", "good", "long", "made", "many", "most", "next", "some", "used",
  "come", "does", "each", "give", "have", "here", "know", "last", "make",
  "more", "need", "over", "same", "take", "than", "them", "then", "turn",
  "want", "what", "your", "about", "after", "being", "below", "between",
  "both", "during", "first", "found", "great", "important", "including",
  "information", "large", "left", "less", "list", "look", "main", "means",
  "method", "number", "other", "place", "process", "question", "result",
  "right", "second", "show", "small", "start", "state", "still", "study",
  "system", "text", "think", "three", "today", "together", "told", "under",
  "until", "upon", "using", "value", "where", "while", "world", "would",
  "answer", "begin", "change", "course", "data", "different", "end",
  "general", "help", "high", "idea", "keep", "learn", "level", "life",
  "meaning", "must", "new", "old", "order", "people", "person", "problem",
  "program", "provide", "read", "reason", "report", "research", "role",
  "rule", "school", "service", "set", "several", "simple", "since",
  "something", "source", "special", "subject", "support", "sure",
  "technology", "test", "through", "total", "true", "unit", "use",
  "view", "water", "whole", "word", "write", "called", "common",
  "communication", "community", "concept", "definition", "description",
  "development", "education", "environment", "experience", "following",
  "function", "history", "human", "language", "material", "member",
  "model", "natural", "nature", "object", "practice", "present",
  "purpose", "science", "society", "structure", "theory", "topic",
  "understanding", "activity", "basic", "body", "building", "business",
  "center", "class", "condition", "content", "control", "country",
  "design", "effect", "element", "energy", "event", "field", "food",
  "force", "future", "game", "goal", "ground", "growth", "head",
  "health", "home", "house", "image", "interest", "issue", "job",
  "knowledge", "land", "law", "letter", "light", "market", "matter",
  "media", "mind", "money", "movement", "music", "network", "office",
  "part", "party", "past", "pattern", "period", "picture", "plan",
  "plant", "play", "policy", "position", "power", "product", "project",
  "public", "range", "rate", "record", "region", "relationship",
  "resource", "response", "sense", "series", "situation", "skill",
  "space", "stage", "standard", "story", "strategy", "student",
  "success", "surface", "task", "team", "trade", "training", "truth",
  "type", "voice", "wall", "war", "week", "child", "children", "city",
  "company", "family", "government", "group", "hand", "man", "woman"
]);

function isStudyWorthy(term, definition) {
  if (!term || !definition) return false;
  const t = term.trim();
  const d = (definition || "").trim();
  if (t.length < 3 || d.length < 20) return false;
  if (t.split(/\s+/).length > 6) return false;
  if (/^\d+$/.test(t)) return false;
  if (TRIVIAL_TERMS.has(t.toLowerCase())) return false;
  if (t.split(/\s+/).length === 1 && TRIVIAL_TERMS.has(t.toLowerCase())) return false;
  const defLower = d.toLowerCase();
  if (defLower.startsWith(t.toLowerCase() + " is ") && d.split(" ").length < 6) return false;
  return true;
}

export function buildLocalFlashcards(definitions, keyConcepts) {
  const seen = new Set();
  const cards = [];

  for (const item of definitions) {
    const key = (item.term || "").toLowerCase();
    if (!item.term || seen.has(key)) continue;
    const def = item.definition || item.description || "";
    if (!isStudyWorthy(item.term, def)) continue;
    seen.add(key);
    cards.push({
      front: item.term,
      back: def,
      rationale: `Understanding "${item.term}" is essential because it is a key term in this material. Recognizing it helps connect related ideas and answer exam questions accurately.`
    });
  }

  for (const concept of keyConcepts) {
    const key = (concept.term || "").toLowerCase();
    if (!concept.term || seen.has(key)) continue;
    const desc = concept.description || "";
    if (!isStudyWorthy(concept.term, desc)) continue;
    seen.add(key);
    cards.push({
      front: concept.term,
      back: desc,
      rationale: `This concept appears frequently in the material. Mastering "${concept.term}" will help you answer both recall and application questions.`
    });
  }

  return cards;
}

// ─── Outline builder ─────────────────────────────────────────────────────────

export function buildOutline(summaryShort, keyConcepts, bullets) {
  return [
    { title: "Overview", points: summaryShort ? [summaryShort] : [] },
    { title: "Key Concepts", points: keyConcepts.map((c) => c.term) },
    { title: "Notes", points: bullets }
  ];
}

// ─── Kept for any legacy references ──────────────────────────────────────────

export function buildQuestions({ keyConcepts, definitions, sentences, difficulty }) {
  const counts = { easy: 3, medium: 5, hard: 7 };
  const n = counts[difficulty] || 5;

  const multipleChoice = [];
  const identification = [];
  const trueFalse = [];
  const shortAnswer = [];

  const pool = shuffle([...keyConcepts, ...definitions]);

  pool.slice(0, n).forEach((item) => {
    const correct = item.description || item.definition || "";
    const distractors = shuffle(pool)
      .filter((d) => d.term !== item.term)
      .slice(0, 3)
      .map((d) => d.definition || d.description || d.term);
    while (distractors.length < 3) distractors.push(`Not related to ${item.term}`);
    const options = shuffle([correct, ...distractors]);
    const answerIndex = options.indexOf(correct);
    const wrongExplanations = {};
    options.forEach((opt, idx) => {
      if (idx !== answerIndex) wrongExplanations[String(idx)] = `"${opt}" does not accurately describe ${item.term}.`;
    });
    multipleChoice.push({
      question: `Which best describes "${item.term}"?`,
      options, answerIndex, answer: correct,
      explanation: `${item.term}: ${correct}`,
      wrongExplanations
    });
  });

  pool.slice(0, n).forEach((item) => {
    identification.push({
      question: `Define or identify: ${item.term}`,
      answer: item.definition || item.description || "",
      explanation: `${item.term}: ${item.definition || item.description || ""}`
    });
  });

  const tfSentences = shuffle(sentences || []).slice(0, n);
  tfSentences.forEach((stmt, idx) => {
    trueFalse.push({
      statement: stmt,
      answer: true,
      explanation: "This statement accurately reflects the content."
    });
  });

  pool.slice(0, Math.min(3, n)).forEach((item) => {
    shortAnswer.push({
      question: `Explain the concept of ${item.term}.`,
      answer: item.description || item.definition || "",
      points: [item.term, item.description || item.definition || ""]
    });
  });

  return { multipleChoice, identification, trueFalse, shortAnswer };
}
