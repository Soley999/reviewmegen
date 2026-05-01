import axios from "axios";
import { config } from "../config.js";

function buildPrompt({ text, subject, difficulty, language, format }) {
  const user = [
    "Create a structured reviewer for the following content.",
    "",
    `Subject: ${subject || "General"}`,
    `Difficulty: ${difficulty}`,
    `Language: ${language}`,
    `Preferred format: ${format}`,
    "",
    "Return JSON with keys: title, summaryShort, summaryDetailed, keyConcepts (array of {term, description}), definitions (array of {term, definition}), bullets (array), questions { multipleChoice (array of {question, options, answerIndex, answer}), identification (array of {question, answer}), trueFalse (array of {statement, answer}) }, flashcards (array of {front, back}), outline (array of {title, points}), highlightTerms (array).",
    "",
    `Content:\n${text}`
  ].join("\n");

  return {
    system:
      "You are a study reviewer generator. Return only valid JSON with no extra text.",
    user
  };
}

function safeJsonParse(raw) {
  try {
    return JSON.parse(raw);
  } catch (error) {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start !== -1 && end !== -1) {
      const sliced = raw.slice(start, end + 1);
      return JSON.parse(sliced);
    }
    return null;
  }
}

export async function generateWithAI({ text, subject, difficulty, language, format }) {
  if (!config.openai.apiKey) {
    return null;
  }

  const prompt = buildPrompt({ text, subject, difficulty, language, format });

  try {
    const response = await axios.post(
      `${config.openai.baseUrl}/chat/completions`,
      {
        model: config.openai.model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${config.openai.apiKey}`,
          "Content-Type": "application/json"
        }
      }
    );

    const content = response?.data?.choices?.[0]?.message?.content;
    if (!content) return null;

    return safeJsonParse(content);
  } catch (error) {
    console.warn("AI provider failed, falling back to local processing.");
    return null;
  }
}
