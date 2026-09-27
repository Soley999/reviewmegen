/**
 * test-fallback.js
 *
 * Verifies the Gemini → Groq fallback by deliberately breaking the Gemini API
 * key so every Gemini attempt returns a 400 authentication error, then confirming
 * that the cascade continues and Groq (or the next configured provider) succeeds.
 *
 * Run from the Backend directory:
 *   node scripts/test-fallback.js
 *   npm run test:fallback
 *
 * Requirements:
 *   GROQ_API_KEY must be set in Backend/.env (or the environment).
 *   GEMINI_API_KEY may or may not be set — it is overridden with a bad value.
 */

import dotenv from "dotenv";
dotenv.config();

// All imports must resolve from the Backend package root
import { config } from "../src/config.js";
import { generateWithAI } from "../src/services/aiProvider.js";

// ─── Colour helpers ───────────────────────────────────────────────────────────

const G = "\x1b[32m", R = "\x1b[31m", Y = "\x1b[33m", X = "\x1b[0m";
let passed = 0, failed = 0;

function pass(msg) { console.log(`${G}✓ PASS${X}  ${msg}`); passed++; }
function fail(msg) { console.error(`${R}✗ FAIL${X}  ${msg}`); failed++; }
function info(msg) { console.log(`${Y}ℹ${X}      ${msg}`); }

const SHORT_TEXT =
  "Photosynthesis is the process by which plants convert sunlight into glucose. " +
  "Chlorophyll is the green pigment inside chloroplasts that captures light energy. " +
  "Carbon dioxide and water are the reactants; oxygen and glucose are the products.";

// ─── Test 1: Cascade — bad Gemini key → Groq succeeds ────────────────────────

async function testCascadeGeminiFailsGroqSucceeds() {
  info("Test 1 — Full cascade: invalid Gemini key → Groq fallback produces a result");

  if (!config.groq.apiKey) {
    info("GROQ_API_KEY not set — skipping. Set GROQ_API_KEY in Backend/.env to run this test.");
    return;
  }

  // Temporarily replace the Gemini key with a known-bad value and disable retries
  const origKey     = config.gemini.apiKey;
  const origRetries = config.gemini.maxRetries;
  config.gemini.apiKey     = "INVALID_GEMINI_KEY_FOR_FALLBACK_TEST";
  config.gemini.maxRetries = 0; // fail fast so the test doesn't hang

  info(`Gemini key set to: ${config.gemini.apiKey}`);
  info(`Groq key present: ${config.groq.apiKey ? "yes" : "no"}`);

  try {
    const { result, provider } = await generateWithAI({
      text: SHORT_TEXT,
      subject: "Biology",
      difficulty: "easy",
      language: "English",
      examEnabled: false,
      examCount: 5,
      flashcardsEnabled: false
    });

    if (!result) {
      fail("Cascade returned null — Groq did not produce a result");
    } else if (provider === "groq") {
      pass(`Cascade correctly fell back to Groq (provider="${provider}")`);
    } else if (provider === "openai") {
      pass(`Fell back to OpenAI legacy (provider="${provider}") — acceptable when Groq also failed`);
    } else {
      fail(`Unexpected provider="${provider}" — expected "groq" or "openai"`);
    }
  } finally {
    config.gemini.apiKey     = origKey;
    config.gemini.maxRetries = origRetries;
  }
}

// ─── Test 2: When Gemini succeeds, Groq is NOT called ────────────────────────

async function testGeminiSucceedsGroqNotCalled() {
  info("Test 2 — When Gemini succeeds, Groq must not be invoked");

  if (!config.gemini.apiKey) {
    info("GEMINI_API_KEY not set — skipping.");
    return;
  }

  // Poison the Groq key; any Groq call would result in an auth error
  const origGroqKey = config.groq.apiKey;
  config.groq.apiKey = "INTENTIONALLY_INVALID_GROQ_KEY";

  try {
    const { result, provider } = await generateWithAI({
      text: SHORT_TEXT,
      subject: "Biology",
      difficulty: "easy",
      language: "English",
      examEnabled: false,
      examCount: 5,
      flashcardsEnabled: false
    });

    if (result && provider === "gemini") {
      pass(`Gemini succeeded (provider="${provider}") — Groq was never reached`);
    } else if (!result) {
      fail("No result returned — Gemini may have an API problem unrelated to fallback logic");
    } else {
      fail(`Expected provider="gemini" but got "${provider}" — Groq was called unnecessarily`);
    }
  } finally {
    config.groq.apiKey = origGroqKey;
  }
}

// ─── Test 3: No keys configured → graceful null ───────────────────────────────

async function testNoKeysConfigured() {
  info("Test 3 — No API keys → generateWithAI returns { result: null, provider: null }");

  const origGemini = config.gemini.apiKey;
  const origGroq   = config.groq.apiKey;

  config.gemini.apiKey = "";
  config.groq.apiKey   = "";

  try {
    const { result, provider } = await generateWithAI({
      text: SHORT_TEXT,
      subject: "Biology",
      difficulty: "easy",
      language: "English",
      examEnabled: false,
      examCount: 5,
      flashcardsEnabled: false
    });

    if (result === null && provider === null) {
      pass('No-key case returns { result: null, provider: null } — no crash');
    } else {
      fail(`Expected null/null but got result=${JSON.stringify(result)}, provider=${provider}`);
    }
  } finally {
    config.gemini.apiKey = origGemini;
    config.groq.apiKey   = origGroq;
  }
}

// ─── Test 4: providerUsed field is present in generateReviewer output ─────────

async function testProviderUsedField() {
  info("Test 4 — generateReviewer() response includes providerUsed field");

  const { generateReviewer } = await import("../src/services/reviewerGenerator.js");

  const fakeFile = { originalname: "test.txt", size: SHORT_TEXT.length, mimetype: "text/plain" };

  const reviewer = await generateReviewer({
    text: SHORT_TEXT,
    options: {
      subject: "Biology",
      difficulty: "easy",
      language: "English",
      examEnabled: false,
      examCount: 5,
      flashcardsEnabled: false
    },
    file: fakeFile
  });

  if ("providerUsed" in reviewer) {
    pass(`providerUsed field present: "${reviewer.providerUsed}"`);
  } else {
    fail("providerUsed field missing from generateReviewer() response");
  }

  if (reviewer.title) {
    pass(`Reviewer has a title: "${reviewer.title}"`);
  } else {
    fail("Reviewer is missing a title");
  }
}

// ─── Runner ───────────────────────────────────────────────────────────────────

async function run() {
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  ReviewMeGen — Gemini → Groq Fallback Tests");
  console.log("══════════════════════════════════════════════════════════\n");

  await testCascadeGeminiFailsGroqSucceeds();
  console.log();
  await testGeminiSucceedsGroqNotCalled();
  console.log();
  await testNoKeysConfigured();
  console.log();
  await testProviderUsedField();

  console.log("\n══════════════════════════════════════════════════════════");
  console.log(`  Passed: ${G}${passed}${X}   Failed: ${failed > 0 ? R : G}${failed}${X}`);
  if (failed > 0) {
    console.error(`${R}  Some tests FAILED.${X}`);
    process.exitCode = 1;
  } else {
    console.log(`${G}  All tests PASSED.${X}`);
  }
  console.log("══════════════════════════════════════════════════════════\n");
}

run().catch((err) => {
  console.error("Unexpected error in test runner:", err);
  process.exitCode = 1;
});
