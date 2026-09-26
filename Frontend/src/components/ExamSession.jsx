import { useState } from "react";

const OPTION_LABELS = ["A", "B", "C", "D"];

/**
 * Interactive exam session.
 * - Users pick an answer for each question.
 * - After submitting, shows score and per-question feedback.
 * - Correct answers shown in green; wrong answers shown in red with full explanation.
 */
function ExamSession({ exam }) {
  const [answers, setAnswers] = useState({}); // { questionIndex: chosenOptionIndex }
  const [submitted, setSubmitted] = useState(false);

  if (!exam?.questions?.length) {
    return (
      <div style={{ padding: "24px", textAlign: "center", color: "var(--muted)" }}>
        No exam questions available.
      </div>
    );
  }

  const questions = exam.questions;

  const handleSelect = (qIdx, optIdx) => {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }));
  };

  const handleSubmit = () => {
    // Require all questions answered
    const unanswered = questions.findIndex((_, i) => answers[i] === undefined);
    if (unanswered !== -1) {
      // Scroll to first unanswered
      const el = document.getElementById(`exam-q-${unanswered}`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setSubmitted(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleRetake = () => {
    setAnswers({});
    setSubmitted(false);
  };

  // Score
  const score = submitted
    ? questions.filter((q, i) => answers[i] === q.answerIndex).length
    : 0;
  const pct = submitted ? Math.round((score / questions.length) * 100) : 0;

  return (
    <div>
      {/* Score banner */}
      {submitted && (
        <div style={{
          padding: "24px 28px",
          marginBottom: 28,
          background: pct >= 75
            ? "linear-gradient(135deg, #d1fae5, #a7f3d0)"
            : pct >= 50
            ? "linear-gradient(135deg, #fef9c3, #fde68a)"
            : "linear-gradient(135deg, #fee2e2, #fca5a5)",
          borderRadius: "var(--radius-md)",
          border: "1px solid",
          borderColor: pct >= 75 ? "#6ee7b7" : pct >= 50 ? "#fbbf24" : "#f87171"
        }}>
          <div style={{ fontSize: "2.4rem", fontWeight: 800, marginBottom: 4 }}>
            {score} / {questions.length}
          </div>
          <div style={{ fontSize: "1.1rem", fontWeight: 600, marginBottom: 8 }}>
            {pct}% — {pct >= 75 ? "Great work! 🎉" : pct >= 50 ? "Good effort! Keep studying." : "Keep practicing — you'll get there!"}
          </div>
          <button className="button button-ghost" type="button" onClick={handleRetake} style={{ marginTop: 8 }}>
            Retake Exam
          </button>
        </div>
      )}

      {/* Questions */}
      {questions.map((q, qIdx) => {
        const chosen = answers[qIdx];
        const isCorrect = submitted && chosen === q.answerIndex;
        const isWrong = submitted && chosen !== undefined && chosen !== q.answerIndex;
        const unanswered = submitted && chosen === undefined;

        return (
          <div
            key={qIdx}
            id={`exam-q-${qIdx}`}
            style={{
              marginBottom: 24,
              padding: "20px 22px",
              borderRadius: "var(--radius-md)",
              border: "1px solid",
              borderColor: isCorrect
                ? "#6ee7b7"
                : isWrong
                ? "#fca5a5"
                : "var(--border)",
              background: isCorrect
                ? "#f0fdf4"
                : isWrong
                ? "#fff5f5"
                : "#fff"
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 14, lineHeight: 1.5 }}>
              <span style={{ color: "var(--muted)", marginRight: 8 }}>Q{qIdx + 1}.</span>
              {q.question}
            </div>

            {/* Options */}
            <div style={{ display: "grid", gap: 8 }}>
              {q.options.map((opt, optIdx) => {
                const isChosen = chosen === optIdx;
                const isAnswer = q.answerIndex === optIdx;

                let bg = "#f8fafc";
                let border = "1.5px solid #e5e7eb";
                let color = "inherit";

                if (submitted) {
                  if (isAnswer) {
                    bg = "#d1fae5"; border = "2px solid #34d399"; color = "#065f46";
                  } else if (isChosen && !isAnswer) {
                    bg = "#fee2e2"; border = "2px solid #f87171"; color = "#7f1d1d";
                  }
                } else if (isChosen) {
                  bg = "#ede9fe"; border = "2px solid var(--accent)"; color = "var(--accent)";
                }

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => handleSelect(qIdx, optIdx)}
                    style={{
                      display: "flex", alignItems: "flex-start", gap: 10,
                      padding: "10px 14px", borderRadius: 10,
                      background: bg, border, color,
                      cursor: submitted ? "default" : "pointer",
                      textAlign: "left", fontFamily: "inherit", fontSize: "0.95rem",
                      lineHeight: 1.5, width: "100%", transition: "all 0.15s"
                    }}
                  >
                    <span style={{ fontWeight: 700, minWidth: 22 }}>{OPTION_LABELS[optIdx]}.</span>
                    <span>{opt}</span>
                    {submitted && isAnswer && (
                      <span style={{ marginLeft: "auto", color: "#059669", fontWeight: 700 }}>✓</span>
                    )}
                    {submitted && isChosen && !isAnswer && (
                      <span style={{ marginLeft: "auto", color: "#dc2626", fontWeight: 700 }}>✗</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Post-submit feedback */}
            {submitted && (
              <div style={{ marginTop: 14 }}>
                {/* Correct answer explanation */}
                <div style={{
                  padding: "12px 14px",
                  background: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  borderRadius: 8,
                  fontSize: "0.9rem",
                  lineHeight: 1.6,
                  marginBottom: 8
                }}>
                  <strong style={{ color: "#065f46" }}>✅ Why the correct answer is correct: </strong>
                  {q.explanation || `The correct answer is option ${OPTION_LABELS[q.answerIndex]}: "${q.options[q.answerIndex]}".`}
                </div>

                {/* Wrong answer explanation — only if user got it wrong */}
                {isWrong && chosen !== undefined && (
                  <div style={{
                    padding: "12px 14px",
                    background: "#fff5f5",
                    border: "1px solid #fca5a5",
                    borderRadius: 8,
                    fontSize: "0.9rem",
                    lineHeight: 1.6
                  }}>
                    <strong style={{ color: "#991b1b" }}>
                      ❌ Why your answer ({OPTION_LABELS[chosen]}) is wrong:{" "}
                    </strong>
                    {q.wrongExplanations?.[String(chosen)] ||
                      `Option ${OPTION_LABELS[chosen]} ("${q.options[chosen]}") is not the best answer for this question.`}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Submit / retake */}
      {!submitted ? (
        <button
          className="button button-primary"
          type="button"
          onClick={handleSubmit}
          style={{ marginTop: 8 }}
        >
          Submit Exam ({Object.keys(answers).length}/{questions.length} answered)
        </button>
      ) : (
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button className="button button-primary" type="button" onClick={handleRetake}>
            Retake Exam
          </button>
        </div>
      )}
    </div>
  );
}

export default ExamSession;
