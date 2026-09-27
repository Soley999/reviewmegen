import dotenv from "dotenv";

if (!process.env.VERCEL) {
  dotenv.config();
}

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || (process.env.VERCEL ? "*" : "http://localhost:5173"),
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 200),

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    // Full model path as returned by the ListModels API (models/... prefix required
    // for models not yet promoted to the default v1beta namespace).
    model: process.env.GEMINI_MODEL || "models/gemini-3.6-flash"
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY || "",
    model: process.env.GROQ_MODEL || "openai/gpt-oss-20b"
  },

  // Per-call character budget for AI prompts.
  // gemini-3.5-flash / qwen-27b both have large context windows.
  // 200K chars (~50K tokens) keeps most documents as a single chunk
  // while leaving room for the prompt template + output.
  maxCharsPerChunk: Number(process.env.MAX_CHARS_PER_CHUNK || 200000),

  // Kept for backwards compatibility with any env override
  chunkingThreshold: Number(process.env.CHUNKING_THRESHOLD || 200000)
};
