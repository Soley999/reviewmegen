import { shuffle } from "./text.js";

// ─── Local exam builder ───────────────────────────────────────────────────────

/**
 * Build a local (no-AI) multiple-choice exam from extracted key concepts.
 * Each question gets a correct answer and explanations for wrong options.
 */
export function buildLocalExam({ keyConcepts, definitions, sentences, difficulty, examCount }) {
  const count = typeof examCount === "number" ? examCount : 20;
  const pool = [...keyConcepts, ...definitions].filter(
    (item) => (item.description || item.definition || "").length > 10
  );

  if (pool.length < 2) {
    return { description: "Exam", questions: [] };
  }

  const shuffled = shuffle(pool);
  const questions = [];
  // Track used questions to avoid duplicates
  const usedTerms = new Set();

  for (let i = 0; i < shuffled.length && questions.length < count; i++) {
    const target = shuffled[i];
    if (usedTerms.has(target.term)) continue;

    const correct = (target.description || target.definition || "").trim();
    if (!correct || correct.length < 5) continue;

    // Pick distractors: other items whose correct text is different from the correct answer
    const distractor_pool = shuffle(pool).filter(
      (item) => item.term !== target.term &&
                (item.description || item.definition || "").trim() !== correct &&
                (item.description || item.definition || "").trim().length >= 5
    );

    const rawDistractors = distractor_pool.slice(0, 3)
      .map((item) => (item.description || item.definition || item.term).trim());

    // Pad with generic distractors only as last resort
    while (rawDistractors.length < 3) {
      rawDistractors.push(`Not applicable to "${target.term}"`);
    }

    // Build options array with known answer position so indexOf is never ambiguous
    const allOptions = [correct, ...rawDistractors];
    // Shuffle in-place and record where correct ended up
    for (let j = allOptions.length - 1; j > 0; j--) {
      const k = Math.floor(Math.random() * (j + 1));
      [allOptions[j], allOptions[k]] = [allOptions[k], allOptions[j]];
    }
    // After shuffle, correct is still somewhere; find it by identity
    const answerIndex = allOptions.indexOf(correct);

    // Ensure all 4 options are distinct (guard against padding duplicates)
    const unique = new Set(allOptions.map((o) => o.trim()));
    if (unique.size < 4) continue;

    const wrongExplanations = {};
    allOptions.forEach((opt, idx) => {
      if (idx !== answerIndex) {
        wrongExplanations[String(idx)] = `"${opt}" does not accurately describe "${target.term}".`;
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
export function buildLocalFlashcards(definitions, keyConcepts) {
  const seen = new Set();
  const cards = [];

  for (const item of definitions) {
    if (!item.term || seen.has(item.term)) continue;
    seen.add(item.term);
    const def = item.definition || item.description || "";
    cards.push({
      front: item.term,
      back: def,
      rationale: def
        ? `Understanding "${item.term}" is essential because it is a key term in this material. Recognizing it helps connect related ideas and answer exam questions accurately.`
        : ""
    });
  }

  for (const concept of keyConcepts) {
    if (!concept.term || seen.has(concept.term)) continue;
    seen.add(concept.term);
    const desc = concept.description || "";
    cards.push({
      front: concept.term,
      back: desc,
      rationale: desc
        ? `This concept appears frequently in the material. Mastering "${concept.term}" will help you answer both recall and application questions.`
        : ""
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
