import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import HighlightText from "../components/HighlightText.jsx";
import Flashcards from "../components/Flashcards.jsx";
import Outline from "../components/Outline.jsx";
import SearchBox from "../components/SearchBox.jsx";
import Section from "../components/Section.jsx";
import LessonDisplay from "../components/LessonDisplay.jsx";
import ExamSession from "../components/ExamSession.jsx";
import { getLastReviewer, saveLastReviewer } from "../utils/storage.js";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState("summary");
  const [query, setQuery] = useState("");

  const reviewer = useMemo(() => {
    const stateReviewer = location.state?.reviewer;
    if (stateReviewer) {
      saveLastReviewer(stateReviewer);
      return stateReviewer;
    }
    return getLastReviewer();
  }, [location.state]);

  if (!reviewer) {
    return (
      <Section title="No reviewer loaded" subtitle="Upload a file to get started.">
        <button className="button button-primary" type="button" onClick={() => navigate("/upload")}>
          Go to Upload
        </button>
      </Section>
    );
  }

  const highlightTerms = reviewer.highlightTerms || reviewer.keyConcepts?.map((item) => item.term) || [];
  const hasLessons = reviewer.lessons?.length > 0;
  const hasFlashcards = reviewer.flashcards?.length > 0;
  const hasExam = reviewer.exam?.questions?.length > 0;
  const hasOutline = reviewer.outline?.length > 0;

  // Build tab list dynamically
  const tabs = [
    { id: "summary", label: "Summary" },
    hasLessons && { id: "lessons", label: `Lessons (${reviewer.lessons.length})` },
    hasFlashcards && { id: "flashcards", label: `Flashcards (${reviewer.flashcards.length})` },
    hasExam && { id: "exam", label: `Exam (${reviewer.exam.questions.length} Qs)` },
    hasOutline && { id: "outline", label: "Outline" }
  ].filter(Boolean);

  const handleDownload = async () => {
    const element = document.getElementById("reviewer-print");
    if (!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    let position = 0;
    pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
    let heightLeft = pdfHeight - pdf.internal.pageSize.getHeight();
    while (heightLeft > 0) {
      position = heightLeft - pdfHeight;
      pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, pdfHeight);
      heightLeft -= pdf.internal.pageSize.getHeight();
    }
    pdf.save("reviewer.pdf");
  };

  return (
    <div>
      {/* Warnings */}
      {reviewer.warnings?.length > 0 && (
        <div className="notice">
          {reviewer.warnings.map((w) => <div key={w}>{w}</div>)}
        </div>
      )}

      {/* Header */}
      <div className="section">
        <div className="section-title">{reviewer.title || reviewer.subject}</div>
        <p className="section-subtitle">
          {reviewer.subject} · {reviewer.difficulty} · {reviewer.languageUsed}
          {hasLessons && <> · {reviewer.lessons.length} Lesson{reviewer.lessons.length !== 1 ? "s" : ""}</>}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <button className="button button-primary" type="button" onClick={handleDownload}>
            Download PDF
          </button>
          <button className="button button-ghost" type="button" onClick={() => navigate("/upload")}>
            New Reviewer
          </button>
          <SearchBox value={query} onChange={setQuery} />
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {tabs.map((t) => (
          <button
            key={t.id}
            className={`tab ${tab === t.id ? "active" : ""}`}
            type="button"
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div id="reviewer-print">

        {tab === "summary" && (
          <div>
            {reviewer.tableOfContents?.length > 0 && (
              <div className="card" style={{ marginBottom: 24 }}>
                <h3>Table of Contents</h3>
                <ol style={{ lineHeight: 1.9, margin: 0, paddingLeft: 20 }}>
                  {reviewer.tableOfContents.map((item, i) => <li key={i}>{item}</li>)}
                </ol>
              </div>
            )}

            <div className="results-grid">
              {reviewer.summaryShort && (
                <div className="card">
                  <h3>Short Summary</h3>
                  <p><HighlightText text={reviewer.summaryShort} highlights={highlightTerms} query={query} /></p>
                </div>
              )}
              {reviewer.summaryDetailed && (
                <div className="card">
                  <h3>Detailed Summary</h3>
                  <p><HighlightText text={reviewer.summaryDetailed} highlights={highlightTerms} query={query} /></p>
                </div>
              )}
              {reviewer.keyConcepts?.length > 0 && (
                <div className="card">
                  <h3>Key Concepts</h3>
                  <ul>
                    {reviewer.keyConcepts.map((c) => (
                      <li key={c.term}>
                        <strong>{c.term}:</strong>{" "}
                        <HighlightText text={c.description} highlights={highlightTerms} query={query} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reviewer.definitions?.length > 0 && (
                <div className="card">
                  <h3>Definitions</h3>
                  <ul>
                    {reviewer.definitions.map((d) => (
                      <li key={d.term}>
                        <strong>{d.term}:</strong>{" "}
                        <HighlightText text={d.definition} highlights={highlightTerms} query={query} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {reviewer.bullets?.length > 0 && (
                <div className="card">
                  <h3>Bullet Notes</h3>
                  <ul>
                    {reviewer.bullets.map((b, i) => (
                      <li key={i}><HighlightText text={b} highlights={highlightTerms} query={query} /></li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}

        {tab === "lessons" && hasLessons && (
          <div>
            {reviewer.lessons.map((lesson) => (
              <LessonDisplay
                key={lesson.lessonNumber}
                lesson={lesson}
                highlightTerms={highlightTerms}
                query={query}
              />
            ))}
          </div>
        )}

        {tab === "flashcards" && hasFlashcards && (
          <div>
            <p style={{ color: "var(--muted)", marginBottom: 20 }}>
              {reviewer.flashcards.length} flashcard{reviewer.flashcards.length !== 1 ? "s" : ""} — tap a card to flip it and see the answer and rationale.
            </p>
            <Flashcards cards={reviewer.flashcards} />
          </div>
        )}

        {tab === "exam" && hasExam && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: "0 0 4px" }}>{reviewer.exam.description || "Exam"}</h2>
              <p style={{ color: "var(--muted)", margin: 0 }}>
                Answer all {reviewer.exam.questions.length} questions, then submit to see your score and detailed feedback.
              </p>
            </div>
            <ExamSession exam={reviewer.exam} />
          </div>
        )}

        {tab === "outline" && hasOutline && (
          <Outline outline={reviewer.outline} />
        )}
      </div>
    </div>
  );
}

export default Results;
