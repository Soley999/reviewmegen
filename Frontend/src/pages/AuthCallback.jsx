import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import LoadingOverlay from "../components/LoadingOverlay.jsx";

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  const [status, setStatus] = useState("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      setStatus("error");
      setErrorMessage(error === "oauth_failed"
        ? "OAuth authentication failed. This could be due to a cancelled sign-in or missing permissions."
        : "Authentication failed. Please try again.");

      setTimeout(() => {
        navigate("/login?error=oauth_failed");
      }, 3000);
      return;
    }

    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));

        if (!payload.sub || !payload.email) {
          throw new Error("Invalid token payload");
        }

        const user = {
          id: payload.sub,
          email: payload.email
        };

        loginWithToken(token, user);
        setStatus("success");

        setTimeout(() => {
          navigate("/dashboard");
        }, 500);
      } catch (err) {
        console.error("Token decode error:", err);
        setStatus("error");
        setErrorMessage("Invalid authentication token. Please try logging in again.");

        setTimeout(() => {
          navigate("/login?error=invalid_token");
        }, 3000);
      }
    } else {
      setStatus("error");
      setErrorMessage("No authentication token received.");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    }
  }, [searchParams, navigate, loginWithToken]);

  if (status === "processing" || status === "success") {
    return <LoadingOverlay progress={status === "success" ? 100 : 50} />;
  }

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center", maxWidth: "500px", padding: "20px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "20px" }}>⚠️</div>
        <h2 style={{ color: "#d32f2f", marginBottom: "12px" }}>Authentication Failed</h2>
        <p style={{ color: "#666", lineHeight: "1.6" }}>{errorMessage}</p>
        <p style={{ color: "#999", fontSize: "0.9rem", marginTop: "20px" }}>
          Redirecting you back to the login page...
        </p>
      </div>
    </div>
  );
}

export default AuthCallback;
