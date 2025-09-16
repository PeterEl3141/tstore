import { Link } from "react-router-dom";
import "./TShirtCard.css";
import { formatMoney } from "../../lib/money";

export default function TShirtCard({ t }) {
  const img = t.images?.[0];

  return (
    <Link
      className="tshirt-card"
      to={`/t/${t.slug}`}
      aria-label={`${t.name} — ${formatMoney(t.priceCents)}`}
    >
      {img && <img className="tshirt-card-image" src={img} alt={t.name} />}
      <div className="tshirt-card-body">
        <h3 className="tshirt-card-title">{t.name}</h3>
        <p className="tshirt-card-price">{formatMoney(t.priceCents)}</p>
      </div>
    </Link>
  );
}
