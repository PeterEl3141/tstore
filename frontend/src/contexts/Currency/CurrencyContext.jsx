// src/contexts/Currency/CurrencyContext.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CurrencyCtx = createContext(null);
const DISPLAY = ["GBP", "EUR", "USD"];
const SYMBOL = { GBP: "£", EUR: "€", USD: "$" };

export function CurrencyProvider({ children }) {
  const [selected, setSelected] = useState(localStorage.getItem("cur") || "GBP");
  const [rates, setRates] = useState({ GBP: 1, EUR: 1.16, USD: 1.30 });

  useEffect(() => localStorage.setItem("cur", selected), [selected]);

  useEffect(() => {
    let cancelled = false;
  
    async function loadRates() {
      try {
        // Primary: Frankfurter (ECB)
        const r = await fetch("https://api.frankfurter.app/latest?from=GBP&to=EUR,USD");
        if (!r.ok) throw new Error("Frankfurter failed");
        const d = await r.json();
        if (!cancelled) setRates({ GBP: 1, ...d.rates });
      } catch {
        try {
          // Fallback: exchangerate.host
          const r2 = await fetch("https://api.exchangerate.host/latest?base=GBP&symbols=EUR,USD");
          if (!r2.ok) throw new Error("exchangerate.host failed");
          const d2 = await r2.json();
          if (!cancelled) setRates({ GBP: 1, ...(d2.rates || {}) });
        } catch {
          // keep seeded defaults on failure
        }
      }
    }
  
    loadRates();
    return () => { cancelled = true; };
  }, []);
  

  function convertCentsFromGBP(centsGBP, to = selected) {
    const rate = rates[to] ?? 1;
    return Math.round(((centsGBP / 100) * rate) * 100);
  }
  function format(centsGBP, to = selected) {
    const cents = convertCentsFromGBP(centsGBP, to);
    return `${SYMBOL[to] || ""}${(cents / 100).toFixed(2)} ${to}`;
  }

  const value = useMemo(() => ({
    selected, setSelected, DISPLAY, rates, format, convertCentsFromGBP
  }), [selected, rates]);

  return <CurrencyCtx.Provider value={value}>{children}</CurrencyCtx.Provider>;
}

export function useCurrency() {
  return useContext(CurrencyCtx);
}
