// src/pages/Home/Home.jsx
import { useEffect, useState, useMemo } from "react";
import { fetchTShirts } from "../../api/tshirts";
import TShirtCard from "../../components/TShirtCard/TShirtCard.jsx";
import { prioritizeImages } from "../../lib/images"; 
import "./Home.css";

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTShirts()
      .then((data) => setItems(Array.isArray(data.items) ? data.items : []))
      .finally(() => setLoading(false));
  }, []);

  const cards = useMemo(() => {
    return items.map((t) => {
      // pick a “preferred” color to bias the sort a bit; totally optional
      const preferredColor =
        t?.currentSpec?.colors?.[0] ||
        t?.colorOptions?.[0] ||
        "";

      const imgs = prioritizeImages(t?.images || [], preferredColor);
      const cover =
        imgs[0] ||
        t?.currentSpec?.frontFileUrl ||
        null;

      return { t, cover };
    });
  }, [items]);

  if (loading) return <p className="home-loading">Loading…</p>;

  return (
    <section className="home">
      <h1 className="home-title">Con Fuoco</h1>
      <div className="home-grid">
        {cards.map(({ t, cover }) => (
          <TShirtCard key={t.id} t={t} cover={cover} />
        ))}
      </div>
    </section>
  );
}
