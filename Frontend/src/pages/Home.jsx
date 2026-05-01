import { Link } from "react-router-dom";
import Section from "../components/Section.jsx";

function Home() {
  return (
    <div>
      <section className="hero hero--navy">
        <div className="hero-content stagger">
          <div className="hero-eyebrow">Reviewer Generator</div>
          <div className="hero-title">Get your reviewer in seconds.</div>
          <p className="section-subtitle">
            Upload a PDF, DOCX, or TXT file and get a study-ready reviewer with
            summaries, key concepts, and practice questions.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/upload">
              Start for free
            </Link>
            <Link className="button button-outline" to="/dashboard">
              View dashboard
            </Link>
          </div>
          <div className="hero-proof">
            <div className="proof-line">Trusted by 10,000+ students. 4.9/5 average rating.</div>
            <div className="proof-logos">
              <span className="logo-badge">North State</span>
              <span className="logo-badge">Summit Tech</span>
              <span className="logo-badge">City U</span>
            </div>
          </div>
        </div>
        <div className="hero-preview stagger" id="hero-sample">
          <div className="preview-label">Sample reviewer</div>
          <div className="preview-card">
            <div className="preview-title">Biology 101 - Cellular Respiration</div>
            <div>
              <span className="preview-chip">Summary</span>
              <span className="preview-chip">Key Concepts</span>
              <span className="preview-chip">Quiz</span>
            </div>
            <div className="preview-grid preview-blur">
              <div>Cellular respiration converts glucose into ATP through glycolysis...</div>
              <div>Key terms: mitochondria, NADH, FADH2, electron transport...</div>
              <div>1. Which step produces the most ATP? (A) Glycolysis (B) ETC ...</div>
            </div>
          </div>
          <div className="preview-note">See before you upload.</div>
        </div>
      </section>

      <Section
        title="Built for student flow"
        subtitle="Stay focused with clean layouts, quick previews, and instant downloads."
      >
        <div className="card-grid stagger">
          <div className="card">
            <h3>Drag, drop, done</h3>
            <p>Upload files with a clean dropzone and see progress in real time.</p>
          </div>
          <div className="card">
            <h3>Study the way you like</h3>
            <p>Switch between flashcards, Q&A, or outline style reviewers.</p>
          </div>
          <div className="card">
            <h3>Search inside reviewers</h3>
            <p>Find important concepts fast with built-in highlighting.</p>
          </div>
        </div>
      </Section>

      <Section
        title="Three steps to study-ready"
        subtitle="From upload to reviewer in moments."
      >
        <div className="stepper">
          <div className="step">
            <div className="step-index">01</div>
            <h3 className="step-title">Upload</h3>
            <p>Select your subject, tags, and difficulty level.</p>
          </div>
          <div className="step">
            <div className="step-index">02</div>
            <h3 className="step-title">Generate</h3>
            <p>Get summaries, flashcards, and practice questions.</p>
          </div>
          <div className="step">
            <div className="step-index">03</div>
            <h3 className="step-title">Study</h3>
            <p>Download a PDF or save it for later review.</p>
          </div>
        </div>
      </Section>
    </div>
  );
}

export default Home;
