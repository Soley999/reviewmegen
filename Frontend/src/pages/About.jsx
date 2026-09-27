function About() {
  const team = [
    {
      name: "Alexis Soley Alfonso",
      role: "Computer Engineering Student",
      bio: "Passionate about building tools that make learning more accessible and efficient for students.",
      linkedin: "https://www.linkedin.com/in/alexissoleyalfonso05/"
    },
    {
      name: "Christian Jiro Yabut",
      role: "Computer Engineering Student",
      bio: "Driven to create practical software solutions that help students succeed in their studies.",
      linkedin: "https://www.linkedin.com/in/christian-jiro-yabut-2347b4362/"
    }
  ];

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div className="section" style={{ textAlign: "center", marginBottom: 48 }}>
        <div className="section-title">About ReviewMeGen</div>
        <p className="section-subtitle" style={{ margin: "0 auto", maxWidth: 600 }}>
          ReviewMeGen was created to help students turn their learning materials into
          useful reviewers, flashcards, and practice exams — making study time more
          focused and effective.
        </p>
      </div>

      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <h2 style={{ fontFamily: "var(--font-heading)", fontSize: "1.4rem", margin: "0 0 6px" }}>
          Meet the Team
        </h2>
        <p style={{ color: "var(--muted)", margin: 0 }}>The developers behind ReviewMeGen</p>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
        gap: 24,
        marginBottom: 48
      }}>
        {team.map((member) => (
          <div
            key={member.name}
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              textAlign: "center",
              padding: "32px 24px"
            }}
          >
            <div style={{
              width: 80,
              height: 80,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--accent), #7a5dff)",
              display: "grid",
              placeItems: "center",
              marginBottom: 16,
              fontSize: "1.6rem",
              fontWeight: 700,
              color: "#fff",
              flexShrink: 0
            }}>
              {member.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </div>

            <h3 style={{
              fontFamily: "var(--font-heading)",
              fontSize: "1.15rem",
              margin: "0 0 4px"
            }}>
              {member.name}
            </h3>

            <p style={{
              color: "var(--accent)",
              fontSize: "0.88rem",
              fontWeight: 600,
              margin: "0 0 12px"
            }}>
              {member.role}
            </p>

            <p style={{
              color: "var(--muted)",
              fontSize: "0.92rem",
              lineHeight: 1.6,
              margin: "0 0 20px",
              flex: 1
            }}>
              {member.bio}
            </p>

            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-primary"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: "0.9rem" }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              LinkedIn
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

export default About;
