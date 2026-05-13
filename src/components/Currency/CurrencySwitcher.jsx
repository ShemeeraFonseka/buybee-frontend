import { useState, useRef, useEffect } from "react";
import { useCurrency } from "./CurrencyContext";
import "./CurrencySwitcher.css";

export default function CurrencySwitcher() {
  const { currencies, activeCurrency, switchCurrency } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  /* Close on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="cs-root" ref={ref}>
      <button className="cs-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="cs-trigger__symbol">{activeCurrency.symbol}</span>
        <span className="cs-trigger__code">{activeCurrency.code}</span>
        <span
          className={`cs-trigger__arrow ${open ? "cs-trigger__arrow--open" : ""}`}
        >
          ▾
        </span>
      </button>

      {open && (
        <div className="cs-dropdown">
          {currencies.map((c) => (
            <button
              key={c.code}
              className={`cs-option ${c.code === activeCurrency.code ? "cs-option--active" : ""}`}
              onClick={() => {
                switchCurrency(c.code);
                setOpen(false);
              }}
            >
              <span className="cs-option__symbol">{c.symbol}</span>
              <div className="cs-option__info">
                <span className="cs-option__code">{c.code}</span>
                <span className="cs-option__name">{c.name}</span>
              </div>
              {c.code === activeCurrency.code && (
                <span className="cs-option__check">✓</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
