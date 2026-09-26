import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  maxFileSizeMb: Number(process.env.MAX_FILE_SIZE_MB || 200),

  gemini: {
    apiKey: process.env.GEMINI_API_KEY || "",
    // Full model path as returned by the ListModels API (models/... prefix required
    // for models not yet promoted to the default v1beta namespace).
    model: process.env.GEMINI_MODEL || "models/gemini-3.5-flash"
  },

  groq: {
    apiKey: process.env.GROQ_API_KEY || "",
    model: process.env.GROQ_MODEL || "qwen/qwen3.8-27b"
  },

  // Safe per-call character limit — Gemini 1.5 Flash has 1M token context but
  // we cap the content portion at ~60K chars (~15K tokens) so the full prompt +
  // output fits comfortably within limits and avoids high latency.
  // For large files we chunk and make multiple calls.
  maxCharsPerChunk: Number(process.env.MAX_CHARS_PER_CHUNK || 60000),

  // If the full text exceeds this, use chunked processing
  chunkingThreshold: Number(process.env.CHUNKING_THRESHOLD || 60000)
};
