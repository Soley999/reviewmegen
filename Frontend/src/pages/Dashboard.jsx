import { useNavigate } from "react-router-dom";
import Section from "../components/Section.jsx";
import { getLastReviewer, saveLastReviewer } from "../utils/storage.js";

function Dashboard() {
  const navigate = useNavigate();
  const reviewer = getLastReviewer();

  const openReviewer = () => {
    if (!reviewer) return;
    saveLastReviewer(reviewer);
    navigate("/results", { state: { reviewer } });
  };

  if (!reviewer) {
    return (
      <Section
        title="No reviewer yet"
        subtitle="Upload a file to generate your first reviewer."
      >
        <button
          className="button button-primary"
          type="button"
          onClick={() => navigate("/upload")}
        >
          Go to Upload
        </button>
      </Section>
    );
  }

  const createdDate = reviewer.createdAt ? new Date(reviewer.createdAt) : null;

  return (
    <Section title="Your last reviewer" subtitle="Your most recently generated reviewer is saved here.">
      <div className="card-grid">
        <div className="card">
          <div style={{ marginBottom: "12px" }}>
            <h3 style={{ marginBottom: "4px" }}>{reviewer.title || reviewer.subject}</h3>
            {createdDate && (
              <p style={{ fontSize: "12px", color: "#666", margin: "0" }}>
                📅 {createdDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                {" at "}
                {createdDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </p>
            )}
          </div>
          <p style={{ color: "#888", fontSize: "14px", marginBottom: "8px" }}>
            {reviewer.format ? `Format: ${reviewer.format}` : ""}
            {reviewer.difficulty ? ` • ${reviewer.difficulty}` : ""}
          </p>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {(reviewer.tags || []).map((tag) => (
              <span className="tag" key={tag}>{tag}</span>
            ))}
          </div>
          <button className="button button-ghost" type="button" onClick={openReviewer}>
            Open
          </button>
        </div>
      </div>
      <p style={{ marginTop: "24px", color: "#888", fontSize: "14px" }}>
        Only the most recent reviewer is stored locally in your browser.
        Generate a new one on the <a href="/upload">Upload</a> page.
      </p>
    </Section>
  );
}

export default Dashboard;
