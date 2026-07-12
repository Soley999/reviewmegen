import { shuffle } from "./text.js";

const DIFFICULTY_COUNTS = {
  easy: { mcq: 3, identification: 3, tf: 4, shortAnswer: 2 },
  medium: { mcq: 5, identification: 5, tf: 6, shortAnswer: 3 },
  hard: { mcq: 7, identification: 7, tf: 8, shortAnswer: 4 }
};

const FINAL_EXAM_COUNTS = {
  easy: { mcq: 10, identification: 5, tf: 8, shortAnswer: 3 },
  medium: { mcq: 15, identification: 8, tf: 12, shortAnswer: 5 },
  hard: { mcq: 20, identification: 10, tf: 15, shortAnswer: 7 }
};

function pickCount(difficulty) {
  return DIFFICULTY_COUNTS[difficulty] || DIFFICULTY_COUNTS.medium;
}

function pickFinalExamCount(difficulty) {
  return FINAL_EXAM_COUNTS[difficulty] || FINAL_EXAM_COUNTS.medium;
}

export function buildQuestions({ keyConcepts, definitions, sentences, difficulty }) {
  const counts = pickCount(difficulty);
  const conceptPool = keyConcepts.length ? keyConcepts : definitions;
  const definitionPool = definitions.length ? definitions : keyConcepts;

  const multipleChoice = [];
  const identification = [];
  const trueFalse = [];
  const shortAnswer = [];

  const shuffledDefinitions = shuffle(definitionPool);
  const shuffledConcepts = shuffle(conceptPool);

  const mcqTargets = shuffledConcepts.slice(0, counts.mcq);
  for (const concept of mcqTargets) {
    const correct = concept.description || concept.definition || "";
    const distractors = shuffle(definitionPool)
      .filter((item) => item.term !== concept.term)
      .slice(0, 3)
      .map((item) => item.definition || item.description || item.term);

    const options = shuffle([correct, ...distractors].filter(Boolean));
    const answerIndex = options.findIndex((option) => option === correct);

    multipleChoice.push({
      question: `Which statement best describes ${concept.term}?`,
      options,
      answerIndex: Math.max(answerIndex, 0),
      answer: correct,
      explanation: `${concept.term} is defined as: ${correct}`
    });
  }

  const idTargets = shuffledDefinitions.slice(0, counts.identification);
  for (const item of idTargets) {
    identification.push({
      question: `Define or identify: ${item.term}`,
      answer: item.definition || item.description || "",
      explanation: `${item.term}: ${item.definition || item.description || ""}`
    });
  }

  const tfSentences = shuffle(sentences).slice(0, counts.tf);
  for (let index = 0; index < tfSentences.length; index += 1) {
    const statement = tfSentences[index];
    const shouldFlip = index % 2 === 1 && shuffledConcepts.length > 1;

    if (shouldFlip) {
      const swapFrom = shuffledConcepts[0]?.term;
      const swapTo = shuffledConcepts[1]?.term;
      trueFalse.push({
        statement: statement.replace(new RegExp(swapFrom, "gi"), swapTo),
        answer: false,
        explanation: `This statement is false because ${swapFrom} was incorrectly replaced with ${swapTo}.`
      });
    } else {
      trueFalse.push({
        statement,
        answer: true,
        explanation: "This statement accurately reflects the content."
      });
    }
  }

  const saTargets = shuffledConcepts.slice(0, counts.shortAnswer);
  for (const concept of saTargets) {
    shortAnswer.push({
      question: `Explain the concept of ${concept.term}.`,
      answer: concept.description || concept.definition || "",
      points: [
        concept.term,
        concept.description || concept.definition || ""
      ]
    });
  }

  return { multipleChoice, identification, trueFalse, shortAnswer };
}

export function buildFinalExam({ allLessons, difficulty }) {
  const counts = pickFinalExamCount(difficulty);
  const multipleChoice = [];
  const identification = [];
  const trueFalse = [];
  const shortAnswer = [];

  for (const lesson of allLessons) {
    if (!lesson.questions) continue;

    const lessonMcq = lesson.questions.multipleChoice || [];
    const lessonId = lesson.questions.identification || [];
    const lessonTf = lesson.questions.trueFalse || [];
    const lessonSa = lesson.questions.shortAnswer || [];

    lessonMcq.forEach(q => multipleChoice.push({ ...q, lessonRef: lesson.lessonNumber }));
    lessonId.forEach(q => identification.push({ ...q, lessonRef: lesson.lessonNumber }));
    lessonTf.forEach(q => trueFalse.push({ ...q, lessonRef: lesson.lessonNumber }));
    lessonSa.forEach(q => shortAnswer.push({ ...q, lessonRef: lesson.lessonNumber }));
  }

  const selectedMcq = shuffle(multipleChoice).slice(0, counts.mcq);
  const selectedId = shuffle(identification).slice(0, counts.identification);
  const selectedTf = shuffle(trueFalse).slice(0, counts.tf);
  const selectedSa = shuffle(shortAnswer).slice(0, counts.shortAnswer);

  const answerKey = [
    "MULTIPLE CHOICE:",
    ...selectedMcq.map((q, i) => `${i + 1}. ${q.answer} - ${q.explanation || ""} (Lesson ${q.lessonRef})`),
    "",
    "TRUE/FALSE:",
    ...selectedTf.map((q, i) => `${i + 1}. ${q.answer ? "TRUE" : "FALSE"} - ${q.explanation || ""} (Lesson ${q.lessonRef})`),
    "",
    "IDENTIFICATION:",
    ...selectedId.map((q, i) => `${i + 1}. ${q.answer} - ${q.explanation || ""} (Lesson ${q.lessonRef})`),
    "",
    "SHORT ANSWER:",
    ...selectedSa.map((q, i) => `${i + 1}. ${q.answer} (Lesson ${q.lessonRef})`)
  ].join("\n");

  return {
    description: `Comprehensive ${difficulty} level final exam covering ${allLessons.length} lesson(s)`,
    questions: {
      multipleChoice: selectedMcq,
      trueFalse: selectedTf,
      identification: selectedId,
      shortAnswer: selectedSa
    },
    answerKey
  };
}

export function buildFlashcards(definitions, keyConcepts) {
  const cards = definitions.map((item) => ({
    front: item.term,
    back: item.definition || item.description || ""
  }));

  const conceptCards = keyConcepts
    .filter((concept) =>
      cards.every((card) => card.front !== concept.term)
    )
    .map((concept) => ({
      front: concept.term,
      back: concept.description || ""
    }));

  return [...cards, ...conceptCards];
}

export function buildOutline(summaryShort, keyConcepts, bullets) {
  return [
    {
      title: "Overview",
      points: summaryShort ? [summaryShort] : []
    },
    {
      title: "Key Concepts",
      points: keyConcepts.map((concept) => concept.term)
    },
    {
      title: "Notes",
      points: bullets
    }
  ];
}
