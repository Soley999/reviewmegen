import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error) {
      navigate("/login?error=OAuth authentication failed");
      return;
    }

    if (token) {
      // Decode token to get user info
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const user = {
          id: payload.sub,
          email: payload.email
        };

        loginWithToken(token, user);
        navigate("/dashboard");
      } catch (err) {
        console.error("Token decode error:", err);
        navigate("/login?error=Invalid token");
      }
    } else {
      navigate("/login");
    }
  }, [searchParams, navigate, loginWithToken]);

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <h2>Completing sign in...</h2>
        <p>Please wait while we log you in.</p>
      </div>
    </div>
  );
}

export default AuthCallback;
