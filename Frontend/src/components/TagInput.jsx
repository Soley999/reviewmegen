import { useState } from "react";

function TagInput({ tags, setTags }) {
  const [value, setValue] = useState("");

  const addTag = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    if (!tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setValue("");
  };

  const removeTag = (tag) => {
    setTags(tags.filter((item) => item !== tag));
  };

  return (
    <div className="tag-input">
      {tags.map((tag) => (
        <button
          type="button"
          key={tag}
          className="tag"
          onClick={() => removeTag(tag)}
        >
          {tag} x
        </button>
      ))}
      <input
        className="input"
        style={{ border: "none", flex: 1, minWidth: 120 }}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            addTag();
          }
        }}
        placeholder="Add tags"
      />
      <button className="button button-ghost" type="button" onClick={addTag}>
        Add
      </button>
    </div>
  );
}

export default TagInput;
