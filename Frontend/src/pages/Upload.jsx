import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FileDropzone from "../components/FileDropzone.jsx";
import LoadingOverlay from "../components/LoadingOverlay.jsx";
import TagInput from "../components/TagInput.jsx";
import Section from "../components/Section.jsx";
import { processFile } from "../api/reviewers.js";
import { saveLastReviewer } from "../utils/storage.js";

function Upload() {
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [subject, setSubject] = useState("");
  const [tags, setTags] = useState([]);
  const [difficulty, setDifficulty] = useState("medium");
  const [language, setLanguage] = useState("English");

  const [examEnabled, setExamEnabled] = useState(false);
  const [examCount, setExamCount] = useState(10);
  const [flashcardsEnabled, setFlashcardsEnabled] = useState(true);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!file) {
      setError("Please upload a file first.");
      return;
    }

    setLoading(true);
    setError("");
    setProgress(0);

    try {
      const response = await processFile({
        file,
        subject,
        tags,
        difficulty,
        language,
        examEnabled,
        examCount,
        flashcardsEnabled,
        onProgress: setProgress
      });

      saveLastReviewer(response.reviewer);
      navigate("/results", { state: { reviewer: response.reviewer } });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to generate reviewer. Please try again.";
      setError(message);
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="upload-page">
      {loading && <LoadingOverlay progress={progress} />}
      <Section
        title="Upload your file"
        subtitle="Add subject tags, choose your options, and generate your reviewer."
      >
        <form className="upload-form" onSubmit={handleSubmit}>
          <FileDropzone file={file} onFileSelected={setFile} disabled={loading} />

          <input
            className="input"
            placeholder="Subject or course (e.g., Biology 101)"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={loading}
          />

          <TagInput tags={tags} setTags={setTags} />

          <div className="card-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div>
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                className="select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={loading}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
            <div>
              <label htmlFor="language">Language</label>
              <select
                id="language"
                className="select"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                disabled={loading}
              >
                <option value="English">English</option>
                <option value="Tagalog">Tagalog</option>
              </select>
            </div>
          </div>

          {/* ── Generate options ────────────────────────────────── */}
          <div className="card" style={{ padding: "18px 20px" }}>
            <h3 style={{ margin: "0 0 14px", fontSize: "1rem" }}>What to generate</h3>

            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={flashcardsEnabled}
                onChange={(e) => setFlashcardsEnabled(e.target.checked)}
                disabled={loading}
                style={{ width: 16, height: 16 }}
              />
              <span>
                <strong>Flashcards</strong>
                <span style={{ color: "var(--muted)", fontSize: "0.88rem", marginLeft: 6 }}>
                  — auto-generated from key concepts, each with a rationale
                </span>
              </span>
            </label>

            <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={examEnabled}
                onChange={(e) => setExamEnabled(e.target.checked)}
                disabled={loading}
                style={{ width: 16, height: 16, marginTop: 3 }}
              />
              <div style={{ flex: 1 }}>
                <span>
                  <strong>Exam</strong>
                  <span style={{ color: "var(--muted)", fontSize: "0.88rem", marginLeft: 6 }}>
                    — interactive multiple-choice with score &amp; per-answer feedback
                  </span>
                </span>
                {examEnabled && (
                  <div style={{ marginTop: 10 }}>
                    <label htmlFor="examCount" style={{ fontSize: "0.9rem", color: "var(--muted)", display: "block", marginBottom: 4 }}>
                      Number of exam questions
                    </label>
                    <input
                      id="examCount"
                      type="number"
                      className="input"
                      min={1}
                      max={100}
                      value={examCount}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "") { setExamCount(""); return; }
                        const num = parseInt(val, 10);
                        if (!isNaN(num)) setExamCount(Math.max(1, Math.min(100, num)));
                      }}
                      onBlur={() => { if (!examCount || examCount < 1) setExamCount(10); }}
                      disabled={loading}
                      style={{ width: 120 }}
                    />
                  </div>
                )}
              </div>
            </label>
          </div>

          {error && (
            <div className="notice" style={{ backgroundColor: "#fee", borderColor: "#fcc", color: "#c62828" }}>
              {error}
            </div>
          )}

          <button
            className="button button-primary"
            type="submit"
            disabled={loading || !file}
            style={{ opacity: loading || !file ? 0.6 : 1 }}
          >
            {loading ? "Generating…" : "Generate Reviewer"}
          </button>
        </form>
      </Section>
    </div>
  );
}

export default Upload;
