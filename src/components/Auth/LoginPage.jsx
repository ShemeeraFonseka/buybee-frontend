import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import "./LoginPage.css";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      window.location.href = "/admin";
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="lp-root">
      {/* Left panel */}
      <div className="lp-left">
        <div className="lp-brand">
          <div className="lp-brand__icon">🐝</div>
          <div className="lp-brand__name">BuyBee</div>
          <div className="lp-brand__sub">Admin Portal</div>
        </div>
        <div className="lp-left__tagline">
          Manage your store,
          <br />
          your way.
        </div>
        <div className="lp-left__features">
          {[
            "📦 Products & inventory",
            "📋 Orders & fulfillment",
            "✨ Landing page content",
            "👥 Team & access control",
          ].map((f) => (
            <div key={f} className="lp-left__feature">
              {f}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="lp-right">
        <form className="lp-form" onSubmit={handleSubmit} noValidate>
          <div className="lp-form__header">
            <h1 className="lp-form__title">Welcome back</h1>
            <p className="lp-form__sub">Sign in to your admin account</p>
          </div>

          {error && (
            <div className="lp-error">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="lp-field">
            <label className="lp-field__label">Email address</label>
            <input
              className="lp-field__input"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoFocus
            />
          </div>

          <div className="lp-field">
            <label className="lp-field__label">Password</label>
            <div className="lp-field__pass-wrap">
              <input
                className="lp-field__input"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="lp-field__eye"
                onClick={() => setShowPass((s) => !s)}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button className="lp-submit" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="lp-spinner" /> Signing in…
              </>
            ) : (
              "🐝 Sign In"
            )}
          </button>

          <p className="lp-form__hint">
            First time? Use <code>/api/auth/seed</code> to create your
            SuperAdmin account.
          </p>
        </form>
      </div>
    </div>
  );
}
