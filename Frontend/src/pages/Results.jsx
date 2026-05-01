import { useLocation, useNavigate } from "react-router-dom";
import { useMemo, useState } from "react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import HighlightText from "../components/HighlightText.jsx";
import Flashcards from "../components/Flashcards.jsx";
import QAReviewer from "../components/QAReviewer.jsx";
import Outline from "../components/Outline.jsx";
import SearchBox from "../components/SearchBox.jsx";
import Section from "../components/Section.jsx";
import { getLastReviewer, saveLastReviewer } from "../utils/storage.js";

function Results() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tab, setTab] = useState("flashcards");
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
      {reviewer.warnings?.length ? (
        <div className="notice">
          {reviewer.warnings.map((warning) => (
            <div key={warning}>{warning}</div>
          ))}
        </div>
      ) : null}

      <div className="section">
        <div className="section-title">{reviewer.title || reviewer.subject}</div>
        <p className="section-subtitle">
          {reviewer.subject} · {reviewer.difficulty} · {reviewer.languageUsed}
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
          <button className="button button-primary" type="button" onClick={handleDownload}>
            Download PDF
          </button>
          <SearchBox value={query} onChange={setQuery} />
        </div>
      </div>

      <div id="reviewer-print">
        <div className="results-grid">
          <div className="card">
            <h3>Short Summary</h3>
            <p>
              <HighlightText text={reviewer.summaryShort || ""} highlights={highlightTerms} query={query} />
            </p>
          </div>
          <div className="card">
            <h3>Detailed Summary</h3>
            <p>
              <HighlightText text={reviewer.summaryDetailed || ""} highlights={highlightTerms} query={query} />
            </p>
          </div>
          <div className="card">
            <h3>Key Concepts</h3>
            <ul>
              {reviewer.keyConcepts?.map((concept) => (
                <li key={concept.term}>
                  <strong>{concept.term}:</strong>{" "}
                  <HighlightText text={concept.description} highlights={highlightTerms} query={query} />
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Definitions</h3>
            <ul>
              {reviewer.definitions?.map((definition) => (
                <li key={definition.term}>
                  <strong>{definition.term}:</strong>{" "}
                  <HighlightText text={definition.definition} highlights={highlightTerms} query={query} />
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Bullet Notes</h3>
            <ul>
              {reviewer.bullets?.map((bullet, index) => (
                <li key={`bullet-${index}`}>
                  <HighlightText text={bullet} highlights={highlightTerms} query={query} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        <Section title="Study Format" subtitle="Pick the format that matches your focus.">
          <div className="tabs">
            <button
              className={`tab ${tab === "flashcards" ? "active" : ""}`}
              type="button"
              onClick={() => setTab("flashcards")}
            >
              Flashcards
            </button>
            <button
              className={`tab ${tab === "qa" ? "active" : ""}`}
              type="button"
              onClick={() => setTab("qa")}
            >
              Q&A Reviewer
            </button>
            <button
              className={`tab ${tab === "outline" ? "active" : ""}`}
              type="button"
              onClick={() => setTab("outline")}
            >
              Outline
            </button>
          </div>

          {tab === "flashcards" && <Flashcards cards={reviewer.flashcards} />}
          {tab === "qa" && <QAReviewer questions={reviewer.questions} />}
          {tab === "outline" && <Outline outline={reviewer.outline} />}
        </Section>
      </div>
    </div>
  );
}

export default Results;
