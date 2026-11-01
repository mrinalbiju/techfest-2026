import { createContext, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext();

// The token is an httpOnly cookie set by the server; React only keeps the user profile.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  // On page load, ask the server who is logged in (the browser sends the cookie)
  useEffect(() => {
    api
      .get("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setReady(true));
  }, []);

  async function login(email, password) {
    const res = await api.post("/auth/login", { email, password });
    setUser(res.data.user);
    return res.data.user;
  }

  async function logout() {
    await api.post("/auth/logout").catch(() => {});
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, ready, login, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
