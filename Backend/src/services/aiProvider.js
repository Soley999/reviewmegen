import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { config } from "../config.js";

// ─── Shared utilities ────────────────────────────────────────────────────────

function safeJsonParse(raw) {
  if (!raw) return null;

  // Strip markdown code fences if the model wrapped its JSON in them
  let cleaned = raw.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }

  try {
    return JSON.parse(cleaned);
  } catch {
    // Try to extract the outermost JSON object
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.slice(start, end + 1));
      } catch {
        console.warn("[aiProvider] Could not parse AI response as JSON");
        return null;
      }
    }
    return null;
  }
}

function hasAiKey() {
  return !!(config.gemini.apiKey || config.groq.apiKey);
}

// ─── Prompt builder ──────────────────────────────────────────────────────────

/**
 * Build the generation prompt.
 * The prompt is intentionally strict: the model must use ONLY the provided
 * content and must not invent facts, definitions, or answers.
 */
function buildPrompt({ text, subject, difficulty, language, examEnabled, examCount, flashcardsEnabled }) {
  const examSchema = examEnabled ? `
  "exam": {
    "description": "string — title of the exam",
    "questions": [
      {
        "question": "string — question based strictly on the content",
        "options": ["string", "string", "string", "string"],
        "answerIndex": 0,
        "answer": "string — MUST be options[answerIndex] verbatim",
        "explanation": "string — cite exactly where in the material this answer comes from",
        "wrongExplanations": {
          "0": "why option[0] is wrong (omit if this is the correct index)",
          "1": "why option[1] is wrong (omit if this is the correct index)",
          "2": "why option[2] is wrong (omit if this is the correct index)",
          "3": "why option[3] is wrong (omit if this is the correct index)"
        }
      }
    ]
  }` : `"exam": null`;

  const flashcardSchema = flashcardsEnabled ? `
  "flashcards": [
    {
      "front": "string — the exact term as it appears in the material",
      "back": "string — the definition or explanation exactly as stated in the material",
      "rationale": "string — why this concept is significant within the topic; must reference the material"
    }
  ]` : `"flashcards": []`;

  const examInstruction = examEnabled ? `
EXAM — STRICT RULES:
- Generate EXACTLY ${examCount} multiple-choice questions.
- Each question MUST be answerable using only the provided content.
- options[] must have EXACTLY 4 items.
- answerIndex is 0-based. "answer" must equal options[answerIndex] character-for-character.
- All 3 wrong options must be plausible but clearly distinguishable from the correct answer.
- Do NOT repeat the same question.
- "explanation" must quote or closely paraphrase the relevant passage from the content.
- "wrongExplanations" must contain entries for every index EXCEPT answerIndex.
` : "";

  const flashcardInstruction = flashcardsEnabled ? `
FLASHCARDS — STRICT RULES:
- One flashcard per distinct term or concept defined in the material.
- "front": the term exactly as it appears in the material.
- "back": the definition/explanation exactly as stated in the material (not a paraphrase).
- "rationale": 1-2 sentences on why this concept matters in context; must reference the material.
- Do NOT invent definitions. If no definition exists in the text, skip that term.
` : "";

  const lines = [
    `You are an expert study-material analyzer. Your task is to create a STRUCTURED REVIEWER from the educational content below.`,
    ``,
    `ABSOLUTE RULES — violating any of these invalidates your response:`,
    `1. Base ALL content STRICTLY on the provided material. Do not invent, assume, or add information not present in the text.`,
    `2. Return ONLY a valid JSON object. No prose, no markdown, no code fences, no text outside the JSON.`,
    `3. Every definition, explanation, and answer must be traceable to the provided content.`,
    `4. If the content does not contain enough information for a section, use shorter arrays — do not fabricate content.`,
    ``,
    `Subject: ${subject}`,
    `Difficulty: ${difficulty}`,
    `Language: ${language}`,
    ``,
    `Return this exact JSON structure:`,
    `{`,
    `  "title": "string — reviewer title derived from the content",`,
    `  "tableOfContents": ["string — one entry per major topic/lesson found in the content"],`,
    `  "summaryShort": "string — 2-3 sentences summarising the entire content",`,
    `  "summaryDetailed": "string — comprehensive paragraph covering all major topics",`,
    `  "lessons": [`,
    `    {`,
    `      "lessonNumber": 1,`,
    `      "title": "string — name of this topic/lesson as it appears in the content",`,
    `      "learningObjectives": ["string — what the student should understand after studying this"],`,
    `      "keyConcepts": [{"term": "string", "description": "string — from the content"}],`,
    `      "definitions": [{"term": "string", "definition": "string — verbatim or close paraphrase from content"}],`,
    `      "detailedExplanation": "string — full explanation of this lesson using only the content",`,
    `      "examples": ["string — concrete examples found in the content"],`,
    `      "importantNotes": ["string — warnings, exceptions, or emphasis found in the content"],`,
    `      "importantTerms": ["string"],`,
    `      "summary": "string — 2-3 sentence lesson summary"`,
    `    }`,
    `  ],`,
    examSchema + `,`,
    flashcardSchema + `,`,
    `  "outline": [{"title": "string", "points": ["string"]}],`,
    `  "keyConcepts": [{"term": "string", "description": "string"}],`,
    `  "definitions": [{"term": "string", "definition": "string"}],`,
    `  "bullets": ["string — key facts directly from the content"],`,
    `  "highlightTerms": ["string — important terms to highlight in the text"]`,
    `}`,
    ``,
    examInstruction,
    flashcardInstruction,
    `---`,
    `CONTENT TO ANALYZE:`,
    `---`,
    text
  ];

  return lines.join("\n");
}

/**
 * Build the image-analysis prompt.
 */
function buildImagePrompt({ subject, difficulty, language, examEnabled, examCount, flashcardsEnabled }) {
  const examPart = examEnabled
    ? `Also produce an "exam" object with exactly ${examCount} multiple-choice questions. Each question: "question", "options" (4 items), "answerIndex" (0-based), "answer" (= options[answerIndex] verbatim), "explanation", "wrongExplanations" (keys for every wrong index).`
    : `Set "exam" to null.`;
  const fcPart = flashcardsEnabled
    ? `Also produce "flashcards": one per term visible in the image, each with "front" (term), "back" (definition from the image), "rationale" (why it matters).`
    : `Set "flashcards" to [].`;

  return [
    `Extract ALL readable text, formulas, diagrams, and study content from this image.`,
    `Subject: ${subject} | Difficulty: ${difficulty} | Language: ${language}`,
    ``,
    `Return ONLY valid JSON with: title, tableOfContents, summaryShort, summaryDetailed, lessons (each with keyConcepts, definitions, detailedExplanation, examples, importantNotes, importantTerms, summary), keyConcepts, definitions, bullets, highlightTerms, outline.`,
    examPart,
    fcPart,
    `Do NOT hallucinate content not visible in the image. Return ONLY JSON.`
  ].join("\n");
}

// ─── Gemini provider ─────────────────────────────────────────────────────────

/**
 * Ordered list of Gemini Flash models to try when the primary fails with 503.
 * All confirmed available on this project's v1beta endpoint.
 * The primary (config.gemini.model) is tried first; these are used only as fallbacks.
 */
const GEMINI_FALLBACK_CHAIN = [
  "models/gemini-3.5-flash",
  "models/gemini-3.6-flash",
  "models/gemini-flash-latest"
];

/**
 * Sleep helper for exponential back-off.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Call a single Gemini model. Returns parsed JSON or null.
 * Retries once on 503 (high-load) with a short delay before giving up on that model.
 */
async function callGeminiModel(modelId, content) {
  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  const model = genAI.getGenerativeModel({
    model: modelId,
    // responseMimeType is intentionally omitted: newer flash models (3.x) return
    // empty content when that constraint is set. We rely on the strict JSON-only
    // prompt + safeJsonParse which already strips markdown fences.
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 8192
    }
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await model.generateContent(content);
      const text = result.response.text();
      const parsed = safeJsonParse(text);
      if (parsed) return parsed;
      console.warn(`[aiProvider] Gemini ${modelId} returned unparseable content (attempt ${attempt})`);
      return null; // bad JSON — no point retrying with same model
    } catch (err) {
      const is503 = err.status === 503 || err.message?.includes("503");
      if (is503 && attempt === 1) {
        console.warn(`[aiProvider] Gemini ${modelId} 503 on attempt 1 — waiting 1.5s before retry`);
        await sleep(1500);
        continue;
      }
      throw err; // re-throw for the caller to handle (404, auth, etc.)
    }
  }
  return null;
}

async function callGeminiText(prompt) {
  // Build the ordered model chain: configured model first, then fallbacks (deduped)
  const primary = config.gemini.model;
  const chain = [primary, ...GEMINI_FALLBACK_CHAIN.filter((m) => m !== primary)];

  for (const modelId of chain) {
    try {
      const result = await callGeminiModel(modelId, prompt);
      if (result) {
        if (modelId !== primary) {
          console.log(`[aiProvider] Gemini succeeded on fallback model: ${modelId}`);
        }
        return result;
      }
    } catch (err) {
      const is503 = err.status === 503 || err.message?.includes("503");
      const is404 = err.status === 404 || err.message?.includes("404");
      if (is503) {
        console.warn(`[aiProvider] Gemini ${modelId} still 503 after retry — trying next model`);
      } else if (is404) {
        console.warn(`[aiProvider] Gemini ${modelId} 404 (not available on this key) — trying next model`);
      } else {
        console.warn(`[aiProvider] Gemini ${modelId} error: ${err.message} — trying next model`);
      }
    }
  }

  console.warn("[aiProvider] All Gemini models exhausted");
  return null;
}

async function callGeminiVision({ base64, mimeType, textPrompt }) {
  // Use the configured model for vision; fall back to gemini-3.5-flash which
  // confirmed supports inlineData on this project's key.
  const primary = config.gemini.model;
  const visionChain = [primary, ...GEMINI_FALLBACK_CHAIN.filter((m) => m !== primary)];

  for (const modelId of visionChain) {
    try {
      const result = await callGeminiModel(modelId, [
        { text: textPrompt },
        { inlineData: { mimeType, data: base64 } }
      ]);
      if (result) return result;
    } catch (err) {
      const is503 = err.status === 503 || err.message?.includes("503");
      const is404 = err.status === 404 || err.message?.includes("404");
      if (is503 || is404) {
        console.warn(`[aiProvider] Gemini vision ${modelId} ${err.status} — trying next model`);
      } else {
        console.warn(`[aiProvider] Gemini vision ${modelId} error: ${err.message}`);
        break; // non-transient error (e.g. image too large) — stop trying
      }
    }
  }

  return null;
}

// ─── Groq provider ───────────────────────────────────────────────────────────

async function callGroq(prompt) {
  const groq = new Groq({ apiKey: config.groq.apiKey });

  const completion = await groq.chat.completions.create({
    model: config.groq.model,
    temperature: 0.1,
    max_tokens: 8000,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: "You are an expert educational content analyzer. Return ONLY valid JSON. Never include text outside the JSON object. Base all content strictly on the provided material."
      },
      { role: "user", content: prompt }
    ]
  });

  const content = completion.choices?.[0]?.message?.content;
  return safeJsonParse(content);
}

// ─── Provider dispatcher ─────────────────────────────────────────────────────

/**
 * Try Gemini first, fall back to Groq if Gemini fails or is not configured.
 */
async function callAI(prompt) {
  // Try Gemini
  if (config.gemini.apiKey) {
    try {
      const result = await callGeminiText(prompt);
      if (result) {
        console.log("[aiProvider] Gemini succeeded");
        return result;
      }
      console.warn("[aiProvider] Gemini returned null/empty response");
    } catch (err) {
      console.warn("[aiProvider] Gemini failed:", err.message || err);
    }
  }

  // Fall back to Groq
  if (config.groq.apiKey) {
    try {
      const result = await callGroq(prompt);
      if (result) {
        console.log("[aiProvider] Groq succeeded");
        return result;
      }
      console.warn("[aiProvider] Groq returned null/empty response");
    } catch (err) {
      console.warn("[aiProvider] Groq failed:", err.message || err);
    }
  }

  return null;
}

// ─── Public API ──────────────────────────────────────────────────────────────

export async function generateWithAI({ text, subject, difficulty, language, examEnabled, examCount, flashcardsEnabled }) {
  if (!hasAiKey()) return null;

  const prompt = buildPrompt({ text, subject, difficulty, language, examEnabled, examCount, flashcardsEnabled });
  return callAI(prompt);
}

/**
 * Generate reviewer from an image.
 * Gemini only — Groq does not support vision.
 */
export async function generateWithAIVision({ base64, mimeType, subject, difficulty, language, examEnabled, examCount, flashcardsEnabled }) {
  if (!config.gemini.apiKey) return null;

  const textPrompt = buildImagePrompt({ subject, difficulty, language, examEnabled, examCount, flashcardsEnabled });

  try {
    const result = await callGeminiVision({ base64, mimeType, textPrompt });
    if (result) {
      console.log("[aiProvider] Gemini vision succeeded");
      return result;
    }
    console.warn("[aiProvider] Gemini vision returned null/empty");
  } catch (err) {
    console.warn("[aiProvider] Gemini vision failed:", err.message || err);
  }
  return null;
}

/**
 * Exposed so reviewerGenerator can check without calling.
 */
export function aiIsConfigured() {
  return hasAiKey();
}
