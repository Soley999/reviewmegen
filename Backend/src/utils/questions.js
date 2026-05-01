import { shuffle } from "./text.js";

const DIFFICULTY_COUNTS = {
  easy: { mcq: 3, identification: 3, tf: 4 },
  medium: { mcq: 5, identification: 5, tf: 6 },
  hard: { mcq: 7, identification: 7, tf: 8 }
};

function pickCount(difficulty) {
  return DIFFICULTY_COUNTS[difficulty] || DIFFICULTY_COUNTS.medium;
}

export function buildQuestions({ keyConcepts, definitions, sentences, difficulty }) {
  const counts = pickCount(difficulty);
  const conceptPool = keyConcepts.length ? keyConcepts : definitions;
  const definitionPool = definitions.length ? definitions : keyConcepts;

  const multipleChoice = [];
  const identification = [];
  const trueFalse = [];

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
      answer: correct
    });
  }

  const idTargets = shuffledDefinitions.slice(0, counts.identification);
  for (const item of idTargets) {
    identification.push({
      question: `Define ${item.term}.`,
      answer: item.definition || item.description || ""
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
        answer: false
      });
    } else {
      trueFalse.push({
        statement,
        answer: true
      });
    }
  }

  return { multipleChoice, identification, trueFalse };
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
