import api from "./client.js";

export async function processFile({
  file,
  subject,
  tags,
  format,
  difficulty,
  language,
  onProgress
}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("subject", subject || "");
  formData.append("tags", JSON.stringify(tags || []));
  formData.append("format", format || "flashcards");
  formData.append("difficulty", difficulty || "medium");
  formData.append("language", language || "English");

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
