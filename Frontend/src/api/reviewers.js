import api from "./client.js";

export async function processFile({
  file,
  subject,
  tags,
  difficulty,
  language,
  examEnabled,
  examCount,
  flashcardsEnabled,
  onProgress
}) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("subject", subject || "");
  formData.append("tags", JSON.stringify(tags || []));
  formData.append("difficulty", difficulty || "medium");
  formData.append("language", language || "English");
  formData.append("examEnabled", examEnabled ? "true" : "false");
  formData.append("examCount", String(examCount || 20));
  formData.append("flashcardsEnabled", flashcardsEnabled ? "true" : "false");

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
