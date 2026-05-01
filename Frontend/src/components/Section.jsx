function Section({ title, subtitle, children }) {
  return (
    <section className="section">
      {title && <h2 className="section-title">{title}</h2>}
      {subtitle && <p className="section-subtitle">{subtitle}</p>}
      <div>{children}</div>
    </section>
  );
}

export default Section;
