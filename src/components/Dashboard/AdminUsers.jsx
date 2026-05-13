import { useState, useEffect } from "react";
import { useAuth } from "../Auth/AuthContext";
import "./AdminUsers.css";

const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace("/api/content", "")
  : "http://localhost:5000";
const USERS_API = `${API_BASE}/api/users`;

const EMPTY_FORM = { name: "", email: "", password: "" };

function UserForm({ initial = EMPTY_FORM, onSave, onCancel, saving, isEdit }) {
  const [form, setForm] = useState(initial);
  const [showPw, setShowPw] = useState(false);
  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="au-form">
      <div className="au-form__grid">
        <div className="au-field">
          <label className="au-field__label">Full Name *</label>
          <input
            className="au-field__input"
            value={form.name}
            onChange={(e) => set("name")(e.target.value)}
            placeholder="Ayesha Perera"
          />
        </div>
        <div className="au-field">
          <label className="au-field__label">Email *</label>
          <input
            className="au-field__input"
            type="email"
            value={form.email}
            onChange={(e) => set("email")(e.target.value)}
            placeholder="ayesha@buybee.com"
          />
        </div>
        <div className="au-field au-field--full">
          <label className="au-field__label">
            {isEdit
              ? "New Password (leave blank to keep current)"
              : "Password *"}
          </label>
          <div className="au-field__pass-wrap">
            <input
              className="au-field__input"
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={(e) => set("password")(e.target.value)}
              placeholder="Min 6 characters"
            />
            <button
              type="button"
              className="au-field__eye"
              onClick={() => setShowPw((s) => !s)}
            >
              {showPw ? "🙈" : "👁️"}
            </button>
          </div>
        </div>
      </div>
      <div className="au-form__actions">
        <button className="au-btn au-btn--ghost" onClick={onCancel}>
          Cancel
        </button>
        <button
          className="au-btn au-btn--primary"
          onClick={() => onSave(form)}
          disabled={saving}
        >
          {saving ? "Saving…" : isEdit ? "Update User" : "Create User"}
        </button>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { user: me, authFetch } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState("list");
  const [editing, setEditing] = useState(null);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "success" });

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const load = async () => {
    setLoading(true);
    try {
      const res = await authFetch(USERS_API);
      const data = await res.json();
      if (res.ok) setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []); // eslint-disable-next-line react-hooks/exhaustive-deps

  const handleSave = async (form) => {
    if (!form.name || !form.email) {
      showToast("Name and email are required", "error");
      return;
    }
    if (!editing && !form.password) {
      showToast("Password is required", "error");
      return;
    }
    setSaving(true);
    try {
      const body = { name: form.name, email: form.email };
      if (form.password) body.password = form.password;
      const url = editing ? `${USERS_API}/${editing._id}` : USERS_API;
      const method = editing ? "PATCH" : "POST";
      const res = await authFetch(url, { method, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      showToast(editing ? "User updated!" : "User created!");
      setView("list");
      setEditing(null);
      load();
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true);
    try {
      const res = await authFetch(`${USERS_API}/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setConfirm(null);
      showToast("User deleted");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="au-root">
      <div className="au-header">
        <div>
          <h1 className="au-header__title">👥 Admin Users</h1>
          <p className="au-header__sub">
            {users.length} user{users.length !== 1 ? "s" : ""}
          </p>
        </div>
        {view === "list" ? (
          <button
            className="au-btn au-btn--primary"
            onClick={() => {
              setEditing(null);
              setView("add");
            }}
          >
            + Add User
          </button>
        ) : (
          <button
            className="au-btn au-btn--ghost"
            onClick={() => {
              setView("list");
              setEditing(null);
            }}
          >
            ← Back
          </button>
        )}
      </div>

      {view !== "list" && (
        <div className="au-form-wrap">
          <h2 className="au-form-wrap__title">
            {editing ? "Edit User" : "New User"}
          </h2>
          <UserForm
            initial={editing ? { ...editing, password: "" } : EMPTY_FORM}
            onSave={handleSave}
            onCancel={() => {
              setView("list");
              setEditing(null);
            }}
            saving={saving}
            isEdit={!!editing}
          />
        </div>
      )}

      {view === "list" &&
        (loading ? (
          <div className="au-loading">
            <div className="au-loading__spinner" />
            <p>Loading…</p>
          </div>
        ) : users.length === 0 ? (
          <div className="au-empty">
            <div className="au-empty__icon">👤</div>
            <p>No users yet. Add your first admin user.</p>
          </div>
        ) : (
          <div className="au-table-wrap">
            <table className="au-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Created</th>
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div className="au-user-cell">
                        <div className="au-avatar">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="au-user-name">{u.name}</span>
                        {u._id === me?._id && (
                          <span className="au-you">you</span>
                        )}
                      </div>
                    </td>
                    <td className="au-email">{u.email}</td>
                    <td className="au-date">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="au-date">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleDateString()
                        : "—"}
                    </td>
                    <td>
                      <div className="au-table__actions">
                        <button
                          className="au-btn au-btn--sm au-btn--ghost"
                          onClick={() => {
                            setEditing(u);
                            setView("edit");
                          }}
                        >
                          ✏️ Edit
                        </button>
                        {u._id !== me?._id &&
                          (confirm === u._id ? (
                            <>
                              <span className="au-confirm-msg">Delete?</span>
                              <button
                                className="au-btn au-btn--sm au-btn--danger"
                                onClick={() => handleDelete(u._id)}
                                disabled={saving}
                              >
                                Yes
                              </button>
                              <button
                                className="au-btn au-btn--sm au-btn--ghost"
                                onClick={() => setConfirm(null)}
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <button
                              className="au-btn au-btn--sm au-btn--danger-ghost"
                              onClick={() => setConfirm(u._id)}
                            >
                              🗑️
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}

      {toast.msg && (
        <div className={`au-toast au-toast--${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
