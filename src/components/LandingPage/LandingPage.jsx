import { useState, useEffect, useRef } from "react";
import { useSite } from "./SiteContext";
import { useCurrency } from "../Currency/CurrencyContext";
import CurrencySwitcher from "../Currency/CurrencySwitcher";
import "./LandingPage.css";

const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace("/api/content", "")
  : "http://localhost:5000";

/* ─── HOOK: Intersection Observer ─── */
function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return { ref, visible };
}

/* ─── NAV ─── */
function Logo({ dark = false }) {
  return (
    <a
      href="/"
      className="nav__logo"
      style={dark ? { color: "var(--white)" } : {}}
    >
      <div className="nav__logo-icon">🐝</div>
      BuyBee
    </a>
  );
}

function Navbar() {
  return (
    <nav className="nav">
      <Logo />
      <ul className="nav__links">
        <li>
          <a href="#features">Features</a>
        </li>
        <li>
          <a href="#categories">Shop</a>
        </li>
        <li>
          <a href="#products">Deals</a>
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
    </nav>
  );
}

/* ─── HERO ─── */
function Hero() {
  const { content } = useSite();
  const h = content.hero;
  const { format } = useCurrency();
  const [showcaseProducts, setShowcaseProducts] = useState([]);

  const FLOAT_STYLES = [
    { delay: "0s", dur: "3.2s", amt: "-12px" },
    { delay: "0.15s", dur: "2.8s", amt: "-8px" },
    { delay: "0.3s", dur: "3.6s", amt: "-14px" },
    { delay: "0.45s", dur: "2.5s", amt: "-10px" },
    { delay: "0.6s", dur: "3.9s", amt: "-9px" },
    { delay: "0.75s", dur: "3.1s", amt: "-13px" },
  ];

  useEffect(() => {
    fetch(`${API_BASE}/api/products?limit=6&sort=newest`)
      .then((r) => r.json())
      .then((data) => setShowcaseProducts(data.items || []))
      .catch(() => {});
  }, []);

  return (
    <section className="hero">
      <div className="hero__bg" />
      <svg
        className="hero__hex-grid"
        viewBox="0 0 400 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern
            id="hex"
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
        <rect width="400" height="400" fill="url(#hex)" />
      </svg>

      <div className="hero__content">
        <div className="hero__badge">
          <div className="hero__badge-dot" />
          {h.badge}
        </div>
        <h1 className="hero__title">
          {h.titleMain} <em>{h.titleEmph}</em>
        </h1>
        <p className="hero__sub">{h.sub}</p>
        <div className="hero__actions">
          <a href="#categories" className="btn-primary">
            {h.btnPrimary}
          </a>
          <a href="#features" className="btn-secondary">
            {h.btnSecondary}
          </a>
        </div>
      </div>

      <div className="hero__showcase">
        <div className="showcase__ring" />
        <div className="showcase__grid">
          {showcaseProducts.map((product, i) => {
            const f = FLOAT_STYLES[i % FLOAT_STYLES.length];
            const src = product.image
              ? product.image.startsWith("http")
                ? product.image
                : `${API_BASE}${product.image}`
              : null;
            return (
              <a
                key={product._id}
                href="/products"
                className="showcase__card"
                style={{
                  "--card-delay": f.delay,
                  "--float-dur": f.dur,
                  "--float-amt": f.amt,
                  textDecoration: "none",
                }}
              >
                <div
                  className="showcase__card-img"
                  style={{ background: product.bg || "#FDE8C8" }}
                >
                  {src ? (
                    <img
                      src={src}
                      alt={product.title}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                        borderRadius: 10,
                      }}
                    />
                  ) : (
                    "🛍️"
                  )}
                </div>
                <div className="showcase__card-label">{product.title}</div>
                <div className="showcase__card-price">
                  {format(product.price)}
                </div>
              </a>
            );
          })}

          {/* Skeleton placeholders while loading */}
          {showcaseProducts.length === 0 &&
            Array.from({ length: 6 }).map((_, i) => {
              const f = FLOAT_STYLES[i];
              return (
                <div
                  key={i}
                  className="showcase__card showcase__card--skeleton"
                  style={{
                    "--card-delay": f.delay,
                    "--float-dur": f.dur,
                    "--float-amt": f.amt,
                  }}
                >
                  <div className="showcase__card-img showcase__skeleton-img" />
                  <div className="showcase__skeleton-line" />
                  <div className="showcase__skeleton-line showcase__skeleton-line--short" />
                </div>
              );
            })}
        </div>

        <div className="showcase__badge">
          <span className="showcase__badge-icon">🔥</span>
          <div>
            <div className="showcase__badge-title">1.2M+ products</div>
            <div className="showcase__badge-sub">across all categories</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── STATS ─── */
function Stats() {
  const { content } = useSite();
  return (
    <div className="stats">
      {(content.stats || []).map((s) => (
        <div key={s._id || s.label} className="stats__item">
          <div className="stats__num">{s.num}</div>
          <div className="stats__label">{s.label}</div>
        </div>
      ))}
    </div>
  );
}

/* ─── FEATURES ─── */
function FeatureCard({ feature }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`feature-card ${visible ? "visible" : ""}`}>
      <div className="feature-card__icon">{feature.icon}</div>
      <div className="feature-card__title">{feature.title}</div>
      <p className="feature-card__desc">{feature.desc}</p>
    </div>
  );
}

function Features() {
  const { content } = useSite();
  return (
    <section className="section" id="features">
      <div className="section-label">Why BuyBee</div>
      <div className="section-title">
        Built for the way
        <br />
        you shop today
      </div>
      <p className="section-sub">
        Every feature of BuyBee is designed to make your shopping experience
        faster, safer, and more delightful.
      </p>
      <div className="features__grid">
        {(content.features || []).map((f) => (
          <FeatureCard key={f._id || f.title} feature={f} />
        ))}
      </div>
    </section>
  );
}

/* ─── CATEGORIES ─── */
function CategoryCard({ cat }) {
  const { ref, visible } = useReveal();
  return (
    <a
      href="#products"
      ref={ref}
      className={`cat-card ${visible ? "visible" : ""}`}
    >
      <span className="cat-card__emoji">{cat.emoji}</span>
      <div className="cat-card__name">{cat.name}</div>
      <div className="cat-card__count">{cat.count}</div>
    </a>
  );
}

function Categories() {
  const { content } = useSite();
  return (
    <section className="categories" id="categories">
      <div className="section-label">Explore</div>
      <div className="section-title">Shop by category</div>
      <div className="categories__grid">
        {(content.categories || []).map((c) => (
          <CategoryCard key={c._id || c.name} cat={c} />
        ))}
      </div>
    </section>
  );
}

/* ─── PRODUCTS ─── */
function ProductCard({ product }) {
  const { ref, visible } = useReveal();
  const { format } = useCurrency();
  const [wished, setWished] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  // Prices stored as strings like "$49.99" — strip symbol and parse
  const parsePrice = (p) => parseFloat(String(p).replace(/[^0-9.]/g, "")) || 0;

  const tagClass =
    { hot: "tag--hot", new: "tag--new", sale: "tag--sale" }[product.tag] ||
    "tag--new";

  return (
    <div ref={ref} className={`product-card ${visible ? "visible" : ""}`}>
      <div className="product-card__img" style={{ background: product.bg }}>
        {product.image ? (
          <img
            src={
              product.image.startsWith("http")
                ? product.image
                : `${API_BASE}${product.image}`
            }
            alt={product.title}
            className="product-card__photo"
          />
        ) : (
          <span className="product-card__placeholder">🛍️</span>
        )}
        <span className={`product-card__tag ${tagClass}`}>
          {product.tagLabel}
        </span>
        <button
          className="product-card__wishlist"
          onClick={() => setWished((w) => !w)}
          aria-label="Toggle wishlist"
        >
          {wished ? "❤️" : "🤍"}
        </button>
      </div>
      <div className="product-card__info">
        <div className="product-card__cat">{product.cat}</div>
        <div className="product-card__title">{product.title}</div>
        <div className="product-card__stars">
          {product.stars} <span>{product.reviews} reviews</span>
        </div>
        <div className="product-card__footer">
          <div>
            <span className="price-new">
              {format(parsePrice(product.price))}
            </span>
            {product.oldPrice && (
              <span className="price-old">
                {format(parsePrice(product.oldPrice))}
              </span>
            )}
          </div>
          <button
            className={`add-to-cart ${added ? "add-to-cart--added" : ""}`}
            onClick={handleAdd}
            aria-label="Add to cart"
          >
            {added ? "✓" : "+"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Products() {
  const { content } = useSite();
  return (
    <section className="section" id="products">
      <div className="section-label">Featured Deals</div>
      <div className="section-title">Trending right now</div>
      <div className="products__grid">
        {(content.products || []).map((p) => (
          <ProductCard key={p._id || p.title} product={p} />
        ))}
      </div>
    </section>
  );
}

/* ─── PROMO BANNER ─── */
function PromoBanner() {
  const { content } = useSite();
  const p = content.promo;
  return (
    <div className="promo-banner">
      <div className="promo-banner__content">
        <div className="promo-banner__label">{p.label}</div>
        <div className="promo-banner__title">{p.title}</div>
        <p className="promo-banner__sub">
          {p.sub.replace(p.code, "")}
          <span className="promo-banner__code">{p.code}</span> at checkout and
          enjoy massive savings on your very first purchase.
        </p>
        <button className="btn-primary">{p.btn}</button>
      </div>
      <div className="promo-banner__bg-num">{p.bigNum}</div>
    </div>
  );
}

/* ─── TESTIMONIALS ─── */
function TestimonialCard({ testimonial: t }) {
  const { ref, visible } = useReveal();
  return (
    <div ref={ref} className={`testimonial-card ${visible ? "visible" : ""}`}>
      <div className="testimonial-card__quote">"</div>
      <p className="testimonial-card__text">{t.text}</p>
      <div className="testimonial-card__author">
        <div className="author-avatar" style={{ background: t.avatarBg }}>
          {t.avatar}
        </div>
        <div>
          <div className="author-name">{t.name}</div>
          <div className="author-role">{t.role}</div>
        </div>
      </div>
    </div>
  );
}

function Testimonials() {
  const { content } = useSite();
  return (
    <section className="testimonials">
      <div className="testimonials__header">
        <div className="section-label section-label--center">Customer Love</div>
        <div className="section-title">What our shoppers say</div>
      </div>
      <div className="testimonials__grid">
        {(content.testimonials || []).map((t) => (
          <TestimonialCard key={t._id || t.name} testimonial={t} />
        ))}
      </div>
    </section>
  );
}

/* ─── NEWSLETTER ─── */
function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const handleSubmit = () => {
    if (!email) return;
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setEmail("");
    }, 2500);
  };
  return (
    <section className="newsletter">
      <div className="newsletter__inner">
        <div className="section-label section-label--center">
          Stay in the loop
        </div>
        <div className="section-title">Get the best deals first</div>
        <p className="newsletter__sub">
          Subscribe and be the first to know about flash sales, new arrivals,
          and exclusive offers — straight to your inbox.
        </p>
        <div className="newsletter__form">
          <input
            type="email"
            className="newsletter__input"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            className="btn-primary"
            onClick={handleSubmit}
            style={{ whiteSpace: "nowrap", padding: "12px 26px" }}
          >
            {sent ? "✓ Subscribed!" : "Subscribe →"}
          </button>
        </div>
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function Footer() {
  const cols = [
    {
      heading: "Shop",
      links: [
        "New Arrivals",
        "Best Sellers",
        "Flash Deals",
        "Gift Cards",
        "Brands",
      ],
    },
    {
      heading: "Sell",
      links: [
        "Start Selling",
        "Seller Hub",
        "Seller Fees",
        "Seller Stories",
        "Seller Support",
      ],
    },
    {
      heading: "Help",
      links: [
        "Help Center",
        "Track Order",
        "Returns & Refunds",
        "Privacy Policy",
        "Terms of Use",
      ],
    },
  ];
  return (
    <footer className="footer">
      <div className="footer__top">
        <div className="footer__brand">
          <Logo dark />
          <p>
            Your trusted marketplace for everything — from everyday essentials
            to luxury finds, delivered fast with love.
          </p>
          <div className="social-links">
            {[
              { icon: "𝕏", label: "Twitter" },
              { icon: "f", label: "Facebook" },
              { icon: "in", label: "LinkedIn" },
              { icon: "▶", label: "YouTube" },
            ].map(({ icon, label }) => (
              <button key={label} className="social-link" aria-label={label}>
                {icon}
              </button>
            ))}
          </div>
        </div>
        {cols.map((col) => (
          <div key={col.heading} className="footer__col">
            <h4>{col.heading}</h4>
            <ul>
              {col.links.map((l) => (
                <li key={l}>
                  <button className="footer__link">{l}</button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="footer__bottom">
        <span>
          © 2026 BuyBee. All rights reserved. Built with ❤️ by{" "}
          <a
            href="https://flegoinnovation.com"
            target="_blank"
            rel="noreferrer"
          >
            Flego Innovation
          </a>
          .
        </span>
        <span>🐝 Shop smarter. Live better.</span>
      </div>
    </footer>
  );
}

/* ─── ROOT ─── */
export default function LandingPage() {
  const { loading, error } = useSite();

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "DM Sans, sans-serif",
          color: "#8A7D6B",
        }}
      >
        Loading…
      </div>
    );

  if (error)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "DM Sans, sans-serif",
          color: "#E53935",
        }}
      >
        Could not load content: {error}
      </div>
    );

  return (
    <>
      <Navbar />
      <Hero />
      <Stats />
      <Features />
      <Categories />
      <Products />
      <PromoBanner />
      <Testimonials />
      <Newsletter />
      <Footer />
    </>
  );
}
