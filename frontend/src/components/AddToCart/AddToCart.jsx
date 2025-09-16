// frontend/src/components/AddToCart/AddToCart.jsx
import { useEffect, useMemo, useState } from "react";
import { useCart } from "../../contexts/Cart/CartContext.jsx";

export default function AddToCart({ product: t }) {
  const { add } = useCart();

  // Available options: prefer published spec colors, then fallback to product arrays
  const colors = useMemo(
    () => (t?.currentSpec?.colors?.length ? t.currentSpec.colors : (t?.colorOptions || [])),
    [t?.currentSpec?.colors, t?.colorOptions]
  );
  const sizes = useMemo(
    () => (Array.isArray(t?.sizeOptions) ? t.sizeOptions : []),
    [t?.sizeOptions]
  );

  const [color, setColor] = useState(colors[0] || "");
  const [size, setSize] = useState(sizes[0] || "");
  const [qty, setQty] = useState(1);

  // Reset defaults when product/spec changes
  useEffect(() => {
    setColor(colors[0] || "");
    setSize(sizes[0] || "");
  }, [t?.id, t?.currentSpec?.id, colors, sizes]);

  const canAdd = Boolean(t?.id && color && size);

  function onAdd(e) {
    e.preventDefault();
    if (!canAdd) {
      alert("Please pick a size and color.");
      return;
    }
    add({
      id: t.id,
      slug: t.slug,
      name: t.name,
      priceCents: t.priceCents,
      currency: t.currency,
      // crucial for checkout:
      size,
      color,
      qty: Number(qty) || 1,
    });
  }

  return (
    <form className="add-to-cart" onSubmit={onAdd}>
      <label>
        Size
        <select value={size} onChange={(e)=>setSize(e.target.value)}>
          {sizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </label>

      <label>
        Color
        <select value={color} onChange={(e)=>setColor(e.target.value)}>
          {colors.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </label>

      <label>
        Qty
        <input type="number" min="1" value={qty} onChange={(e)=>setQty(e.target.value)} />
      </label>

      <button type="submit" disabled={!canAdd}>Add to cart</button>
    </form>
  );
}
