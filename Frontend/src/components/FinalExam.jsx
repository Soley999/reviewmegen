function FinalExam({ finalExam }) {
  if (!finalExam || !finalExam.questions) return null;

  const { multipleChoice, trueFalse, identification, shortAnswer } = finalExam.questions;
  const hasQuestions =
    (multipleChoice && multipleChoice.length > 0) ||
    (trueFalse && trueFalse.length > 0) ||
    (identification && identification.length > 0) ||
    (shortAnswer && shortAnswer.length > 0);

  if (!hasQuestions) return null;

  return (
    <div className="card" style={{ marginTop: "32px", background: "linear-gradient(135deg, #f8f9ff 0%, #fff 100%)" }}>
      <div style={{ borderBottom: "3px solid var(--accent)", paddingBottom: "16px", marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 8px 0", color: "var(--accent)", fontSize: "1.8rem" }}>
          📝 Final Examination
        </h2>
        <p style={{ margin: 0, color: "var(--muted)" }}>
          {finalExam.description || "Comprehensive exam covering all lessons"}
        </p>
      </div>

      {multipleChoice && multipleChoice.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ color: "var(--accent-2)" }}>Part I: Multiple Choice</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "16px" }}>
            Choose the best answer for each question.
          </p>
          {multipleChoice.map((q, index) => (
            <div key={index} className="qa-block" style={{ padding: "16px", background: "white", borderRadius: "12px", marginBottom: "16px" }}>
              <p><strong>{index + 1}.</strong> {q.question} {q.lessonRef && <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>(Lesson {q.lessonRef})</span>}</p>
              {q.options && (
                <ul style={{ listStyle: "none", paddingLeft: "20px", marginBottom: "12px" }}>
                  {q.options.map((option, i) => (
                    <li key={i} style={{ marginBottom: "8px" }}>
                      {String.fromCharCode(65 + i)}. {option}
                    </li>
                  ))}
                </ul>
              )}
              <details>
                <summary style={{ cursor: "pointer", color: "var(--accent)", fontWeight: "600", fontSize: "0.9rem" }}>
                  Show Answer
                </summary>
                <div style={{ marginTop: "12px", padding: "12px", background: "#e8f5e9", borderLeft: "4px solid #4caf50", borderRadius: "4px" }}>
                  <p style={{ margin: "0 0 8px 0" }}><strong>Answer:</strong> {q.answer}</p>
                  {q.explanation && <p style={{ margin: 0, fontSize: "0.9rem" }}><strong>Explanation:</strong> {q.explanation}</p>}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}

      {trueFalse && trueFalse.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ color: "var(--accent-2)" }}>Part II: True or False</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "16px" }}>
            Write TRUE if the statement is correct, FALSE if incorrect.
          </p>
          {trueFalse.map((q, index) => (
            <div key={index} className="qa-block" style={{ padding: "16px", background: "white", borderRadius: "12px", marginBottom: "16px" }}>
              <p><strong>{index + 1}.</strong> {q.statement} {q.lessonRef && <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>(Lesson {q.lessonRef})</span>}</p>
              <details>
                <summary style={{ cursor: "pointer", color: "var(--accent)", fontWeight: "600", fontSize: "0.9rem" }}>
                  Show Answer
                </summary>
                <div style={{ marginTop: "12px", padding: "12px", background: "#e8f5e9", borderLeft: "4px solid #4caf50", borderRadius: "4px" }}>
                  <p style={{ margin: "0 0 8px 0" }}><strong>Answer:</strong> {q.answer ? "TRUE" : "FALSE"}</p>
                  {q.explanation && <p style={{ margin: 0, fontSize: "0.9rem" }}><strong>Explanation:</strong> {q.explanation}</p>}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}

      {identification && identification.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ color: "var(--accent-2)" }}>Part III: Identification</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "16px" }}>
            Identify or define the following terms.
          </p>
          {identification.map((q, index) => (
            <div key={index} className="qa-block" style={{ padding: "16px", background: "white", borderRadius: "12px", marginBottom: "16px" }}>
              <p><strong>{index + 1}.</strong> {q.question} {q.lessonRef && <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>(Lesson {q.lessonRef})</span>}</p>
              <details>
                <summary style={{ cursor: "pointer", color: "var(--accent)", fontWeight: "600", fontSize: "0.9rem" }}>
                  Show Answer
                </summary>
                <div style={{ marginTop: "12px", padding: "12px", background: "#e8f5e9", borderLeft: "4px solid #4caf50", borderRadius: "4px" }}>
                  <p style={{ margin: "0 0 8px 0" }}><strong>Answer:</strong> {q.answer}</p>
                  {q.explanation && <p style={{ margin: 0, fontSize: "0.9rem" }}><strong>Explanation:</strong> {q.explanation}</p>}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}

      {shortAnswer && shortAnswer.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <h3 style={{ color: "var(--accent-2)" }}>Part IV: Short Answer</h3>
          <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "16px" }}>
            Answer the following questions in 2-3 sentences.
          </p>
          {shortAnswer.map((q, index) => (
            <div key={index} className="qa-block" style={{ padding: "16px", background: "white", borderRadius: "12px", marginBottom: "16px" }}>
              <p><strong>{index + 1}.</strong> {q.question} {q.lessonRef && <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>(Lesson {q.lessonRef})</span>}</p>
              <details>
                <summary style={{ cursor: "pointer", color: "var(--accent)", fontWeight: "600", fontSize: "0.9rem" }}>
                  Show Answer
                </summary>
                <div style={{ marginTop: "12px", padding: "12px", background: "#e8f5e9", borderLeft: "4px solid #4caf50", borderRadius: "4px" }}>
                  <p style={{ margin: "0 0 8px 0" }}><strong>Answer:</strong> {q.answer}</p>
                  {q.points && q.points.length > 0 && (
                    <>
                      <p style={{ margin: "8px 0 4px 0", fontSize: "0.9rem" }}><strong>Key Points:</strong></p>
                      <ul style={{ margin: 0 }}>
                        {q.points.map((point, i) => (
                          <li key={i} style={{ fontSize: "0.9rem" }}>{point}</li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </details>
            </div>
          ))}
        </div>
      )}

      {finalExam.answerKey && (
        <details style={{ marginTop: "24px" }}>
          <summary style={{ cursor: "pointer", padding: "12px", background: "var(--accent)", color: "white", borderRadius: "8px", fontWeight: "600" }}>
            📋 View Complete Answer Key
          </summary>
          <div style={{ marginTop: "16px", padding: "20px", background: "white", borderRadius: "12px", border: "2px solid var(--accent)" }}>
            <pre style={{ whiteSpace: "pre-wrap", fontFamily: "inherit", fontSize: "0.9rem", lineHeight: "1.6" }}>
              {finalExam.answerKey}
            </pre>
          </div>
        </details>
      )}
    </div>
  );
}

export default FinalExam;
