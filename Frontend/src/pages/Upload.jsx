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
  const [format, setFormat] = useState("flashcards");
  const [difficulty, setDifficulty] = useState("medium");
  const [language, setLanguage] = useState("English");
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
        format,
        difficulty,
        language,
        onProgress: setProgress
      });

      saveLastReviewer(response.reviewer);
      navigate("/results", { state: { reviewer: response.reviewer } });
    } catch (err) {
      const message = err?.response?.data?.message
        || err?.message
        || "Failed to generate reviewer. Please try again.";
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
        subtitle="Add subject tags, choose format, and let the generator do the rest."
      >
        <form className="upload-form" onSubmit={handleSubmit}>
          <FileDropzone file={file} onFileSelected={setFile} disabled={loading} />

          <input
            className="input"
            placeholder="Subject or course (e.g., Biology 101)"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            disabled={loading}
          />

          <TagInput tags={tags} setTags={setTags} />

          <div className="card-grid">
            <div>
              <label htmlFor="format">Output format</label>
              <select
                id="format"
                className="select"
                value={format}
                onChange={(event) => setFormat(event.target.value)}
                disabled={loading}
              >
                <option value="flashcards">Flashcards</option>
                <option value="qa">Q&amp;A reviewer</option>
                <option value="outline">Outline format</option>
              </select>
            </div>
            <div>
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                className="select"
                value={difficulty}
                onChange={(event) => setDifficulty(event.target.value)}
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
                onChange={(event) => setLanguage(event.target.value)}
                disabled={loading}
              >
                <option value="English">English</option>
                <option value="Tagalog">Tagalog</option>
              </select>
            </div>
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
            {loading ? "Generating..." : "Generate Reviewer"}
          </button>
        </form>
      </Section>
    </div>
  );
}

export default Upload;
