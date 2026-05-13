import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const API =
  process.env.REACT_APP_API_URL || "http://localhost:5000/api/content";

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  /* ── Load all content on mount ── */
  const loadContent = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(API);
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      setContent(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadContent();
  }, [loadContent]);

  /* ── Update hero or promo (flat objects) ── */
  const updateSection = useCallback(async (section, patch) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/${section}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`Save failed ${res.status}`);
      const updated = await res.json();
      setContent((prev) => ({ ...prev, [section]: updated }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, []);

  /* ── Add item to an array section ── */
  const addItem = useCallback(async (section, item) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/${section}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!res.ok) throw new Error(`Add failed ${res.status}`);
      const added = await res.json();
      setContent((prev) => ({
        ...prev,
        [section]: [...(prev[section] || []), added],
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, []);

  /* ── Update one item in an array section ── */
  const updateItem = useCallback(async (section, id, patch) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/${section}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(`Update failed ${res.status}`);
      const updated = await res.json();
      setContent((prev) => ({
        ...prev,
        [section]: prev[section].map((it) => (it._id === id ? updated : it)),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, []);

  /* ── Delete one item from an array section ── */
  const deleteItem = useCallback(async (section, id) => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/${section}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed ${res.status}`);
      setContent((prev) => ({
        ...prev,
        [section]: prev[section].filter((it) => it._id !== id),
      }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }, []);

  return (
    <SiteContext.Provider
      value={{
        content,
        loading,
        error,
        saving,
        updateSection,
        addItem,
        updateItem,
        deleteItem,
        reload: loadContent,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <SiteProvider>");
  return ctx;
}
