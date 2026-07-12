import HighlightText from "./HighlightText.jsx";

function LessonDisplay({ lesson, highlightTerms, query }) {
  if (!lesson) return null;

  return (
    <div className="card" style={{ marginBottom: "24px" }}>
      <div style={{ borderBottom: "2px solid var(--accent)", paddingBottom: "12px", marginBottom: "16px" }}>
        <h2 style={{ margin: "0 0 8px 0", color: "var(--accent)" }}>
          Lesson {lesson.lessonNumber}: {lesson.title}
        </h2>
      </div>

      {lesson.learningObjectives && lesson.learningObjectives.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3 style={{ marginTop: 0 }}>Learning Objectives</h3>
          <ul>
            {lesson.learningObjectives.map((objective, index) => (
              <li key={index}>
                <HighlightText text={objective} highlights={highlightTerms} query={query} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {lesson.detailedExplanation && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Explanation</h3>
          <p style={{ lineHeight: "1.7" }}>
            <HighlightText text={lesson.detailedExplanation} highlights={highlightTerms} query={query} />
          </p>
        </div>
      )}

      {lesson.keyConcepts && lesson.keyConcepts.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Key Concepts</h3>
          <ul>
            {lesson.keyConcepts.map((concept, index) => (
              <li key={index}>
                <strong>{concept.term}:</strong>{" "}
                <HighlightText text={concept.description} highlights={highlightTerms} query={query} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {lesson.definitions && lesson.definitions.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Definitions</h3>
          <ul>
            {lesson.definitions.map((definition, index) => (
              <li key={index}>
                <strong>{definition.term}:</strong>{" "}
                <HighlightText text={definition.definition} highlights={highlightTerms} query={query} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {lesson.examples && lesson.examples.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Examples</h3>
          <ul>
            {lesson.examples.map((example, index) => (
              <li key={index}>
                <HighlightText text={example} highlights={highlightTerms} query={query} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {lesson.importantNotes && lesson.importantNotes.length > 0 && (
        <div style={{ marginBottom: "20px", padding: "16px", background: "#fff8e1", borderLeft: "4px solid #ffa000", borderRadius: "4px" }}>
          <h3 style={{ marginTop: 0, color: "#e65100" }}>Important Notes</h3>
          <ul style={{ marginBottom: 0 }}>
            {lesson.importantNotes.map((note, index) => (
              <li key={index}>
                <HighlightText text={note} highlights={highlightTerms} query={query} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {lesson.importantTerms && lesson.importantTerms.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h3>Important Terms</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {lesson.importantTerms.map((term, index) => (
              <span
                key={index}
                style={{
                  padding: "6px 12px",
                  borderRadius: "999px",
                  background: "var(--highlight)",
                  fontSize: "0.85rem",
                  fontWeight: "500"
                }}
              >
                {term}
              </span>
            ))}
          </div>
        </div>
      )}

      {lesson.summary && (
        <div style={{ marginTop: "20px", padding: "16px", background: "var(--surface-2)", borderRadius: "12px" }}>
          <h3 style={{ marginTop: 0 }}>Summary</h3>
          <p style={{ marginBottom: 0, lineHeight: "1.6" }}>
            <HighlightText text={lesson.summary} highlights={highlightTerms} query={query} />
          </p>
        </div>
      )}

      {lesson.questions && (
        <div style={{ marginTop: "24px" }}>
          <h3 style={{ color: "var(--accent)" }}>Lesson {lesson.lessonNumber} Assessment</h3>

          {lesson.questions.multipleChoice && lesson.questions.multipleChoice.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h4>Multiple Choice</h4>
              {lesson.questions.multipleChoice.map((q, index) => (
                <div key={index} className="qa-block">
                  <p><strong>Q{index + 1}:</strong> {q.question}</p>
                  <ul style={{ listStyle: "none", paddingLeft: "20px" }}>
                    {q.options && q.options.map((option, i) => (
                      <li key={i} style={{ marginBottom: "6px" }}>
                        {String.fromCharCode(65 + i)}. {option}
                      </li>
                    ))}
                  </ul>
                  <details style={{ marginTop: "8px" }}>
                    <summary style={{ cursor: "pointer", color: "var(--accent)", fontWeight: "600" }}>
                      Show Answer
                    </summary>
                    <div style={{ marginTop: "8px", padding: "12px", background: "#f0f9ff", borderRadius: "8px" }}>
                      <p><strong>Answer:</strong> {q.answer}</p>
                      {q.explanation && <p><strong>Explanation:</strong> {q.explanation}</p>}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}

          {lesson.questions.trueFalse && lesson.questions.trueFalse.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h4>True or False</h4>
              {lesson.questions.trueFalse.map((q, index) => (
                <div key={index} className="qa-block">
                  <p><strong>Q{index + 1}:</strong> {q.statement}</p>
                  <details style={{ marginTop: "8px" }}>
                    <summary style={{ cursor: "pointer", color: "var(--accent)", fontWeight: "600" }}>
                      Show Answer
                    </summary>
                    <div style={{ marginTop: "8px", padding: "12px", background: "#f0f9ff", borderRadius: "8px" }}>
                      <p><strong>Answer:</strong> {q.answer ? "TRUE" : "FALSE"}</p>
                      {q.explanation && <p><strong>Explanation:</strong> {q.explanation}</p>}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}

          {lesson.questions.identification && lesson.questions.identification.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h4>Identification</h4>
              {lesson.questions.identification.map((q, index) => (
                <div key={index} className="qa-block">
                  <p><strong>Q{index + 1}:</strong> {q.question}</p>
                  <details style={{ marginTop: "8px" }}>
                    <summary style={{ cursor: "pointer", color: "var(--accent)", fontWeight: "600" }}>
                      Show Answer
                    </summary>
                    <div style={{ marginTop: "8px", padding: "12px", background: "#f0f9ff", borderRadius: "8px" }}>
                      <p><strong>Answer:</strong> {q.answer}</p>
                      {q.explanation && <p><strong>Explanation:</strong> {q.explanation}</p>}
                    </div>
                  </details>
                </div>
              ))}
            </div>
          )}

          {lesson.questions.shortAnswer && lesson.questions.shortAnswer.length > 0 && (
            <div style={{ marginBottom: "20px" }}>
              <h4>Short Answer</h4>
              {lesson.questions.shortAnswer.map((q, index) => (
                <div key={index} className="qa-block">
                  <p><strong>Q{index + 1}:</strong> {q.question}</p>
                  <details style={{ marginTop: "8px" }}>
                    <summary style={{ cursor: "pointer", color: "var(--accent)", fontWeight: "600" }}>
                      Show Answer
                    </summary>
                    <div style={{ marginTop: "8px", padding: "12px", background: "#f0f9ff", borderRadius: "8px" }}>
                      <p><strong>Answer:</strong> {q.answer}</p>
                      {q.points && q.points.length > 0 && (
                        <>
                          <p><strong>Key Points:</strong></p>
                          <ul>
                            {q.points.map((point, i) => (
                              <li key={i}>{point}</li>
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
        </div>
      )}
    </div>
  );
}

export default LessonDisplay;
