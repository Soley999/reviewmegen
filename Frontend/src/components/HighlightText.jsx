function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({ text, highlights = [], query }) {
  const terms = [
    ...highlights,
    query
  ]
    .filter(Boolean)
    .map((term) => term.trim())
    .filter((term) => term.length > 1);

  if (!terms.length) return text;

  const escaped = terms.map((term) => escapeRegExp(term));
  const regex = new RegExp(`(${escaped.join("|")})`, "gi");
  const parts = text.split(regex);
  const lowerTerms = terms.map((term) => term.toLowerCase());

  return parts.map((part, index) => {
    const isMatch = lowerTerms.includes(part.toLowerCase());
    if (!isMatch) return part;
    return (
      <span className="highlight" key={`${part}-${index}`}>
        {part}
      </span>
    );
  });
}

export default HighlightText;
