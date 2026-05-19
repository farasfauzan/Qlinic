import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("qlinic_token"));
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("qlinic_user");
    return raw ? JSON.parse(raw) : null;
  });
  const [loading, setLoading] = useState(Boolean(token));

  useEffect(() => {
    let mounted = true;

    async function loadMe() {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get("/auth/me");
        if (mounted) {
          setUser(response.data);
          localStorage.setItem("qlinic_user", JSON.stringify(response.data));
        }
      } catch (_error) {
        localStorage.removeItem("qlinic_token");
        localStorage.removeItem("qlinic_user");
        if (mounted) {
          setToken(null);
          setUser(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadMe();
    return () => {
      mounted = false;
    };
  }, [token]);

  async function login(payload) {
    const response = await api.post("/auth/login", payload);
    localStorage.setItem("qlinic_token", response.data.token);
    localStorage.setItem("qlinic_user", JSON.stringify(response.data.user));
    setToken(response.data.token);
    setUser(response.data.user);
    return response.data.user;
  }

  function logout() {
    localStorage.removeItem("qlinic_token");
    localStorage.removeItem("qlinic_user");
    setToken(null);
    setUser(null);
  }

  const value = useMemo(
    () => ({ token, user, loading, isAuthenticated: Boolean(token && user), login, logout }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus dipakai di dalam AuthProvider");
  }
  return context;
}
