import { useState } from "react";
import { useLocation } from "react-router-dom";
import { useCurrency } from "../Currency/CurrencyContext";
import CurrencySwitcher from "../Currency/CurrencySwitcher";
import "./CheckoutPage.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const ORDERS_API = `${API_BASE}/api/orders`;

const imgSrc = (url) =>
  !url ? null : url.startsWith("http") ? url : `${API_BASE}${url}`;

const SHIPPING_LKR = 400; // shipping fee in LKR — change this to adjust

/* ─── STEP BAR ─── */
function StepBar({ step }) {
  const steps = ["Shipping", "Review & Place"];
  return (
    <div className="ck-steps">
      {steps.map((s, i) => (
        <div key={s} className="ck-steps__item">
          <div
            className={`ck-steps__circle ${i < step ? "done" : i === step ? "active" : ""}`}
          >
            {i < step ? "✓" : i + 1}
          </div>
          <span className={`ck-steps__label ${i === step ? "active" : ""}`}>
            {s}
          </span>
          {i < steps.length - 1 && (
            <div className={`ck-steps__line ${i < step ? "done" : ""}`} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── ORDER SUMMARY SIDEBAR ─── */
function OrderSummary({ cart, shippingFeeUSD }) {
  const { format } = useCurrency();
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + shippingFeeUSD;

  return (
    <div className="ck-summary">
      <h3 className="ck-summary__title">Order Summary</h3>

      <div className="ck-summary__items">
        {cart.map((item) => (
          <div key={item._id} className="ck-summary__item">
            <div
              className="ck-summary__item-img"
              style={{ background: item.bg || "#FDE8C8" }}
            >
              {item.image ? (
                <img src={imgSrc(item.image)} alt={item.title} />
              ) : (
                "🛍️"
              )}
              <span className="ck-summary__item-qty">{item.qty}</span>
            </div>
            <div className="ck-summary__item-info">
              <div className="ck-summary__item-title">{item.title}</div>
              <div className="ck-summary__item-cat">{item.category}</div>
            </div>
            <div className="ck-summary__item-price">
              {format(item.price * item.qty)}
            </div>
          </div>
        ))}
      </div>

      <div className="ck-summary__totals">
        <div className="ck-summary__row">
          <span>Subtotal</span>
          <span>{format(subtotal)}</span>
        </div>
        <div className="ck-summary__row">
          <span>Shipping</span>
          <span>{format(shippingFeeUSD)}</span>
        </div>
        <div className="ck-summary__row ck-summary__row--total">
          <span>Total</span>
          <span>{format(total)}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── FIELD HELPERS ─── */
function Field({ label, required, error, children }) {
  return (
    <div className="ck-field">
      <label className="ck-field__label">
        {label}
        {required && " *"}
      </label>
      {children}
      {error && <span className="ck-field__error">{error}</span>}
    </div>
  );
}

function Input({ value, onChange, placeholder, type = "text", error }) {
  return (
    <input
      className={`ck-input ${error ? "ck-input--error" : ""}`}
      type={type}
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/* ─── STEP 1: SHIPPING ─── */
function ShippingStep({ data, onChange, onNext }) {
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!data.firstName) e.firstName = "Required";
    if (!data.lastName) e.lastName = "Required";
    if (!data.email || !/\S+@\S+\.\S+/.test(data.email))
      e.email = "Valid email required";
    if (!data.phone) e.phone = "Required";
    if (!data.address) e.address = "Required";
    if (!data.city) e.city = "Required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const set = (key) => (val) => {
    onChange({ ...data, [key]: val });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  return (
    <div className="ck-section">
      <h2 className="ck-section__title">📦 Shipping Information</h2>

      <div className="ck-grid ck-grid--2">
        <Field label="First name" required error={errors.firstName}>
          <Input
            value={data.firstName}
            onChange={set("firstName")}
            placeholder="Ayesha"
            error={errors.firstName}
          />
        </Field>
        <Field label="Last name" required error={errors.lastName}>
          <Input
            value={data.lastName}
            onChange={set("lastName")}
            placeholder="Perera"
            error={errors.lastName}
          />
        </Field>
      </div>

      <div className="ck-grid ck-grid--2">
        <Field label="Email" required error={errors.email}>
          <Input
            value={data.email}
            onChange={set("email")}
            placeholder="you@email.com"
            type="email"
            error={errors.email}
          />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <Input
            value={data.phone}
            onChange={set("phone")}
            placeholder="+94 77 123 4567"
            type="tel"
            error={errors.phone}
          />
        </Field>
      </div>

      <Field label="Address" required error={errors.address}>
        <Input
          value={data.address}
          onChange={set("address")}
          placeholder="123 Main Street"
          error={errors.address}
        />
      </Field>

      <div className="ck-grid ck-grid--3">
        <Field label="City" required error={errors.city}>
          <Input
            value={data.city}
            onChange={set("city")}
            placeholder="Colombo"
            error={errors.city}
          />
        </Field>
        <Field label="Province">
          <Input
            value={data.province}
            onChange={set("province")}
            placeholder="Western"
          />
        </Field>
        <Field label="Postal code">
          <Input
            value={data.postalCode}
            onChange={set("postalCode")}
            placeholder="00100"
          />
        </Field>
      </div>

      <Field label="Country">
        <select
          className="ck-input"
          value={data.country}
          onChange={(e) => set("country")(e.target.value)}
        >
          <option>Sri Lanka</option>
          <option>India</option>
          <option>United States</option>
          <option>United Kingdom</option>
          <option>Australia</option>
          <option>Other</option>
        </select>
      </Field>

      <Field label="Payment method" required>
        <div className="ck-payment-inline">
          <label
            className={`ck-pay-opt ${data.paymentMethod === "cod" ? "ck-pay-opt--active" : ""}`}
          >
            <input
              type="radio"
              name="pm"
              value="cod"
              checked={data.paymentMethod === "cod"}
              onChange={() => set("paymentMethod")("cod")}
            />
            🚚 Cash on Delivery
          </label>
          <label
            className={`ck-pay-opt ${data.paymentMethod === "card" ? "ck-pay-opt--active" : ""}`}
          >
            <input
              type="radio"
              name="pm"
              value="card"
              checked={data.paymentMethod === "card"}
              onChange={() => set("paymentMethod")("card")}
            />
            💳 Card (pay on site)
          </label>
        </div>
      </Field>

      <Field label="Order notes (optional)">
        <textarea
          className="ck-input ck-input--textarea"
          value={data.notes}
          onChange={(e) => set("notes")(e.target.value)}
          placeholder="Any special delivery instructions…"
          rows={3}
        />
      </Field>

      <div className="ck-actions">
        <a href="/products" className="ck-btn ck-btn--ghost">
          ← Back to Shop
        </a>
        <button
          className="ck-btn ck-btn--primary"
          onClick={() => {
            if (validate()) onNext();
          }}
        >
          Review Order →
        </button>
      </div>
    </div>
  );
}

/* ─── STEP 2: REVIEW & PLACE ─── */
function ReviewStep({
  shipping,
  cart,
  shippingFeeUSD,
  onBack,
  onPlace,
  placing,
  error,
}) {
  const { format } = useCurrency();
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + shippingFeeUSD;

  return (
    <div className="ck-section">
      <h2 className="ck-section__title">✅ Review Your Order</h2>

      <div className="ck-review-card">
        <div className="ck-review-card__header">📦 Shipping to</div>
        <div className="ck-review-card__body">
          <strong>
            {shipping.firstName} {shipping.lastName}
          </strong>
          <br />
          {shipping.address}, {shipping.city}
          {shipping.province ? `, ${shipping.province}` : ""}{" "}
          {shipping.postalCode}
          <br />
          {shipping.country}
          <br />
          <span style={{ color: "#8A7D6B" }}>
            {shipping.email} · {shipping.phone}
          </span>
        </div>
      </div>

      <div className="ck-review-card">
        <div className="ck-review-card__header">💳 Payment</div>
        <div className="ck-review-card__body">
          {shipping.paymentMethod === "cod"
            ? "🚚 Cash on Delivery — pay when your order arrives"
            : "💳 Card — pay at delivery point"}
        </div>
      </div>

      <div className="ck-review-card">
        <div className="ck-review-card__header">
          🛍️ Items ({cart.reduce((s, i) => s + i.qty, 0)})
        </div>
        <div className="ck-review-items">
          {cart.map((item) => (
            <div key={item._id} className="ck-review-item">
              <div className="ck-review-item__left">
                <div
                  className="ck-review-item__img"
                  style={{ background: item.bg || "#FDE8C8" }}
                >
                  {item.image ? (
                    <img src={imgSrc(item.image)} alt={item.title} />
                  ) : (
                    "🛍️"
                  )}
                </div>
                <div>
                  <div className="ck-review-item__name">{item.title}</div>
                  <div className="ck-review-item__qty">Qty: {item.qty}</div>
                </div>
              </div>
              <span className="ck-review-item__price">
                {format(item.price * item.qty)}
              </span>
            </div>
          ))}

          <div className="ck-review-totals">
            <div className="ck-review-totals__row">
              <span>Subtotal</span>
              <span>{format(subtotal)}</span>
            </div>
            <div className="ck-review-totals__row">
              <span>Shipping</span>
              <span>{format(shippingFeeUSD)}</span>
            </div>
            <div className="ck-review-totals__row ck-review-totals__row--total">
              <span>Total</span>
              <span>{format(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <div className="ck-error">⚠️ {error}</div>}

      <div className="ck-actions">
        <button className="ck-btn ck-btn--ghost" onClick={onBack}>
          ← Back
        </button>
        <button
          className="ck-btn ck-btn--place"
          onClick={onPlace}
          disabled={placing}
        >
          {placing ? (
            <>
              <span className="ck-spinner" /> Placing order…
            </>
          ) : (
            "🐝 Place Order"
          )}
        </button>
      </div>
    </div>
  );
}

/* ─── CONFIRMATION ─── */
function Confirmation({ order }) {
  const { format } = useCurrency();
  return (
    <div className="ck-confirm">
      <div className="ck-confirm__icon">🎉</div>
      <h1 className="ck-confirm__title">Order Placed!</h1>
      <p className="ck-confirm__sub">
        Thank you, <strong>{order.customer.firstName}</strong>! Your order has
        been received and is being processed.
      </p>

      <div className="ck-confirm__number">
        Order # <span>{order.orderNumber}</span>
      </div>

      <p className="ck-confirm__email">
        A confirmation will be sent to <strong>{order.customer.email}</strong>
      </p>

      <div className="ck-confirm__summary">
        <div className="ck-confirm__summary-header">Order Details</div>
        {order.items.map((item, i) => (
          <div key={i} className="ck-confirm__item">
            <span>
              {item.title}{" "}
              <span style={{ color: "#8A7D6B" }}>× {item.qty}</span>
            </span>
            <span>{format(item.price * item.qty)}</span>
          </div>
        ))}
        <div className="ck-confirm__item ck-confirm__item--shipping">
          <span>Shipping</span>
          <span>{format(order.shippingFee)}</span>
        </div>
        <div className="ck-confirm__item ck-confirm__item--total">
          <span>Total</span>
          <span>{format(order.total)}</span>
        </div>
      </div>

      <div className="ck-confirm__delivery">
        <div className="ck-confirm__delivery-icon">🚚</div>
        <div>
          <div className="ck-confirm__delivery-title">Delivering to</div>
          <div className="ck-confirm__delivery-addr">
            {order.customer.address}, {order.customer.city},{" "}
            {order.customer.country}
          </div>
        </div>
      </div>

      <div className="ck-confirm__actions">
        <a href="/products" className="ck-btn ck-btn--primary">
          Continue Shopping →
        </a>
        <a href="/" className="ck-btn ck-btn--ghost">
          Back to Home
        </a>
      </div>
    </div>
  );
}

/* ─── ROOT ─── */
export default function CheckoutPage({ cart: cartProp = [], onClearCart }) {
  const location = useLocation();
  const cart = cartProp.length > 0 ? cartProp : location.state?.cart || [];

  // Get live LKR rate to convert Rs 400 → USD accurately
  const { currencies } = useCurrency();
  const lkrRate = currencies.find((c) => c.code === "LKR")?.rateToUSD || 320;
  const shippingFeeUSD = SHIPPING_LKR / lkrRate; // e.g. 400 / 320 = $1.25

  const [step, setStep] = useState(0);
  const [placing, setPlacing] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  const [shipping, setShipping] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    province: "",
    postalCode: "",
    country: "Sri Lanka",
    paymentMethod: "cod",
    notes: "",
  });

  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const total = subtotal + shippingFeeUSD;

  const placeOrder = async () => {
    setPlacing(true);
    setError("");
    try {
      const body = {
        customer: shipping,
        items: cart.map((i) => ({
          productId: i._id,
          title: i.title,
          image: i.image || "",
          price: i.price,
          qty: i.qty,
          category: i.category || "",
        })),
        subtotal,
        shippingFee: shippingFeeUSD,
        discount: 0,
        total,
        paymentMethod: shipping.paymentMethod,
        notes: shipping.notes,
      };

      const res = await fetch(ORDERS_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.outOfStock?.length) {
          const list = data.outOfStock
            .map(
              (i) =>
                `${i.title} (requested ${i.requested}, available ${i.available})`,
            )
            .join(", ");
          throw new Error(`Some items are out of stock: ${list}`);
        }
        const detail = data.fields?.length
          ? `${data.message}: ${data.fields.join(", ")}`
          : data.message || "Failed to place order";
        throw new Error(detail);
      }

      setOrder(data);
      if (onClearCart) onClearCart();
    } catch (err) {
      setError(err.message);
    } finally {
      setPlacing(false);
    }
  };

  const Nav = () => (
    <nav className="ck-nav">
      <a href="/" className="ck-nav__logo">
        <span className="ck-nav__bee">🐝</span> BuyBee
      </a>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <CurrencySwitcher />
        {!order && <span className="ck-nav__title">Checkout</span>}
      </div>
    </nav>
  );

  if (!cart.length && !order) {
    return (
      <div className="ck-root">
        <Nav />
        <div className="ck-empty-cart">
          <div className="ck-empty-cart__icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some products before checking out</p>
          <a href="/products" className="ck-btn ck-btn--primary">
            Browse Products
          </a>
        </div>
      </div>
    );
  }

  if (order) {
    return (
      <div className="ck-root">
        <Nav />
        <div className="ck-confirm-wrap">
          <Confirmation order={order} />
        </div>
      </div>
    );
  }

  return (
    <div className="ck-root">
      <Nav />
      <div className="ck-body">
        <div className="ck-main">
          <StepBar step={step} />

          {step === 0 && (
            <ShippingStep
              data={shipping}
              onChange={setShipping}
              onNext={() => setStep(1)}
            />
          )}

          {step === 1 && (
            <ReviewStep
              shipping={shipping}
              cart={cart}
              shippingFeeUSD={shippingFeeUSD}
              onBack={() => setStep(0)}
              onPlace={placeOrder}
              placing={placing}
              error={error}
            />
          )}
        </div>

        <aside className="ck-aside">
          <OrderSummary cart={cart} shippingFeeUSD={shippingFeeUSD} />
        </aside>
      </div>
    </div>
  );
}
