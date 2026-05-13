import { useState, useRef, useEffect } from "react";
import { useSite } from "../LandingPage/SiteContext";
import { useAuth } from "../Auth/AuthContext";
import "./AdminDashboard.css";

const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace("/api/content", "")
  : "http://localhost:5000";

/* ─── HELPERS ─── */
const SECTIONS = [
  "hero",
  "stats",
  "features",
  "categories",
  "products",
  "testimonials",
  "promo",
];
const SECTION_LABELS = {
  hero: "🏠 Hero",
  stats: "📊 Stats",
  features: "✨ Features",
  categories: "📦 Categories",
  products: "🛍️ Products",
  testimonials: "💬 Testimonials",
  promo: "🎯 Promo Banner",
};

const TAG_OPTIONS = ["hot", "new", "sale"];

/* ─── IMAGE UPLOADER ─── */
function ImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // Resolve full URL for preview (handles both /uploads/... and full https://...)
  const previewSrc = value
    ? value.startsWith("http")
      ? value
      : `${API_BASE}${value}`
    : null;

  const handleFile = async (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File too large — max 5 MB");
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
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleClear = () => onChange("");

  return (
    <div className="ad-field ad-field--full">
      <label className="ad-field__label">Product Image</label>

      {previewSrc ? (
        /* ── Preview mode ── */
        <div className="ad-img-preview">
          <img src={previewSrc} alt="Product" className="ad-img-preview__img" />
          <div className="ad-img-preview__actions">
            <button
              className="ad-btn ad-btn--sm ad-btn--ghost"
              onClick={() => inputRef.current.click()}
            >
              🔄 Replace
            </button>
            <button
              className="ad-btn ad-btn--sm ad-btn--danger-ghost"
              onClick={handleClear}
            >
              🗑️ Remove
            </button>
          </div>
        </div>
      ) : (
        /* ── Drop zone ── */
        <div
          className={`ad-dropzone ${uploading ? "ad-dropzone--loading" : ""}`}
          onClick={() => inputRef.current.click()}
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onDragEnter={(e) =>
            e.currentTarget.classList.add("ad-dropzone--over")
          }
          onDragLeave={(e) =>
            e.currentTarget.classList.remove("ad-dropzone--over")
          }
        >
          {uploading ? (
            <div className="ad-dropzone__spinner" />
          ) : (
            <>
              <div className="ad-dropzone__icon">📷</div>
              <div className="ad-dropzone__text">
                Click or drag an image here
              </div>
              <div className="ad-dropzone__hint">
                JPEG, PNG, WebP · max 5 MB
              </div>
            </>
          )}
        </div>
      )}

      {error && <div className="ad-field__error">{error}</div>}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}

function Field({ label, value, onChange, type = "text", rows }) {
  return (
    <div className="ad-field">
      <label className="ad-field__label">{label}</label>
      {rows ? (
        <textarea
          className="ad-field__input ad-field__input--textarea"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={rows}
        />
      ) : (
        <input
          className="ad-field__input"
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}

function SaveBar({ saving, onSave, onCancel, dirty }) {
  return dirty ? (
    <div className="ad-savebar">
      <span className="ad-savebar__msg">You have unsaved changes</span>
      <div className="ad-savebar__actions">
        <button className="ad-btn ad-btn--ghost" onClick={onCancel}>
          Discard
        </button>
        <button
          className="ad-btn ad-btn--primary"
          onClick={onSave}
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </div>
  ) : null;
}

function Toast({ msg, type }) {
  return msg ? <div className={`ad-toast ad-toast--${type}`}>{msg}</div> : null;
}

/* ════════════════════════════════════════════
   HERO EDITOR
   ════════════════════════════════════════════ */
function HeroEditor({ showToast }) {
  const { content, updateSection, saving } = useSite();
  const [draft, setDraft] = useState(null);
  const current = draft ?? content.hero;
  const dirty = draft !== null;

  const set = (key) => (val) =>
    setDraft((d) => ({ ...(d ?? content.hero), [key]: val }));

  const handleSave = async () => {
    await updateSection("hero", draft);
    setDraft(null);
    showToast("Hero saved!", "success");
  };

  return (
    <div className="ad-editor">
      <div className="ad-editor__grid ad-editor__grid--2">
        <Field
          label="Badge text"
          value={current.badge}
          onChange={set("badge")}
        />
        <Field
          label="Primary button"
          value={current.btnPrimary}
          onChange={set("btnPrimary")}
        />
        <Field
          label="Title (main)"
          value={current.titleMain}
          onChange={set("titleMain")}
        />
        <Field
          label="Secondary button"
          value={current.btnSecondary}
          onChange={set("btnSecondary")}
        />
        <Field
          label="Title (highlighted)"
          value={current.titleEmph}
          onChange={set("titleEmph")}
        />
      </div>
      <Field
        label="Subtitle"
        value={current.sub}
        onChange={set("sub")}
        rows={3}
      />
      <SaveBar
        saving={saving}
        dirty={dirty}
        onSave={handleSave}
        onCancel={() => setDraft(null)}
      />
    </div>
  );
}

/* ════════════════════════════════════════════
   PROMO EDITOR
   ════════════════════════════════════════════ */
function PromoEditor({ showToast }) {
  const { content, updateSection, saving } = useSite();
  const [draft, setDraft] = useState(null);
  const current = draft ?? content.promo;
  const dirty = draft !== null;

  const set = (key) => (val) =>
    setDraft((d) => ({ ...(d ?? content.promo), [key]: val }));

  const handleSave = async () => {
    await updateSection("promo", draft);
    setDraft(null);
    showToast("Promo banner saved!", "success");
  };

  return (
    <div className="ad-editor">
      <div className="ad-editor__grid ad-editor__grid--2">
        <Field
          label="Label (small text)"
          value={current.label}
          onChange={set("label")}
        />
        <Field
          label="Discount number"
          value={current.bigNum}
          onChange={set("bigNum")}
        />
        <Field label="Promo code" value={current.code} onChange={set("code")} />
        <Field label="Button text" value={current.btn} onChange={set("btn")} />
      </div>
      <Field label="Title" value={current.title} onChange={set("title")} />
      <Field
        label="Subtitle"
        value={current.sub}
        onChange={set("sub")}
        rows={3}
      />
      <SaveBar
        saving={saving}
        dirty={dirty}
        onSave={handleSave}
        onCancel={() => setDraft(null)}
      />
    </div>
  );
}

/* ════════════════════════════════════════════
   GENERIC ARRAY EDITOR (stats, features, categories, testimonials)
   ════════════════════════════════════════════ */
function ArrayEditor({ section, fields, showToast, newItemDefaults }) {
  const { content, addItem, updateItem, deleteItem, saving } = useSite();
  const items = content[section] || [];

  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({});
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState(newItemDefaults);
  const [confirm, setConfirm] = useState(null);

  const startEdit = (item) => {
    setEditId(item._id);
    setDraft({ ...item });
  };
  const cancelEdit = () => {
    setEditId(null);
    setDraft({});
  };

  const handleUpdate = async () => {
    await updateItem(section, editId, draft);
    setEditId(null);
    setDraft({});
    showToast("Updated!", "success");
  };

  const handleAdd = async () => {
    await addItem(section, newItem);
    setNewItem(newItemDefaults);
    setAdding(false);
    showToast("Added!", "success");
  };

  const handleDelete = async (id) => {
    await deleteItem(section, id);
    setConfirm(null);
    showToast("Deleted!", "success");
  };

  return (
    <div className="ad-editor">
      {/* Item list */}
      <div className="ad-list">
        {items.map((item) => (
          <div
            key={item._id}
            className={`ad-list__item ${editId === item._id ? "ad-list__item--editing" : ""}`}
          >
            {editId === item._id ? (
              /* ── Inline edit form ── */
              <div className="ad-list__edit-form">
                {/* Image uploader for products */}
                {section === "products" && (
                  <ImageUploader
                    value={draft.image ?? ""}
                    onChange={(url) => setDraft((d) => ({ ...d, image: url }))}
                  />
                )}
                <div className="ad-editor__grid ad-editor__grid--2">
                  {fields
                    .filter((f) => f.key !== "image")
                    .map((f) => (
                      <Field
                        key={f.key}
                        label={f.label}
                        value={draft[f.key] ?? ""}
                        onChange={(val) =>
                          setDraft((d) => ({ ...d, [f.key]: val }))
                        }
                        rows={f.rows}
                        type={f.type}
                      />
                    ))}
                </div>
                {/* Tag select for products */}
                {section === "products" && (
                  <div className="ad-field">
                    <label className="ad-field__label">Tag type</label>
                    <select
                      className="ad-field__input"
                      value={draft.tag ?? "new"}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, tag: e.target.value }))
                      }
                    >
                      {TAG_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="ad-list__edit-actions">
                  <button className="ad-btn ad-btn--ghost" onClick={cancelEdit}>
                    Cancel
                  </button>
                  <button
                    className="ad-btn ad-btn--primary"
                    onClick={handleUpdate}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              /* ── Read view ── */
              <div className="ad-list__row">
                <div className="ad-list__preview">
                  {item.image ? (
                    <img
                      src={
                        item.image.startsWith("http")
                          ? item.image
                          : `${API_BASE}${item.image}`
                      }
                      alt={item.title}
                      className="ad-list__thumb"
                    />
                  ) : item.icon || item.emoji || item.avatar ? (
                    <span className="ad-list__icon">
                      {item.icon || item.emoji || item.avatar}
                    </span>
                  ) : null}
                  <div>
                    <div className="ad-list__primary">
                      {item.title || item.name || item.num || item.label}
                    </div>
                    <div className="ad-list__secondary">
                      {item.desc ||
                        item.count ||
                        item.label ||
                        item.role ||
                        item.price ||
                        ""}
                    </div>
                  </div>
                </div>
                <div className="ad-list__actions">
                  <button
                    className="ad-btn ad-btn--sm ad-btn--ghost"
                    onClick={() => startEdit(item)}
                  >
                    ✏️ Edit
                  </button>
                  {confirm === item._id ? (
                    <>
                      <span className="ad-list__confirm-msg">Delete?</span>
                      <button
                        className="ad-btn ad-btn--sm ad-btn--danger"
                        onClick={() => handleDelete(item._id)}
                        disabled={saving}
                      >
                        Yes
                      </button>
                      <button
                        className="ad-btn ad-btn--sm ad-btn--ghost"
                        onClick={() => setConfirm(null)}
                      >
                        No
                      </button>
                    </>
                  ) : (
                    <button
                      className="ad-btn ad-btn--sm ad-btn--danger-ghost"
                      onClick={() => setConfirm(item._id)}
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add new */}
      {adding ? (
        <div className="ad-add-form">
          <div className="ad-add-form__title">Add new item</div>
          {/* Image uploader for products */}
          {section === "products" && (
            <ImageUploader
              value={newItem.image ?? ""}
              onChange={(url) => setNewItem((n) => ({ ...n, image: url }))}
            />
          )}
          <div className="ad-editor__grid ad-editor__grid--2">
            {fields
              .filter((f) => f.key !== "image")
              .map((f) => (
                <Field
                  key={f.key}
                  label={f.label}
                  value={newItem[f.key] ?? ""}
                  onChange={(val) =>
                    setNewItem((n) => ({ ...n, [f.key]: val }))
                  }
                  rows={f.rows}
                  type={f.type}
                />
              ))}
          </div>
          {section === "products" && (
            <div className="ad-field">
              <label className="ad-field__label">Tag type</label>
              <select
                className="ad-field__input"
                value={newItem.tag ?? "new"}
                onChange={(e) =>
                  setNewItem((n) => ({ ...n, tag: e.target.value }))
                }
              >
                {TAG_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="ad-add-form__actions">
            <button
              className="ad-btn ad-btn--ghost"
              onClick={() => {
                setAdding(false);
                setNewItem(newItemDefaults);
              }}
            >
              Cancel
            </button>
            <button
              className="ad-btn ad-btn--primary"
              onClick={handleAdd}
              disabled={saving}
            >
              {saving ? "Saving…" : "Add Item"}
            </button>
          </div>
        </div>
      ) : (
        <button className="ad-btn ad-btn--add" onClick={() => setAdding(true)}>
          + Add new item
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   SECTION CONFIGS
   ════════════════════════════════════════════ */
const SECTION_CONFIG = {
  stats: {
    fields: [
      { key: "num", label: "Number (e.g. 250K+)" },
      { key: "label", label: "Label" },
    ],
    defaults: { num: "", label: "" },
  },
  features: {
    fields: [
      { key: "icon", label: "Icon (emoji)" },
      { key: "title", label: "Title" },
      { key: "desc", label: "Description", rows: 3 },
    ],
    defaults: { icon: "⭐", title: "", desc: "" },
  },
  categories: {
    fields: [
      { key: "emoji", label: "Emoji" },
      { key: "name", label: "Name" },
      { key: "count", label: "Count (e.g. 5,000 products)" },
    ],
    defaults: { emoji: "📦", name: "", count: "" },
  },
  products: {
    fields: [
      { key: "image", label: "Image URL" },
      { key: "title", label: "Product title" },
      { key: "cat", label: "Category" },
      { key: "price", label: "Price" },
      { key: "oldPrice", label: "Old price (optional)" },
      { key: "tagLabel", label: "Tag label (e.g. 🔥 Hot)" },
      { key: "stars", label: "Stars (e.g. ★★★★★)" },
      { key: "reviews", label: "Review count" },
      { key: "bg", label: "Card bg color", type: "color" },
    ],
    defaults: {
      image: "",
      title: "",
      cat: "",
      price: "",
      oldPrice: "",
      tagLabel: "New",
      tag: "new",
      stars: "★★★★★",
      reviews: "0",
      bg: "#FDE8C8",
    },
  },
  testimonials: {
    fields: [
      { key: "name", label: "Customer name" },
      { key: "role", label: "Role / location" },
      { key: "avatar", label: "Avatar emoji" },
      { key: "text", label: "Testimonial text", rows: 4 },
    ],
    defaults: {
      name: "",
      role: "",
      avatar: "👤",
      avatarBg: "#FDE8C8",
      text: "",
    },
  },
};

/* ════════════════════════════════════════════
   ROOT DASHBOARD
   ════════════════════════════════════════════ */
export default function AdminDashboard() {
  const { loading, error } = useSite();
  const { user, logout } = useAuth();
  const [activeSection, setActiveSection] = useState("hero");
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [lowStock, setLowStock] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/api/products/low-stock?threshold=5`)
      .then((r) => r.json())
      .then((data) => setLowStock(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  if (loading)
    return (
      <div className="ad-loading">
        <div className="ad-loading__spinner" />
        <p>Loading content from MongoDB…</p>
      </div>
    );

  if (error)
    return (
      <div className="ad-error">
        <div className="ad-error__icon">⚠️</div>
        <h2>Could not connect to server</h2>
        <p>{error}</p>
        <p className="ad-error__hint">
          Make sure your Express server is running on{" "}
          <code>http://localhost:5000</code>
        </p>
      </div>
    );

  return (
    <div className="ad-root">
      {/* Sidebar */}
      <aside className="ad-sidebar">
        <div className="ad-sidebar__brand">
          <span className="ad-sidebar__bee">🐝</span>
          <div>
            <div className="ad-sidebar__name">BuyBee</div>
            <div className="ad-sidebar__role">Admin Dashboard</div>
          </div>
        </div>

        {user && (
          <div className="ad-sidebar__user">
            <div className="ad-sidebar__user-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="ad-sidebar__user-info">
              <div className="ad-sidebar__user-name">{user.name}</div>
              <div className="ad-sidebar__user-role">{user.email}</div>
            </div>
            <button
              className="ad-sidebar__logout"
              onClick={logout}
              title="Sign out"
            >
              ⇥
            </button>
          </div>
        )}

        <nav className="ad-sidebar__nav">
          {SECTIONS.map((s) => (
            <button
              key={s}
              className={`ad-sidebar__item ${activeSection === s ? "ad-sidebar__item--active" : ""}`}
              onClick={() => setActiveSection(s)}
            >
              {SECTION_LABELS[s]}
            </button>
          ))}
        </nav>

        <div className="ad-sidebar__divider" />
        <div className="ad-sidebar__ext-links">
          <a href="/admin/products" className="ad-sidebar__ext-link">
            🛍️ Products
          </a>
          <a href="/admin/orders" className="ad-sidebar__ext-link">
            📋 Orders
          </a>
          <a href="/admin/users" className="ad-sidebar__ext-link">
            👥 Users
          </a>
          <a href="/admin/currencies" className="ad-sidebar__ext-link">
            💱 Currencies
          </a>
        </div>

        <a
          href="/"
          target="_blank"
          rel="noreferrer"
          className="ad-sidebar__preview-btn"
        >
          👁️ View Live Site
        </a>
      </aside>

      {/* Main */}
      <main className="ad-main">
        <div className="ad-main__header">
          <div>
            <h1 className="ad-main__title">{SECTION_LABELS[activeSection]}</h1>
            <p className="ad-main__sub">
              Changes are saved directly to MongoDB and reflected live on the
              site.
            </p>
          </div>
        </div>

        {/* ── Low stock alert ── */}
        {lowStock.length > 0 && (
          <div className="ad-low-stock-alert">
            <div className="ad-low-stock-alert__header">
              <span>
                ⚠️ Low Stock Alert — {lowStock.length} product
                {lowStock.length !== 1 ? "s" : ""} running low
              </span>
              <a href="/admin/products" className="ad-low-stock-alert__link">
                Manage stock →
              </a>
            </div>
            <div className="ad-low-stock-alert__items">
              {lowStock.map((p) => (
                <div key={p._id} className="ad-low-stock-alert__item">
                  <div
                    className="ad-low-stock-alert__img"
                    style={{ background: p.bg || "#FDE8C8" }}
                  >
                    {p.image ? (
                      <img
                        src={
                          p.image.startsWith("http")
                            ? p.image
                            : `${API_BASE}${p.image}`
                        }
                        alt={p.title}
                      />
                    ) : (
                      "🛍️"
                    )}
                  </div>
                  <div className="ad-low-stock-alert__name">{p.title}</div>
                  <div
                    className={`ad-low-stock-alert__qty ${p.stock === 0 ? "ad-low-stock-alert__qty--oos" : ""}`}
                  >
                    {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="ad-main__body">
          {activeSection === "hero" && <HeroEditor showToast={showToast} />}
          {activeSection === "promo" && <PromoEditor showToast={showToast} />}
          {[
            "stats",
            "features",
            "categories",
            "products",
            "testimonials",
          ].includes(activeSection) && (
            <ArrayEditor
              section={activeSection}
              fields={SECTION_CONFIG[activeSection].fields}
              newItemDefaults={SECTION_CONFIG[activeSection].defaults}
              showToast={showToast}
            />
          )}
        </div>
      </main>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
