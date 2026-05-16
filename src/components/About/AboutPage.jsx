import { useEffect, useRef, useState } from "react";
import "./AboutPage.css";
import CurrencySwitcher from "../Currency/CurrencySwitcher";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

function Logo({ dark = false }) {
  return (
    <a
      href="/"
      className="ab-logo"
      style={dark ? { color: "var(--white)" } : {}}
    >
      <div className="ab-logo__icon">🐝</div>BuyBee
    </a>
  );
}

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="nav">
      <Logo />
      <ul className={`nav__links ${menuOpen ? "nav__links--open" : ""}`}>
        <li>
          <a href="about" onClick={() => setMenuOpen(false)}>
            About Us
          </a>
        </li>
        <li>
          <a href="contact" onClick={() => setMenuOpen(false)}>
            Contact
          </a>
        </li>
        <li>
          <CurrencySwitcher />
        </li>
        <li>
          <a
            href="/products"
            className="nav__cta"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            Shop Now →
          </a>
        </li>
      </ul>
      <button
        className="nav__hamburger"
        onClick={() => setMenuOpen((o) => !o)}
        aria-label="Menu"
      >
        {menuOpen ? "✕" : "☰"}
      </button>
    </nav>
  );
}

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

function ValueCard({ value }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`ab-value-card ${visible ? "visible" : ""}`}>
      <div className="ab-value-card__icon">{value.icon}</div>
      <div className="ab-value-card__title">{value.title}</div>
      <p className="ab-value-card__desc">{value.desc}</p>
    </div>
  );
}

export default function AboutPage() {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/about-content`)
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData({}));
  }, []);

  const d = data || {};

  return (
    <div className="ab-root">
      <Navbar />

      {/* Hero */}
      <section className="ab-hero">
        <div className="ab-hero__bg" />
        <div className="ab-hero__hex">
          <svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern
                id="abHex"
                x="0"
                y="0"
                width="60"
                height="52"
                patternUnits="userSpaceOnUse"
              >
                <polygon
                  points="30,2 58,17 58,47 30,62 2,47 2,17"
                  fill="none"
                  stroke="#F5A623"
                  strokeWidth="1"
                />
              </pattern>
            </defs>
            <rect width="400" height="400" fill="url(#abHex)" />
          </svg>
        </div>
        <div className="ab-hero__content">
          <div className="ab-hero__badge">🐝 Our Story</div>
          <h1
            className="ab-hero__title"
            dangerouslySetInnerHTML={{
              __html: (
                d.heroTitle || "Shopping, reimagined for Sri Lanka"
              ).replace(/,/, ",<br/>"),
            }}
          />
          <p className="ab-hero__sub">
            {d.heroSub ||
              "We started with a simple belief — that everyone deserves a fast, trustworthy, and delightful online shopping experience."}
          </p>
          <div className="ab-hero__actions">
            <a href="/products" className="ab-btn ab-btn--primary">
              Start Shopping →
            </a>
            <a href="/contact" className="ab-btn ab-btn--ghost">
              Get in Touch
            </a>
          </div>
        </div>
        <div className="ab-hero__visual">
          <div className="ab-hero__ring" />
          <div className="ab-hero__emblem">
            <span>🐝</span>
          </div>
        </div>
      </section>

      {/* Stats */}
      {(d.stats || []).length > 0 && (
        <div className="ab-stats">
          {d.stats.map((s) => (
            <div key={s._id} className="ab-stat">
              <div className="ab-stat__num">{s.num}</div>
              <div className="ab-stat__label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Mission */}
      <section className="ab-mission">
        <div className="ab-mission__text">
          <div className="ab-section-label">Our Mission</div>
          <h2 className="ab-section-title">
            {d.missionTitle || "Building Sri Lanka's most trusted marketplace"}
          </h2>
          {d.missionBody1 && (
            <p className="ab-mission__body">{d.missionBody1}</p>
          )}
          {d.missionBody2 && (
            <p className="ab-mission__body">{d.missionBody2}</p>
          )}
          <a
            href="/products"
            className="ab-btn ab-btn--primary"
            style={{ marginTop: 8, display: "inline-flex" }}
          >
            Explore Our Marketplace →
          </a>
        </div>
        <div className="ab-mission__img">
          {[
            { icon: "🏪", label: "Local Sellers" },
            { icon: "📦", label: "Fast Delivery" },
            { icon: "⭐", label: "Top Quality" },
            { icon: "🔒", label: "Secure Payments" },
          ].map((c, i) => (
            <div
              key={c.label}
              className={`ab-mission__img-card ab-mission__img-card--${i + 1}`}
            >
              <span>{c.icon}</span>
              <div>{c.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Values */}
      {(d.values || []).length > 0 && (
        <section className="ab-values">
          <div className="ab-section-label ab-section-label--center">
            What We Stand For
          </div>
          <h2 className="ab-section-title ab-section-title--center">
            Our core values
          </h2>
          <div className="ab-values__grid">
            {d.values.map((v) => (
              <ValueCard key={v._id} value={v} />
            ))}
          </div>
        </section>
      )}

      {/* Timeline */}
      {(d.timeline || []).length > 0 && (
        <section className="ab-timeline">
          <div className="ab-section-label ab-section-label--center">
            Our Journey
          </div>
          <h2 className="ab-section-title ab-section-title--center">
            How we got here
          </h2>
          <div className="ab-timeline__track">
            {d.timeline.map((item, i) => (
              <div
                key={item._id}
                className={`ab-timeline__item ${i % 2 === 0 ? "left" : "right"}`}
              >
                <div className="ab-timeline__year">{item.year}</div>
                <div className="ab-timeline__dot" />
                <div className="ab-timeline__card">
                  <div className="ab-timeline__card-title">{item.title}</div>
                  <p className="ab-timeline__card-desc">{item.desc}</p>
                </div>
              </div>
            ))}
            <div className="ab-timeline__line" />
          </div>
        </section>
      )}

      {/* Team */}
      {(d.team || []).length > 0 && (
        <section className="ab-team">
          <div className="ab-section-label ab-section-label--center">
            The People
          </div>
          <h2 className="ab-section-title ab-section-title--center">
            Meet our team
          </h2>
          <div className="ab-team__grid">
            {d.team.map((m) => (
              <div key={m._id} className="ab-team__card">
                <div
                  className="ab-team__avatar"
                  style={{ background: m.bg || "#FDE8C8" }}
                >
                  {m.avatar}
                </div>
                <div className="ab-team__name">{m.name}</div>
                <div className="ab-team__role">{m.role}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="ab-cta">
        <div className="ab-cta__inner">
          <h2 className="ab-cta__title">
            {d.ctaTitle || "Ready to start shopping?"}
          </h2>
          <p className="ab-cta__sub">
            {d.ctaSub || "Join thousands of happy customers who trust BuyBee."}
          </p>
          <div className="ab-cta__actions">
            <a href="/products" className="ab-btn ab-btn--primary">
              Browse Products →
            </a>
            <a href="/contact" className="ab-btn ab-btn--ghost-light">
              Contact Us
            </a>
          </div>
        </div>
      </section>

      <footer className="ab-footer">
        <Logo dark />
        <p>
          © 2026 BuyBee. Built with ❤️ by{" "}
          <a
            href="https://flegoinnovation.com"
            target="_blank"
            rel="noreferrer"
          >
            Flego Innovation
          </a>
          .
        </p>
        <span>🐝 Shop smarter. Live better.</span>
      </footer>
    </div>
  );
}
