import { useState, useEffect } from "react";
import "./AdminOrders.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const ORDERS_API = `${API_BASE}/api/orders`;

const STATUS_FLOW = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_META = {
  pending: { label: "Pending", emoji: "🕐", color: "#F39C12" },
  confirmed: { label: "Confirmed", emoji: "✅", color: "#27AE60" },
  processing: { label: "Processing", emoji: "⚙️", color: "#2980B9" },
  shipped: { label: "Shipped", emoji: "🚚", color: "#8E44AD" },
  delivered: { label: "Delivered", emoji: "📦", color: "#27AE60" },
  cancelled: { label: "Cancelled", emoji: "❌", color: "#E53935" },
};

const PAYMENT_META = {
  pending: { label: "Pending", color: "#F39C12" },
  paid: { label: "Paid", color: "#27AE60" },
  failed: { label: "Failed", color: "#E53935" },
};

function StatusBadge({ status }) {
  const m = STATUS_META[status] || { label: status, emoji: "", color: "#888" };
  return (
    <span className="ao-badge" style={{ "--badge-color": m.color }}>
      {m.emoji} {m.label}
    </span>
  );
}

function PaymentBadge({ status }) {
  const m = PAYMENT_META[status] || { label: status, color: "#888" };
  return (
    <span
      className="ao-badge ao-badge--sm"
      style={{ "--badge-color": m.color }}
    >
      {m.label}
    </span>
  );
}

/* ─── ORDER DETAIL MODAL ─── */
function OrderDetail({
  order,
  onClose,
  onStatusChange,
  onPaymentChange,
  saving,
}) {
  const imgSrc = (url) =>
    !url ? null : url.startsWith("http") ? url : `${API_BASE}${url}`;

  return (
    <div className="ao-modal-overlay" onClick={onClose}>
      <div className="ao-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ao-modal__header">
          <div>
            <h2 className="ao-modal__title">Order #{order.orderNumber}</h2>
            <p className="ao-modal__date">
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <button className="ao-modal__close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="ao-modal__body">
          {/* Status controls */}
          <div className="ao-modal__section">
            <div className="ao-modal__section-title">Order Status</div>
            <div className="ao-status-flow">
              {STATUS_FLOW.filter((s) => s !== "cancelled").map((s) => (
                <button
                  key={s}
                  className={`ao-status-step ${order.status === s ? "ao-status-step--active" : ""} ${STATUS_FLOW.indexOf(s) < STATUS_FLOW.indexOf(order.status) ? "ao-status-step--done" : ""}`}
                  onClick={() => onStatusChange(s)}
                  disabled={saving || order.status === "cancelled"}
                >
                  {STATUS_META[s].emoji} {STATUS_META[s].label}
                </button>
              ))}
              <button
                className={`ao-status-step ao-status-step--cancel ${order.status === "cancelled" ? "ao-status-step--active" : ""}`}
                onClick={() => onStatusChange("cancelled")}
                disabled={saving || order.status === "delivered"}
              >
                ❌ Cancel
              </button>
            </div>
          </div>

          {/* Payment status */}
          <div className="ao-modal__section">
            <div className="ao-modal__section-title">Payment</div>
            <div className="ao-modal__row">
              <span className="ao-modal__label">Method</span>
              <span>
                {order.paymentMethod === "cod"
                  ? "🚚 Cash on Delivery"
                  : "💳 Card"}
              </span>
            </div>
            <div className="ao-modal__row">
              <span className="ao-modal__label">Status</span>
              <div className="ao-payment-btns">
                {["pending", "paid", "failed"].map((s) => (
                  <button
                    key={s}
                    className={`ao-pay-btn ${order.paymentStatus === s ? "ao-pay-btn--active" : ""}`}
                    onClick={() => onPaymentChange(s)}
                    disabled={saving}
                  >
                    {PAYMENT_META[s].label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Customer */}
          <div className="ao-modal__section">
            <div className="ao-modal__section-title">Customer</div>
            <div className="ao-modal__row">
              <span className="ao-modal__label">Name</span>
              <span>
                {order.customer.firstName} {order.customer.lastName}
              </span>
            </div>
            <div className="ao-modal__row">
              <span className="ao-modal__label">Email</span>
              <span>{order.customer.email}</span>
            </div>
            <div className="ao-modal__row">
              <span className="ao-modal__label">Phone</span>
              <span>{order.customer.phone}</span>
            </div>
            <div className="ao-modal__row">
              <span className="ao-modal__label">Address</span>
              <span>
                {order.customer.address}, {order.customer.city}
                {order.customer.province
                  ? `, ${order.customer.province}`
                  : ""}, {order.customer.country}
              </span>
            </div>
            {order.customer.notes && (
              <div className="ao-modal__row">
                <span className="ao-modal__label">Notes</span>
                <span>{order.customer.notes}</span>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="ao-modal__section">
            <div className="ao-modal__section-title">Items</div>
            <div className="ao-modal__items">
              {order.items.map((item, i) => (
                <div key={i} className="ao-modal__item">
                  <div className="ao-modal__item-img">
                    {item.image ? (
                      <img src={imgSrc(item.image)} alt={item.title} />
                    ) : (
                      "🛍️"
                    )}
                  </div>
                  <div className="ao-modal__item-info">
                    <div className="ao-modal__item-title">{item.title}</div>
                    <div className="ao-modal__item-cat">{item.category}</div>
                  </div>
                  <div className="ao-modal__item-right">
                    <div className="ao-modal__item-qty">× {item.qty}</div>
                    <div className="ao-modal__item-price">
                      ${(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="ao-modal__section ao-modal__totals">
            <div className="ao-modal__row">
              <span>Subtotal</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="ao-modal__row">
              <span>Shipping</span>
              <span>${order.shippingFee.toFixed(2)}</span>
            </div>
            {order.discount > 0 && (
              <div className="ao-modal__row ao-modal__row--discount">
                <span>Discount</span>
                <span>−${order.discount.toFixed(2)}</span>
              </div>
            )}
            <div className="ao-modal__row ao-modal__row--total">
              <span>Total</span>
              <span>${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── ROOT ─── */
export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState(null);
  const [toast, setToast] = useState({ msg: "", type: "success" });
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState({});
  const LIMIT = 15;

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: "", type: "success" }), 3000);
  };

  const load = async (p = 1, s = "", st = "all") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: p, limit: LIMIT });
      if (s) params.set("search", s);
      if (st !== "all") params.set("status", st);
      const res = await fetch(`${ORDERS_API}?${params}`);
      const data = await res.json();
      setOrders(data.orders || []);
      setTotal(data.total || 0);
      // Build counts map
      const map = {};
      (data.statusCounts || []).forEach(({ _id, count }) => {
        map[_id] = count;
      });
      setCounts(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(page, search, status);
  }, [page, search, status]);

  const updateOrder = async (id, patch) => {
    setSaving(true);
    try {
      const res = await fetch(`${ORDERS_API}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error("Update failed");
      const updated = await res.json();
      setOrders((prev) => prev.map((o) => (o._id === id ? updated : o)));
      setSelected(updated);
      showToast("Order updated!");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const deleteOrder = async (id) => {
    if (!window.confirm("Delete this order?")) return;
    setSaving(true);
    try {
      await fetch(`${ORDERS_API}/${id}`, { method: "DELETE" });
      setOrders((prev) => prev.filter((o) => o._id !== id));
      setTotal((t) => t - 1);
      showToast("Order deleted!");
    } catch (e) {
      showToast(e.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const pages = Math.ceil(total / LIMIT);
  const totalRevenue = orders.reduce(
    (s, o) => s + (o.paymentStatus === "paid" ? o.total : 0),
    0,
  );

  return (
    <div className="ao-root">
      {/* Header */}
      <div className="ao-header">
        <div>
          <h1 className="ao-header__title">📋 Orders</h1>
          <p className="ao-header__sub">{total} total orders</p>
        </div>
        <div className="ao-header__stats">
          <div className="ao-stat">
            <div className="ao-stat__num">{total}</div>
            <div className="ao-stat__label">Total Orders</div>
          </div>
          <div className="ao-stat">
            <div className="ao-stat__num">{counts["pending"] || 0}</div>
            <div className="ao-stat__label">Pending</div>
          </div>
          <div className="ao-stat">
            <div className="ao-stat__num">${totalRevenue.toFixed(0)}</div>
            <div className="ao-stat__label">Revenue (paid)</div>
          </div>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="ao-tabs">
        {["all", ...STATUS_FLOW].map((s) => (
          <button
            key={s}
            className={`ao-tab ${status === s ? "ao-tab--active" : ""}`}
            onClick={() => {
              setStatus(s);
              setPage(1);
            }}
          >
            {s === "all"
              ? "All"
              : `${STATUS_META[s].emoji} ${STATUS_META[s].label}`}
            {s !== "all" && counts[s] ? (
              <span className="ao-tab__count">{counts[s]}</span>
            ) : null}
            {s === "all" && <span className="ao-tab__count">{total}</span>}
          </button>
        ))}
      </div>

      {/* Search toolbar */}
      <div className="ao-toolbar">
        <div className="ao-search">
          <span>🔍</span>
          <input
            type="text"
            placeholder="Search order # or customer…"
            className="ao-search__input"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="ao-loading">
          <div className="ao-loading__spinner" />
          <p>Loading orders…</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="ao-empty">
          <div className="ao-empty__icon">📋</div>
          <p>No orders found</p>
        </div>
      ) : (
        <div className="ao-table-wrap">
          <table className="ao-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Date</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order._id}
                  onClick={() => setSelected(order)}
                  className="ao-table__row"
                >
                  <td>
                    <span className="ao-order-num">{order.orderNumber}</span>
                  </td>
                  <td>
                    <div className="ao-customer">
                      <div className="ao-customer__name">
                        {order.customer.firstName} {order.customer.lastName}
                      </div>
                      <div className="ao-customer__email">
                        {order.customer.email}
                      </div>
                    </div>
                  </td>
                  <td className="ao-date">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="ao-items-count">
                    {order.items.length} item
                    {order.items.length !== 1 ? "s" : ""}
                  </td>
                  <td>
                    <span className="ao-total">${order.total.toFixed(2)}</span>
                  </td>
                  <td>
                    <PaymentBadge status={order.paymentStatus} />
                  </td>
                  <td>
                    <StatusBadge status={order.status} />
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="ao-table__actions">
                      <button
                        className="ao-btn ao-btn--sm ao-btn--ghost"
                        onClick={() => setSelected(order)}
                      >
                        View
                      </button>
                      <button
                        className="ao-btn ao-btn--sm ao-btn--danger-ghost"
                        onClick={() => deleteOrder(order._id)}
                      >
                        🗑️
                      </button>
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
        <div className="ao-pagination">
          <button
            className="ao-btn ao-btn--sm ao-btn--ghost"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            ← Prev
          </button>
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              className={`ao-btn ao-btn--sm ${p === page ? "ao-btn--primary" : "ao-btn--ghost"}`}
              onClick={() => setPage(p)}
            >
              {p}
            </button>
          ))}
          <button
            className="ao-btn ao-btn--sm ao-btn--ghost"
            disabled={page === pages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next →
          </button>
        </div>
      )}

      {/* Order detail modal */}
      {selected && (
        <OrderDetail
          order={selected}
          onClose={() => setSelected(null)}
          onStatusChange={(s) => updateOrder(selected._id, { status: s })}
          onPaymentChange={(s) =>
            updateOrder(selected._id, { paymentStatus: s })
          }
          saving={saving}
        />
      )}

      {/* Toast */}
      {toast.msg && (
        <div className={`ao-toast ao-toast--${toast.type}`}>{toast.msg}</div>
      )}
    </div>
  );
}
