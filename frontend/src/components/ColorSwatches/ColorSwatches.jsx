// frontend/src/components/ColorSwatches/ColorSwatches.jsx
import "./ColorSwatches.css";

// UI palette (display names)
const PALETTE = [
  // Neutrals
  { name: "Black", css: "#111827" },
  { name: "Charcoal", css: "#374151" },
  { name: "Grey", css: "#9ca3af" },
  { name: "Light Grey", css: "#d1d5db", outline: true },
  { name: "White", css: "#ffffff", outline: true },
  { name: "Cream", css: "#f5f0e6", outline: true },
  { name: "Sand", css: "#e7d3ad", outline: true },
  { name: "Khaki", css: "#c8b68e", outline: true },

  // Blues/greens
  { name: "Navy", css: "#0b2545" },
  { name: "Royal Blue", css: "#4169e1" },
  { name: "Blue", css: "#3b82f6" },
  { name: "Teal", css: "#14b8a6" },
  { name: "Green", css: "#10b981" },
  { name: "Forest", css: "#065f46" },
  { name: "Olive", css: "#6b8e23" },

  // Warm colors
  { name: "Red", css: "#ef4444" },
  { name: "Burgundy", css: "#8d021f" },
  { name: "Vivid Orange", css: "#ff6b00" },
  { name: "Mustard", css: "#e0b300" },
  { name: "Brown", css: "#8b5e3c" },

  // Extras
  { name: "Purple", css: "#7e22ce" },
  { name: "Pink", css: "#ec4899" },
];

// Display → canonical (Gelato / backend) mapping
const DISPLAY_TO_CANON = {
  "Charcoal": "dark-heather",
  "Vivid Orange": "gold",
  "Burgundy": "cardinal-red",
  "Pink": "Heliconia",
  // identity cases (kept for clarity; optional)
  "Black": "black",
  "White": "white",
  "Navy": "navy",
  "Red": "red",
};

function toCanon(label) {
  if (!label) return "";
  return DISPLAY_TO_CANON[label] || label.toLowerCase().replace(/\s+/g, "-");
}

export default function ColorSwatches({ value = "", onChange }) {
  // Normalize incoming comma list to canonical tokens
  const selectedCanon = new Set(
    value
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(toCanon)
  );

  function toggle(displayName) {
    const canon = toCanon(displayName);
    const next = new Set(selectedCanon);
    next.has(canon) ? next.delete(canon) : next.add(canon);
    onChange([...next].join(",")); // emit canonical list
  }

  return (
    <div className="swatches">
      {PALETTE.map(({ name, css, outline }) => {
        const canon = toCanon(name);
        const active = selectedCanon.has(canon);
        return (
          <button
            type="button"
            key={name}
            title={name}
            onClick={() => toggle(name)}
            className={`swatch ${active ? "is-active" : ""} ${outline ? "is-outline" : ""}`}
            style={{ backgroundColor: css }}
          >
            {active && <span className="swatch-tick">✓</span>}
          </button>
        );
      })}
    </div>
  );
}
