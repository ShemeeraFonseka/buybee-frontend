import { useState, useEffect } from "react";
import { useAuth } from "../Auth/AuthContext";
import "./AdminCurrencies.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const CURRENCY_API = `${API_BASE}/api/currencies`;

export default function AdminCurrencies() {
  const { authFetch } = useAuth();
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [savingCode, setSavingCode] = useState(null);
  const [lastUpdated, setLastUpdated] = useState("");
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [drafts, setDrafts] = useState({});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(CURRENCY_API);
      const data = await res.json();
      setCurrencies(data);
      // Init drafts
      const d = {};
      data.forEach((c) => {
        d[c.code] = { rateToUSD: c.rateToUSD, symbol: c.symbol, name: c.name };
      });
      setDrafts(d);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSave = async (code) => {
    setSavingCode(code);
    try {
      const res = await authFetch(`${CURRENCY_API}/${code}`, {
        method: "PATCH",
        body: JSON.stringify(drafts[code]),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCurrencies((prev) => prev.map((c) => (c.code === code ? data : c)));
      showToast(`${code} rate saved!`);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSavingCode(null);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await authFetch(`${CURRENCY_API}/refresh`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setCurrencies(data.currencies);
      const d = {};
      data.currencies.forEach((c) => {
        d[c.code] = { rateToUSD: c.rateToUSD, symbol: c.symbol, name: c.name };
      });
      setDrafts(d);
      setLastUpdated(data.lastUpdated);
      showToast("Live rates updated!");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setRefreshing(false);
    }
  };

  const setDraft = (code, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [code]: { ...prev[code], [field]: value },
    }));
  };

  const isDirty = (c) => {
    const d = drafts[c.code];
    if (!d) return false;
    return (
      Number(d.rateToUSD) !== c.rateToUSD ||
      d.symbol !== c.symbol ||
      d.name !== c.name
    );
  };

  return (
    <div className="ac-root">
      {/* Header */}
      <div className="ac-header">
        <div>
          <h1 className="ac-header__title">💱 Currency Settings</h1>
          <p className="ac-header__sub">
            Products are stored in USD. Exchange rates are used to display
            prices in LKR and KRW.
          </p>
        </div>
        <button
          className="ac-btn ac-btn--refresh"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <span className="ac-spinner" /> Fetching rates…
            </>
          ) : (
            "🔄 Fetch Live Rates"
          )}
        </button>
      </div>

      {lastUpdated && (
        <div className="ac-live-note">✅ Last live update: {lastUpdated}</div>
      )}

      {/* How it works */}
      <div className="ac-info">
        <div className="ac-info__icon">ℹ️</div>
        <div>
          <strong>How it works:</strong> All prices in the database are stored
          in <strong>USD</strong>. When a customer selects LKR or KRW, prices
          are multiplied by the rate below. Example: $10 × 320 = Rs 3,200. Use{" "}
          <em>Fetch Live Rates</em> to pull today's rates automatically, or edit
          them manually.
        </div>
      </div>

      {/* Currency cards */}
      {loading ? (
        <div className="ac-loading">
          <div className="ac-loading__spinner" />
          <p>Loading…</p>
        </div>
      ) : (
        <div className="ac-cards">
          {currencies.map((c) => (
            <div
              key={c.code}
              className={`ac-card ${c.code === "USD" ? "ac-card--base" : ""}`}
            >
              <div className="ac-card__header">
                <div className="ac-card__symbol">{c.symbol}</div>
                <div>
                  <div className="ac-card__code">{c.code}</div>
                  <div className="ac-card__name">{c.name}</div>
                </div>
                {c.code === "USD" && (
                  <span className="ac-card__base-badge">Base Currency</span>
                )}
              </div>

              <div className="ac-card__fields">
                <div className="ac-field">
                  <label className="ac-field__label">Symbol</label>
                  <input
                    className="ac-field__input"
                    value={drafts[c.code]?.symbol ?? c.symbol}
                    onChange={(e) => setDraft(c.code, "symbol", e.target.value)}
                    disabled={c.code === "USD"}
                  />
                </div>
                <div className="ac-field">
                  <label className="ac-field__label">
                    Rate (1 USD = ? {c.code})
                  </label>
                  <input
                    className="ac-field__input"
                    type="number"
                    step="0.01"
                    value={drafts[c.code]?.rateToUSD ?? c.rateToUSD}
                    onChange={(e) =>
                      setDraft(c.code, "rateToUSD", e.target.value)
                    }
                    disabled={c.code === "USD"}
                  />
                </div>
              </div>

              {/* Preview */}
              <div className="ac-card__preview">
                <span className="ac-card__preview-label">Preview:</span>
                <span className="ac-card__preview-val">
                  $100 = {c.symbol}
                  {(
                    100 * (Number(drafts[c.code]?.rateToUSD) || c.rateToUSD)
                  ).toLocaleString(undefined, {
                    minimumFractionDigits: c.code === "KRW" ? 0 : 2,
                    maximumFractionDigits: c.code === "KRW" ? 0 : 2,
                  })}
                </span>
              </div>

              {c.code !== "USD" && (
                <button
                  className={`ac-btn ac-btn--save ${isDirty(c) ? "ac-btn--save-active" : ""}`}
                  onClick={() => handleSave(c.code)}
                  disabled={savingCode === c.code || !isDirty(c)}
                >
                  {savingCode === c.code
                    ? "Saving…"
                    : isDirty(c)
                      ? "Save Changes"
                      : "Saved ✓"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {toast.msg && (
        <div className={`ac-toast ac-toast--${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
