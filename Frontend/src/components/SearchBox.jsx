function SearchBox({ value, onChange, placeholder }) {
  return (
    <input
      className="input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder || "Search inside reviewer"}
    />
  );
}

export default SearchBox;
