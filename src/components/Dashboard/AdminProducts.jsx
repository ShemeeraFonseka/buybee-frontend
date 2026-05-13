import { useState, useEffect, useRef } from "react";
import "./AdminProducts.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const PRODUCTS_API = `${API_BASE}/api/products`;
const imgSrc = (url) =>
  !url ? null : url.startsWith("http") ? url : `${API_BASE}${url}`;

const EMPTY_FORM = {
  title: "",
  description: "",
  price: "",
  oldPrice: "",
  category: "",
  tag: "",
  tagLabel: "",
  stars: "5",
  reviews: "0",
  stock: "0",
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
      const form = new FormData();
      form.append("image", file);
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: "POST",
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
function Field({ label, value, onChange, type = "text", rows, half }) {
  return (
    <div className={`ap-field ${half ? "ap-field--half" : ""}`}>
      <label className="ap-field__label">{label}</label>
      {rows ? (
        <textarea
          className="ap-field__input ap-field__input--textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
        />
      ) : (
        <input
          className="ap-field__input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

/* ─── PRODUCT FORM (add / edit) ─── */
function ProductForm({ initial = EMPTY_FORM, onSave, onCancel, saving }) {
  const [form, setForm] = useState(initial);
  const set = (key) => (val) => setForm((f) => ({ ...f, [key]: val }));

  const handleSubmit = () => {
    if (!form.title || !form.price || !form.category) {
      alert("Title, price and category are required");
      return;
    }
    onSave(form);
  };

  return (
    <div className="ap-form">
      <ImageUploader value={form.image} onChange={set("image")} />

      <div className="ap-form__grid">
        <Field
          label="Title *"
          value={form.title}
          onChange={set("title")}
          half
        />
        <Field
          label="Category *"
          value={form.category}
          onChange={set("category")}
          half
        />
        <Field
          label="Price ($) *"
          value={form.price}
          onChange={set("price")}
          type="number"
          half
        />
        <Field
          label="Old Price ($)"
          value={form.oldPrice}
          onChange={set("oldPrice")}
          type="number"
          half
        />
        <Field
          label="Stock"
          value={form.stock}
          onChange={set("stock")}
          type="number"
          half
        />
        <Field
          label="Reviews count"
          value={form.reviews}
          onChange={set("reviews")}
          type="number"
          half
        />
        <Field
          label="Stars (0–5)"
          value={form.stars}
          onChange={set("stars")}
          type="number"
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

      <Field
        label="Description"
        value={form.description}
        onChange={set("description")}
        rows={3}
      />

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
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("list"); // 'list' | 'add' | 'edit'
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
        oldPrice: parseFloat(form.oldPrice) || null,
        stars: parseFloat(form.stars) || 5,
        reviews: parseInt(form.reviews) || 0,
        stock: parseInt(form.stock) || 0,
      };

      if (view === "edit") {
        const res = await fetch(`${PRODUCTS_API}/${editing._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Update failed");
        showToast("Product updated!");
      } else {
        const res = await fetch(PRODUCTS_API, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
      await fetch(`${PRODUCTS_API}/${id}`, { method: "DELETE" });
      setConfirm(null);
      showToast("Deleted!");
      load(page, search);
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="ap-root">
      {/* ─ Header ─ */}
      <div className="ap-header">
        <div>
          <h1 className="ap-header__title">🛍️ Products</h1>
          <p className="ap-header__sub">{total} products in catalog</p>
        </div>
        {view === "list" && (
          <button
            className="ap-btn ap-btn--primary"
            onClick={() => setView("add")}
          >
            + Add Product
          </button>
        )}
        {view !== "list" && (
          <button
            className="ap-btn ap-btn--ghost"
            onClick={() => setView("list")}
          >
            ← Back to list
          </button>
        )}
      </div>

      {/* ─ Add / Edit form ─ */}
      {view !== "list" && (
        <div className="ap-form-wrap">
          <h2 className="ap-form-wrap__title">
            {view === "edit" ? "Edit Product" : "New Product"}
          </h2>
          <ProductForm
            initial={
              view === "edit"
                ? {
                    ...editing,
                    price: editing.price?.toString() ?? "",
                    oldPrice: editing.oldPrice?.toString() ?? "",
                    stars: editing.stars?.toString() ?? "5",
                    reviews: editing.reviews?.toString() ?? "0",
                    stock: editing.stock?.toString() ?? "0",
                  }
                : EMPTY_FORM
            }
            onSave={handleSave}
            onCancel={() => setView("list")}
            saving={saving}
          />
        </div>
      )}

      {/* ─ List ─ */}
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
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Tag</th>
                    <th>Featured</th>
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
                              {"★".repeat(Math.round(p.stars))} ({p.reviews})
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="ap-table__cat">{p.category}</span>
                      </td>
                      <td>
                        <span className="ap-table__price">
                          ${p.price.toFixed(2)}
                        </span>
                        {p.oldPrice && (
                          <span className="ap-table__old">
                            ${p.oldPrice.toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={`ap-table__stock ${p.stock === 0 ? "ap-table__stock--out" : ""}`}
                        >
                          {p.stock === 0 ? "Out" : p.stock}
                        </span>
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
                        <span
                          className={`ap-table__featured ${p.featured ? "ap-table__featured--yes" : ""}`}
                        >
                          {p.featured ? "✓ Yes" : "—"}
                        </span>
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

          {/* Pagination */}
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

      {/* Toast */}
      {toast.msg && (
        <div className={`ap-toast ap-toast--${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
