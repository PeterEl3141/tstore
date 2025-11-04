import { Link } from "react-router-dom";
import "./TShirtCard.css";
import { formatMoney } from "../../lib/money";

export default function TShirtCard({ t }) {
  function stripPipe(u = "") { return u.split("|")[0].trim(); }
  const imgList = Array.isArray(t.images) ? t.images.map(stripPipe) : [];
  const hero = imgList[0] || t.currentSpec?.frontFileUrl || null;

  return (
    <Link
      className="tshirt-card"
      to={`/t/${t.slug}`}
      aria-label={`${t.name} — ${formatMoney(t.priceCents)}`}
    >
      {hero && <img className="tshirt-card-image" src={hero} alt={t.name} />}
      <div className="tshirt-card-body">
        <h3 className="tshirt-card-title">{t.name}</h3>
        <p className="tshirt-card-price">{formatMoney(t.priceCents)}</p>
      </div>
    </Link>
  );
}
