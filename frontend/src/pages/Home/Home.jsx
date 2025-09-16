import { useEffect, useState } from "react";
import { fetchTShirts } from "../../api/tshirts";
import TShirtCard from "../../components/TShirtCard/TShirtCard.jsx";
import "./Home.css";

export default function Home() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTShirts()
      .then((data) => setItems(Array.isArray(data.items) ? data.items : []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="home-loading">Loading…</p>;

  return (
    <section className="home">
      <h1 className="home-title">Con Fuoco</h1>
      <div className="home-grid">
        {items.map((t) => (
          <TShirtCard key={t.id} t={t} />
        ))}
      </div>
    </section>
  );
}
