import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTShirtBySlug } from "../../api/tshirts";
import ReviewList from "../../components/ReviewList/ReviewList.jsx";
import ReviewForm from "../../components/ReviewForm/ReviewForm.jsx";
import AddToCart from "../../components/AddToCart/AddToCart.jsx";
import { useCurrency } from "../../contexts/Currency/CurrencyContext.jsx";
import "./TShirt.css";
import { useAuth } from "../../contexts/Auth/AuthContext.jsx";
import { api } from "../../api/client";
import Loader from "../../components/Loader/Loader.jsx";


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

// ---- Display ↔ Canonical mapping helpers ----

// Special cases where the canonical (stored) name differs from the display name
const DISPLAY_TO_CANON = new Map([
  ["Charcoal",     "dark-heather"],
  ["Vivid Orange", "gold"],
  ["Burgundy",     "cardinal-red"],
  ["Pink",         "heliconia"],
]);

// Build reverse map, including identity mappings for all COLOR_MAP keys
const CANON_TO_DISPLAY = new Map([
  // reverse of the special cases above
  ...[...DISPLAY_TO_CANON].map(([display, canon]) => [canon.toLowerCase(), display]),
  // identity for colors that map to themselves (e.g., "Navy" -> "navy")
  ...Object.keys(COLOR_MAP).map((display) => [
    display.toLowerCase().replace(/\s+/g, "-"),
    display,
  ]),
]);

const slug = (s = "") => String(s).trim().toLowerCase().replace(/\s+/g, "-");

/** Normalize any label (display or already-canonical) to canonical slug form */
function toCanon(label = "") {
  if (DISPLAY_TO_CANON.has(label)) return DISPLAY_TO_CANON.get(label);
  return slug(label);
}

/** Hex for either a display name ("Burgundy") OR canonical token ("cardinal-red") */
function colorHex(nameOrCanon = "") {
  if (!nameOrCanon) return "#eee";
  // 1) direct display hit
  if (COLOR_MAP[nameOrCanon]) return COLOR_MAP[nameOrCanon];
  // 2) canonical → display
  const disp = CANON_TO_DISPLAY.get(slug(nameOrCanon));
  if (disp && COLOR_MAP[disp]) return COLOR_MAP[disp];
  // 3) last resort: Title Case guess (keeps working if you later add to COLOR_MAP)
  const guess = String(nameOrCanon).replace(/-/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
  return COLOR_MAP[guess] || "#eee";
}

/** Light-outline check for display or canonical */
function isLight(nameOrCanon = "") {
  if (LIGHT_NAMES.has(nameOrCanon)) return true;               // display form
  const disp = CANON_TO_DISPLAY.get(slug(nameOrCanon));         // canonical → display
  return disp ? LIGHT_NAMES.has(disp) : false;
}


// ---- Parse "url | Color, Color" lines from t.images into metadata ----
function parseImageEntry(line = "") {
  const [rawUrl = "", rawTags = ""] = String(line).split("|");
  const url = rawUrl.trim();
  const tags = rawTags
    .split(",")
    .map(s => s.trim())
    .filter(Boolean)
    .map(toCanon); 
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
  const { user } = useAuth();

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
    try {
      const [listRes, summaryRes] = await Promise.all([
        api.get(`/tshirts/${t.id}/reviews`, { params: { limit: REV_LIMIT, offset: 0 } }),
        api.get(`/tshirts/${t.id}/reviews/summary`),
      ]);
      if (cancelled) return;

      const list = listRes.data;
      const summary = summaryRes.data;

      setReviews(list.items || []);
      setRevCount(list.count || 0);
      setRevOffset(list.items?.length || 0);
      setAvgRating(summary?.avgRating ?? null);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
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

    const wanted = toCanon(color); 
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
    const { data: r } = await api.get(`/tshirts/${t.id}/reviews`, {
      params: { limit: REV_LIMIT, offset: revOffset },
    });
    setReviews((prev) => [...prev, ...(r.items || [])]);
    setRevOffset((o) => o + (r.items?.length || 0));
  } finally {
    setLoadingMoreReviews(false);
  }
}

// deletion handler
async function handleReviewDelete(r) {
  if (!t?.id) return;
  const ok = window.confirm("Delete this review?");
  if (!ok) return;

  try {
    await api.delete(`/tshirts/${t.id}/reviews/${r.id}`);
    setReviews((prev) => prev.filter((x) => x.id !== r.id));
    setRevCount((c) => Math.max(0, c - 1));
    // adjust average optimistically (simple recalculation)
    setAvgRating((prev) => {
      if (!reviews.length) return prev;
      const total = reviews.reduce((n, x) => n + x.rating, 0) - r.rating;
      const nextCount = reviews.length - 1;
      return nextCount > 0 ? total / nextCount : null;
    });
  } catch (err) {
    alert(err?.response?.data?.message || err.message || "Failed to delete review");
  }
}


  if (loading) return <Loader label="Loading product" />;
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
  <div className="tshirt-info-inner">
    <header className="tshirt-header">
      <h1 className="tshirt-title">{t.name}</h1>
      <div className="tshirt-price">{format(t.priceCents)}</div>
      <div className="tshirt-price-note">(Charged in GBP; other currencies are estimates)</div>
    </header>

    <p className="tshirt-description">{t.description}</p>

    {t.colorOptions?.length > 0 && (
      <div className="tshirt-colors">
        <div className="tshirt-colors-label">Color</div>
        <div className="tshirt-swatches">
          {t.colorOptions.map((c) => (
            <button
              type="button"
              key={c}
              className={`swatch ${color === c ? "is-active" : ""} ${isLight(c) ? "is-outline" : ""}`}
              onClick={() => setColor(c)}
              title={c}
              style={{ backgroundColor: colorHex(c) }}
            />
          ))}
        </div>
      </div>
    )}

    {canPurchase ? (
      <AddToCart product={t} color={color} image={hero} />
    ) : (
      <p className="tshirt-notfound">This item isn’t available yet.</p>
    )}
  </div>
</div>

      {/* Reviews */}
      <section className="tshirt-reviews">
        <div className="tshirt-reviews-header" style={{display:"flex", alignItems:"center", gap:12}}>
          <h2 className="tshirt-reviews-title">Reviews</h2>
          {avgRating != null && (
            <span className="tshirt-reviews-chip">{avgRating.toFixed(1)}★ ({revCount})</span>
          )}
        </div>

        <ReviewList reviews={reviews} currentUser={user}
          onDelete={handleReviewDelete}/>
        <ReviewForm tshirtId={t.id} onAdd={handleReviewAdd} />

        

        {reviews.length < revCount && (
          <button onClick={loadMoreReviews} disabled={loadingMoreReviews}>
            {loadingMoreReviews ? "Loading…" : "Load more"}
          </button>
        )}
      </section>
    </article>
  );
}
