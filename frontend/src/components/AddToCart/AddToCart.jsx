import { useEffect, useMemo, useState } from "react";
import { useCart } from "../../contexts/Cart/CartContext.jsx";
import './AddToCart.css';

// Same small safety net on the client:
// If a pretty label sneaks through, normalize before sending to API/cart.
const DISPLAY_TO_CANON = {
  "Charcoal": "dark-heather",
  "Vivid Orange": "gold",
  "Burgundy": "cardinal-red",
  "Black": "black",
  "White": "white",
  "Navy": "navy",
  "Red": "red",
};
function toCanon(label) {
  if (!label) return "";
  return DISPLAY_TO_CANON[label] || String(label).toLowerCase().replace(/\s+/g, "-");
}

export default function AddToCart({ product: t, color /* controlled from parent swatches */ }) {
  const { add } = useCart();

  // Available options (prefer currentSpec if present)
  const colors = useMemo(
    () => (t?.currentSpec?.colors?.length ? t.currentSpec.colors : (t?.colorOptions || [])),
    [t]
  );
  const sizes = useMemo(
    () => (t?.currentSpec?.variants?.length
      ? Array.from(new Set(t.currentSpec.variants.map(v => v.size)))
      : (t?.sizeOptions || ["S","M","L","XL"])),
    [t]
  );

  const [localColor, setLocalColor] = useState(colors[0] || "");
  const [size, setSize] = useState(sizes[0] || "");

  useEffect(() => {
    if (!color && colors.length && !localColor) setLocalColor(colors[0]);
  }, [color, colors, localColor]);

  const effectiveColor = color ?? localColor; // parent swatches win if provided

  function onAdd(e) {
    e?.preventDefault?.();
    if (!effectiveColor && colors.length) {
      alert("Please select a color.");
      return;
    }
    if (!size && sizes.length) {
      alert("Please select a size.");
      return;
    }

    add({
      id: t.id,
      name: t.name,
      priceCents: t.priceCents,
      currency: t.currency,
      color: toCanon(effectiveColor),     // 👈 ensure canonical here
      size: String(size || "").toUpperCase(),
      qty: 1,
      image: t.images?.[0] ?? t.currentSpec?.frontFileUrl ?? null,
    });
  }

  return (
    <form className="addtocart addtocart--inline" onSubmit={onAdd}>
      {/* If you’re using swatches on the product page, pass color prop and this select stays hidden */}
      {!color && colors.length > 0 && (
        <label className="addtocart-color">
          <span>Color</span>
          <select value={localColor} onChange={(e)=>setLocalColor(e.target.value)}>
            {colors.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
      )}

      <label className="addtocart-size">
        <span>Size</span>
        <select value={size} onChange={(e)=>setSize(e.target.value)}>
          {sizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <button className="addtocart-button" type="submit">Add to cart</button>
    </form>
  );
}
