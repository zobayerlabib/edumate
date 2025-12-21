// src/context/AuthContext.js
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null); // { email, role }

  useEffect(() => {
    const savedToken = localStorage.getItem("edumate_token");
    const savedUser = localStorage.getItem("edumate_user");
    if (savedToken) setToken(savedToken);
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const isAuthenticated = !!token;

  const login = ({ token, email, role }) => {
    setToken(token);
    setUser({ email, role });
    localStorage.setItem("edumate_token", token);
    localStorage.setItem("edumate_user", JSON.stringify({ email, role }));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("edumate_token");
    localStorage.removeItem("edumate_user");
  };

  const value = useMemo(
    () => ({ token, user, isAuthenticated, login, logout }),
    [token, user, isAuthenticated]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
