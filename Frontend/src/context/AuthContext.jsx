import { createContext, useContext, useMemo, useState } from "react";
import { loginUser, signupUser } from "../api/reviewers.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => window.localStorage.getItem("rg_token") || ""
  );
  const [user, setUser] = useState(() => {
    const saved = window.localStorage.getItem("rg_user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (payload) => {
    try {
      const data = await loginUser(payload);
      if (data && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        window.localStorage.setItem("rg_token", data.token);
        window.localStorage.setItem("rg_user", JSON.stringify(data.user));
        return data;
      }
      throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const signup = async (payload) => {
    try {
      const data = await signupUser(payload);
      if (data && data.token && data.user) {
        setToken(data.token);
        setUser(data.user);
        window.localStorage.setItem("rg_token", data.token);
        window.localStorage.setItem("rg_user", JSON.stringify(data.user));
        return data;
      }
      throw new Error("Invalid response from server");
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  const loginWithToken = (token, user) => {
    setToken(token);
    setUser(user);
    window.localStorage.setItem("rg_token", token);
    window.localStorage.setItem("rg_user", JSON.stringify(user));
  };

  const logout = () => {
    setToken("");
    setUser(null);
    window.localStorage.removeItem("rg_token");
    window.localStorage.removeItem("rg_user");
  };

  const value = useMemo(
    () => ({ token, user, login, signup, loginWithToken, logout, isLoggedIn: !!token }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
