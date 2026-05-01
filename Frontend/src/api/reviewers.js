import api from "./client.js";

export async function loginUser(payload) {
  const { data } = await api.post("/api/auth/login", payload);
  return data;
}

export async function signupUser(payload) {
  const { data } = await api.post("/api/auth/signup", payload);
  return data;
}

export async function processFile({
  file,
  subject,
  tags,
  format,
  difficulty,
  language,
  save,
  onProgress
}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("subject", subject || "");
  formData.append("tags", JSON.stringify(tags || []));
  formData.append("format", format || "flashcards");
  formData.append("difficulty", difficulty || "medium");
  formData.append("language", language || "English");
  formData.append("save", save ? "true" : "false");

  const { data } = await api.post("/api/process", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (event) => {
      if (!onProgress) return;
      const percent = event.total
        ? Math.round((event.loaded / event.total) * 100)
        : 0;
      onProgress(percent);
    }
  });

  return data;
}

export async function listReviewers() {
  const { data } = await api.get("/api/reviewers");
  return data.reviewers;
}

export async function getReviewer(id) {
  const { data } = await api.get(`/api/reviewers/${id}`);
  return data.reviewer;
}

export async function removeReviewer(id) {
  await api.delete(`/api/reviewers/${id}`);
}
