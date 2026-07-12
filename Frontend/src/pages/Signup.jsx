import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Section from "../components/Section.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const checkPasswordStrength = (password) => {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters long." };
  }
  if (password.length < 8) {
    return { valid: true, strength: "weak", message: "Weak password. Consider using 8+ characters." };
  }
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const strengthCount = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

  if (strengthCount >= 3 && password.length >= 8) {
    return { valid: true, strength: "strong", message: "Strong password!" };
  } else if (strengthCount >= 2) {
    return { valid: true, strength: "medium", message: "Medium strength password." };
  } else {
    return { valid: true, strength: "weak", message: "Weak password. Add numbers and symbols." };
  }
};

function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(null);

  const handlePasswordChange = (value) => {
    setPassword(value);
    if (value) {
      setPasswordStrength(checkPasswordStrength(value));
    } else {
      setPasswordStrength(null);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!name.trim()) {
      setError("Name is required.");
      return;
    }

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters long.");
      return;
    }

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    const pwdCheck = checkPasswordStrength(password);
    if (!pwdCheck.valid) {
      setError(pwdCheck.message);
      return;
    }

    try {
      await signup({ name: name.trim(), email: email.trim(), password });
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.message || "Signup failed. Please try again.");
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
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(event) => handlePasswordChange(event.target.value)}
        />
        {passwordStrength && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              fontSize: "0.85rem",
              backgroundColor:
                passwordStrength.strength === "strong"
                  ? "#d4edda"
                  : passwordStrength.strength === "medium"
                  ? "#fff3cd"
                  : "#f8d7da",
              color:
                passwordStrength.strength === "strong"
                  ? "#155724"
                  : passwordStrength.strength === "medium"
                  ? "#856404"
                  : "#721c24",
              border: `1px solid ${
                passwordStrength.strength === "strong"
                  ? "#c3e6cb"
                  : passwordStrength.strength === "medium"
                  ? "#ffeeba"
                  : "#f5c6cb"
              }`
            }}
          >
            {passwordStrength.message}
          </div>
        )}
        {error && <div className="notice">{error}</div>}
        <button className="button button-primary" type="submit">
          Sign up
        </button>

        <div style={{ textAlign: "center", margin: "20px 0", color: "#666" }}>
          <span>─────── or ───────</span>
        </div>

        <button
          type="button"
          className="button button-outline"
          onClick={() => window.location.href = `${API_BASE_URL}/api/auth/google`}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
            <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
            <path fill="#FBBC05" d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.593.102-1.17.282-1.709V4.958H.957C.347 6.173 0 7.548 0 9c0 1.452.348 2.827.957 4.042l3.007-2.335z"/>
            <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
          </svg>
          Continue with Google
        </button>

        <button
          type="button"
          className="button button-outline"
          onClick={() => window.location.href = `${API_BASE_URL}/api/auth/facebook`}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", backgroundColor: "#1877F2", color: "white", border: "none" }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
          </svg>
          Continue with Facebook
        </button>

        <div style={{ marginTop: "16px" }}>
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </form>
    </Section>
  );
}

export default Signup;
