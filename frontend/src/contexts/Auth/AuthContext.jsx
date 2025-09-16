import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../../api/client";

const AuthContext = createContext(null);
const KEY = "auth:v1";

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const { token, user } = JSON.parse(raw);
        setToken(token);
        setUser(user);
        api.defaults.headers.common.Authorization = token ? `Bearer ${token}` : undefined;
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { data } = await api.get("/users/me");
        setUser(data.user);
        localStorage.setItem(KEY, JSON.stringify({ token, user: data.user }));
      } catch (e) {
        // token might be invalid/expired
        console.warn("Failed to refresh /me", e?.response?.status);
      }
    })();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.post("/users/login", { email, password });
    const { token, user } = res.data;
    setToken(token);
    setUser(user);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem(KEY, JSON.stringify({ token, user }));
    return user;
  };

  // NEW: register (auto-log-in on success, since backend returns token)
  const register = async (email, password, name) => {
    const res = await api.post("/users/register", { email, password, name });
    const { token, user } = res.data;
    setToken(token);
    setUser(user);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem(KEY, JSON.stringify({ token, user }));
    return user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem(KEY);
  };

  const value = useMemo(
    () => ({ user, token, login, logout, register, isAdmin: user?.role === "ADMIN" }),
    [user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
