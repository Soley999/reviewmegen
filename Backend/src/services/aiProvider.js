import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";
import { config } from "../config.js";

// ─── Utilities ────────────────────────────────────────────────────────────────

function safeJsonParse(raw) {
  if (!raw) return null;
  let cleaned = raw.trim();
  // Strip markdown fences if the model wrapped its response
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) {
      try { return JSON.parse(cleaned.slice(start, end + 1)); } catch { /* fall through */ }
    }
    console.warn("[aiProvider] Could not parse AI response as JSON");
    return null;
  }
}

export function aiIsConfigured() {
  return !!(config.gemini.apiKey || config.groq.apiKey);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─── Prompt builders ──────────────────────────────────────────────────────────

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

  return [
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
  ].join("\n");
}

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

// ─── Gemini ───────────────────────────────────────────────────────────────────

// All confirmed-working models on this project's key (validated 2025).
// Primary from config is tried first; rest are fallbacks deduped at call time.
const GEMINI_FALLBACK_CHAIN = [
  "models/gemini-3.5-flash",
  "models/gemini-3.6-flash",
  "models/gemini-flash-latest"
];

/**
 * Call one Gemini model. Retries once on 503 after 1.5 s.
 * Returns parsed JSON or null (parse failure).
 * Throws for non-transient errors (404, auth, etc.) so the chain can skip.
 */
async function callOneGeminiModel(modelId, content) {
  const genAI = new GoogleGenerativeAI(config.gemini.apiKey);
  const model = genAI.getGenerativeModel({
    model: modelId,
    // responseMimeType omitted: 3.x flash models return empty string when set.
    // Strict JSON-only prompt + safeJsonParse handles parsing instead.
    generationConfig: { temperature: 0.1, maxOutputTokens: 8192 }
  });

  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await model.generateContent(content);
      const parsed = safeJsonParse(result.response.text());
      if (parsed) return parsed;
      console.warn(`[gemini] ${modelId} — unparseable response`);
      return null; // not retryable
    } catch (err) {
      const status = err.status ?? 0;
      const msg = String(err.message ?? "");
      const is503 = status === 503 || msg.includes("503");
      const is429 = status === 429 || msg.includes("429") || msg.toLowerCase().includes("quota") || msg.toLowerCase().includes("rate");
      if (is429) {
        // Hard quota limit — no point retrying this model, skip to next immediately
        console.warn(`[gemini] ${modelId} — 429 rate-limited, skipping to next model`);
        throw err;
      }
      if (is503 && attempt === 1) {
        // Transient overload — one retry after a short wait is worth it
        console.warn(`[gemini] ${modelId} — 503, retrying in 1.5 s`);
        await sleep(1500);
        continue;
      }
      throw err; // re-throw so outer chain can classify and skip
    }
  }
  return null;
}

/**
 * Walk the Gemini model chain.
 * Returns parsed JSON data on success, or null if every model fails.
 * Does NOT touch Groq — that is callAI()'s responsibility.
 */
async function tryAllGeminiModels(content) {
  const primary = config.gemini.model;
  const chain = [primary, ...GEMINI_FALLBACK_CHAIN.filter((m) => m !== primary)];

  for (const modelId of chain) {
    try {
      const data = await callOneGeminiModel(modelId, content);
      if (data) {
        console.log(`[aiProvider] ✓ provider=gemini  model=${modelId}`);
        return data;
      }
      console.warn(`[gemini] ${modelId} — no usable output, trying next model`);
    } catch (err) {
      const code = err.status ?? "?";
      console.warn(`[gemini] ${modelId} — error ${code}: ${String(err.message).slice(0, 80)} — trying next model`);
    }
  }

  console.warn("[gemini] All Gemini models exhausted");
  return null;
}

// ─── Groq ─────────────────────────────────────────────────────────────────────

// Confirmed-working Groq models for this key (validated 2025).
// Primary from config is tried first; rest are fallbacks.
const GROQ_FALLBACK_CHAIN = [
  "openai/gpt-oss-20b",
  "openai/gpt-oss-120b",
  "qwen/qwen3.8-27b"
];

async function callOneGroqModel(modelId, prompt) {
  const groq = new Groq({ apiKey: config.groq.apiKey });
  const completion = await groq.chat.completions.create({
    model: modelId,
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
  const raw = completion.choices?.[0]?.message?.content;
  return safeJsonParse(raw);
}

async function tryGroq(prompt) {
  const primary = config.groq.model;
  const chain = [primary, ...GROQ_FALLBACK_CHAIN.filter((m) => m !== primary)];

  for (const modelId of chain) {
    try {
      const data = await callOneGroqModel(modelId, prompt);
      if (data) {
        console.log(`[aiProvider] ✓ provider=groq  model=${modelId}`);
        return data;
      }
      console.warn(`[groq] ${modelId} — no usable output, trying next model`);
    } catch (err) {
      const status = err.status ?? 0;
      const msg = String(err.message ?? "");
      const is429 = status === 429 || msg.includes("429") || msg.toLowerCase().includes("rate") || msg.toLowerCase().includes("quota");
      console.warn(`[groq] ${modelId} — ${is429 ? "429 rate-limited" : `error ${status}`}, trying next model`);
    }
  }

  console.warn("[groq] All Groq models exhausted");
  return null;
}

// ─── Provider dispatcher ──────────────────────────────────────────────────────

/**
 * Try Gemini first; if ALL Gemini models fail, immediately fall back to Groq.
 *
 * Returns the parsed JSON data directly (plain object), or null.
 * The provider used is logged to the console.
 */
async function callAI(prompt) {
  // 1. Gemini
  if (config.gemini.apiKey) {
    const data = await tryAllGeminiModels(prompt);
    if (data) return data;
    // Every Gemini model failed — fall through to Groq right now
    if (config.groq.apiKey) {
      console.warn("[aiProvider] Gemini exhausted — falling back to Groq");
    }
  }

  // 2. Groq fallback
  if (config.groq.apiKey) {
    try {
      const data = await tryGroq(prompt);
      if (data) {
        console.log(`[aiProvider] ✓ provider=groq  model=${config.groq.model}`);
        return data;
      }
      console.warn("[aiProvider] Groq returned null/empty response");
    } catch (err) {
      console.warn(`[aiProvider] Groq failed: ${err.message}`);
    }
  }

  return null;
}

// ─── Vision (Gemini only — Groq has no vision API) ────────────────────────────

async function callGeminiVision({ base64, mimeType, textPrompt }) {
  const primary = config.gemini.model;
  const chain = [primary, ...GEMINI_FALLBACK_CHAIN.filter((m) => m !== primary)];

  for (const modelId of chain) {
    try {
      const data = await callOneGeminiModel(modelId, [
        { text: textPrompt },
        { inlineData: { mimeType, data: base64 } }
      ]);
      if (data) {
        console.log(`[aiProvider] ✓ provider=gemini-vision  model=${modelId}`);
        return data;
      }
    } catch (err) {
      const is503 = err.status === 503 || String(err.message).includes("503");
      const is404 = err.status === 404 || String(err.message).includes("404");
      if (is503 || is404) {
        console.warn(`[aiProvider] Gemini vision ${modelId} — ${err.status}, trying next`);
      } else {
        console.warn(`[aiProvider] Gemini vision ${modelId} — non-transient error, stopping: ${err.message}`);
        break;
      }
    }
  }
  return null;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate reviewer JSON from text.
 * Returns the parsed data object directly, or null on total failure.
 */
export async function generateWithAI({ text, subject, difficulty, language, examEnabled, examCount, flashcardsEnabled }) {
  if (!aiIsConfigured()) return null;
  const prompt = buildPrompt({ text, subject, difficulty, language, examEnabled, examCount, flashcardsEnabled });
  return callAI(prompt);
}

/**
 * Generate reviewer JSON from an image (Gemini vision only).
 * Returns the parsed data object directly, or null on failure.
 */
export async function generateWithAIVision({ base64, mimeType, subject, difficulty, language, examEnabled, examCount, flashcardsEnabled }) {
  if (!config.gemini.apiKey) return null;
  const textPrompt = buildImagePrompt({ subject, difficulty, language, examEnabled, examCount, flashcardsEnabled });
  try {
    const data = await callGeminiVision({ base64, mimeType, textPrompt });
    if (!data) console.warn("[aiProvider] Gemini vision returned null/empty");
    return data;
  } catch (err) {
    console.warn("[aiProvider] Gemini vision failed:", err.message);
    return null;
  }
}
