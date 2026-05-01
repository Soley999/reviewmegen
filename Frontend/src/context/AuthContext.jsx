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
    const data = await loginUser(payload);
    setToken(data.token);
    setUser(data.user);
    window.localStorage.setItem("rg_token", data.token);
    window.localStorage.setItem("rg_user", JSON.stringify(data.user));
    return data;
  };

  const signup = async (payload) => {
    const data = await signupUser(payload);
    setToken(data.token);
    setUser(data.user);
    window.localStorage.setItem("rg_token", data.token);
    window.localStorage.setItem("rg_user", JSON.stringify(data.user));
    return data;
  };

  const logout = () => {
    setToken("");
    setUser(null);
    window.localStorage.removeItem("rg_token");
    window.localStorage.removeItem("rg_user");
  };

  const value = useMemo(
    () => ({ token, user, login, signup, logout, isLoggedIn: !!token }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
