import express from "express";
import multer from "multer";
import { config } from "../config.js";
import { parseFile } from "../services/fileParser.js";
import { generateReviewer } from "../services/reviewerGenerator.js";
import { optionalAuth } from "../middleware/auth.js";
import { saveReviewer } from "../services/storage.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowed = [".pdf", ".docx", ".txt"];
    const extension = file.originalname
      .slice(file.originalname.lastIndexOf("."))
      .toLowerCase();
    if (!allowed.includes(extension)) {
      const error = new Error("Unsupported file type.");
      error.status = 400;
      return cb(error);
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
    } catch (error) {
      return raw
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean);
    }
  }
  return [];
}

router.post("/", optionalAuth, upload.single("file"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "File upload is required." });
    }

    const text = await parseFile(req.file);
    if (!text.trim()) {
      return res
        .status(400)
        .json({ message: "File has no readable text." });
    }

    const options = {
      subject: req.body.subject || "General Studies",
      tags: parseTags(req.body.tags),
      format: req.body.format || "flashcards",
      difficulty: req.body.difficulty || "medium",
      language: req.body.language || "English"
    };

    const reviewer = await generateReviewer({
      text,
      options,
      file: req.file
    });

    let saved = false;
    let savedReviewer = reviewer;

    if (req.body.save === "true" && req.user) {
      savedReviewer = await saveReviewer({
        ...reviewer,
        userId: req.user.id
      });
      saved = true;
    }

    return res.json({ reviewer: savedReviewer, saved });
  } catch (error) {
    return next(error);
  }
});

export default router;
