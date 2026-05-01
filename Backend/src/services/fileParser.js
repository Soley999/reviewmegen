import path from "path";
import pdf from "pdf-parse";
import mammoth from "mammoth";

export async function parseFile(file) {
  const extension = path.extname(file.originalname).toLowerCase();

  if (extension === ".pdf") {
    const data = await pdf(file.buffer);
    return data.text || "";
  }

  if (extension === ".docx") {
    const result = await mammoth.extractRawText({ buffer: file.buffer });
    return result.value || "";
  }

  if (extension === ".txt") {
    return file.buffer.toString("utf8");
  }

  const error = new Error("Unsupported file type.");
  error.status = 400;
  throw error;
}
