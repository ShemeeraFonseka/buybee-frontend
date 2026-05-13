import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCurrency } from "../Currency/CurrencyContext";
import CurrencySwitcher from "../Currency/CurrencySwitcher";
import "./ProductsPage.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const PRODUCTS_API = `${API_BASE}/api/products`;

const imgSrc = (url) =>
  !url ? null : url.startsWith("http") ? url : `${API_BASE}${url}`;

const starStr = (n) =>
  "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

/* ─── CART CONTEXT (local state lifted to page) ─── */

/* ─── CART DRAWER ─── */
function CartDrawer({ cart, onClose, onRemove, onQtyChange, onCheckout }) {
  const { format } = useCurrency();
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  return (
    <>
      <div className="pp-overlay" onClick={onClose} />
      <aside className="pp-cart">
        <div className="pp-cart__header">
          <h2 className="pp-cart__title">🛒 Your Cart</h2>
          <button className="pp-cart__close" onClick={onClose}>
            ✕
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="pp-cart__empty">
            <div className="pp-cart__empty-icon">🛍️</div>
            <p>Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="pp-cart__items">
              {cart.map((item) => (
                <div key={item._id} className="pp-cart__item">
                  <div
                    className="pp-cart__item-img"
                    style={{ background: item.bg }}
                  >
                    {item.image ? (
                      <img src={imgSrc(item.image)} alt={item.title} />
                    ) : (
                      "🛍️"
                    )}
                  </div>
                  <div className="pp-cart__item-info">
                    <div className="pp-cart__item-title">{item.title}</div>
                    <div className="pp-cart__item-price">
                      {format(item.price)}
                    </div>
                    <div className="pp-cart__item-qty">
                      <button
                        onClick={() => onQtyChange(item._id, item.qty - 1)}
                      >
                        −
                      </button>
                      <span>{item.qty}</span>
                      <button
                        onClick={() => onQtyChange(item._id, item.qty + 1)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <button
                    className="pp-cart__item-remove"
                    onClick={() => onRemove(item._id)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
            <div className="pp-cart__footer">
              <div className="pp-cart__total">
                <span>Total</span>
                <span>{format(total)}</span>
              </div>
              <button
                className="pp-btn pp-btn--primary pp-btn--full"
                onClick={onCheckout}
              >
                Checkout →
              </button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

/* ─── PRODUCT CARD ─── */
function ProductCard({ product, onAddToCart }) {
  const [added, setAdded] = useState(false);
  const [wished, setWished] = useState(false);
  const { format } = useCurrency();

  const outOfStock = product.stock !== undefined && product.stock <= 0;
  const lowStock =
    product.stock !== undefined && product.stock > 0 && product.stock <= 5;

  const handleAdd = () => {
    if (outOfStock) return;
    onAddToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1200);
  };

  const tagClass =
    { hot: "tag--hot", new: "tag--new", sale: "tag--sale" }[product.tag] || "";

  return (
    <div
      className={`pp-product-card ${outOfStock ? "pp-product-card--oos" : ""}`}
    >
      <div
        className="pp-product-card__img"
        style={{ background: product.bg || "#FDE8C8" }}
      >
        {product.image ? (
          <img src={imgSrc(product.image)} alt={product.title} />
        ) : (
          <span>🛍️</span>
        )}
        {outOfStock && <div className="pp-oos-overlay">Out of Stock</div>}
        {!outOfStock && product.tag && (
          <span className={`pp-product-card__tag ${tagClass}`}>
            {product.tagLabel || product.tag}
          </span>
        )}
        <button
          className="pp-product-card__wish"
          onClick={() => setWished((w) => !w)}
          aria-label="Wishlist"
        >
          {wished ? "❤️" : "🤍"}
        </button>
      </div>

      <div className="pp-product-card__info">
        <div className="pp-product-card__cat">{product.category}</div>
        <div className="pp-product-card__title">{product.title}</div>
        <div className="pp-product-card__stars">
          {starStr(product.stars)}
          <span> ({product.reviews})</span>
        </div>
        {lowStock && (
          <div className="pp-low-stock">⚠️ Only {product.stock} left!</div>
        )}
        <div className="pp-product-card__footer">
          <div>
            <span className="pp-price-new">{format(product.price)}</span>
            {product.oldPrice && (
              <span className="pp-price-old">{format(product.oldPrice)}</span>
            )}
          </div>
          <button
            className={`pp-add-btn ${added ? "pp-add-btn--added" : ""} ${outOfStock ? "pp-add-btn--oos" : ""}`}
            onClick={handleAdd}
            aria-label={outOfStock ? "Out of stock" : "Add to cart"}
            disabled={outOfStock}
          >
            {outOfStock ? "✕" : added ? "✓" : "+"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── FILTER SIDEBAR ─── */
function Sidebar({ categories, filters, onChange }) {
  const tags = [
    { value: "", label: "All" },
    { value: "new", label: "🆕 New" },
    { value: "hot", label: "🔥 Hot" },
    { value: "sale", label: "🏷️ Sale" },
  ];

  const sorts = [
    { value: "newest", label: "Newest" },
    { value: "price_asc", label: "Price: Low → High" },
    { value: "price_desc", label: "Price: High → Low" },
    { value: "rating", label: "Top Rated" },
  ];

  return (
    <aside className="pp-sidebar">
      <div className="pp-sidebar__section">
        <div className="pp-sidebar__label">Category</div>
        {["All", ...categories].map((cat) => (
          <button
            key={cat}
            className={`pp-sidebar__item ${filters.category === cat ? "pp-sidebar__item--active" : ""}`}
            onClick={() => onChange({ ...filters, category: cat, page: 1 })}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="pp-sidebar__section">
        <div className="pp-sidebar__label">Tag</div>
        {tags.map((t) => (
          <button
            key={t.value}
            className={`pp-sidebar__item ${filters.tag === t.value ? "pp-sidebar__item--active" : ""}`}
            onClick={() => onChange({ ...filters, tag: t.value, page: 1 })}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="pp-sidebar__section">
        <div className="pp-sidebar__label">Sort by</div>
        {sorts.map((s) => (
          <button
            key={s.value}
            className={`pp-sidebar__item ${filters.sort === s.value ? "pp-sidebar__item--active" : ""}`}
            onClick={() => onChange({ ...filters, sort: s.value })}
          >
            {s.label}
          </button>
        ))}
      </div>
    </aside>
  );
}

/* ─── PAGINATION ─── */
function Pagination({ page, total, limit, onChange }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div className="pp-pagination">
      <button
        className="pp-pagination__btn"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        ← Prev
      </button>

      {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          className={`pp-pagination__btn ${p === page ? "pp-pagination__btn--active" : ""}`}
          onClick={() => onChange(p)}
        >
          {p}
        </button>
      ))}

      <button
        className="pp-pagination__btn"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
      >
        Next →
      </button>
    </div>
  );
}

/* ─── ROOT PAGE ─── */
export default function ProductsPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    category: "All",
    tag: "",
    sort: "newest",
    page: 1,
    limit: 12,
  });

  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const fetchProducts = useCallback(async (f) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (f.search) params.set("search", f.search);
      if (f.category !== "All") params.set("category", f.category);
      if (f.tag) params.set("tag", f.tag);
      params.set("sort", f.sort);
      params.set("page", f.page);
      params.set("limit", f.limit);

      const res = await fetch(`${PRODUCTS_API}?${params}`);
      const data = await res.json();
      setProducts(data.items || []);
      setTotal(data.total || 0);
      setCategories(data.categories || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts(filters);
  }, [filters, fetchProducts]);

  /* Debounced search */
  const handleSearch = (val) => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setFilters((f) => ({ ...f, search: val, page: 1 }));
    }, 400);
  };

  /* Cart actions */
  const addToCart = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing)
        return prev.map((i) =>
          i._id === product._id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (id) =>
    setCart((prev) => prev.filter((i) => i._id !== id));

  const changeQty = (id, qty) => {
    if (qty < 1) return removeFromCart(id);
    setCart((prev) => prev.map((i) => (i._id === id ? { ...i, qty } : i)));
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const handleCheckout = () => {
    setCartOpen(false);
    navigate("/checkout", { state: { cart } });
  };

  return (
    <div className="pp-root">
      {/* ── TOP NAV ── */}
      <nav className="pp-nav">
        <a href="/" className="pp-nav__logo">
          <div className="pp-nav__logo-icon">🐝</div>
          BuyBee
        </a>

        <div className="pp-nav__search">
          <span className="pp-nav__search-icon">🔍</span>
          <input
            ref={searchRef}
            type="text"
            placeholder="Search products…"
            className="pp-nav__search-input"
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>

        <div className="pp-nav__actions">
          <a href="/" className="pp-nav__link">
            Home
          </a>
          <CurrencySwitcher />
          <button
            className="pp-nav__cart-btn"
            onClick={() => setCartOpen(true)}
            aria-label="Open cart"
          >
            🛒
            {cartCount > 0 && (
              <span className="pp-nav__cart-count">{cartCount}</span>
            )}
          </button>
        </div>
      </nav>

      <div className="pp-body">
        {/* ── SIDEBAR TOGGLE (mobile) ── */}
        <button
          className="pp-filter-toggle"
          onClick={() => setSidebarOpen((o) => !o)}
        >
          {sidebarOpen ? "✕ Close" : "⚙️ Filters"}
        </button>

        {/* ── SIDEBAR ── */}
        <div
          className={`pp-sidebar-wrap ${sidebarOpen ? "pp-sidebar-wrap--open" : ""}`}
        >
          {sidebarOpen && (
            <div className="pp-sidebar-close-bar">
              <span className="pp-sidebar-close-title">⚙️ Filters</span>
              <button
                className="pp-sidebar-close-btn"
                onClick={() => setSidebarOpen(false)}
              >
                ✕ Close
              </button>
            </div>
          )}
          <Sidebar
            categories={categories}
            filters={filters}
            onChange={(f) => {
              setFilters(f);
              setSidebarOpen(false);
            }}
          />
        </div>

        {/* ── MAIN ── */}
        <main className="pp-main">
          {/* Results bar */}
          <div className="pp-results-bar">
            <span className="pp-results-bar__count">
              {loading
                ? "Loading…"
                : `${total} product${total !== 1 ? "s" : ""} found`}
            </span>
            <select
              className="pp-results-bar__sort"
              value={filters.sort}
              onChange={(e) =>
                setFilters((f) => ({ ...f, sort: e.target.value }))
              }
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low → High</option>
              <option value="price_desc">Price: High → Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="pp-loading">
              <div className="pp-loading__spinner" />
              <p>Loading products…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="pp-empty">
              <div className="pp-empty__icon">🔍</div>
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
              <button
                className="pp-btn pp-btn--primary"
                onClick={() =>
                  setFilters({
                    search: "",
                    category: "All",
                    tag: "",
                    sort: "newest",
                    page: 1,
                    limit: 12,
                  })
                }
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="pp-grid">
              {products.map((p) => (
                <ProductCard key={p._id} product={p} onAddToCart={addToCart} />
              ))}
            </div>
          )}

          <Pagination
            page={filters.page}
            total={total}
            limit={filters.limit}
            onChange={(p) => setFilters((f) => ({ ...f, page: p }))}
          />
        </main>
      </div>

      {/* ── CART DRAWER ── */}
      {cartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setCartOpen(false)}
          onRemove={removeFromCart}
          onQtyChange={changeQty}
          onCheckout={handleCheckout}
        />
      )}
    </div>
  );
}
