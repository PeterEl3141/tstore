import { useEffect, useMemo, useState } from "react";
import { useCart } from "../../contexts/Cart/CartContext.jsx";
import "./AddToCart.css";
import { toast } from "react-toastify";
import confetti from "canvas-confetti";

function stripPipe(u = "") {
  return String(u).split("|")[0].trim();
}

export default function AddToCart({ product: t, color, image }) {
  const { add } = useCart();

  const colors = useMemo(
    () => (t?.currentSpec?.colors?.length ? t.currentSpec.colors : t?.colorOptions || []),
    [t]
  );

  const sizes = useMemo(
    () =>
      t?.currentSpec?.variants?.length
        ? Array.from(new Set(t.currentSpec.variants.map((v) => v.size)))
        : t?.sizeOptions || ["S", "M", "L", "XL"],
    [t]
  );

  const [localColor, setLocalColor] = useState(colors[0] || "");
  const [size, setSize] = useState(sizes[0] || "");

  useEffect(() => {
    if (!color && colors.length && !localColor) setLocalColor(colors[0]);
  }, [color, colors, localColor]);

  const effectiveColor = color ?? localColor;

  function onAdd(e) {
    e?.preventDefault?.();

    if (!effectiveColor && colors.length) return alert("Please select a color.");
    if (!size && sizes.length) return alert("Please select a size.");

    const img =
      (image && stripPipe(image)) ||
      (t?.currentSpec?.frontFileUrl && stripPipe(t.currentSpec.frontFileUrl)) ||
      (t?.images?.[0] && stripPipe(t.images[0])) ||
      null;

    add({
      id: t.id,
      slug: t.slug,
      name: t.name,
      priceCents: t.priceCents,
      currency: t.currency || "GBP",
      color: effectiveColor,
      size: String(size || "").toUpperCase(),
      qty: 1,
      image: img,
    });

    toast(
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <strong>Added to cart</strong>
        <span style={{ opacity: 0.9 }}>
          {t.name}
          {effectiveColor ? ` • ${effectiveColor}` : ""}
          {size ? ` • ${String(size).toUpperCase()}` : ""}
        </span>
        <button
          style={{ marginTop: 8, alignSelf: "flex-start" }}
          onClick={() => window.location.assign("/cart")}
        >
          View cart
        </button>
      </div>,
      { type: "success", toastId: `add:${t.id}:${effectiveColor}:${String(size).toUpperCase()}` }
    );

    const reduceMotion =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!reduceMotion) {
      confetti({
        particleCount: 70,
        spread: 70,
        startVelocity: 28,
        scalar: 0.9,
        origin: { x: 0.85, y: 0.12 },
      });
    }
  }

  return (
    <form className="addtocart addtocart--inline" onSubmit={onAdd}>
      {!color && colors.length > 0 && (
        <label className="addtocart-color">
          <span>Color</span>
          <select value={localColor} onChange={(e) => setLocalColor(e.target.value)}>
            {colors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      )}

      <label className="addtocart-size">
        <span>Size</span>
        <select value={size} onChange={(e) => setSize(e.target.value)}>
          {sizes.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <button className="addtocart-button" type="submit">
        Add to cart
      </button>
    </form>
  );
}
