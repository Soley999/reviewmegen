function QAReviewer({ questions }) {
  if (!questions) {
    return <div>No questions available.</div>;
  }

  return (
    <div>
      <div className="qa-block">
        <h3>Multiple Choice</h3>
        {questions.multipleChoice?.map((item, index) => (
          <div key={`mcq-${index}`}>
            <strong>{index + 1}. {item.question}</strong>
            <ul>
              {item.options.map((option, optIndex) => (
                <li key={`mcq-${index}-${optIndex}`}>{option}</li>
              ))}
            </ul>
            <div><em>Answer: {item.answer}</em></div>
          </div>
        ))}
      </div>
      <div className="qa-block">
        <h3>Identification</h3>
        {questions.identification?.map((item, index) => (
          <div key={`id-${index}`}>
            <strong>{index + 1}. {item.question}</strong>
            <div><em>Answer: {item.answer}</em></div>
          </div>
        ))}
      </div>
      <div className="qa-block">
        <h3>True / False</h3>
        {questions.trueFalse?.map((item, index) => (
          <div key={`tf-${index}`}>
            <strong>{index + 1}. {item.statement}</strong>
            <div><em>Answer: {item.answer ? "True" : "False"}</em></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default QAReviewer;
