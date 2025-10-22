import { useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../../contexts/Cart/CartContext.jsx";
import "./CheckoutSuccess.css";

export default function CheckoutSuccess() {
  const { clear } = useCart();
  const [params] = useSearchParams();
  const orderId = params.get("order") || null; // if you add it later

  useEffect(() => { clear(); }, [clear]);

  return (
    <section className="checkout-success">
      <h1>Thank you!</h1>
      <p>Your order has been received{orderId ? ` (ID: ${orderId})` : ""}.</p>
      <p>We’ll email you tracking details as soon as it ships.</p>
      <Link to="/">Back to store</Link>
    </section>
  );
}
