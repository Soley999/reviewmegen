import express from "express";
import multer from "multer";
import { config } from "../config.js";
import { parseFile } from "../services/fileParser.js";
import { generateReviewer } from "../services/reviewerGenerator.js";

const router = express.Router();

const ALLOWED_EXTENSIONS = new Set([
  ".pdf", ".docx", ".txt",
  ".jpg", ".jpeg", ".png", ".gif", ".webp", ".bmp", ".tiff"
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxFileSizeMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = file.originalname
      .slice(file.originalname.lastIndexOf("."))
      .toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      const err = new Error(
        `Unsupported file type: ${ext}. Allowed: PDF, DOCX, TXT, JPG, PNG, GIF, WEBP.`
      );
      err.status = 400;
      return cb(err);
    }
    return cb(null, true);
  }
});

function parseTags(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return raw.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }
  return [];
}

function handleUpload(req, res, next) {
  upload.single("file")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          message: `File is too large. Maximum size is ${config.maxFileSizeMb}MB.`
        });
      }
      if (err.status === 400 || err.message?.includes("Unsupported")) {
        return res.status(400).json({ message: err.message });
      }
      return res.status(500).json({ message: "File upload failed. Please try again." });
    }
    next();
  });
}

router.post("/", handleUpload, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File upload is required." });
    }

    const text = await parseFile(req.file);

    // Parse exam options
    const examEnabled = req.body.examEnabled === "true";
    const examCount = Math.min(
      100,
      Math.max(1, parseInt(req.body.examCount, 10) || 10)
    );

    // Parse flashcard option
    const flashcardsEnabled = req.body.flashcardsEnabled !== "false"; // default true

    const options = {
      subject: req.body.subject || "General Studies",
      tags: parseTags(req.body.tags),
      difficulty: req.body.difficulty || "medium",
      language: req.body.language || "English",
      examEnabled,
      examCount,
      flashcardsEnabled
    };

    const reviewer = await generateReviewer({ text, options, file: req.file });

    return res.json({ reviewer });
  } catch (error) {
    return next(error);
  }
});

export default router;
