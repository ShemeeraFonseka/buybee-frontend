import { useState, useEffect, useRef } from "react";
import "./AdminProducts.css";
import CurrencySwitcher from "../Currency/CurrencySwitcher";
import { useCurrency } from "../Currency/CurrencyContext";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const PRODUCTS_API = `${API_BASE}/api/products`;
const imgSrc = (url) =>
  !url ? null : url.startsWith("http") ? url : `${API_BASE}${url}`;

const EMPTY_FORM = {
  /* Basic */
  title: "",
  description: "",
  barcode: "",
  brand: "",
  category: "",
  supplier: "",
  /* Pricing */
  costPrice: "",
  price: "",
  oldPrice: "",
  wholesalePrice: "",
  maxDiscount: "",
  singleDiscount: "",
  /* Stock */
  stock: "0",
  stockDate: "",
  expireDate: "",
  warranty: "",
  /* Display */
  tag: "",
  tagLabel: "",
  stars: "5",
  reviews: "0",
  featured: false,
  bg: "#FDE8C8",
  image: "",
};

/* ─── IMAGE UPLOADER ─── */
function ImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const preview = value ? imgSrc(value) : null;

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("Max 5 MB");
      return;
    }
    setError("");
    setUploading(true);
    try {
      const token = localStorage.getItem("bb_token");
      const form = new FormData();
      form.append("image", file);
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) throw new Error("Upload failed");
      const { url } = await res.json();
      onChange(url);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="ap-field ap-field--full">
      <label className="ap-field__label">Product Image</label>
      {preview ? (
        <div className="ap-img-preview">
          <img src={preview} alt="preview" className="ap-img-preview__img" />
          <div className="ap-img-preview__btns">
            <button
              className="ap-btn ap-btn--sm ap-btn--ghost"
              onClick={() => inputRef.current.click()}
            >
              🔄 Replace
            </button>
            <button
              className="ap-btn ap-btn--sm ap-btn--danger-ghost"
              onClick={() => onChange("")}
            >
              🗑️ Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`ap-dropzone ${uploading ? "ap-dropzone--loading" : ""}`}
          onClick={() => inputRef.current.click()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files[0]);
          }}
          onDragOver={(e) => e.preventDefault()}
        >
          {uploading ? (
            <div className="ap-dropzone__spinner" />
          ) : (
            <>
              <div className="ap-dropzone__icon">📷</div>
              <div className="ap-dropzone__text">Click or drag image here</div>
              <div className="ap-dropzone__hint">
                JPEG, PNG, WebP · max 5 MB
              </div>
            </>
          )}
        </div>
      )}
      {error && <div className="ap-field__error">{error}</div>}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}

/* ─── FIELD ─── */
function Field({
  label,
  value,
  onChange,
  type = "text",
  rows,
  half,
  third,
  placeholder,
}) {
  const cls = `ap-field ${half ? "ap-field--half" : ""} ${third ? "ap-field--third" : ""}`;
  return (
    <div className={cls}>
      <label className="ap-field__label">{label}</label>
      {rows ? (
        <textarea
          className="ap-field__input ap-field__input--textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
          placeholder={placeholder}
        />
      ) : (
        <input
          className="ap-field__input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

/* ─── SECTION HEADING ─── */
function SectionHead({ label }) {
  return <div className="ap-section-head">{label}</div>;
}

/* ─── PRODUCT FORM ─── */
function ProductForm({ initial = EMPTY_FORM, onSave, onCancel, saving }) {
  const { currencies, selectedCurrency } = useCurrency();
  const [form, setForm] = useState(initial);
  const [priceCurrency, setPriceCurrency] = useState(
    () => localStorage.getItem("bb_currency") || "USD",
  );
  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  // Get rate for selected input currency
  const inputCur = currencies.find((c) => c.code === priceCurrency) || {
    code: "USD",
    symbol: "$",
    rateToUSD: 1,
  };
  const rate = inputCur.rateToUSD || 1;
  const sym = inputCur.symbol || "$";

  // Preview: convert entered value to USD for display hint
  const toUSDHint = (v) =>
    v ? `≈ $${(parseFloat(v) / rate).toFixed(2)} USD` : "";

  const handleSubmit = () => {
    if (!form.title || !form.price) {
      alert("Product name and sale price are required");
      return;
    }
    // Convert all prices to USD before saving
    const toUSD = (v) =>
      v ? parseFloat((parseFloat(v) / rate).toFixed(6)) : null;
    onSave({
      ...form,
      price: toUSD(form.price) || 0,
      oldPrice: toUSD(form.oldPrice),
      costPrice: toUSD(form.costPrice),
      wholesalePrice: toUSD(form.wholesalePrice),
      maxDiscount: toUSD(form.maxDiscount),
      singleDiscount: toUSD(form.singleDiscount),
    });
  };

  return (
    <div className="ap-form">
      <ImageUploader value={form.image} onChange={set("image")} />

      {/* ── Basic Info ── */}
      <SectionHead label="📦 Basic Information" />
      <div className="ap-form__grid">
        <Field
          label="Product Name *"
          value={form.title}
          onChange={set("title")}
          half
        />
        <Field
          label="Brand Name"
          value={form.brand}
          onChange={set("brand")}
          half
        />
        <Field
          label="Category *"
          value={form.category}
          onChange={set("category")}
          half
        />
        <Field
          label="Barcode"
          value={form.barcode}
          onChange={set("barcode")}
          half
          placeholder="e.g. 8901234567890"
        />
        <Field
          label="Supplier Name"
          value={form.supplier}
          onChange={set("supplier")}
          half
        />

        <div className="ap-field ap-field--half">
          <label className="ap-field__label">Tag</label>
          <select
            className="ap-field__input"
            value={form.tag}
            onChange={(e) => set("tag")(e.target.value)}
          >
            <option value="">None</option>
            <option value="new">New</option>
            <option value="hot">Hot</option>
            <option value="sale">Sale</option>
          </select>
        </div>

        <Field
          label="Tag Label (e.g. 🔥 Hot)"
          value={form.tagLabel}
          onChange={set("tagLabel")}
          half
        />

        <div className="ap-field ap-field--full">
          <label className="ap-field__label">Description</label>
          <textarea
            className="ap-field__input ap-field__input--textarea"
            value={form.description}
            onChange={(e) => set("description")(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      {/* ── Pricing ── */}
      <SectionHead label="💰 Pricing" />
      <div className="ap-form__grid">
        {/* Currency selector */}
        <div className="ap-field ap-field--full">
          <label className="ap-field__label">Enter prices in</label>
          <div className="ap-price-currency-row">
            <select
              className="ap-field__input ap-price-currency-select"
              value={priceCurrency}
              onChange={(e) => setPriceCurrency(e.target.value)}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code} — {c.name} ({c.symbol})
                </option>
              ))}
            </select>
            {priceCurrency !== "USD" && (
              <span className="ap-price-currency-hint">
                → stored as USD automatically
              </span>
            )}
          </div>
        </div>

        <div className="ap-field ap-field--third">
          <label className="ap-field__label">Cost Price ({sym})</label>
          <input
            className="ap-field__input"
            type="number"
            min="0"
            step="0.01"
            value={form.costPrice}
            onChange={(e) => set("costPrice")(e.target.value)}
            placeholder="What you paid"
          />
          {priceCurrency !== "USD" && form.costPrice && (
            <div className="ap-currency-hint">{toUSDHint(form.costPrice)}</div>
          )}
        </div>
        <div className="ap-field ap-field--third">
          <label className="ap-field__label">Sale Price ({sym}) *</label>
          <input
            className="ap-field__input"
            type="number"
            min="0"
            step="0.01"
            value={form.price}
            onChange={(e) => set("price")(e.target.value)}
            placeholder="Public price"
          />
          {priceCurrency !== "USD" && form.price && (
            <div className="ap-currency-hint">{toUSDHint(form.price)}</div>
          )}
        </div>
        <div className="ap-field ap-field--third">
          <label className="ap-field__label">Old / Compare Price ({sym})</label>
          <input
            className="ap-field__input"
            type="number"
            min="0"
            step="0.01"
            value={form.oldPrice}
            onChange={(e) => set("oldPrice")(e.target.value)}
            placeholder="Crossed-out price"
          />
          {priceCurrency !== "USD" && form.oldPrice && (
            <div className="ap-currency-hint">{toUSDHint(form.oldPrice)}</div>
          )}
        </div>
        <div className="ap-field ap-field--third">
          <label className="ap-field__label">Wholesale Price ({sym})</label>
          <input
            className="ap-field__input"
            type="number"
            min="0"
            step="0.01"
            value={form.wholesalePrice}
            onChange={(e) => set("wholesalePrice")(e.target.value)}
            placeholder="Bulk buyer price"
          />
          {priceCurrency !== "USD" && form.wholesalePrice && (
            <div className="ap-currency-hint">
              {toUSDHint(form.wholesalePrice)}
            </div>
          )}
        </div>
        <div className="ap-field ap-field--third">
          <label className="ap-field__label">Max Discount ({sym})</label>
          <input
            className="ap-field__input"
            type="number"
            min="0"
            step="0.01"
            value={form.maxDiscount}
            onChange={(e) => set("maxDiscount")(e.target.value)}
            placeholder="Max discount allowed"
          />
          {priceCurrency !== "USD" && form.maxDiscount && (
            <div className="ap-currency-hint">
              {toUSDHint(form.maxDiscount)}
            </div>
          )}
        </div>
        <div className="ap-field ap-field--third">
          <label className="ap-field__label">Single Discount ({sym})</label>
          <input
            className="ap-field__input"
            type="number"
            min="0"
            step="0.01"
            value={form.singleDiscount}
            onChange={(e) => set("singleDiscount")(e.target.value)}
            placeholder="Per-item discount"
          />
          {priceCurrency !== "USD" && form.singleDiscount && (
            <div className="ap-currency-hint">
              {toUSDHint(form.singleDiscount)}
            </div>
          )}
        </div>
      </div>

      {/* ── Stock ── */}
      <SectionHead label="📋 Stock & Inventory" />
      <div className="ap-form__grid">
        <Field
          label="Quantity / Stock"
          value={form.stock}
          onChange={set("stock")}
          type="number"
          half
        />
        <Field
          label="Warranty"
          value={form.warranty}
          onChange={set("warranty")}
          half
          placeholder="e.g. 1 Year, 6 Months"
        />
        <Field
          label="Stock Date"
          value={form.stockDate}
          onChange={set("stockDate")}
          type="date"
          half
        />
        <Field
          label="Expire Date"
          value={form.expireDate}
          onChange={set("expireDate")}
          type="date"
          half
        />
      </div>

      {/* ── Display ── */}
      <SectionHead label="🎨 Display Settings" />
      <div className="ap-form__grid">
        <Field
          label="Stars (0–5)"
          value={form.stars}
          onChange={set("stars")}
          type="number"
          half
        />
        <Field
          label="Reviews Count"
          value={form.reviews}
          onChange={set("reviews")}
          type="number"
          half
        />

        <div className="ap-field ap-field--half">
          <label className="ap-field__label">Card Background</label>
          <div className="ap-color-row">
            <input
              className="ap-field__input ap-field__input--color"
              type="color"
              value={form.bg}
              onChange={(e) => set("bg")(e.target.value)}
            />
            <span className="ap-color-val">{form.bg}</span>
          </div>
        </div>

        <div className="ap-field ap-field--half ap-field--check">
          <label className="ap-field__label">Featured on landing page</label>
          <label className="ap-toggle">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => set("featured")(e.target.checked)}
            />
            <span className="ap-toggle__slider" />
          </label>
        </div>
      </div>

      <div className="ap-form__actions">
        <button className="ap-btn ap-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="ap-btn ap-btn--primary"
          onClick={handleSubmit}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Product"}
        </button>
      </div>
    </div>
  );
}

/* ─── ROOT ─── */
export default function AdminProducts() {
  const { format, selected } = useCurrency();

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const LIMIT = 10;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const load = async (p = 1, q = "") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (q) params.set("search", q);
      const res = await fetch(`${PRODUCTS_API}?${params}`);
      const data = await res.json();
      setProducts(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, search);
  }, [page, search]);

  const handleSave = async (form) => {
    setSaving(true);
    try {
      const body = {
        ...form,
        price: parseFloat(form.price) || 0,
        oldPrice: form.oldPrice ? parseFloat(form.oldPrice) : null,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : null,
        wholesalePrice: form.wholesalePrice
          ? parseFloat(form.wholesalePrice)
          : null,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        singleDiscount: form.singleDiscount
          ? parseFloat(form.singleDiscount)
          : null,
        stars: parseFloat(form.stars) || 5,
        reviews: parseInt(form.reviews) || 0,
        stock: parseInt(form.stock) || 0,
        stockDate: form.stockDate || null,
        expireDate: form.expireDate || null,
      };

      const token = localStorage.getItem("bb_token");
      const headers = {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      if (view === "edit") {
        const res = await fetch(`${PRODUCTS_API}/${editing._id}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Update failed");
        showToast("Product updated!");
      } else {
        const res = await fetch(PRODUCTS_API, {
          method: "POST",
          headers,
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Create failed");
        showToast("Product added!");
      }
      setView("list");
      load(page, search);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      const token = localStorage.getItem("bb_token");
      await fetch(`${PRODUCTS_API}/${id}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setConfirm(null);
      showToast("Deleted!");
      load(page, search);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  /* Helper: format editing product back to form strings */
  const toFormStr = (p) => ({
    ...p,
    price: p.price?.toString() ?? "",
    oldPrice: p.oldPrice?.toString() ?? "",
    costPrice: p.costPrice?.toString() ?? "",
    wholesalePrice: p.wholesalePrice?.toString() ?? "",
    maxDiscount: p.maxDiscount?.toString() ?? "",
    singleDiscount: p.singleDiscount?.toString() ?? "",
    stars: p.stars?.toString() ?? "5",
    reviews: p.reviews?.toString() ?? "0",
    stock: p.stock?.toString() ?? "0",
    stockDate: p.stockDate ? p.stockDate.slice(0, 10) : "",
    expireDate: p.expireDate ? p.expireDate.slice(0, 10) : "",
  });

  const pages = Math.ceil(total / LIMIT);

  /* Check if product is expiring soon (within 30 days) */
  const isExpiringSoon = (dateStr) => {
    if (!dateStr) return false;
    const diff = new Date(dateStr) - new Date();
    return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
  };
  const isExpired = (dateStr) => dateStr && new Date(dateStr) < new Date();

  return (
    <div className="ap-root">
      {/* Header */}
      <div className="ap-header">
        <div>
          <h1 className="ap-header__title">🛍️ Products</h1>
          <p className="ap-header__sub">{total} products in catalog</p>
        </div>
        {view === "list" ? (
          <button
            className="ap-btn ap-btn--primary"
            onClick={() => setView("add")}
          >
            + Add Product
          </button>
        ) : (
          <button
            className="ap-btn ap-btn--ghost"
            onClick={() => setView("list")}
          >
            ← Back to list
          </button>
        )}
      </div>

      {/* Form */}
      {view !== "list" && (
        <div className="ap-form-wrap">
          <h2 className="ap-form-wrap__title">
            {view === "edit" ? "Edit Product" : "New Product"}
          </h2>
          <ProductForm
            initial={view === "edit" ? toFormStr(editing) : EMPTY_FORM}
            onSave={handleSave}
            onCancel={() => setView("list")}
            saving={saving}
          />
        </div>
      )}

      {/* List */}
      {view === "list" && (
        <>
          <div className="ap-toolbar">
            <div className="ap-search">
              <span>🔍</span>
              <input
                type="text"
                placeholder="Search products…"
                className="ap-search__input"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
            <CurrencySwitcher />
          </div>

          {loading ? (
            <div className="ap-loading">
              <div className="ap-loading__spinner" />
              <p>Loading…</p>
            </div>
          ) : products.length === 0 ? (
            <div className="ap-empty">
              <div className="ap-empty__icon">📦</div>
              <p>No products yet. Add your first one!</p>
            </div>
          ) : (
            <div className="ap-table-wrap">
              <table className="ap-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand / Supplier</th>
                    <th>Sale Price ({selected})</th>
                    <th>Cost ({selected})</th>
                    <th>Stock</th>
                    <th>Expire</th>
                    <th>Tag</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id}>
                      <td>
                        <div className="ap-table__product">
                          <div
                            className="ap-table__thumb"
                            style={{ background: p.bg }}
                          >
                            {p.image ? (
                              <img src={imgSrc(p.image)} alt={p.title} />
                            ) : (
                              "🛍️"
                            )}
                          </div>
                          <div>
                            <div className="ap-table__name">{p.title}</div>
                            <div className="ap-table__sub">
                              {p.barcode && (
                                <span className="ap-table__barcode">
                                  #{p.barcode}
                                </span>
                              )}{" "}
                              {"★".repeat(Math.round(p.stars))} ({p.reviews})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div
                          className="ap-table__name"
                          style={{ fontSize: "0.82rem" }}
                        >
                          {p.brand || "—"}
                        </div>
                        <div className="ap-table__sub">{p.supplier || ""}</div>
                      </td>
                      <td>
                        <span className="ap-table__price">
                          {format(p.price)}
                        </span>
                        {p.oldPrice && (
                          <span className="ap-table__old">
                            {format(p.oldPrice)}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className="ap-table__cat">
                          {p.costPrice ? format(p.costPrice) : "—"}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`ap-table__stock ${p.stock === 0 ? "ap-table__stock--out" : ""}`}
                        >
                          {p.stock === 0 ? "Out" : p.stock}
                        </span>
                      </td>
                      <td>
                        {p.expireDate ? (
                          <span
                            className={`ap-expire-badge ${isExpired(p.expireDate) ? "ap-expire-badge--expired" : isExpiringSoon(p.expireDate) ? "ap-expire-badge--soon" : "ap-expire-badge--ok"}`}
                          >
                            {isExpired(p.expireDate)
                              ? "⛔ Expired"
                              : isExpiringSoon(p.expireDate)
                                ? "⚠️ Soon"
                                : "✓ OK"}
                            <span className="ap-expire-badge__date">
                              {new Date(p.expireDate).toLocaleDateString()}
                            </span>
                          </span>
                        ) : (
                          <span className="ap-table__cat">—</span>
                        )}
                      </td>
                      <td>
                        {p.tag ? (
                          <span className={`ap-badge ap-badge--${p.tag}`}>
                            {p.tagLabel || p.tag}
                          </span>
                        ) : (
                          <span className="ap-badge ap-badge--none">—</span>
                        )}
                      </td>
                      <td>
                        <div className="ap-table__actions">
                          <button
                            className="ap-btn ap-btn--sm ap-btn--ghost"
                            onClick={() => {
                              setEditing(p);
                              setView("edit");
                            }}
                          >
                            ✏️ Edit
                          </button>
                          {confirm === p._id ? (
                            <>
                              <span className="ap-confirm-msg">Delete?</span>
                              <button
                                className="ap-btn ap-btn--sm ap-btn--danger"
                                onClick={() => handleDelete(p._id)}
                                disabled={saving}
                              >
                                Yes
                              </button>
                              <button
                                className="ap-btn ap-btn--sm ap-btn--ghost"
                                onClick={() => setConfirm(null)}
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <button
                              className="ap-btn ap-btn--sm ap-btn--danger-ghost"
                              onClick={() => setConfirm(p._id)}
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pages > 1 && (
            <div className="ap-pagination">
              <button
                className="ap-btn ap-btn--sm ap-btn--ghost"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`ap-btn ap-btn--sm ${p === page ? "ap-btn--primary" : "ap-btn--ghost"}`}
                  onClick={() => setPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="ap-btn ap-btn--sm ap-btn--ghost"
                disabled={page === pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}

      {toast.msg && (
        <div className={`ap-toast ap-toast--${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
