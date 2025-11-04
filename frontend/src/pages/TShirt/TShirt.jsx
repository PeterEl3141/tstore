import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTShirtBySlug } from "../../api/tshirts";
import ReviewList from "../../components/ReviewList/ReviewList.jsx";
import AddToCart from "../../components/AddToCart/AddToCart.jsx";
import { useCurrency } from "../../contexts/Currency/CurrencyContext.jsx";
import "./TShirt.css";
import { prioritizeImages } from "../../lib/images.js";

// ---- Color helpers ----
const COLOR_MAP = {
  Black:"#111827", Charcoal:"#374151", Grey:"#9ca3af", "Light Grey":"#d1d5db",
  White:"#ffffff", Cream:"#f5f0e6", Sand:"#e7d3ad", Khaki:"#c8b68e",
  Navy:"#0b2545", "Royal Blue":"#4169e1", Blue:"#3b82f6", Teal:"#14b8a6",
  Green:"#10b981", Forest:"#065f46", Olive:"#6b8e23",
  Red:"#ef4444", Burgundy:"#8d021f", "Vivid Orange":"#ff6b00",
  Mustard:"#e0b300", Brown:"#8b5e3c", Purple:"#7e22ce", Pink:"#ec4899",
};
const LIGHT_NAMES = new Set(["White","Cream","Sand","Khaki","Light Grey"]);
const hexFor = (name) => COLOR_MAP[name] || "#eee";

// filename matching: “navy” matches “…-navy-…”, fallback to all
function filterImagesByColor(images = [], color = "") {
  if (!images.length) return [];
  if (!color) return images;
  const key = color.toLowerCase().replace(/\s+/g, "-");
  const hits = images.filter(u => u.toLowerCase().includes(key));
  return hits.length ? hits : images;
}

export default function TShirt() {
  const { slug } = useParams();
  const [t, setT] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [color, setColor] = useState(null);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTShirtBySlug(slug)
      .then((d) => {
        if (cancelled) return;
        setT(d);
        // prefer live spec colors, else product colorOptions
        const firstColor =
          d?.currentSpec?.colors?.[0] ||
          d?.colorOptions?.[0] ||
          null;
        setColor(firstColor);
        setIdx(0);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [slug]);

  // Sort all images with PNGs first once per product
  const sortedAll = useMemo(
    () => prioritizeImages(t?.images || []),
    [t]
  );

  // Then filter by currently selected color
  const imagesForColor = useMemo(
    () => filterImagesByColor(sortedAll, color),
    [sortedAll, color]
  );

  const hero =
    imagesForColor[idx] ||
    t?.currentSpec?.frontFileUrl ||
    sortedAll[0] ||
    t?.images?.[0] ||
    null;

  const canPurchase = !!t?.currentSpec;

  function next() {
    setIdx(i => (i + 1) % Math.max(1, imagesForColor.length));
  }
  function prev() {
    const n = Math.max(1, imagesForColor.length);
    setIdx(i => (i - 1 + n) % n);
  }
  // reset carousel when color changes
  useEffect(() => { setIdx(0); }, [color]);

  if (loading) return <p className="tshirt-loading">Loading…</p>;
  if (!t) return <p className="tshirt-notfound">Not found</p>;

  const { format } = useCurrency();

  return (
    <article className="tshirt-page">
      {/* Gallery */}
      {hero && (
        <div className="tshirt-gallery" aria-label="Product gallery">
          <img className="tshirt-image" src={hero} alt={t.name} />
          {imagesForColor.length > 1 && (
            <>
              <button className="gal-nav gal-prev" onClick={prev} aria-label="Previous image">‹</button>
              <button className="gal-nav gal-next" onClick={next} aria-label="Next image">›</button>
            </>
          )}
          {imagesForColor.length > 1 && (
            <div className="gal-dots">
              {imagesForColor.map((_, i) => (
                <button
                  key={i}
                  className={`gal-dot ${i === idx ? "is-active" : ""}`}
                  onClick={() => setIdx(i)}
                  aria-label={`Show image ${i + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Info / purchase */}
      <div className="tshirt-info">
        <header className="tshirt-header">
          <h1 className="tshirt-title">{t.name}</h1>
          <div className="tshirt-price">{format(t.priceCents)}</div>
          <div className="tshirt-price-note">(Charged in GBP; other currencies are estimates)</div>
        </header>

        <p className="tshirt-description">{t.description}</p>

        {/* Color swatches (drives AddToCart visually) */}
        {t.colorOptions?.length > 0 && (
          <div className="tshirt-colors">
            <div className="tshirt-colors-label">Color</div>
            <div className="tshirt-swatches">
              {t.colorOptions.map((c) => (
                <button
                  type="button"
                  key={c}
                  className={`swatch ${color === c ? "is-active" : ""} ${LIGHT_NAMES.has(c) ? "is-outline" : ""}`}
                  onClick={() => setColor(c)}
                  title={c}
                  style={{ backgroundColor: hexFor(c) }}
                />
              ))}
            </div>
          </div>
        )}

        {canPurchase ? (
          // pass the selected color to AddToCart so checkout uses it
          <AddToCart product={t} color={color} />
        ) : (
          <p className="tshirt-notfound">This item isn’t available yet.</p>
        )}
      </div>

      <section className="tshirt-reviews">
        <h2 className="tshirt-reviews-title">Reviews</h2>
        <ReviewList reviews={t.reviews ?? []} />
      </section>
    </article>
  );
}
