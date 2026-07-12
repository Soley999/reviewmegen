const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "he",
  "in",
  "is",
  "it",
  "its",
  "of",
  "on",
  "that",
  "the",
  "to",
  "was",
  "were",
  "will",
  "with",
  "this",
  "these",
  "those",
  "or",
  "if",
  "then",
  "than",
  "which",
  "what",
  "who",
  "whom",
  "when",
  "where",
  "why",
  "how",
  "can",
  "could",
  "should",
  "would",
  "may",
  "might",
  "your",
  "you",
  "we",
  "our",
  "they",
  "their"
]);

export function normalizeText(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\n+/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

export function splitSentences(text) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n+/g, ". ");
  const sentences = [];
  let current = "";

  for (const char of normalized) {
    current += char;
    if (".!?".includes(char)) {
      const sentence = current.trim();
      if (sentence) sentences.push(sentence);
      current = "";
    }
  }

  const tail = current.trim();
  if (tail) sentences.push(tail);

  return sentences.map((sentence) => sentence.replace(/\s+/g, " ").trim());
}

export function tokenizeWords(text) {
  return (text.toLowerCase().match(/[a-z0-9']+/g) || []).filter(
    (word) => word.length > 2
  );
}

export function wordFrequencies(words) {
  const counts = new Map();
  for (const word of words) {
    if (STOP_WORDS.has(word)) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  return counts;
}

export function extractKeyTerms(text, limit = 10) {
  const words = tokenizeWords(text);
  const frequencies = wordFrequencies(words);
  const ranked = [...frequencies.entries()]
    .filter(([word]) => word.length > 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word]) => word);

  return ranked;
}

export function scoreSentences(sentences) {
  const words = tokenizeWords(sentences.join(" "));
  const frequencies = wordFrequencies(words);
  const scores = new Map();

  for (const sentence of sentences) {
    const sentenceWords = tokenizeWords(sentence);
    const score = sentenceWords.reduce(
      (total, word) => total + (frequencies.get(word) || 0),
      0
    );
    scores.set(sentence, score);
  }

  return scores;
}

export function pickTopSentences(sentences, count) {
  const scores = scoreSentences(sentences);
  const ranked = [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, count)
    .map(([sentence]) => sentence);

  const ordered = sentences.filter((sentence) => ranked.includes(sentence));
  return ordered.length ? ordered : ranked;
}

export function summarize(sentences, count) {
  if (sentences.length <= count) return sentences.join(" ");
  return pickTopSentences(sentences, count).join(" ");
}

export function shuffle(items) {
  const clone = [...items];
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [clone[i], clone[j]] = [clone[j], clone[i]];
  }
  return clone;
}

export function firstSentenceWithTerm(sentences, term) {
  const lower = term.toLowerCase();
  return (
    sentences.find((sentence) => sentence.toLowerCase().includes(lower)) ||
    ""
  );
}

export function identifyLessons(text) {
  const lessonPatterns = [
    /lesson\s+(\d+)[:\s-]*(.*?)(?=\n|lesson|\d+\.|$)/gi,
    /chapter\s+(\d+)[:\s-]*(.*?)(?=\n|chapter|\d+\.|$)/gi,
    /topic\s+(\d+)[:\s-]*(.*?)(?=\n|topic|\d+\.|$)/gi,
    /unit\s+(\d+)[:\s-]*(.*?)(?=\n|unit|\d+\.|$)/gi,
    /(\d+)\.\s+([A-Z][^\n]+?)(?=\n\d+\.|\n\n|$)/g
  ];

  const lessons = [];
  let foundPattern = false;

  for (const pattern of lessonPatterns) {
    const matches = [...text.matchAll(pattern)];
    if (matches.length > 0) {
      foundPattern = true;
      for (const match of matches) {
        const number = parseInt(match[1]) || lessons.length + 1;
        const title = (match[2] || `Section ${number}`).trim();
        lessons.push({ number, title });
      }
      break;
    }
  }

  if (!foundPattern || lessons.length === 0) {
    const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 100);
    const chunkSize = Math.max(1, Math.floor(paragraphs.length / 3));
    for (let i = 0; i < Math.min(3, paragraphs.length); i++) {
      lessons.push({
        number: i + 1,
        title: `Section ${i + 1}`
      });
    }
  }

  return lessons;
}

export function splitTextIntoLessons(text, lessonMarkers) {
  if (!lessonMarkers || lessonMarkers.length === 0) {
    return [{ number: 1, title: "Main Content", text }];
  }

  const sections = [];
  const lines = text.split('\n');
  let currentSection = { number: 1, title: "Introduction", text: "" };
  let markerIndex = 0;

  for (const line of lines) {
    let foundMarker = false;

    for (const marker of lessonMarkers) {
      const lessonRegex = new RegExp(
        `(lesson|chapter|topic|unit)\\s*${marker.number}|^${marker.number}\\.`,
        'i'
      );

      if (lessonRegex.test(line)) {
        if (currentSection.text.trim()) {
          sections.push(currentSection);
        }
        currentSection = {
          number: marker.number,
          title: marker.title,
          text: line + '\n'
        };
        foundMarker = true;
        markerIndex++;
        break;
      }
    }

    if (!foundMarker) {
      currentSection.text += line + '\n';
    }
  }

  if (currentSection.text.trim()) {
    sections.push(currentSection);
  }

  return sections.length > 0 ? sections : [{ number: 1, title: "Main Content", text }];
}
