import { useState } from "react";

function Flashcards({ cards }) {
  const [flipped, setFlipped] = useState({});

  const toggleCard = (index) => {
    setFlipped((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (!cards?.length) {
    return <div>No flashcards generated yet.</div>;
  }

  return (
    <div className="flashcards">
      {cards.map((card, index) => (
        <button
          className="flashcard"
          key={`${card.front}-${index}`}
          type="button"
          onClick={() => toggleCard(index)}
        >
          <strong>{flipped[index] ? "Answer" : "Prompt"}</strong>
          <p>{flipped[index] ? card.back : card.front}</p>
        </button>
      ))}
    </div>
  );
}

export default Flashcards;
