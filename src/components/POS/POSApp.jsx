import { useState, useEffect, useRef, useCallback } from "react";
import "./POSApp.css";

const API_BASE = process.env.REACT_APP_API_URL
  ? process.env.REACT_APP_API_URL.replace("/api/content", "")
  : "http://localhost:5000";

const imgSrc = (url) =>
  !url ? null : url.startsWith("http") ? url : `${API_BASE}${url}`;

/* ─── HELPERS ─── */
const fmt = (n) => `$${Number(n).toFixed(2)}`;
const getToken = () => localStorage.getItem("bb_token");
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

/* ════════════════════════════════════════
   RECEIPT COMPONENT (printable)
   ════════════════════════════════════════ */
function Receipt({ sale, session, onClose }) {
  const printRef = useRef(null);

  const handlePrint = () => {
    const content = printRef.current.innerHTML;

    // Create hidden iframe for printing
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>BuyBee Receipt - ${sale.order?.orderNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      font-size: 12px;
      width: 300px;
      padding: 12px;
      color: #000;
    }
    .r-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
    .r-logo   { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
    .r-sub    { font-size: 10px; color: #555; margin-bottom: 1px; }
    .r-row    { display: flex; justify-content: space-between; margin: 3px 0; font-size: 12px; }
    .r-divider{ border-top: 1px dashed #000; margin: 6px 0; }
    .r-total  { font-weight: bold; font-size: 14px; margin: 4px 0; }
    .r-change { background: #f0f0f0; padding: 5px 8px; text-align: center; margin: 6px 0; border-radius: 4px; font-weight: bold; font-size: 13px; }
    .r-footer { text-align: center; margin-top: 10px; font-size: 10px; color: #555; }
    .r-item-name { max-width: 180px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @media print {
      body { width: 100%; }
      @page { margin: 0; size: 80mm auto; }
    }
  </style>
</head>
<body>${content}</body>
</html>`);
    doc.close();

    iframe.contentWindow.focus();

    // Small delay to ensure content is rendered before printing
    setTimeout(() => {
      iframe.contentWindow.print();
      // Remove iframe after print dialog closes
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

        {/* Printable receipt */}
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
          {/* ── Status ── */}
          {tab === "status" && session && (
            <div className="shift-status">
              <div className="shift-status__row">
                <span>Operator</span>
                <strong>{session.operator}</strong>
              </div>
              <div className="shift-status__row">
                <span>Terminal</span>
                <strong>{session.terminal}</strong>
              </div>
              <div className="shift-status__row">
                <span>Opened</span>
                <strong>
                  {new Date(session.openedAt).toLocaleTimeString()}
                </strong>
              </div>
              <div className="shift-status__row">
                <span>Sales</span>
                <strong>{fmt(session.totalSales)}</strong>
              </div>
              <div className="shift-status__row">
                <span>Orders</span>
                <strong>{session.totalOrders}</strong>
              </div>
              <div className="shift-status__row">
                <span>Cash</span>
                <strong>{fmt(session.totalCash)}</strong>
              </div>
              <div className="shift-status__row">
                <span>Card</span>
                <strong>{fmt(session.totalCard)}</strong>
              </div>
              <div className="shift-status__row shift-status__row--highlight">
                <span>Expected Cash</span>
                <strong>{fmt(session.expectedCash)}</strong>
              </div>
            </div>
          )}

          {/* ── Open shift ── */}
          {tab === "open" && !session && (
            <div className="shift-form">
              <div className="pos-field">
                <label>Opening Cash ($)</label>
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

          {/* ── Cash in/out ── */}
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
                <label>Amount ($)</label>
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

          {/* ── Close shift ── */}
          {tab === "close" && session && (
            <div className="shift-form">
              <div className="shift-status">
                <div className="shift-status__row">
                  <span>Expected Cash</span>
                  <strong>{fmt(session.expectedCash)}</strong>
                </div>
              </div>
              <div className="pos-field">
                <label>Counted Cash ($)</label>
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
   CUSTOMER DISPLAY (second screen)
   ════════════════════════════════════════ */
function CustomerDisplay({ cart, total, lastSale }) {
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
function CheckoutModal({ cart, subtotal, onSale, onClose, saving }) {
  const [payMethod, setPayMethod] = useState("cash");
  const [discount, setDiscount] = useState("");
  const [amountPaid, setAmountPaid] = useState("");
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [note, setNote] = useState("");

  const discountNum = Number(discount) || 0;
  const total = Math.max(0, subtotal - discountNum);
  const change =
    payMethod === "cash" ? Math.max(0, (Number(amountPaid) || 0) - total) : 0;

  const quickAmounts = [
    Math.ceil(total / 10) * 10,
    Math.ceil(total / 50) * 50,
    Math.ceil(total / 100) * 100,
  ];

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
          {/* Left — payment */}
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
              <label>Discount ($)</label>
              <input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                placeholder="0.00"
                className="pos-input"
              />
            </div>

            {payMethod === "cash" && (
              <div className="pos-field">
                <label>Amount Paid ($)</label>
                <input
                  type="number"
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(e.target.value)}
                  placeholder="0.00"
                  className="pos-input pos-input--large"
                />
                <div className="quick-amounts">
                  {quickAmounts
                    .filter((v, i, a) => a.indexOf(v) === i)
                    .map((a) => (
                      <button
                        key={a}
                        className="quick-amount"
                        onClick={() => setAmountPaid(String(a))}
                      >
                        {fmt(a)}
                      </button>
                    ))}
                  <button
                    className="quick-amount quick-amount--exact"
                    onClick={() => setAmountPaid(String(total))}
                  >
                    Exact
                  </button>
                </div>
                {amountPaid && (
                  <div
                    className={`change-display ${change >= 0 ? "change-display--ok" : "change-display--short"}`}
                  >
                    {change >= 0
                      ? `Change: ${fmt(change)}`
                      : `Short: ${fmt(Math.abs(change))}`}
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

          {/* Right — order summary */}
          <div className="checkout-right">
            <div className="checkout-summary">
              <div className="checkout-summary__title">Order Summary</div>
              {cart.map((item, i) => (
                <div key={i} className="checkout-summary__item">
                  <span>
                    {item.title} ×{item.qty}
                  </span>
                  <span>{fmt(item.price * item.qty)}</span>
                </div>
              ))}
              <div className="checkout-summary__divider" />
              <div className="checkout-summary__row">
                <span>Subtotal</span>
                <span>{fmt(subtotal)}</span>
              </div>
              {discountNum > 0 && (
                <div className="checkout-summary__row checkout-summary__row--discount">
                  <span>Discount</span>
                  <span>-{fmt(discountNum)}</span>
                </div>
              )}
              <div className="checkout-summary__total">
                <span>TOTAL</span>
                <span>{fmt(total)}</span>
              </div>
            </div>

            <button
              className="pos-btn pos-btn--sale pos-btn--full"
              onClick={() =>
                onSale({
                  payMethod,
                  discount: discountNum,
                  amountPaid: Number(amountPaid),
                  custName,
                  custEmail,
                  custPhone,
                  note,
                })
              }
              disabled={
                saving ||
                (payMethod === "cash" &&
                  amountPaid &&
                  Number(amountPaid) < total)
              }
            >
              {saving ? "⏳ Processing…" : `✓ Charge ${fmt(total)}`}
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
  const [session, setSession] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [categories, setCategories] = useState([]);
  const [recentSales, setRecentSales] = useState([]);
  const [saving, setSaving] = useState(false);
  const [lastSale, setLastSale] = useState(null);
  const [toast, setToast] = useState("");
  const [modal, setModal] = useState(null); // 'shift' | 'checkout' | 'receipt' | 'display'
  const searchRef = useRef(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  /* ── Load session ── */
  const loadSession = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/pos/session/current`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    setSession(data);
  }, []);

  /* ── Load products ── */
  const loadProducts = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/products?limit=100&sort=newest`);
    const data = await res.json();
    setProducts(data.items || []);
    setCategories([
      ...new Set((data.items || []).map((p) => p.category).filter(Boolean)),
    ]);
  }, []);

  /* ── Load recent sales ── */
  const loadSales = useCallback(async () => {
    const res = await fetch(`${API_BASE}/api/pos/sales`, {
      headers: authHeaders(),
    });
    const data = await res.json();
    setRecentSales(Array.isArray(data) ? data : []);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    loadSession();
    loadProducts();
    loadSales();
    searchRef.current?.focus();
  }, []);

  /* ── Filtered products ── */
  const filtered = products.filter((p) => {
    const matchCat = category === "All" || p.category === category;
    const matchSearch =
      !search || p.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  /* ── Cart actions ── */
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

  /* ── Open / Close shift ── */
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

  /* ── Process sale ── */
  const handleSale = async ({
    payMethod,
    discount,
    amountPaid,
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
        amountPaid,
        discount,
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

      setLastSale(data);
      clearCart();
      setModal("receipt");
      loadSession();
      loadSales();
      loadProducts(); // refresh stock
      showToast("Sale complete!");
    } catch (err) {
      showToast(err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ── Keyboard shortcut ── */
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
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cart]);

  return (
    <div className="pos-root">
      {/* ── TOP BAR ── */}
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
          <button
            className="pos-btn pos-btn--ghost pos-btn--sm"
            onClick={() => setModal("display")}
          >
            📺 Customer Display
          </button>
          <button
            className="pos-btn pos-btn--ghost pos-btn--sm"
            onClick={() => setModal("shift")}
          >
            💼 Shift
          </button>
          <a href="/admin" className="pos-btn pos-btn--ghost pos-btn--sm">
            ⬅ Back to Admin
          </a>
        </div>
      </div>

      <div className="pos-body">
        {/* ── LEFT: PRODUCTS ── */}
        <div className="pos-products">
          {/* Search */}
          <div className="pos-search">
            <span>🔍</span>
            <input
              ref={searchRef}
              type="text"
              placeholder="Search products… (F2)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

          {/* Category tabs */}
          <div className="pos-cats">
            {["All", ...categories].map((c) => (
              <button
                key={c}
                className={`pos-cat ${category === c ? "pos-cat--active" : ""}`}
                onClick={() => setCategory(c)}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Product grid */}
          <div className="pos-grid">
            {filtered.map((p) => {
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
                    {p.stock !== undefined && p.stock > 0 && p.stock <= 5 && (
                      <div className="pos-product__low">⚠️{p.stock}</div>
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
        </div>

        {/* ── RIGHT: CART ── */}
        <div className="pos-cart">
          <div className="pos-cart__header">
            <span>
              🛒 Cart{" "}
              {cart.length > 0 &&
                `(${cart.reduce((s, i) => s + i.qty, 0)} items)`}
            </span>
            {cart.length > 0 && (
              <button
                className="pos-btn pos-btn--ghost pos-btn--sm"
                onClick={clearCart}
              >
                Clear
              </button>
            )}
          </div>

          <div className="pos-cart__items">
            {cart.length === 0 ? (
              <div className="pos-cart__empty">
                <div>🛒</div>
                <p>Cart is empty</p>
                <p className="pos-cart__empty-hint">
                  Click a product or search to add
                </p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item._id} className="pos-cart__item">
                  <div className="pos-cart__item-info">
                    <div className="pos-cart__item-title">{item.title}</div>
                    <div className="pos-cart__item-price">
                      {fmt(item.price)} each
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

          {/* Cart footer */}
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

          {/* Recent sales */}
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
      </div>

      {/* ── MODALS ── */}
      {modal === "shift" && (
        <ShiftModal
          session={session}
          onOpen={handleOpenShift}
          onClose={() => setModal(null)}
          onCashMovement={handleCashMovement}
          onCloseShift={handleCloseShift}
        />
      )}
      {modal === "checkout" && cart.length > 0 && (
        <CheckoutModal
          cart={cart}
          subtotal={subtotal}
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
        />
      )}
      {modal === "display" && (
        <div className="pos-modal-overlay" onClick={() => setModal(null)}>
          <div
            className="pos-modal pos-modal--display"
            onClick={(e) => e.stopPropagation()}
          >
            <CustomerDisplay cart={cart} total={subtotal} lastSale={lastSale} />
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

      {/* ── TOAST ── */}
      {toast && <div className="pos-toast">{toast}</div>}
    </div>
  );
}
