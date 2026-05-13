import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const CurrencyContext = createContext(null);

/* Fallback if API is down */
const FALLBACK = [
  { code: "USD", symbol: "$", name: "US Dollar", rateToUSD: 1 },
  { code: "LKR", symbol: "Rs", name: "Sri Lankan Rupee", rateToUSD: 320 },
  { code: "KRW", symbol: "₩", name: "South Korean Won", rateToUSD: 1350 },
];

export function CurrencyProvider({ children }) {
  const [currencies, setCurrencies] = useState(FALLBACK);
  const [activeCurrency, setActiveCurrency] = useState(
    () =>
      JSON.parse(localStorage.getItem("bb_currency") || "null") || FALLBACK[0],
  );

  /* Load currencies from server */
  useEffect(() => {
    fetch(`${API_BASE}/api/currencies`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setCurrencies(data);
          // Refresh active currency with latest rate
          const stored = JSON.parse(
            localStorage.getItem("bb_currency") || "null",
          );
          if (stored) {
            const updated = data.find((c) => c.code === stored.code);
            if (updated) setActiveCurrency(updated);
          }
        }
      })
      .catch(() => {}); // use fallback silently
  }, []);

  /* Switch currency */
  const switchCurrency = useCallback(
    (code) => {
      const found = currencies.find((c) => c.code === code);
      if (found) {
        setActiveCurrency(found);
        localStorage.setItem("bb_currency", JSON.stringify(found));
      }
    },
    [currencies],
  );

  /* Convert a USD price to active currency */
  const convert = useCallback(
    (usdPrice) => {
      if (!usdPrice && usdPrice !== 0) return "";
      const converted = Number(usdPrice) * activeCurrency.rateToUSD;
      return converted;
    },
    [activeCurrency],
  );

  /* Format a USD price in the active currency */
  const format = useCallback(
    (usdPrice) => {
      if (!usdPrice && usdPrice !== 0) return "";
      const converted = Number(usdPrice) * activeCurrency.rateToUSD;

      // KRW has no decimal places, LKR uses 2
      const decimals = activeCurrency.code === "KRW" ? 0 : 2;
      const formatted = converted.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });

      return `${activeCurrency.symbol}${formatted}`;
    },
    [activeCurrency],
  );

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        activeCurrency,
        switchCurrency,
        convert,
        format,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx)
    throw new Error("useCurrency must be used inside <CurrencyProvider>");
  return ctx;
}
