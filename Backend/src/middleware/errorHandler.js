export function errorHandler(err, req, res, next) {
  const status = err.code === "LIMIT_FILE_SIZE" ? 413 : err.status || 500;
  const message =
    err.code === "LIMIT_FILE_SIZE"
      ? "File exceeds the size limit."
      : err.message || "Unexpected server error.";

  if (process.env.NODE_ENV !== "test") {
    console.error("API error:", err);
  }

  res.status(status).json({ message });
}
