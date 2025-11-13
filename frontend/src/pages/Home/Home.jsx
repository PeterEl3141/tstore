// src/pages/Home/Home.jsx
import { useEffect, useState, useMemo } from "react";
import { fetchTShirts } from "../../api/tshirts";
import TShirtCard from "../../components/TShirtCard/TShirtCard.jsx";
import { prioritizeImages } from "../../lib/images";
import "./Home.css";

// Helper: robustly read category
function getCategory(t) {
  // adjust if your field is different (e.g., t.categorySlug)
  const raw = t?.category ?? t?.categorySlug ?? "";
  return String(raw).toUpperCase();
}

// Alternate ARTIST/PIECE if no rank is present
function interleaveByCategory(items, order = ["ARTIST", "PIECE"]) {
  const buckets = Object.fromEntries(order.map(k => [k, []]));
  const rest = [];
  for (const t of items) {
    const cat = getCategory(t);
    if (buckets[cat]) buckets[cat].push(t); else rest.push(t);
  }
  const out = [];
  let i = 0;
  const max = items.length + 5; // safety
  while ((buckets[order[0]].length || buckets[order[1]].length) && i < max) {
    const k = order[i % order.length];
    if (buckets[k].length) out.push(buckets[k].shift());
    i++;
  }
  return out.concat(rest);
}

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("ALL"); // ALL | ARTIST | PIECE

  useEffect(() => {
  let cancelled = false;
  const PAGE_SIZE = 50;

  (async () => {
    try {
      // 1) Fetch first page to learn `total`
      const first = await fetchTShirts({ page: 1, pageSize: PAGE_SIZE });
      if (cancelled) return;

      let all = first.items || [];
      const pages = Math.ceil((first.total || all.length) / (first.pageSize || PAGE_SIZE));

      // 2) Fetch remaining pages in parallel (if any)
      if (pages > 1) {
        const rest = await Promise.all(
          Array.from({ length: pages - 1 }, (_, i) =>
            fetchTShirts({ page: i + 2, pageSize: PAGE_SIZE })
          )
        );
        if (cancelled) return;
        all = all.concat(...rest.map(r => r.items || []));
      }

      setItems(all);
    } catch (e) {
      console.error("Failed to load products:", e);
      setItems([]);
    } finally {
      if (!cancelled) setLoading(false);
    }
  })();

  return () => { cancelled = true; };
}, []);


  // Apply filter
  const filtered = useMemo(() => {
    if (filter === "ALL") return items;
    return items.filter((t) => getCategory(t) === filter);
  }, [items, filter]);

  // Order: prefer rank asc if present; else fallback to ARTIST/PIECE interleave
  const ordered = useMemo(() => {
    const hasRank = filtered.some((t) => typeof t.rank === "number");
    if (hasRank) {
      return [...filtered].sort((a, b) => {
        const ar = typeof a.rank === "number" ? a.rank : 1000;
        const br = typeof b.rank === "number" ? b.rank : 1000;
        if (ar !== br) return ar - br;
        // tie-break by createdAt desc if available
        const ad = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bd = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bd - ad;
      });
    }
    // No rank? Alternate to keep variety.
    return interleaveByCategory(filtered, ["ARTIST", "PIECE"]);
  }, [filtered]);

  // Build cards with cover image
  const cards = useMemo(() => {
    return ordered.map((t) => {
      const preferredColor = t?.currentSpec?.colors?.[0] || t?.colorOptions?.[0] || "";
      const imgs = prioritizeImages(t?.images || [], preferredColor);
      const cover = imgs[0] || t?.currentSpec?.frontFileUrl || null;
      return { t, cover };
    });
  }, [ordered]);

  if (loading) return <p className="home-loading">Loading…</p>;

  return (
    <section className="home">
      <header className="home-header">
        <h1 className="home-title">Con Fuoco</h1>

        <div className="home-controls">
          <label className="filter">
            <span>Filter by:     </span>
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="ALL">All</option>
              <option value="ARTIST">Artists</option>
              <option value="PIECE">Compositions</option>
            </select>
          </label>
        </div>
      </header>

      <div className="home-grid">
        {cards.map(({ t, cover }) => (
          <TShirtCard key={t.id} t={t} cover={cover} />
        ))}
      </div>
    </section>
  );
}
