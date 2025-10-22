import { useCurrency } from "../../contexts/Currency/CurrencyContext.jsx";

export default function CurrencySelector() {
  const { selected, setSelected, DISPLAY } = useCurrency();
  return (
    <select
      value={selected}
      onChange={e => setSelected(e.target.value)}
      style={{ background: "transparent", border: "1px solid #ddd", borderRadius: 6, padding: "4px 8px" }}
      aria-label="Currency"
    >
      {DISPLAY.map(c => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}
