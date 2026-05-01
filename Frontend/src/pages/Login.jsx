import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Section from "../components/Section.jsx";
import { useAuth } from "../context/AuthContext.jsx";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      await login({ email, password });
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed.");
    }
  };

  return (
    <Section title="Welcome back" subtitle="Log in to save and manage reviewers.">
      <form className="form-grid" onSubmit={handleSubmit}>
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
          Login
        </button>
        <div>
          No account yet? <Link to="/signup">Create one</Link>
        </div>
      </form>
    </Section>
  );
}

export default Login;
