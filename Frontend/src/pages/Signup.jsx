import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Section from "../components/Section.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await signup({ name, email, password });
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Signup failed.");
    }
  };

  return (
    <Section title="Create your account" subtitle="Save reviewers and track your progress.">
      <form className="form-grid" onSubmit={handleSubmit}>
        <input
          className="input"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <div className="notice">{error}</div>}
        <button className="button button-primary" type="submit">
          Sign up
        </button>
        <div>
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </form>
    </Section>
  );
}

export default Signup;
