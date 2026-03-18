// src/lib/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tokenOk, setTokenOk] = useState(null); // Stellar token gate status

  useEffect(() => {
    const stored = localStorage.getItem("sh_user");
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch {}
    }
    setLoading(false);
  }, []);

  // Check Stellar token gate whenever user changes
  useEffect(() => {
    if (user?.stellarKey) {
      api.tokenCheck(user.stellarKey)
        .then(r => setTokenOk(r))
        .catch(() => setTokenOk({ allowed: false, reason: "Check failed" }));
    }
  }, [user?.stellarKey]);

  const login = async ({ email, stellarKey }) => {
    const data = await api.login({ email, stellarKey });
    localStorage.setItem("sh_token", data.token);
    localStorage.setItem("sh_user",  JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const register = async (payload) => {
    const data = await api.register(payload);
    localStorage.setItem("sh_token", data.token);
    localStorage.setItem("sh_user",  JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("sh_token");
    localStorage.removeItem("sh_user");
    setUser(null);
    setTokenOk(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, tokenOk, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
