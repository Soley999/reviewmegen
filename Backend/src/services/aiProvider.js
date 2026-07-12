import axios from "axios";
import { config } from "../config.js";

function buildPrompt({ text, subject, difficulty, language, format }) {
  const mcqPerLesson = difficulty === "easy" ? 5 : difficulty === "hard" ? 10 : 7;
  const tfPerLesson = difficulty === "easy" ? 4 : difficulty === "hard" ? 8 : 6;
  const idPerLesson = difficulty === "easy" ? 3 : difficulty === "hard" ? 7 : 5;

  const user = [
    "Create a comprehensive structured reviewer for the following educational content.",
    "",
    `Subject: ${subject || "General"}`,
    `Difficulty: ${difficulty}`,
    `Language: ${language}`,
    `Preferred format: ${format}`,
    "",
    "INSTRUCTIONS:",
    "1. Carefully read the entire content.",
    "2. Identify all distinct lessons, topics, or chapters.",
    "3. For each lesson, extract key concepts, definitions, examples, and important notes.",
    "4. Generate a quiz after each lesson.",
    "5. Generate a comprehensive final exam covering all lessons.",
    "",
    "Return JSON with this exact structure:",
    "{",
    '  "title": "Overall reviewer title based on the subject",',
    '  "tableOfContents": ["Lesson 1: Title", "Lesson 2: Title", ...],',
    '  "summaryShort": "2-3 sentence overview",',
    '  "summaryDetailed": "Detailed paragraph overview covering all topics",',
    '  "lessons": [',
    "    {",
    '      "lessonNumber": 1,',
    '      "title": "Lesson title",',
    '      "learningObjectives": ["By the end of this lesson, students will be able to..."],',
    '      "keyConcepts": [{"term": "concept name", "description": "clear explanation"}],',
    '      "definitions": [{"term": "term", "definition": "precise definition"}],',
    '      "detailedExplanation": "Full explanation with headings, covering the topic thoroughly",',
    '      "examples": ["Concrete example 1", "Concrete example 2"],',
    '      "importantNotes": ["Key takeaway or note"],',
    '      "importantTerms": ["term1", "term2"],',
    '      "summary": "Brief summary of the lesson",',
    '      "questions": {',
    `        "multipleChoice": [{"question": "...", "options": ["A", "B", "C", "D"], "answerIndex": 0, "answer": "correct option text", "explanation": "why this is correct"}] (generate ${mcqPerLesson} questions),`,
    '        "trueFalse": [{"statement": "...", "answer": true, "explanation": "..."}],',
    '        "identification": [{"question": "...", "answer": "...", "explanation": "..."}],',
    '        "shortAnswer": [{"question": "...", "answer": "...", "points": ["key point"]}]',
    "      }",
    "    }",
    "  ],",
    '  "finalExam": {',
    '    "description": "Comprehensive Final Examination",',
    '    "instructions": "Answer all questions. Choose the best answer for multiple choice.",',
    '    "questions": {',
    '      "multipleChoice": [{"question": "...", "options": ["A","B","C","D"], "answerIndex": 0, "answer": "...", "explanation": "...", "lessonRef": 1}],',
    '      "trueFalse": [{"statement": "...", "answer": true, "explanation": "...", "lessonRef": 1}],',
    '      "identification": [{"question": "...", "answer": "...", "explanation": "...", "lessonRef": 1}],',
    '      "shortAnswer": [{"question": "...", "answer": "...", "points": [], "lessonRef": 1}]',
    "    },",
    '    "answerKey": "Full answer key with explanations for all questions"',
    "  },",
    '  "flashcards": [{"front": "term or question", "back": "definition or answer"}],',
    '  "outline": [{"title": "section heading", "points": ["bullet point"]}],',
    '  "highlightTerms": ["important term 1", "important term 2"]',
    "}",
    "",
    "QUESTION REQUIREMENTS PER LESSON:",
    `- Multiple Choice: ${mcqPerLesson} questions, each with exactly 4 options (A, B, C, D)`,
    `- True or False: ${tfPerLesson} statements`,
    `- Identification: ${idPerLesson} questions`,
    "- Short Answer: 2-3 questions",
    "- Every question MUST have an explanation for the correct answer",
    "",
    "FINAL EXAM REQUIREMENTS:",
    `- Multiple Choice: ${mcqPerLesson * 2} questions balanced across all lessons`,
    `- True or False: ${tfPerLesson * 2} statements balanced across all lessons`,
    `- Identification: ${idPerLesson * 2} questions balanced across all lessons`,
    "- Short Answer: 5 questions",
    "- Include lessonRef (lesson number) for each question",
    "- Provide a complete answer key",
    "",
    "QUALITY REQUIREMENTS:",
    "- Content must be accurate and directly from the source material",
    "- No duplicated content between lessons",
    "- No missing sections or incomplete outputs",
    "- Proper formatting with clear headings",
    "- Examples should be concrete and relevant",
    "- Definitions should be precise",
    "- Questions should test comprehension, not just memorization",
    "",
    `Content:\n${text}`
  ].join("\n");

  return {
    system:
      "You are an expert educational content generator and exam creator. Your task is to analyze educational material and produce well-structured, comprehensive study reviewers with accurate assessments. Always return valid JSON. Never include text outside the JSON object. Ensure all content is accurate to the source material.",
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
      try {
        const sliced = raw.slice(start, end + 1);
        return JSON.parse(sliced);
      } catch (innerError) {
        console.warn("Failed to parse AI response as JSON");
        return null;
      }
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
        max_tokens: 16000,
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
        },
        timeout: 120000
      }
    );

    const content = response?.data?.choices?.[0]?.message?.content;
    if (!content) return null;

    return safeJsonParse(content);
  } catch (error) {
    if (error.response) {
      console.warn(`AI provider returned ${error.response.status}: ${error.response.data?.error?.message || "unknown error"}`);
    } else if (error.code === "ECONNABORTED") {
      console.warn("AI provider request timed out");
    } else {
      console.warn("AI provider failed:", error.message);
    }
    return null;
  }
}
