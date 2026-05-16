import { useState, useRef, useEffect, useCallback } from "react";
import { useSite } from "../LandingPage/SiteContext";
import { useAuth } from "../Auth/AuthContext";
import "./AdminDashboard.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

const SECTIONS = [
  "hero",
  "stats",
  "features",
  "categories",
  "products",
  "testimonials",
  "promo",
  "contact",
  "about",
];
const SECTION_LABELS = {
  hero: "🏠 Hero",
  stats: "📊 Stats",
  features: "✨ Features",
  categories: "📦 Categories",
  products: "🛍️ Products",
  testimonials: "💬 Testimonials",
  promo: "🎯 Promo Banner",
  contact: "📞 Contact Page",
  about: "🏢 About Page",
};
const TAG_OPTIONS = ["hot", "new", "sale"];

/* ─── AUTH FETCH HELPER ─── */
const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem("bb_token");
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
  });
};

/* ─── IMAGE UPLOADER ─── */
function ImageUploader({ value, onChange }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);
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
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="ad-field ad-field--full">
      <label className="ad-field__label">Product Image</label>
      {previewSrc ? (
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
              onClick={() => onChange("")}
            >
              🗑️ Remove
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`ad-dropzone ${uploading ? "ad-dropzone--loading" : ""}`}
          onClick={() => inputRef.current.click()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files[0]);
          }}
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
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => handleFile(e.target.files[0])}
      />
    </div>
  );
}

/* ─── FIELD ─── */
function Field({ label, value, onChange, type = "text", rows, full }) {
  return (
    <div className={`ad-field ${full ? "ad-field--full" : ""}`}>
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

/* ─── HERO EDITOR ─── */
function HeroEditor({ showToast }) {
  const { content, updateSection, saving } = useSite();
  const [draft, setDraft] = useState(null);
  const current = draft ?? content.hero;
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
        dirty={draft !== null}
        onSave={handleSave}
        onCancel={() => setDraft(null)}
      />
    </div>
  );
}

/* ─── PROMO EDITOR ─── */
function PromoEditor({ showToast }) {
  const { content, updateSection, saving } = useSite();
  const [draft, setDraft] = useState(null);
  const current = draft ?? content.promo;
  const set = (key) => (val) =>
    setDraft((d) => ({ ...(d ?? content.promo), [key]: val }));
  const handleSave = async () => {
    await updateSection("promo", draft);
    setDraft(null);
    showToast("Promo saved!", "success");
  };
  return (
    <div className="ad-editor">
      <div className="ad-editor__grid ad-editor__grid--2">
        <Field label="Label" value={current.label} onChange={set("label")} />
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
        dirty={draft !== null}
        onSave={handleSave}
        onCancel={() => setDraft(null)}
      />
    </div>
  );
}

/* ─── ARRAY EDITOR (landing page sections) ─── */
function ArrayEditor({ section, fields, showToast, newItemDefaults }) {
  const { content, addItem, updateItem, deleteItem, saving } = useSite();
  const items = content[section] || [];
  const [editId, setEditId] = useState(null);
  const [draft, setDraft] = useState({});
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState(newItemDefaults);
  const [confirm, setConfirm] = useState(null);

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
      <div className="ad-list">
        {items.map((item) => (
          <div
            key={item._id}
            className={`ad-list__item ${editId === item._id ? "ad-list__item--editing" : ""}`}
          >
            {editId === item._id ? (
              <div className="ad-list__edit-form">
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
                  <button
                    className="ad-btn ad-btn--ghost"
                    onClick={() => {
                      setEditId(null);
                      setDraft({});
                    }}
                  >
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
                    onClick={() => {
                      setEditId(item._id);
                      setDraft({ ...item });
                    }}
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
      {adding ? (
        <div className="ad-add-form">
          <div className="ad-add-form__title">Add new item</div>
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
   CONTACT PAGE EDITOR
   ════════════════════════════════════════════ */
function ContactEditor({ showToast }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [editFaq, setEditFaq] = useState(null);
  const [newFaq, setNewFaq] = useState({ question: "", answer: "" });
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/contact-content`);
    const json = await res.json();
    setData(json);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (val) => {
    setData((d) => ({ ...d, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { faqs, _id, __v, createdAt, updatedAt, ...flat } = data;
      await authFetch(`${API_BASE}/api/contact-content`, {
        method: "PATCH",
        body: JSON.stringify(flat),
      });
      setDirty(false);
      showToast("Contact page saved!", "success");
    } catch {
      showToast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddFaq = async () => {
    if (!newFaq.question || !newFaq.answer) return;
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/api/contact-content/faqs`, {
        method: "POST",
        body: JSON.stringify(newFaq),
      });
      const item = await res.json();
      setData((d) => ({ ...d, faqs: [...(d.faqs || []), item] }));
      setNewFaq({ question: "", answer: "" });
      setAdding(false);
      showToast("FAQ added!", "success");
    } catch {
      showToast("Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateFaq = async (id) => {
    setSaving(true);
    try {
      const res = await authFetch(
        `${API_BASE}/api/contact-content/faqs/${id}`,
        { method: "PATCH", body: JSON.stringify(editFaq) },
      );
      const item = await res.json();
      setData((d) => ({
        ...d,
        faqs: d.faqs.map((f) => (f._id === id ? item : f)),
      }));
      setEditFaq(null);
      showToast("FAQ updated!", "success");
    } catch {
      showToast("Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteFaq = async (id) => {
    setSaving(true);
    try {
      await authFetch(`${API_BASE}/api/contact-content/faqs/${id}`, {
        method: "DELETE",
      });
      setData((d) => ({ ...d, faqs: d.faqs.filter((f) => f._id !== id) }));
      setConfirm(null);
      showToast("FAQ deleted!", "success");
    } catch {
      showToast("Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!data)
    return (
      <div className="ad-loading">
        <div className="ad-loading__spinner" />
      </div>
    );

  return (
    <div className="ad-editor">
      {/* Hero section */}
      <div className="ad-editor__section-title">Hero</div>
      <div className="ad-editor__grid ad-editor__grid--2">
        <Field
          label="Hero Title"
          value={data.heroTitle || ""}
          onChange={set("heroTitle")}
        />
        <Field
          label="Hero Subtitle"
          value={data.heroSub || ""}
          onChange={set("heroSub")}
          rows={2}
        />
      </div>

      {/* Contact info */}
      <div className="ad-editor__section-title" style={{ marginTop: 24 }}>
        Contact Info
      </div>
      <div className="ad-editor__grid ad-editor__grid--2">
        <Field
          label="Address"
          value={data.address || ""}
          onChange={set("address")}
        />
        <Field label="Phone" value={data.phone || ""} onChange={set("phone")} />
        <Field label="Email" value={data.email || ""} onChange={set("email")} />
        <Field
          label="Business Hours"
          value={data.hours || ""}
          onChange={set("hours")}
        />
      </div>

      <SaveBar
        saving={saving}
        dirty={dirty}
        onSave={handleSave}
        onCancel={() => {
          load();
          setDirty(false);
        }}
      />

      {/* FAQs */}
      <div className="ad-editor__section-title" style={{ marginTop: 32 }}>
        FAQs
      </div>
      <div className="ad-list">
        {(data.faqs || []).map((faq) => (
          <div
            key={faq._id}
            className={`ad-list__item ${editFaq?._id === faq._id ? "ad-list__item--editing" : ""}`}
          >
            {editFaq?._id === faq._id ? (
              <div className="ad-list__edit-form">
                <Field
                  label="Question"
                  value={editFaq.question}
                  onChange={(v) => setEditFaq((f) => ({ ...f, question: v }))}
                  full
                />
                <Field
                  label="Answer"
                  value={editFaq.answer}
                  onChange={(v) => setEditFaq((f) => ({ ...f, answer: v }))}
                  rows={3}
                  full
                />
                <div className="ad-list__edit-actions">
                  <button
                    className="ad-btn ad-btn--ghost"
                    onClick={() => setEditFaq(null)}
                  >
                    Cancel
                  </button>
                  <button
                    className="ad-btn ad-btn--primary"
                    onClick={() => handleUpdateFaq(faq._id)}
                    disabled={saving}
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="ad-list__row">
                <div className="ad-list__preview">
                  <div>
                    <div className="ad-list__primary">{faq.question}</div>
                    <div className="ad-list__secondary">{faq.answer}</div>
                  </div>
                </div>
                <div className="ad-list__actions">
                  <button
                    className="ad-btn ad-btn--sm ad-btn--ghost"
                    onClick={() => setEditFaq({ ...faq })}
                  >
                    ✏️ Edit
                  </button>
                  {confirm === faq._id ? (
                    <>
                      <span className="ad-list__confirm-msg">Delete?</span>
                      <button
                        className="ad-btn ad-btn--sm ad-btn--danger"
                        onClick={() => handleDeleteFaq(faq._id)}
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
                      onClick={() => setConfirm(faq._id)}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      {adding ? (
        <div className="ad-add-form">
          <div className="ad-add-form__title">New FAQ</div>
          <Field
            label="Question"
            value={newFaq.question}
            onChange={(v) => setNewFaq((f) => ({ ...f, question: v }))}
            full
          />
          <Field
            label="Answer"
            value={newFaq.answer}
            onChange={(v) => setNewFaq((f) => ({ ...f, answer: v }))}
            rows={3}
            full
          />
          <div className="ad-add-form__actions">
            <button
              className="ad-btn ad-btn--ghost"
              onClick={() => {
                setAdding(false);
                setNewFaq({ question: "", answer: "" });
              }}
            >
              Cancel
            </button>
            <button
              className="ad-btn ad-btn--primary"
              onClick={handleAddFaq}
              disabled={saving}
            >
              {saving ? "Saving…" : "Add FAQ"}
            </button>
          </div>
        </div>
      ) : (
        <button className="ad-btn ad-btn--add" onClick={() => setAdding(true)}>
          + Add FAQ
        </button>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════
   ABOUT PAGE EDITOR
   ════════════════════════════════════════════ */
function AboutEditor({ showToast }) {
  const [data, setData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [activeTab, setActiveTab] = useState("hero");
  const [editItem, setEditItem] = useState(null);
  const [editArr, setEditArr] = useState(null);
  const [newItem, setNewItem] = useState({});
  const [adding, setAdding] = useState(null);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/about-content`);
    const json = await res.json();
    setData(json);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const set = (key) => (val) => {
    setData((d) => ({ ...d, [key]: val }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const {
        stats,
        values,
        timeline,
        team,
        _id,
        __v,
        createdAt,
        updatedAt,
        ...flat
      } = data;
      await authFetch(`${API_BASE}/api/about-content`, {
        method: "PATCH",
        body: JSON.stringify(flat),
      });
      setDirty(false);
      showToast("About page saved!", "success");
    } catch {
      showToast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleAddArr = async (arr, item) => {
    setSaving(true);
    try {
      const res = await authFetch(`${API_BASE}/api/about-content/${arr}`, {
        method: "POST",
        body: JSON.stringify(item),
      });
      const added = await res.json();
      setData((d) => ({ ...d, [arr]: [...(d[arr] || []), added] }));
      setAdding(null);
      setNewItem({});
      showToast("Added!", "success");
    } catch {
      showToast("Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateArr = async (arr, id) => {
    setSaving(true);
    try {
      const res = await authFetch(
        `${API_BASE}/api/about-content/${arr}/${id}`,
        { method: "PATCH", body: JSON.stringify(editItem) },
      );
      const updated = await res.json();
      setData((d) => ({
        ...d,
        [arr]: d[arr].map((i) => (i._id === id ? updated : i)),
      }));
      setEditItem(null);
      setEditArr(null);
      showToast("Updated!", "success");
    } catch {
      showToast("Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteArr = async (arr, id) => {
    setSaving(true);
    try {
      await authFetch(`${API_BASE}/api/about-content/${arr}/${id}`, {
        method: "DELETE",
      });
      setData((d) => ({ ...d, [arr]: d[arr].filter((i) => i._id !== id) }));
      setConfirm(null);
      showToast("Deleted!", "success");
    } catch {
      showToast("Failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (!data)
    return (
      <div className="ad-loading">
        <div className="ad-loading__spinner" />
      </div>
    );

  const TABS = [
    { key: "hero", label: "Hero & Mission" },
    { key: "stats", label: "Stats" },
    { key: "values", label: "Values" },
    { key: "timeline", label: "Timeline" },
    { key: "team", label: "Team" },
    { key: "cta", label: "CTA" },
  ];

  const renderArray = (arr, fields, defaults, label) => (
    <div className="ad-list" style={{ marginTop: 16 }}>
      {(data[arr] || []).map((item) => (
        <div
          key={item._id}
          className={`ad-list__item ${editArr === arr && editItem?._id === item._id ? "ad-list__item--editing" : ""}`}
        >
          {editArr === arr && editItem?._id === item._id ? (
            <div className="ad-list__edit-form">
              <div className="ad-editor__grid ad-editor__grid--2">
                {fields.map((f) => (
                  <Field
                    key={f.key}
                    label={f.label}
                    value={editItem[f.key] ?? ""}
                    onChange={(v) => setEditItem((i) => ({ ...i, [f.key]: v }))}
                    rows={f.rows}
                    type={f.type}
                  />
                ))}
              </div>
              <div className="ad-list__edit-actions">
                <button
                  className="ad-btn ad-btn--ghost"
                  onClick={() => {
                    setEditItem(null);
                    setEditArr(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="ad-btn ad-btn--primary"
                  onClick={() => handleUpdateArr(arr, item._id)}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          ) : (
            <div className="ad-list__row">
              <div className="ad-list__preview">
                {item.icon && (
                  <span className="ad-list__icon">{item.icon}</span>
                )}
                <div>
                  <div className="ad-list__primary">
                    {item.title ||
                      item.name ||
                      item.num ||
                      item.year ||
                      item.label}
                  </div>
                  <div className="ad-list__secondary">
                    {item.desc || item.role || item.label || ""}
                  </div>
                </div>
              </div>
              <div className="ad-list__actions">
                <button
                  className="ad-btn ad-btn--sm ad-btn--ghost"
                  onClick={() => {
                    setEditItem({ ...item });
                    setEditArr(arr);
                  }}
                >
                  ✏️ Edit
                </button>
                {confirm === item._id ? (
                  <>
                    <span className="ad-list__confirm-msg">Delete?</span>
                    <button
                      className="ad-btn ad-btn--sm ad-btn--danger"
                      onClick={() => handleDeleteArr(arr, item._id)}
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
                    🗑️
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
      {adding === arr ? (
        <div className="ad-add-form">
          <div className="ad-add-form__title">Add {label}</div>
          <div className="ad-editor__grid ad-editor__grid--2">
            {fields.map((f) => (
              <Field
                key={f.key}
                label={f.label}
                value={newItem[f.key] ?? ""}
                onChange={(v) => setNewItem((i) => ({ ...i, [f.key]: v }))}
                rows={f.rows}
                type={f.type}
              />
            ))}
          </div>
          <div className="ad-add-form__actions">
            <button
              className="ad-btn ad-btn--ghost"
              onClick={() => {
                setAdding(null);
                setNewItem({});
              }}
            >
              Cancel
            </button>
            <button
              className="ad-btn ad-btn--primary"
              onClick={() => handleAddArr(arr, { ...defaults, ...newItem })}
              disabled={saving}
            >
              {saving ? "Saving…" : "Add"}
            </button>
          </div>
        </div>
      ) : (
        <button
          className="ad-btn ad-btn--add"
          onClick={() => {
            setAdding(arr);
            setNewItem({});
          }}
        >
          + Add {label}
        </button>
      )}
    </div>
  );

  return (
    <div className="ad-editor">
      {/* Tab bar */}
      <div className="ad-about-tabs">
        {TABS.map((t) => (
          <button
            key={t.key}
            className={`ad-about-tab ${activeTab === t.key ? "active" : ""}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Hero & Mission */}
      {activeTab === "hero" && (
        <>
          <div className="ad-editor__section-title">Hero</div>
          <div className="ad-editor__grid ad-editor__grid--2">
            <Field
              label="Hero Title"
              value={data.heroTitle || ""}
              onChange={set("heroTitle")}
            />
            <Field
              label="Hero Subtitle"
              value={data.heroSub || ""}
              onChange={set("heroSub")}
              rows={2}
            />
          </div>
          <div className="ad-editor__section-title" style={{ marginTop: 24 }}>
            Mission Section
          </div>
          <Field
            label="Mission Title"
            value={data.missionTitle || ""}
            onChange={set("missionTitle")}
            full
          />
          <div
            className="ad-editor__grid ad-editor__grid--2"
            style={{ marginTop: 12 }}
          >
            <Field
              label="Paragraph 1"
              value={data.missionBody1 || ""}
              onChange={set("missionBody1")}
              rows={4}
            />
            <Field
              label="Paragraph 2"
              value={data.missionBody2 || ""}
              onChange={set("missionBody2")}
              rows={4}
            />
          </div>
          <SaveBar
            saving={saving}
            dirty={dirty}
            onSave={handleSave}
            onCancel={() => {
              load();
              setDirty(false);
            }}
          />
        </>
      )}

      {/* Stats */}
      {activeTab === "stats" &&
        renderArray(
          "stats",
          [
            { key: "num", label: "Number (e.g. 50K+)" },
            { key: "label", label: "Label" },
          ],
          { num: "", label: "" },
          "Stat",
        )}

      {/* Values */}
      {activeTab === "values" &&
        renderArray(
          "values",
          [
            { key: "icon", label: "Icon (emoji)" },
            { key: "title", label: "Title" },
            { key: "desc", label: "Description", rows: 3 },
          ],
          { icon: "⭐", title: "", desc: "" },
          "Value",
        )}

      {/* Timeline */}
      {activeTab === "timeline" &&
        renderArray(
          "timeline",
          [
            { key: "year", label: "Year" },
            { key: "title", label: "Title" },
            { key: "desc", label: "Description", rows: 3 },
          ],
          { year: "", title: "", desc: "" },
          "Milestone",
        )}

      {/* Team */}
      {activeTab === "team" &&
        renderArray(
          "team",
          [
            { key: "name", label: "Name" },
            { key: "role", label: "Role" },
            { key: "avatar", label: "Avatar initial" },
            { key: "bg", label: "Background color", type: "color" },
          ],
          { name: "", role: "", avatar: "A", bg: "#FDE8C8" },
          "Team Member",
        )}

      {/* CTA */}
      {activeTab === "cta" && (
        <>
          <div className="ad-editor__section-title">Call to Action</div>
          <div className="ad-editor__grid ad-editor__grid--2">
            <Field
              label="CTA Title"
              value={data.ctaTitle || ""}
              onChange={set("ctaTitle")}
            />
            <Field
              label="CTA Subtitle"
              value={data.ctaSub || ""}
              onChange={set("ctaSub")}
              rows={2}
            />
          </div>
          <SaveBar
            saving={saving}
            dirty={dirty}
            onSave={handleSave}
            onCancel={() => {
              load();
              setDirty(false);
            }}
          />
        </>
      )}
    </div>
  );
}

/* ─── SECTION CONFIGS ─── */
const SECTION_CONFIG = {
  stats: {
    fields: [
      { key: "num", label: "Number" },
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
      { key: "count", label: "Count" },
    ],
    defaults: { emoji: "📦", name: "", count: "" },
  },
  products: {
    fields: [
      { key: "image", label: "Image URL" },
      { key: "title", label: "Title" },
      { key: "cat", label: "Category" },
      { key: "price", label: "Price" },
      { key: "oldPrice", label: "Old price" },
      { key: "tagLabel", label: "Tag label" },
      { key: "stars", label: "Stars" },
      { key: "reviews", label: "Reviews" },
      { key: "bg", label: "BG color", type: "color" },
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
      { key: "name", label: "Name" },
      { key: "role", label: "Role" },
      { key: "avatar", label: "Avatar emoji" },
      { key: "text", label: "Text", rows: 4 },
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
  const { content, loading, error } = useSite();
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

  return (
    <div className="ad-root">
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
          <a href="/pos" className="ad-sidebar__ext-link">
            🖥️ POS Terminal
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
          {/* Landing page sections — need content loaded */}
          {[
            "hero",
            "stats",
            "features",
            "categories",
            "products",
            "testimonials",
            "promo",
          ].includes(activeSection) &&
            (loading ? (
              <div className="ad-loading">
                <div className="ad-loading__spinner" />
                <p>Loading content…</p>
              </div>
            ) : error ? (
              <div className="ad-error">
                <div className="ad-error__icon">⚠️</div>
                <h2>Could not load content</h2>
                <p>{error}</p>
              </div>
            ) : content ? (
              <>
                {activeSection === "hero" && (
                  <HeroEditor showToast={showToast} />
                )}
                {activeSection === "promo" && (
                  <PromoEditor showToast={showToast} />
                )}
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
              </>
            ) : null)}

          {/* Contact & About — independent of SiteContext */}
          {activeSection === "contact" && (
            <ContactEditor showToast={showToast} />
          )}
          {activeSection === "about" && <AboutEditor showToast={showToast} />}
        </div>
      </main>

      <Toast msg={toast.msg} type={toast.type} />
    </div>
  );
}
