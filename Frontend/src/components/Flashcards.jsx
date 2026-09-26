import { useState } from "react";

/**
 * Flashcard viewer with flip animation.
 * Each card: front (term/question), back (answer/definition), rationale (why it matters).
 */
function Flashcards({ cards }) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (!cards?.length) {
    return (
      <div style={{ padding: "32px", textAlign: "center", color: "var(--muted)" }}>
        No flashcards generated.
      </div>
    );
  }

  const card = cards[current];
  const total = cards.length;

  const prev = () => {
    setCurrent((c) => (c - 1 + total) % total);
    setFlipped(false);
  };
  const next = () => {
    setCurrent((c) => (c + 1) % total);
    setFlipped(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto" }}>
      {/* Progress */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12, fontSize: "0.9rem", color: "var(--muted)" }}>
        <span>Card {current + 1} of {total}</span>
        <span>{flipped ? "Answer" : "Question"}</span>
      </div>

      {/* Card */}
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        style={{
          width: "100%",
          minHeight: 200,
          padding: "28px 32px",
          background: flipped
            ? "linear-gradient(135deg, #0b1430, #111b3f)"
            : "#fff",
          color: flipped ? "#f0f4ff" : "var(--ink)",
          border: "2px solid",
          borderColor: flipped ? "var(--accent)" : "var(--border)",
          borderRadius: "var(--radius-md)",
          cursor: "pointer",
          textAlign: "left",
          transition: "all 0.25s ease",
          boxShadow: "0 8px 24px rgba(17,25,43,0.1)"
        }}
      >
        <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 12, opacity: 0.6 }}>
          {flipped ? "Answer" : "Term / Question"}
        </div>
        <div style={{ fontSize: "1.15rem", lineHeight: 1.6, fontWeight: 500 }}>
          {flipped ? card.back : card.front}
        </div>
        {!flipped && (
          <div style={{ marginTop: 20, fontSize: "0.82rem", opacity: 0.45 }}>
            Tap to reveal answer →
          </div>
        )}
      </button>

      {/* Rationale — shown only when flipped */}
      {flipped && card.rationale && (
        <div style={{
          marginTop: 12,
          padding: "14px 18px",
          background: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: "var(--radius-sm)",
          fontSize: "0.9rem",
          lineHeight: 1.6,
          color: "#78350f"
        }}>
          <strong>💡 Why it matters: </strong>{card.rationale}
        </div>
      )}

      {/* Navigation */}
      <div style={{ display: "flex", gap: 10, marginTop: 16, justifyContent: "center" }}>
        <button className="button button-ghost" type="button" onClick={prev} disabled={total <= 1}>
          ← Previous
        </button>
        <button className="button button-ghost" type="button" onClick={next} disabled={total <= 1}>
          Next →
        </button>
      </div>

      {/* Dot nav */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 12, flexWrap: "wrap" }}>
        {cards.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => { setCurrent(i); setFlipped(false); }}
            style={{
              width: 10, height: 10, borderRadius: "50%", border: "none", cursor: "pointer",
              background: i === current ? "var(--accent)" : "var(--border)",
              padding: 0
            }}
            aria-label={`Go to card ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default Flashcards;
