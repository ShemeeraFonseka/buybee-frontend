import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const CurrencyContext = createContext(null);

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

  useEffect(() => {
    fetch(`${API_BASE}/api/currencies`)
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setCurrencies(data);
          const stored = JSON.parse(
            localStorage.getItem("bb_currency") || "null",
          );
          if (stored) {
            const updated = data.find((c) => c.code === stored.code);
            if (updated) setActiveCurrency(updated);
          } else {
            // refresh active with latest rate from server
            const updated = data.find((c) => c.code === activeCurrency.code);
            if (updated) setActiveCurrency(updated);
          }
        }
      })
      .catch(() => {});
  }, []); // eslint-disable-line

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

  const convert = useCallback(
    (usdPrice) => {
      if (!usdPrice && usdPrice !== 0) return 0;
      return Number(usdPrice) * activeCurrency.rateToUSD;
    },
    [activeCurrency],
  );

  const format = useCallback(
    (usdPrice) => {
      if (!usdPrice && usdPrice !== 0) return "";
      const converted = Number(usdPrice) * activeCurrency.rateToUSD;
      const decimals = activeCurrency.code === "KRW" ? 0 : 2;
      return `${activeCurrency.symbol}${converted.toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}`;
    },
    [activeCurrency],
  );

  return (
    <CurrencyContext.Provider
      value={{
        currencies,
        activeCurrency,
        selectedCurrency: activeCurrency, // alias — POSApp, AdminProducts use this
        selected: activeCurrency.code, // alias — some components use this
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
