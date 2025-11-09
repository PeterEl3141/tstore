import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTShirtBySlug } from "../../api/tshirts";
import ReviewList from "../../components/ReviewList/ReviewList.jsx";
import ReviewForm from "../../components/ReviewForm/ReviewForm.jsx";
import AddToCart from "../../components/AddToCart/AddToCart.jsx";
import { useCurrency } from "../../contexts/Currency/CurrencyContext.jsx";
import "./TShirt.css";

// ---- Color helpers (name -> hex, outline, etc.) ----
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

// ---- Color synonyms (editor/customer names -> gelato-ish slugs) ----
const COLOR_SYNONYMS = new Map([
  ["charcoal", "dark-heather"],
  ["dark heather", "dark-heather"],
  ["vivid orange", "gold"],
  ["vibrant orange", "gold"],
  ["burgundy", "cardinal-red"],
]);
const norm = (s = "") => {
  const k = s.trim().toLowerCase();
  return COLOR_SYNONYMS.get(k) || k;
};

// ---- Parse "url | Color, Color" lines from t.images into metadata ----
function parseImageEntry(line = "") {
  const [rawUrl = "", rawTags = ""] = String(line).split("|");
  const url = rawUrl.trim();
  const tags = rawTags
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(norm);
  return { url, tags };
}

// ---- Prefer PNG, “-1”, “front” when ordering candidates ----
function prioritizeImagesMeta(entries = []) {
  const score = (u) => {
    const s = u.toLowerCase();
    let n = 0;
    if (s.endsWith(".png")) n += 3;
    if (s.includes("-1") || s.includes("_1")) n += 2;
    if (s.includes("front")) n += 1;
    return n;
  };
  return [...entries].sort((a, b) => score(b.url) - score(a.url));
}

const REV_LIMIT = 10;

export default function TShirt() {
  const { slug } = useParams();
  const [t, setT] = useState(null);
  const [loading, setLoading] = useState(true);

  // UI state
  const [color, setColor] = useState(null);
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1); // 1 = next/right, -1 = prev/left

  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [revCount, setRevCount] = useState(0);
  const [avgRating, setAvgRating] = useState(null);
  const [revOffset, setRevOffset] = useState(0);
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTShirtBySlug(slug)
      .then((d) => {
        if (cancelled) return;
        setT(d);
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

  // Fetch reviews + summary when we have a product id
  useEffect(() => {
    if (!t?.id) return;
    let cancelled = false;

    (async () => {
      const [list, summary] = await Promise.all([
        fetch(`/api/tshirts/${t.id}/reviews?limit=${REV_LIMIT}&offset=0`).then(r => r.json()),
        fetch(`/api/tshirts/${t.id}/reviews/summary`).then(r => r.json()),
      ]);
      if (cancelled) return;
      setReviews(list.items || []);
      setRevCount(list.count || 0);
      setRevOffset(list.items?.length || 0);
      setAvgRating(summary?.avgRating ?? null);
    })();

    return () => { cancelled = true; };
  }, [t?.id]);

  // Convert t.images -> [{url, tags}] once per product
  const allEntries = useMemo(() => {
    const raw = Array.isArray(t?.images) ? t.images : [];
    return raw.map(parseImageEntry).filter(e => !!e.url);
  }, [t]);

  // Order candidates (PNG first, “-1”, “front”)
  const prioritized = useMemo(() => prioritizeImagesMeta(allEntries), [allEntries]);

  // Filter by selected color, but always include neutrals
  const imagesForColor = useMemo(() => {
    if (!prioritized.length) return [];
    if (!color) return prioritized.map(e => e.url);

    const wanted = norm(color);
    const base = prioritized.filter(e => e.tags.length === 0 || e.tags.includes("any"));
    const tagged = prioritized.filter(e => e.tags.includes(wanted));

    if (tagged.length) return [...tagged, ...base].map(e => e.url);

    // Heuristic fallback if nothing is tagged for this color
    const hits = prioritized.filter(e => e.url.toLowerCase().includes(wanted));
    return (hits.length ? [...hits, ...base] : prioritized).map(e => e.url);
  }, [prioritized, color]);

  const hero =
    imagesForColor[idx] ||
    t?.currentSpec?.frontFileUrl ||
    allEntries[0]?.url ||
    t?.images?.[0] ||
    null;

  const canPurchase = !!t?.currentSpec;

  function next() {
    setDir(1);
    setIdx(i => (i + 1) % Math.max(1, imagesForColor.length));
  }
  function prev() {
    setDir(-1);
    setIdx(i => (i - 1 + Math.max(1, imagesForColor.length)) % Math.max(1, imagesForColor.length));
  }

  // when color changes, reset index and slide in from right
  useEffect(() => { setDir(1); setIdx(0); }, [color]);

  // Optimistic add from ReviewForm
  function handleReviewAdd(newRev) {
    setReviews((prev) => [newRev, ...prev]);
    setRevCount((c) => {
      const nextC = c + 1;
      setAvgRating((prevAvg) => {
        if (prevAvg == null || isNaN(prevAvg)) return newRev.rating;
        return ((prevAvg * c) + newRev.rating) / nextC; // c is previous count
      });
      return nextC;
    });
  }

  async function loadMoreReviews() {
    if (!t?.id) return;
    setLoadingMoreReviews(true);
    try {
      const r = await fetch(`/api/tshirts/${t.id}/reviews?limit=${REV_LIMIT}&offset=${revOffset}`).then(r => r.json());
      setReviews((prev) => [...prev, ...(r.items || [])]);
      setRevOffset((o) => o + (r.items?.length || 0));
    } finally {
      setLoadingMoreReviews(false);
    }
  }

  if (loading) return <p className="tshirt-loading">Loading…</p>;
  if (!t) return <p className="tshirt-notfound">Not found</p>;

  const { format } = useCurrency();

  return (
    <article className="tshirt-page">
      {/* Gallery */}
      {hero && (
        <div className="tshirt-gallery" aria-label="Product gallery">
          <img
            key={idx}
            className={`tshirt-image slide ${dir > 0 ? "from-right" : "from-left"}`}
            src={hero}
            alt={t.name}
          />
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
          <AddToCart product={t} color={color} />
        ) : (
          <p className="tshirt-notfound">This item isn’t available yet.</p>
        )}
      </div>

      {/* Reviews */}
      <section className="tshirt-reviews">
        <div className="tshirt-reviews-header" style={{display:"flex", alignItems:"center", gap:12}}>
          <h2 className="tshirt-reviews-title">Reviews</h2>
          {avgRating != null && (
            <span className="tshirt-reviews-chip">{avgRating.toFixed(1)}★ ({revCount})</span>
          )}
        </div>

        <ReviewForm tshirtId={t.id} onAdd={handleReviewAdd} />

        <ReviewList reviews={reviews} />

        {reviews.length < revCount && (
          <button onClick={loadMoreReviews} disabled={loadingMoreReviews}>
            {loadingMoreReviews ? "Loading…" : "Load more"}
          </button>
        )}
      </section>
    </article>
  );
}
