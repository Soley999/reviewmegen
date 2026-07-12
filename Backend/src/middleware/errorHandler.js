export function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || "An unexpected error occurred.";

  if (err.code === "LIMIT_FILE_SIZE") {
    status = 413;
    message = "File size exceeds the maximum allowed limit (200MB).";
  } else if (err.code === "LIMIT_UNEXPECTED_FILE") {
    status = 400;
    message = "Unexpected file upload error. Please ensure you're uploading a valid file.";
  } else if (err.name === "ValidationError") {
    status = 400;
    message = err.message || "Validation error.";
  } else if (err.name === "UnauthorizedError" || status === 401) {
    status = 401;
    message = "Authentication required. Please log in.";
  } else if (status === 500) {
    message = "An internal server error occurred. Please try again later.";
  }

  if (process.env.NODE_ENV !== "test") {
    console.error("API error:", {
      status,
      message,
      error: err.message,
      stack: err.stack
    });
  }

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
  });
}
