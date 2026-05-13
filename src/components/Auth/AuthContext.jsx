import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* Restore from localStorage on mount */
  useEffect(() => {
    const token = localStorage.getItem("bb_token");
    const saved = localStorage.getItem("bb_user");
    if (token && saved) {
      try {
        setUser(JSON.parse(saved));
      } catch {
        localStorage.removeItem("bb_token");
        localStorage.removeItem("bb_user");
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Login failed");
    localStorage.setItem("bb_token", data.token);
    localStorage.setItem("bb_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("bb_token");
    localStorage.removeItem("bb_user");
    setUser(null);
    window.location.href = "/admin/login";
  }, []);

  /* Authenticated fetch — auto-attaches Bearer token */
  const authFetch = useCallback(async (url, options = {}) => {
    const token = localStorage.getItem("bb_token");
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {}),
      },
    });
    if (res.status === 401) {
      localStorage.removeItem("bb_token");
      localStorage.removeItem("bb_user");
      setUser(null);
      window.location.href = "/admin/login";
    }
    return res;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
