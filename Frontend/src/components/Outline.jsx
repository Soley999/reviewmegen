function Outline({ outline }) {
  if (!outline?.length) {
    return <div>No outline generated yet.</div>;
  }

  return (
    <div>
      {outline.map((section, index) => (
        <div key={`outline-${index}`}>
          <h3>{section.title}</h3>
          <ul className="outline">
            {section.points.map((point, pointIndex) => (
              <li key={`outline-${index}-${pointIndex}`}>{point}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default Outline;
