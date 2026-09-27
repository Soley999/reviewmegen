import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import { jsPDF } from "jspdf";
import HighlightText from "../components/HighlightText.jsx";
import Flashcards from "../components/Flashcards.jsx";
import SearchBox from "../components/SearchBox.jsx";
import Section from "../components/Section.jsx";
import LessonDisplay from "../components/LessonDisplay.jsx";
import ExamSession from "../components/ExamSession.jsx";
import { getLastReviewer, saveLastReviewer } from "../utils/storage.js";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState("lessons");
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

  const tabs = [
    hasLessons && { id: "lessons", label: `Lessons (${reviewer.lessons.length})` },
    hasFlashcards && { id: "flashcards", label: `Flashcards (${reviewer.flashcards.length})` },
    hasExam && { id: "exam", label: `Exam (${reviewer.exam.questions.length} Qs)` }
  ].filter(Boolean);

  const handleDownload = () => {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageW = pdf.internal.pageSize.getWidth();
    const pageH = pdf.internal.pageSize.getHeight();
    const m = 20;
    const cw = pageW - m * 2;
    let y = m;

    const lh = 5.2;
    const lhLg = 7;
    const lhMd = 6;

    const newPage = (need) => {
      if (y + need > pageH - m) { pdf.addPage(); y = m; }
    };

    const clean = (v) => {
      if (!v && v !== 0) return "";
      return String(v).replace(/\s+/g, " ").trim();
    };

    const addParagraph = (text) => {
      const s = clean(text);
      if (!s) return;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(50, 50, 50);
      const lines = pdf.splitTextToSize(s, cw);
      for (const ln of lines) {
        newPage(lh);
        pdf.text(ln, m, y);
        y += lh;
      }
      y += 3;
    };

    const addBullet = (text) => {
      const s = clean(text);
      if (!s) return;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(50, 50, 50);
      const textX = m + 8;
      const lines = pdf.splitTextToSize(s, cw - 8);
      newPage(lh);
      pdf.text("-", m + 4, y);
      pdf.text(lines[0], textX, y);
      y += lh;
      for (let i = 1; i < lines.length; i++) {
        newPage(lh);
        pdf.text(lines[i], textX, y);
        y += lh;
      }
      y += 1.5;
    };

    const addTermDef = (term, desc) => {
      const t = clean(term);
      const d = clean(desc);
      if (!t) return;
      pdf.setFontSize(10);
      newPage(lh * 2);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(40, 40, 40);
      pdf.text(t, m + 4, y);
      y += lh;
      if (d) {
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(60, 60, 60);
        const lines = pdf.splitTextToSize(d, cw - 8);
        for (const ln of lines) {
          newPage(lh);
          pdf.text(ln, m + 8, y);
          y += lh;
        }
      }
      y += 3;
    };

    const addH2 = (text) => {
      const s = clean(text);
      if (!s) return;
      newPage(lhLg + 10);
      y += 8;
      pdf.setFontSize(14);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(20, 60, 120);
      pdf.text(s, m, y);
      y += lhLg + 1;
      pdf.setDrawColor(200, 210, 230);
      pdf.setLineWidth(0.3);
      pdf.line(m, y, pageW - m, y);
      y += 5;
    };

    const addH3 = (text) => {
      const s = clean(text);
      if (!s) return;
      newPage(lhMd + 6);
      y += 5;
      pdf.setFontSize(11);
      pdf.setFont("helvetica", "bold");
      pdf.setTextColor(60, 60, 60);
      pdf.text(s, m, y);
      y += lhMd + 2;
    };

    // ── Title ──
    pdf.setFontSize(18);
    pdf.setFont("helvetica", "bold");
    pdf.setTextColor(20, 60, 120);
    const titleStr = clean(reviewer.title || reviewer.subject || "Reviewer");
    const titleLines = pdf.splitTextToSize(titleStr, cw);
    for (const ln of titleLines) {
      pdf.text(ln, m, y);
      y += 8;
    }
    y += 2;
    pdf.setFontSize(9);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(130, 130, 130);
    pdf.text([reviewer.subject, reviewer.difficulty, reviewer.languageUsed].filter(Boolean).join("  |  "), m, y);
    y += 10;

    // ── Lessons ──
    if (reviewer.lessons?.length > 0) {
      for (const lesson of reviewer.lessons) {
        addH2(`Lesson ${lesson.lessonNumber}: ${lesson.title}`);

        if (lesson.summary) {
          addH3("Summary");
          addParagraph(lesson.summary);
        }

        if (lesson.learningObjectives?.length > 0) {
          addH3("Learning Objectives");
          for (const obj of lesson.learningObjectives) addBullet(obj);
          y += 2;
        }

        if (lesson.detailedExplanation) {
          addH3("Explanation");
          addParagraph(lesson.detailedExplanation);
        }

        if (lesson.keyConcepts?.length > 0) {
          addH3("Key Concepts");
          for (const c of lesson.keyConcepts) addTermDef(c.term, c.description);
        }

        if (lesson.definitions?.length > 0) {
          addH3("Definitions");
          for (const d of lesson.definitions) addTermDef(d.term, d.definition);
        }

        if (lesson.examples?.length > 0) {
          addH3("Examples");
          for (const ex of lesson.examples) addBullet(ex);
          y += 2;
        }

        if (lesson.importantNotes?.length > 0) {
          addH3("Important Notes");
          for (const note of lesson.importantNotes) addBullet(note);
          y += 2;
        }

        if (lesson.importantTerms?.length > 0) {
          addH3("Important Terms");
          addParagraph(lesson.importantTerms.join(", "));
        }
      }
    }

    // ── Fallback: top-level definitions if no lessons ──
    if (reviewer.definitions?.length > 0 && !reviewer.lessons?.length) {
      addH2("Definitions");
      for (const d of reviewer.definitions) addTermDef(d.term, d.definition);
    }

    const filename = (reviewer.title || reviewer.subject || "reviewer").replace(/[^a-zA-Z0-9 ]/g, "").trim().replace(/\s+/g, "_") || "reviewer";
    pdf.save(`${filename}_reviewer.pdf`);
  };

  return (
    <div>
      {reviewer.warnings?.length > 0 && (
        <div className="notice">
          {reviewer.warnings.map((w) => <div key={w}>{w}</div>)}
        </div>
      )}

      <div className="section">
        <div className="section-title">{reviewer.title || reviewer.subject}</div>
        <p className="section-subtitle">
          {reviewer.subject} · {reviewer.difficulty} · {reviewer.languageUsed}
          {hasLessons && <> · {reviewer.lessons.length} Lesson{reviewer.lessons.length !== 1 ? "s" : ""}</>}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <button className="button button-primary" type="button" onClick={handleDownload}>
            Download Reviewer as PDF
          </button>
          <button className="button button-ghost" type="button" onClick={() => navigate("/upload")}>
            New Reviewer
          </button>
          <SearchBox value={query} onChange={setQuery} />
        </div>
      </div>

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

      <div id="reviewer-print">
        {tab === "lessons" && hasLessons && (
          <div>
            {reviewer.lessons.map((lesson, idx) => (
              <LessonDisplay
                key={idx}
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
      </div>
    </div>
  );
}

export default Results;
