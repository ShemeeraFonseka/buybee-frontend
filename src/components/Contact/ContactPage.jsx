import { useState, useEffect } from "react";
import "./ContactPage.css";
import CurrencySwitcher from "../Currency/CurrencySwitcher";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

function Logo({ dark = false }) {
  return (
    <a
      href="/"
      className="cp-logo"
      style={dark ? { color: "var(--white)" } : {}}
    >
      <div className="cp-logo__icon">🐝</div>BuyBee
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

export default function ContactPage() {
  const [pageData, setPageData] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetch(`${API_BASE}/api/contact-content`)
      .then((r) => r.json())
      .then(setPageData)
      .catch(() => setPageData({}));
  }, []);

  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: "" }));
  };

  const validate = () => {
    const e = {};
    if (!form.name) e.name = "Required";
    if (!form.email || !/\S+@\S+\.\S+/.test(form.email))
      e.email = "Valid email required";
    if (!form.subject) e.subject = "Required";
    if (!form.message) e.message = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setSent(true);
  };

  const d = pageData || {};
  const CARDS = [
    {
      icon: "📍",
      title: "Visit Us",
      lines: (d.address || "Negombo, Sri Lanka").split("|"),
    },
    {
      icon: "📞",
      title: "Call Us",
      lines: (d.phone || "+94 77 497 9282").split("|"),
    },
    {
      icon: "✉️",
      title: "Email Us",
      lines: (d.email || "hello@buybee.lk").split("|"),
    },
    {
      icon: "🕐",
      title: "Business Hours",
      lines: (d.hours || "Mon–Fri: 9am–6pm").split("|"),
    },
  ];

  return (
    <div className="cp-root">
      <Navbar />

      <section className="cp-hero">
        <div className="cp-hero__bg" />
        <div className="cp-hero__content">
          <div className="cp-hero__badge">💬 Get in Touch</div>
          <h1 className="cp-hero__title">
            {d.heroTitle || "We'd love to hear from you"}
          </h1>
          <p className="cp-hero__sub">
            {d.heroSub || "Have a question? Our team is always here to help."}
          </p>
        </div>
      </section>

      <section className="cp-cards">
        {CARDS.map((item) => (
          <div key={item.title} className="cp-card">
            <div className="cp-card__icon">{item.icon}</div>
            <div className="cp-card__title">{item.title}</div>
            {item.lines.map((l, i) => (
              <div key={i} className="cp-card__line">
                {l.trim()}
              </div>
            ))}
          </div>
        ))}
      </section>

      <section className="cp-body cp-body--single">
        <div className="cp-form-wrap">
          <div className="cp-form-header">
            <h2 className="cp-form-title">Send us a message</h2>
            <p className="cp-form-sub">We typically reply within 24 hours.</p>
          </div>
          {sent ? (
            <div className="cp-success">
              <div className="cp-success__icon">✓</div>
              <h3>Message sent!</h3>
              <p>Thanks for reaching out. We'll get back to you shortly.</p>
              <button
                className="cp-btn cp-btn--primary"
                onClick={() => {
                  setSent(false);
                  setForm({ name: "", email: "", subject: "", message: "" });
                }}
              >
                Send another
              </button>
            </div>
          ) : (
            <form className="cp-form" onSubmit={handleSubmit} noValidate>
              <div className="cp-form__row">
                <div className="cp-field">
                  <label className="cp-field__label">Full Name *</label>
                  <input
                    className={`cp-field__input ${errors.name ? "cp-field__input--error" : ""}`}
                    value={form.name}
                    onChange={(e) => set("name")(e.target.value)}
                    placeholder="Ayesha Perera"
                  />
                  {errors.name && (
                    <span className="cp-field__error">{errors.name}</span>
                  )}
                </div>
                <div className="cp-field">
                  <label className="cp-field__label">Email Address *</label>
                  <input
                    className={`cp-field__input ${errors.email ? "cp-field__input--error" : ""}`}
                    type="email"
                    value={form.email}
                    onChange={(e) => set("email")(e.target.value)}
                    placeholder="you@email.com"
                  />
                  {errors.email && (
                    <span className="cp-field__error">{errors.email}</span>
                  )}
                </div>
              </div>
              <div className="cp-field">
                <label className="cp-field__label">Subject *</label>
                <input
                  className={`cp-field__input ${errors.subject ? "cp-field__input--error" : ""}`}
                  value={form.subject}
                  onChange={(e) => set("subject")(e.target.value)}
                  placeholder="How can we help?"
                />
                {errors.subject && (
                  <span className="cp-field__error">{errors.subject}</span>
                )}
              </div>
              <div className="cp-field">
                <label className="cp-field__label">Message *</label>
                <textarea
                  className={`cp-field__input cp-field__input--textarea ${errors.message ? "cp-field__input--error" : ""}`}
                  rows={6}
                  value={form.message}
                  onChange={(e) => set("message")(e.target.value)}
                  placeholder="Tell us what's on your mind…"
                />
                {errors.message && (
                  <span className="cp-field__error">{errors.message}</span>
                )}
              </div>
              <button
                className="cp-btn cp-btn--primary cp-btn--full"
                type="submit"
                disabled={sending}
              >
                {sending ? (
                  <>
                    <span className="cp-spinner" /> Sending…
                  </>
                ) : (
                  "Send Message →"
                )}
              </button>
            </form>
          )}
        </div>
      </section>

      {(d.faqs || []).length > 0 && (
        <section className="cp-faq">
          <h2 className="cp-faq__title">Frequently Asked Questions</h2>
          <div className="cp-faq__grid">
            {(d.faqs || []).map((faq) => (
              <div key={faq._id} className="cp-faq__item">
                <div className="cp-faq__q">{faq.question}</div>
                <div className="cp-faq__a">{faq.answer}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer className="cp-footer">
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
