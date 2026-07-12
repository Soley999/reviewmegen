import path from "path";
import pdf from "pdf-parse";
import mammoth from "mammoth";

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".txt"];
const MAX_FILE_SIZE = 200 * 1024 * 1024; // 200MB

export async function parseFile(file) {
  if (!file) {
    const error = new Error("No file provided.");
    error.status = 400;
    throw error;
  }

  if (!file.originalname) {
    const error = new Error("Invalid file: missing filename.");
    error.status = 400;
    throw error;
  }

  if (file.size > MAX_FILE_SIZE) {
    const error = new Error(`File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.`);
    error.status = 400;
    throw error;
  }

  const extension = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    const error = new Error(`Unsupported file type: ${extension}. Allowed types: ${ALLOWED_EXTENSIONS.join(", ")}`);
    error.status = 400;
    throw error;
  }

  try {
    let text = "";

    if (extension === ".pdf") {
      const data = await pdf(file.buffer);
      text = data.text || "";
    } else if (extension === ".docx") {
      const result = await mammoth.extractRawText({ buffer: file.buffer });
      text = result.value || "";
    } else if (extension === ".txt") {
      text = file.buffer.toString("utf8");
    }

    if (!text || text.trim().length === 0) {
      const error = new Error("The file appears to be empty or contains no readable text.");
      error.status = 400;
      throw error;
    }

    if (text.trim().length < 50) {
      const error = new Error("The file contains too little text to generate a meaningful reviewer. Please provide a file with more content.");
      error.status = 400;
      throw error;
    }

    return text;
  } catch (error) {
    if (error.status) {
      throw error;
    }

    console.error("File parsing error:", error);
    const parseError = new Error(`Failed to parse ${extension} file. The file may be corrupted or in an unsupported format.`);
    parseError.status = 400;
    throw parseError;
  }
}
