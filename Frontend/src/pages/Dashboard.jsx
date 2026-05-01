import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Section from "../components/Section.jsx";
import SearchBox from "../components/SearchBox.jsx";
import { listReviewers, removeReviewer } from "../api/reviewers.js";
import { useAuth } from "../context/AuthContext.jsx";
import { saveLastReviewer } from "../utils/storage.js";

function Dashboard() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [reviewers, setReviewers] = useState([]);
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) return;
    listReviewers()
      .then(setReviewers)
      .catch(() => setError("Failed to load reviewers."));
  }, [isLoggedIn]);

  const filtered = useMemo(() => {
    if (!query) return reviewers;
    const lower = query.toLowerCase();
    return reviewers.filter((item) =>
      [item.title, item.subject, ...(item.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(lower)
    );
  }, [query, reviewers]);

  const openReviewer = (reviewer) => {
    saveLastReviewer(reviewer);
    navigate("/results", { state: { reviewer } });
  };

  const deleteReviewer = async (id) => {
    await removeReviewer(id);
    setReviewers((prev) => prev.filter((item) => item.id !== id));
  };

  if (!isLoggedIn) {
    return (
      <Section title="Sign in to see your dashboard" subtitle="Save reviewers to keep them here." />
    );
  }

  return (
    <Section title="Your reviewers" subtitle="Revisit previous study sets anytime.">
      {error && <div className="notice">{error}</div>}
      <div style={{ marginBottom: 16 }}>
        <SearchBox value={query} onChange={setQuery} placeholder="Search your reviewers" />
      </div>
      <div className="card-grid">
        {filtered.map((reviewer) => (
          <div className="card" key={reviewer.id}>
            <h3>{reviewer.title || reviewer.subject}</h3>
            <p>{reviewer.subject}</p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
              {(reviewer.tags || []).map((tag) => (
                <span className="tag" key={tag}>{tag}</span>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="button button-ghost" type="button" onClick={() => openReviewer(reviewer)}>
                Open
              </button>
              <button className="button button-outline" type="button" onClick={() => deleteReviewer(reviewer.id)}>
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
}

export default Dashboard;
