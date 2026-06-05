import { useState, useEffect, useRef, useCallback } from "react";
import { useCurrency } from "../Currency/CurrencyContext";
import "./POSApp.css";
import CurrencySwitcher from "../Currency/CurrencySwitcher";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const imgSrc = (url) =>
  !url ? null : url.startsWith("http") ? url : `${API_BASE}${url}`;
const getToken = () => localStorage.getItem("bb_token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

/* ════════════════════════════════════════
   INVENTORY SIDEBAR
   ════════════════════════════════════════ */
function InventorySidebar({ products, fmt, onClose }) {
  const [filter, setFilter] = useState("all"); // all | low | oos
  const [search, setSearch] = useState("");

  const filtered = products
    .filter((p) => {
      if (filter === "oos") return p.stock === 0;
      if (filter === "low") return p.stock > 0 && p.stock <= 10;
      return true;
    })
    .filter(
      (p) => !search || p.title.toLowerCase().includes(search.toLowerCase()),
    );

  const oosCount = products.filter((p) => p.stock === 0).length;
  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;

  return (
    <div className="pos-inv">
      <div className="pos-inv__header">
        <span className="pos-inv__title">📦 Inventory</span>
        <button className="pos-inv__close" onClick={onClose}>
          ✕
        </button>
      </div>

      {/* Filter tabs */}
      <div className="pos-inv__filters">
        <button
          className={`pos-inv__filter ${filter === "all" ? "active" : ""}`}
          onClick={() => setFilter("all")}
        >
          All <span className="pos-inv__filter-count">{products.length}</span>
        </button>
        <button
          className={`pos-inv__filter pos-inv__filter--low ${filter === "low" ? "active" : ""}`}
          onClick={() => setFilter("low")}
        >
          Low <span className="pos-inv__filter-count">{lowCount}</span>
        </button>
        <button
          className={`pos-inv__filter pos-inv__filter--oos ${filter === "oos" ? "active" : ""}`}
          onClick={() => setFilter("oos")}
        >
          Out <span className="pos-inv__filter-count">{oosCount}</span>
        </button>
      </div>

      {/* Search */}
      <div className="pos-inv__search">
        <span>🔍</span>
        <input
          type="text"
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pos-inv__search-input"
        />
        {search && (
          <button
            className="pos-inv__search-clear"
            onClick={() => setSearch("")}
          >
            ✕
          </button>
        )}
      </div>

      {/* List */}
      <div className="pos-inv__list">
        {filtered.length === 0 ? (
          <div className="pos-inv__empty">No products found</div>
        ) : (
          filtered.map((p) => {
            const oos = p.stock === 0;
            const low = p.stock > 0 && p.stock <= 10;
            return (
              <div
                key={p._id}
                className={`pos-inv__item ${oos ? "pos-inv__item--oos" : low ? "pos-inv__item--low" : ""}`}
              >
                <div
                  className="pos-inv__item-img"
                  style={{ background: p.bg || "#FDE8C8" }}
                >
                  {p.image ? <img src={imgSrc(p.image)} alt={p.title} /> : "🛍️"}
                </div>
                <div className="pos-inv__item-info">
                  <div className="pos-inv__item-name">{p.title}</div>
                  <div className="pos-inv__item-price">{fmt(p.price)}</div>
                </div>
                <div
                  className={`pos-inv__item-stock ${oos ? "pos-inv__item-stock--oos" : low ? "pos-inv__item-stock--low" : ""}`}
                >
                  {oos ? "OUT" : p.stock}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   HELD BILLS MODAL
   ════════════════════════════════════════ */
function HeldBillsModal({ heldBills, onResume, onDelete, onClose, fmt }) {
  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal pos-modal--held">
        <div className="pos-modal__header">
          <h2>📋 Held Bills ({heldBills.length})</h2>
          <button
            className="pos-btn pos-btn--ghost pos-btn--icon"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="pos-modal__body">
          {heldBills.length === 0 ? (
            <div className="pos-held-empty">
              <div style={{ fontSize: "2rem" }}>📋</div>
              <p>No held bills</p>
            </div>
          ) : (
            <div className="pos-held-list">
              {heldBills.map((bill) => (
                <div key={bill.id} className="pos-held-item">
                  <div className="pos-held-item__info">
                    <div className="pos-held-item__name">
                      {bill.label || `Bill #${bill.id}`}
                    </div>
                    <div className="pos-held-item__meta">
                      {bill.items.reduce((s, i) => s + i.qty, 0)} items
                      &nbsp;·&nbsp;
                      {new Date(bill.heldAt).toLocaleTimeString()}
                    </div>
                    <div className="pos-held-item__products">
                      {bill.items
                        .slice(0, 3)
                        .map((i) => i.title)
                        .join(", ")}
                      {bill.items.length > 3 &&
                        ` +${bill.items.length - 3} more`}
                    </div>
                  </div>
                  <div className="pos-held-item__total">
                    {fmt(bill.items.reduce((s, i) => s + i.price * i.qty, 0))}
                  </div>
                  <div className="pos-held-item__actions">
                    <button
                      className="pos-btn pos-btn--primary pos-btn--sm"
                      onClick={() => onResume(bill.id)}
                    >
                      ↩ Resume
                    </button>
                    <button
                      className="pos-btn pos-btn--danger-ghost pos-btn--sm"
                      onClick={() => onDelete(bill.id)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   RECEIPT
   ════════════════════════════════════════ */
function Receipt({ sale, session, onClose, fmt }) {
  const printRef = useRef(null);
  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);
    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt</title>
<style>*{margin:0;padding:0;box-sizing:border-box;}body{font-family:'Courier New',monospace;font-size:12px;width:300px;padding:12px;color:#000;}
.r-header{text-align:center;border-bottom:1px dashed #000;padding-bottom:8px;margin-bottom:8px;}
.r-logo{font-size:16px;font-weight:bold;margin-bottom:2px;}.r-sub{font-size:10px;color:#555;margin-bottom:1px;}
.r-row{display:flex;justify-content:space-between;margin:3px 0;font-size:12px;}
.r-divider{border-top:1px dashed #000;margin:6px 0;}.r-total{font-weight:bold;font-size:14px;margin:4px 0;}
.r-change{background:#f0f0f0;padding:5px 8px;text-align:center;margin:6px 0;border-radius:4px;font-weight:bold;font-size:13px;}
.r-footer{text-align:center;margin-top:10px;font-size:10px;color:#555;}
.r-item-name{max-width:180px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
@media print{body{width:100%;}@page{margin:0;size:80mm auto;}}</style></head><body>${content}</body></html>`);
    doc.close();
    iframe.contentWindow.focus();
    setTimeout(() => {
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    }, 300);
  };
  const o = sale.order;
  const now = new Date();
  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal pos-modal--receipt">
        <div className="pos-modal__header">
          <h2>Receipt</h2>
          <div className="pos-modal__header-actions">
            <button className="pos-btn pos-btn--primary" onClick={handlePrint}>
              🖨️ Print
            </button>
            <button className="pos-btn pos-btn--ghost" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>
        <div ref={printRef} style={{ padding: "10px" }}>
          <div className="r-header">
            <div className="r-logo">🐝 BuyBee</div>
            <div className="r-sub">Point of Sale Receipt</div>
            <div className="r-sub">{now.toLocaleString()}</div>
            <div className="r-sub">Operator: {session?.operator}</div>
            <div className="r-sub">Order: {o.orderNumber}</div>
          </div>
          <div style={{ marginBottom: 8 }}>
            {o.items.map((item, i) => (
              <div key={i} className="r-row">
                <span className="r-item-name">
                  {item.title} ×{item.qty}
                </span>
                <span>{fmt(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="r-divider" />
          <div className="r-row">
            <span>Subtotal</span>
            <span>{fmt(o.subtotal)}</span>
          </div>
          {o.discount > 0 && (
            <div className="r-row">
              <span>Discount</span>
              <span>-{fmt(o.discount)}</span>
            </div>
          )}
          <div className="r-row r-total">
            <span>TOTAL</span>
            <span>{fmt(o.total)}</span>
          </div>
          <div className="r-row">
            <span>Payment</span>
            <span>{o.paymentMethod === "cod" ? "Cash" : "Card"}</span>
          </div>
          {sale.amountPaid > 0 && (
            <div className="r-row">
              <span>Amount Given</span>
              <span>{fmt(sale.amountPaid)}</span>
            </div>
          )}
          {sale.change > 0 && (
            <div className="r-change">Change: {fmt(sale.change)}</div>
          )}
          <div className="r-divider" />
          <div className="r-footer">
            <p>Thank you for shopping at BuyBee!</p>
            <p>buybee.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   SHIFT MODAL
   ════════════════════════════════════════ */
function ShiftModal({
  session,
  onOpen,
  onClose,
  onCashMovement,
  onCloseShift,
  fmt,
}) {
  const [openingCash, setOpeningCash] = useState("");
  const [cashType, setCashType] = useState("in");
  const [cashAmount, setCashAmount] = useState("");
  const [cashNote, setCashNote] = useState("");
  const [closingCash, setClosingCash] = useState("");
  const [tab, setTab] = useState(session ? "status" : "open");
  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal">
        <div className="pos-modal__header">
          <h2>💼 Shift Management</h2>
          <button
            className="pos-btn pos-btn--ghost pos-btn--icon"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="pos-modal__tabs">
          {session && (
            <button
              className={`pos-modal__tab ${tab === "status" ? "active" : ""}`}
              onClick={() => setTab("status")}
            >
              Status
            </button>
          )}
          {!session && (
            <button
              className={`pos-modal__tab ${tab === "open" ? "active" : ""}`}
              onClick={() => setTab("open")}
            >
              Open Shift
            </button>
          )}
          {session && (
            <button
              className={`pos-modal__tab ${tab === "cash" ? "active" : ""}`}
              onClick={() => setTab("cash")}
            >
              Cash
            </button>
          )}
          {session && (
            <button
              className={`pos-modal__tab ${tab === "close" ? "active" : ""}`}
              onClick={() => setTab("close")}
            >
              Close Shift
            </button>
          )}
        </div>
        <div className="pos-modal__body">
          {tab === "status" && session && (
            <div className="shift-status">
              {[
                ["Operator", session.operator],
                ["Terminal", session.terminal],
                ["Opened", new Date(session.openedAt).toLocaleTimeString()],
                ["Sales", fmt(session.totalSales)],
                ["Orders", session.totalOrders],
                ["Cash", fmt(session.totalCash)],
                ["Card", fmt(session.totalCard)],
              ].map(([k, v]) => (
                <div key={k} className="shift-status__row">
                  <span>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
              <div className="shift-status__row shift-status__row--highlight">
                <span>Expected Cash</span>
                <strong>{fmt(session.expectedCash)}</strong>
              </div>
            </div>
          )}
          {tab === "open" && !session && (
            <div className="shift-form">
              <div className="pos-field">
                <label>Opening Cash</label>
                <input
                  type="number"
                  value={openingCash}
                  onChange={(e) => setOpeningCash(e.target.value)}
                  placeholder="0.00"
                  className="pos-input"
                />
              </div>
              <button
                className="pos-btn pos-btn--primary pos-btn--full"
                onClick={() => onOpen(openingCash)}
              >
                Open Shift
              </button>
            </div>
          )}
          {tab === "cash" && session && (
            <div className="shift-form">
              <div className="pos-field">
                <label>Type</label>
                <div className="pos-toggle-group">
                  <button
                    className={`pos-toggle ${cashType === "in" ? "active" : ""}`}
                    onClick={() => setCashType("in")}
                  >
                    Cash In
                  </button>
                  <button
                    className={`pos-toggle ${cashType === "out" ? "active" : ""}`}
                    onClick={() => setCashType("out")}
                  >
                    Cash Out
                  </button>
                </div>
              </div>
              <div className="pos-field">
                <label>Amount</label>
                <input
                  type="number"
                  value={cashAmount}
                  onChange={(e) => setCashAmount(e.target.value)}
                  placeholder="0.00"
                  className="pos-input"
                />
              </div>
              <div className="pos-field">
                <label>Note</label>
                <input
                  type="text"
                  value={cashNote}
                  onChange={(e) => setCashNote(e.target.value)}
                  placeholder="Reason..."
                  className="pos-input"
                />
              </div>
              <button
                className="pos-btn pos-btn--primary pos-btn--full"
                onClick={() => {
                  onCashMovement(cashType, cashAmount, cashNote);
                  setCashAmount("");
                  setCashNote("");
                }}
              >
                Record Movement
              </button>
              <div className="cash-movements">
                <div className="cash-movements__title">Today's movements</div>
                {session.cashMovements.map((m, i) => (
                  <div key={i} className="cash-movement">
                    <span
                      className={`cash-movement__type cash-movement__type--${m.type}`}
                    >
                      {m.type}
                    </span>
                    <span className="cash-movement__note">{m.note || "—"}</span>
                    <span className="cash-movement__amount">
                      {fmt(m.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "close" && session && (
            <div className="shift-form">
              <div className="shift-status">
                <div className="shift-status__row">
                  <span>Expected Cash</span>
                  <strong>{fmt(session.expectedCash)}</strong>
                </div>
              </div>
              <div className="pos-field">
                <label>Counted Cash</label>
                <input
                  type="number"
                  value={closingCash}
                  onChange={(e) => setClosingCash(e.target.value)}
                  placeholder="0.00"
                  className="pos-input"
                />
              </div>
              {closingCash && (
                <div
                  className={`shift-difference ${Number(closingCash) - session.expectedCash >= 0 ? "positive" : "negative"}`}
                >
                  Difference: {fmt(Number(closingCash) - session.expectedCash)}
                </div>
              )}
              <button
                className="pos-btn pos-btn--danger pos-btn--full"
                onClick={() => onCloseShift(closingCash)}
              >
                Close Shift
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   CUSTOMER DISPLAY
   ════════════════════════════════════════ */
function CustomerDisplay({ cart, total, lastSale, fmt }) {
  return (
    <div className="customer-display">
      <div className="customer-display__header">
        <div className="customer-display__logo">🐝 BuyBee</div>
        <div className="customer-display__sub">
          Thank you for shopping with us
        </div>
      </div>
      {lastSale ? (
        <div className="customer-display__complete">
          <div className="customer-display__check">✓</div>
          <div className="customer-display__complete-title">Sale Complete!</div>
          <div className="customer-display__complete-total">
            {fmt(lastSale.order.total)}
          </div>
          {lastSale.change > 0 && (
            <div className="customer-display__change">
              Change: {fmt(lastSale.change)}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="customer-display__items">
            {cart.map((item, i) => (
              <div key={i} className="customer-display__item">
                <span>
                  {item.title} ×{item.qty}
                </span>
                <span>{fmt(item.price * item.qty)}</span>
              </div>
            ))}
          </div>
          <div className="customer-display__total">
            <span>Total</span>
            <span>{fmt(total)}</span>
          </div>
        </>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   CHECKOUT MODAL
   ════════════════════════════════════════ */
function CheckoutModal({ cart, subtotalUSD, onSale, onClose, saving }) {
  const { selectedCurrency, format, currencies } = useCurrency();
  const [payMethod, setPayMethod] = useState("cash");
  const [discount, setDiscount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [note, setNote] = useState("");

  if (!currencies || currencies.length === 0) {
    return (
      <div className="pos-modal-overlay">
        <div
          className="pos-modal"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 200,
          }}
        >
          <div className="ap-loading__spinner" />
        </div>
      </div>
    );
  }

  const rate = selectedCurrency?.rateToUSD || 1;
  const symbol = selectedCurrency?.symbol || "$";
  const fmt = (n) => format(Number(n));

  const subtotalDisp = subtotalUSD * rate;
  const discountDisp = Math.max(0, Number(discount) || 0);
  const totalDisp = Math.max(0, subtotalDisp - discountDisp);
  const amountPaidDisp = Number(amountPaid) || 0;
  const changeDisp =
    payMethod === "cash" ? Math.max(0, amountPaidDisp - totalDisp) : 0;
  const isShort =
    payMethod === "cash" && !!amountPaid && amountPaidDisp < totalDisp;
  const fmtDisp = (n) =>
    `${symbol}${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const mag =
    totalDisp < 100
      ? 10
      : totalDisp < 1000
        ? 50
        : totalDisp < 10000
          ? 100
          : totalDisp < 100000
            ? 500
            : 1000;
  const quickAmounts = [
    ...new Set([
      Math.ceil(totalDisp / mag) * mag,
      Math.ceil(totalDisp / (mag * 5)) * (mag * 5),
      Math.ceil(totalDisp / (mag * 10)) * (mag * 10),
    ]),
  ].filter((a) => a > totalDisp);

  return (
    <div className="pos-modal-overlay">
      <div className="pos-modal pos-modal--checkout">
        <div className="pos-modal__header">
          <h2>💳 Checkout</h2>
          <button
            className="pos-btn pos-btn--ghost pos-btn--icon"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <div className="pos-modal__body pos-modal__body--checkout">
          <div className="checkout-left">
            <div className="pos-field">
              <label>Payment Method</label>
              <div className="pos-toggle-group">
                <button
                  className={`pos-toggle ${payMethod === "cash" ? "active" : ""}`}
                  onClick={() => setPayMethod("cash")}
                >
                  💵 Cash
                </button>
                <button
                  className={`pos-toggle ${payMethod === "card" ? "active" : ""}`}
                  onClick={() => setPayMethod("card")}
                >
                  💳 Card
                </button>
                <button
                  className={`pos-toggle ${payMethod === "other" ? "active" : ""}`}
                  onClick={() => setPayMethod("other")}
                >
                  📱 Other
                </button>
              </div>
            </div>
            <div className="pos-field">
              <label>Discount ({symbol})</label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0"
                className="pos-input"
              />
            </div>
            {payMethod === "cash" && (
              <div className="pos-field">
                <label>Amount Paid ({symbol})</label>
                <input
                  type="number"
                  min="0"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder={totalDisp.toFixed(2)}
                  className="pos-input pos-input--large"
                />
                <div className="quick-amounts">
                  {quickAmounts.map((a) => (
                    <button
                      key={a}
                      className="quick-amount"
                      onClick={() => setAmountPaid(String(a))}
                    >
                      {fmtDisp(a)}
                    </button>
                  ))}
                  <button
                    className="quick-amount quick-amount--exact"
                    onClick={() => setAmountPaid(totalDisp.toFixed(2))}
                  >
                    Exact
                  </button>
                </div>
                {amountPaid && (
                  <div
                    className={`change-display ${isShort ? "change-display--short" : "change-display--ok"}`}
                  >
                    {isShort
                      ? `Short: ${fmtDisp(totalDisp - amountPaidDisp)}`
                      : `Change: ${fmtDisp(changeDisp)}`}
                  </div>
                )}
              </div>
            )}
            <div className="pos-field">
              <label>Customer (optional)</label>
              <input
                type="text"
                value={custName}
                onChange={(e) => setCustName(e.target.value)}
                placeholder="Name"
                className="pos-input"
              />
              <input
                type="email"
                value={custEmail}
                onChange={(e) => setCustEmail(e.target.value)}
                placeholder="Email"
                className="pos-input"
                style={{ marginTop: 6 }}
              />
              <input
                type="tel"
                value={custPhone}
                onChange={(e) => setCustPhone(e.target.value)}
                placeholder="+94 77 xxx xxxx"
                className="pos-input"
                style={{ marginTop: 6 }}
              />
            </div>
            <div className="pos-field">
              <label>Note</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Order note..."
                className="pos-input"
              />
            </div>
          </div>
          <div className="checkout-right">
            <div className="checkout-summary">
              <div className="checkout-summary__title">Order Summary</div>
              {cart.map((item, i) => (
                <div key={i} className="checkout-summary__item">
                  <span>
                    {item.title} ×{item.qty}
                  </span>
                  <span>{fmtDisp(item.price * item.qty * rate)}</span>
                </div>
              ))}
              <div className="checkout-summary__divider" />
              <div className="checkout-summary__row">
                <span>Subtotal</span>
                <span>{fmtDisp(subtotalDisp)}</span>
              </div>
              {discountDisp > 0 && (
                <div className="checkout-summary__row checkout-summary__row--discount">
                  <span>Discount</span>
                  <span>-{fmtDisp(discountDisp)}</span>
                </div>
              )}
              <div className="checkout-summary__total">
                <span>TOTAL</span>
                <span>{fmtDisp(totalDisp)}</span>
              </div>
            </div>
            <button
              className="pos-btn pos-btn--sale pos-btn--full"
              disabled={saving || isShort}
              onClick={() =>
                onSale({
                  payMethod,
                  discountUSD: discountDisp / rate,
                  amountPaidUSD: amountPaidDisp / rate,
                  changeUSD: changeDisp / rate,
                  custName,
                  custEmail,
                  custPhone,
                  note,
                })
              }
            >
              {saving ? "⏳ Processing…" : `✓ Charge ${fmtDisp(totalDisp)}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN POS APP
   ════════════════════════════════════════ */
export default function POSApp() {
  const { format, selectedCurrency } = useCurrency();
  const fmt = (n) => format(Number(n));

  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [heldBills, setHeldBills] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("bb_pos_held") || "[]");
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [saving, setSaving] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null);
  const [showInv, setShowInv] = useState(false);
  const [posPage, setPosPage] = useState(1);
  const [posLimit, setPosLimit] = useState(20);
  const gridRef = useRef(null);

  // Auto-calculate how many cards fit in the visible grid area
  useEffect(() => {
    if (!gridRef.current) return;
    const calculate = () => {
      const grid = gridRef.current;
      if (!grid) return;
      const w = grid.clientWidth;
      const h = grid.clientHeight;
      const minCol = 130; // minmax(130px, 1fr)
      const gap = 10;
      const cardH = 148; // img(90) + title(~30) + price(~28)
      const cols = Math.max(1, Math.floor((w + gap) / (minCol + gap)));
      const rows = Math.max(1, Math.floor((h + gap) / (cardH + gap)));
      setPosLimit(cols * rows);
    };
    calculate();
    const ro = new ResizeObserver(calculate);
    ro.observe(gridRef.current);
    return () => ro.disconnect();
  }, []);
  const searchRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("bb_pos_held", JSON.stringify(heldBills));
  }, [heldBills]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pos/session/current`, {
        headers: authHeaders(),
      });
      setSession(await res.json());
    } catch {}
  }, []);
  const loadProducts = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/products?limit=200&sort=newest`);
      const data = await res.json();
      setProducts(data.items || []);
      setCategories([
        ...new Set((data.items || []).map((p) => p.category).filter(Boolean)),
      ]);
    } catch {}
  }, []);
  const loadSales = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/pos/sales`, {
        headers: authHeaders(),
      });
      const data = await res.json();
      setRecentSales(Array.isArray(data) ? data : []);
    } catch {}
  }, []);

  useEffect(() => {
    loadSession();
    loadProducts();
    loadSales();
    searchRef.current?.focus();
  }, []); // eslint-disable-line

  const filtered = products.filter((p) => {
    const matchCat = category === "All" || p.category === category;
    const matchSearch =
      !search || p.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });
  const posPages = Math.ceil(filtered.length / posLimit);
  const paginated = filtered.slice(
    (posPage - 1) * posLimit,
    posPage * posLimit,
  );

  const addToCart = (product) => {
    if (product.stock !== undefined && product.stock <= 0) {
      showToast("Out of stock");
      return;
    }
    setLastSale(null);
    setCart((prev) => {
      const ex = prev.find((i) => i._id === product._id);
      if (ex)
        return prev.map((i) =>
          i._id === product._id ? { ...i, qty: i.qty + 1 } : i,
        );
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const updateQty = (id, qty) => {
    if (qty < 1) setCart((prev) => prev.filter((i) => i._id !== id));
    else setCart((prev) => prev.map((i) => (i._id === id ? { ...i, qty } : i)));
  };

  const clearCart = () => setCart([]);
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const holdBill = () => {
    if (!cart.length) {
      showToast("Cart is empty");
      return;
    }
    const label = `Table ${heldBills.length + 1}`;
    setHeldBills((prev) => [
      ...prev,
      { id: Date.now(), label, items: cart, heldAt: new Date().toISOString() },
    ]);
    clearCart();
    showToast(`Bill held as "${label}"`);
  };

  const resumeBill = (id) => {
    const bill = heldBills.find((b) => b.id === id);
    if (!bill) return;
    if (cart.length > 0) {
      setHeldBills((prev) => [
        ...prev.filter((b) => b.id !== id),
        {
          id: Date.now(),
          label: `Paused ${new Date().toLocaleTimeString()}`,
          items: cart,
          heldAt: new Date().toISOString(),
        },
      ]);
    } else {
      setHeldBills((prev) => prev.filter((b) => b.id !== id));
    }
    setCart(bill.items);
    setModal(null);
    showToast(`Resumed "${bill.label}"`);
  };

  const deleteBill = (id) => {
    setHeldBills((prev) => prev.filter((b) => b.id !== id));
    showToast("Bill removed");
  };

  const handleOpenShift = async (openingCash) => {
    const res = await fetch(`${API_BASE}/api/pos/session/open`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ openingCash: Number(openingCash) }),
    });
    const data = await res.json();
    if (res.ok) {
      setSession(data);
      setModal(null);
      showToast("Shift opened!");
    } else showToast(data.message);
  };
  const handleCashMovement = async (type, amount, note) => {
    const res = await fetch(`${API_BASE}/api/pos/session/cash`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ type, amount: Number(amount), note }),
    });
    const data = await res.json();
    if (res.ok) {
      setSession(data);
      showToast(`Cash ${type} recorded`);
    } else showToast(data.message);
  };
  const handleCloseShift = async (closingCash) => {
    const res = await fetch(`${API_BASE}/api/pos/session/close`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify({ closingCash: Number(closingCash) }),
    });
    const data = await res.json();
    if (res.ok) {
      setSession(null);
      setModal(null);
      showToast("Shift closed!");
    } else showToast(data.message);
  };

  const handleSale = async ({
    payMethod,
    discountUSD,
    amountPaidUSD,
    changeUSD,
    custName,
    custEmail,
    custPhone,
    note,
  }) => {
    if (!session) {
      showToast("No open shift!");
      return;
    }
    setSaving(true);
    try {
      const body = {
        items: cart.map((i) => ({ productId: i._id, qty: i.qty })),
        paymentMethod: payMethod,
        amountPaid: amountPaidUSD,
        discount: discountUSD,
        customerName: custName,
        customerEmail: custEmail,
        customerPhone: custPhone,
        note,
      };
      const res = await fetch(`${API_BASE}/api/pos/sale`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setLastSale({ ...data, change: changeUSD });
      clearCart();
      setModal("receipt");
      loadSession();
      loadSales();
      loadProducts();
      showToast("Sale complete!");
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === "F4") {
        e.preventDefault();
        if (cart.length) setModal("checkout");
      }
      if (e.key === "F6") {
        e.preventDefault();
        holdBill();
      }
      if (e.key === "F7") {
        e.preventDefault();
        setModal("held");
      }
      if (e.key === "F8") {
        e.preventDefault();
        setShowInv((v) => !v);
      }
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart, heldBills]); // eslint-disable-line

  const oosCount = products.filter((p) => p.stock === 0).length;
  const lowCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;

  return (
    <div className="pos-root">
      <div className="pos-topbar">
        <div className="pos-topbar__brand">🐝 BuyBee POS</div>
        <div className="pos-topbar__center">
          {session ? (
            <span className="pos-session-badge pos-session-badge--open">
              ● Shift Open — {session.operator} — {session.terminal}
            </span>
          ) : (
            <span className="pos-session-badge pos-session-badge--closed">
              ○ No Active Shift
            </span>
          )}
        </div>
        <div className="pos-topbar__actions">
          <CurrencySwitcher />
          <button
            className={`pos-btn pos-btn--ghost pos-btn--sm pos-inv-toggle ${showInv ? "pos-inv-toggle--active" : ""}`}
            onClick={() => setShowInv((v) => !v)}
            title="Inventory (F8)"
          >
            📦 Inventory
            {(oosCount > 0 || lowCount > 0) && (
              <span className="pos-inv-badge">{oosCount + lowCount}</span>
            )}
          </button>
          <button
            className="pos-btn pos-btn--ghost pos-btn--sm"
            onClick={() => setModal("display")}
          >
            📺 Display
          </button>
          <button
            className="pos-btn pos-btn--ghost pos-btn--sm"
            onClick={() => setModal("shift")}
          >
            💼 Shift
          </button>
          <a href="/admin" className="pos-btn pos-btn--ghost pos-btn--sm">
            ⬅ Admin
          </a>
        </div>
      </div>

      <div className="pos-body">
        {/* Products */}
        <div className="pos-products">
          <div className="pos-search">
            <span>🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search products… (F2)"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPosPage(1);
              }}
              className="pos-search__input"
            />
            {search && (
              <button
                className="pos-search__clear"
                onClick={() => setSearch("")}
              >
                ✕
              </button>
            )}
          </div>
          <div className="pos-cats">
            {["All", ...categories].map((c) => (
              <button
                key={c}
                className={`pos-cat ${category === c ? "pos-cat--active" : ""}`}
                onClick={() => {
                  setCategory(c);
                  setPosPage(1);
                }}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="pos-grid" ref={gridRef}>
            {paginated.map((p) => {
              const oos = p.stock !== undefined && p.stock <= 0;
              const src = p.image ? imgSrc(p.image) : null;
              return (
                <button
                  key={p._id}
                  className={`pos-product ${oos ? "pos-product--oos" : ""}`}
                  onClick={() => addToCart(p)}
                  disabled={oos}
                >
                  <div
                    className="pos-product__img"
                    style={{ background: p.bg || "#FDE8C8" }}
                  >
                    {src ? <img src={src} alt={p.title} /> : "🛍️"}
                    {oos && <div className="pos-product__oos">OUT</div>}
                    {!oos && p.stock !== undefined && (
                      <div
                        className={`pos-product__stock ${p.stock <= 5 ? "pos-product__stock--low" : ""}`}
                      >
                        {p.stock <= 5 ? `⚠️ ${p.stock}` : p.stock} left
                      </div>
                    )}
                  </div>
                  <div className="pos-product__title">{p.title}</div>
                  <div className="pos-product__price">{fmt(p.price)}</div>
                </button>
              );
            })}
            {filtered.length === 0 && (
              <div className="pos-no-products">No products found</div>
            )}
          </div>

          {/* Pagination */}
          {posPages > 1 && (
            <div className="pos-pagination">
              <button
                className="pos-pagination__btn"
                disabled={posPage === 1}
                onClick={() => setPosPage((p) => p - 1)}
              >
                ‹
              </button>
              {Array.from({ length: posPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 || p === posPages || Math.abs(p - posPage) <= 2,
                )
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("…");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === "…" ? (
                    <span key={`dots-${i}`} className="pos-pagination__dots">
                      …
                    </span>
                  ) : (
                    <button
                      key={p}
                      className={`pos-pagination__btn ${p === posPage ? "pos-pagination__btn--active" : ""}`}
                      onClick={() => setPosPage(p)}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                className="pos-pagination__btn"
                disabled={posPage === posPages}
                onClick={() => setPosPage((p) => p + 1)}
              >
                ›
              </button>
              <span className="pos-pagination__info">
                {(posPage - 1) * posLimit + 1}–
                {Math.min(posPage * posLimit, filtered.length)} of{" "}
                {filtered.length}
              </span>
            </div>
          )}
        </div>

        {/* Cart */}
        <div className="pos-cart">
          <div className="pos-cart__header">
            <span>
              🛒 Cart{" "}
              {cart.length > 0 &&
                `(${cart.reduce((s, i) => s + i.qty, 0)} items)`}
            </span>
            <div className="pos-cart__header-actions">
              {cart.length > 0 && (
                <button
                  className="pos-btn pos-btn--hold pos-btn--sm"
                  onClick={holdBill}
                  title="Hold bill (F6)"
                >
                  ⏸ Hold
                </button>
              )}
              {heldBills.length > 0 && (
                <button
                  className="pos-btn pos-btn--held pos-btn--sm"
                  onClick={() => setModal("held")}
                  title="View held bills (F7)"
                >
                  📋 {heldBills.length} Held
                </button>
              )}
              {cart.length > 0 && (
                <button
                  className="pos-btn pos-btn--ghost pos-btn--sm"
                  onClick={clearCart}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
          <div className="pos-cart__items">
            {cart.length === 0 ? (
              <div className="pos-cart__empty">
                <div>🛒</div>
                <p>Cart is empty</p>
                <p className="pos-cart__empty-hint">Click a product to add</p>
                {heldBills.length > 0 && (
                  <button
                    className="pos-btn pos-btn--held pos-btn--sm"
                    style={{ marginTop: 12 }}
                    onClick={() => setModal("held")}
                  >
                    📋 {heldBills.length} bill
                    {heldBills.length !== 1 ? "s" : ""} on hold
                  </button>
                )}
              </div>
            ) : (
              cart.map((item) => (
                <div key={item._id} className="pos-cart__item">
                  <div className="pos-cart__item-info">
                    <div className="pos-cart__item-title">{item.title}</div>
                    <div className="pos-cart__item-price">
                      {fmt(item.price)} each
                      {item.stock !== undefined && (
                        <span
                          className={`pos-cart__item-stock ${item.stock <= item.qty ? "pos-cart__item-stock--warn" : ""}`}
                        >
                          &nbsp;· {item.stock} in stock
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="pos-cart__item-controls">
                    <button
                      className="pos-qty-btn"
                      onClick={() => updateQty(item._id, item.qty - 1)}
                    >
                      −
                    </button>
                    <span className="pos-cart__item-qty">{item.qty}</span>
                    <button
                      className="pos-qty-btn"
                      onClick={() => updateQty(item._id, item.qty + 1)}
                    >
                      +
                    </button>
                  </div>
                  <div className="pos-cart__item-total">
                    {fmt(item.price * item.qty)}
                  </div>
                  <button
                    className="pos-cart__item-remove"
                    onClick={() => updateQty(item._id, 0)}
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
          <div className="pos-cart__footer">
            <div className="pos-cart__subtotal">
              <span>Subtotal</span>
              <span>{fmt(subtotal)}</span>
            </div>
            <button
              className="pos-btn pos-btn--sale pos-btn--full"
              disabled={!cart.length || !session}
              onClick={() => setModal("checkout")}
            >
              {!session
                ? "Open a shift first"
                : cart.length === 0
                  ? "Add items to cart"
                  : `Charge ${fmt(subtotal)} (F4)`}
            </button>
          </div>
          {recentSales.length > 0 && (
            <div className="pos-recent">
              <div className="pos-recent__title">Recent Sales</div>
              {recentSales.slice(0, 5).map((o) => (
                <div key={o._id} className="pos-recent__item">
                  <span className="pos-recent__num">{o.orderNumber}</span>
                  <span className="pos-recent__items">
                    {o.items.length} item{o.items.length !== 1 ? "s" : ""}
                  </span>
                  <span className="pos-recent__total">{fmt(o.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Inventory sidebar */}
        {showInv && (
          <InventorySidebar
            products={products}
            fmt={fmt}
            onClose={() => setShowInv(false)}
          />
        )}
      </div>

      {modal === "held" && (
        <HeldBillsModal
          heldBills={heldBills}
          onResume={resumeBill}
          onDelete={deleteBill}
          onClose={() => setModal(null)}
          fmt={fmt}
        />
      )}
      {modal === "shift" && (
        <ShiftModal
          session={session}
          onOpen={handleOpenShift}
          onClose={() => setModal(null)}
          onCashMovement={handleCashMovement}
          onCloseShift={handleCloseShift}
          fmt={fmt}
        />
      )}
      {modal === "checkout" && cart.length > 0 && (
        <CheckoutModal
          cart={cart}
          subtotalUSD={subtotal}
          onSale={handleSale}
          onClose={() => setModal(null)}
          saving={saving}
        />
      )}
      {modal === "receipt" && lastSale && (
        <Receipt
          sale={lastSale}
          session={session}
          onClose={() => setModal(null)}
          fmt={fmt}
        />
      )}
      {modal === "display" && (
        <div className="pos-modal-overlay" onClick={() => setModal(null)}>
          <div
            className="pos-modal pos-modal--display"
            onClick={(e) => e.stopPropagation()}
          >
            <CustomerDisplay
              cart={cart}
              total={subtotal}
              lastSale={lastSale}
              fmt={fmt}
            />
            <button
              className="pos-btn pos-btn--ghost"
              style={{ margin: "0 auto", display: "block", marginTop: 16 }}
              onClick={() => setModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {toast && <div className="pos-toast">{toast}</div>}
    </div>
  );
}
