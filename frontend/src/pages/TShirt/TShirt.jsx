import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchTShirtBySlug } from "../../api/tshirts";
import ReviewList from "../../components/ReviewList/ReviewList.jsx";
import AddToCart from "../../components/AddToCart/AddToCart.jsx";
import { formatMoney } from "../../lib/money";
import "./TShirt.css";

export default function TShirt() {
  const { slug } = useParams();
  const [t, setT] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchTShirtBySlug(slug).then(setT).finally(() => setLoading(false));
  }, [slug]);

  // ✅ Hooks must be unconditionally called on every render
  const hero = useMemo(
    () => t?.currentSpec?.frontFileUrl || t?.images?.[0] || null,
    [t]
  );
  const canPurchase = !!t?.currentSpec; // no hook needed for this

  // Early returns below (after all hooks)
  if (loading) return <p className="tshirt-loading">Loading…</p>;
  if (!t) return <p className="tshirt-notfound">Not found</p>;

  return (
    <article className="tshirt-page">
      <header className="tshirt-header">
        <h1 className="tshirt-title">{t.name}</h1>
        <div className="tshirt-price">{formatMoney(t.priceCents)}</div>
      </header>

      {hero && <img className="tshirt-image" src={hero} alt={t.name} />}

      {canPurchase ? (
        <AddToCart product={t} />
      ) : (
        <p className="tshirt-notfound">This item isn’t available yet.</p>
      )}

      <p className="tshirt-description">{t.description}</p>

      <section className="tshirt-reviews">
        <h2 className="tshirt-reviews-title">Reviews</h2>
        <ReviewList reviews={t.reviews ?? []} />
      </section>
    </article>
  );
}
