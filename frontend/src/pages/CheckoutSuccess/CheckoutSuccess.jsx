import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../../contexts/Cart/CartContext.jsx";
import "./CheckoutSuccess.css";

// Util: load last checkout snapshot from localStorage (set during checkout)
function loadCheckoutSnapshot() {
  try {
    const raw = localStorage.getItem("checkout:last");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function CheckoutSuccess() {
  const { clear } = useCart();
  const [params] = useSearchParams();
  const orderId = params.get("order") || null;
  const isPreview = import.meta.env.DEV && params.get("preview") === "1";

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(!!orderId && !isPreview);
  const [error, setError] = useState("");

  // 1) In real success (not preview), clear the cart once on mount
  useEffect(() => {
    if (!isPreview) clear();
  }, [clear, isPreview]);

  // 2) Try to load order details
  //    Priority: previewMock → local snapshot → (optional) fetch by orderId
  const previewMock = useMemo(() => {
    if (!isPreview) return null;
    const now = new Date().toISOString();
    return {
      id: orderId || "TEST-ORDER-123",
      email: params.get("email") || "alice@example.com",
      createdAt: now,
      lineItems: [
        { id: "li_1", name: "Moby Tee — Navy / L", qty: 1, priceCents: 1999, img: "", color: "Navy" },
        { id: "li_2", name: "Ishmael Tee — Black / M", qty: 2, priceCents: 1899, img: "", color: "Black" },
      ],
      currency: "GBP",
      subtotalCents: 1999 + 2 * 1899,
      shippingCents: 395,
      taxCents: 0,
      totalCents: 1999 + 2 * 1899 + 395,
      address: { name: "Alice Example", city: "London", country: "GB" },
    };
  }, [isPreview, orderId, params]);

  useEffect(() => {
    if (isPreview) { setOrder(previewMock); return; }

    // Try local snapshot (from checkout submit)
    const snap = loadCheckoutSnapshot();
    if (snap) { setOrder(snap); }

    // If you have a backend order endpoint, you can enrich from it:
    async function maybeFetch() {
      if (!orderId) return;
      try {
        const r = await fetch(`/api/orders/${orderId}`);
        if (r.ok) {
          const data = await r.json();
          setOrder((prev) => ({ ...prev, ...data })); // merge snapshot + server
        } else {
          // non-fatal; keep snapshot UI
          // const { message } = await r.json().catch(() => ({}));
        }
      } catch (err) {
        setError("Could not load order details.");
      } finally {
        setLoading(false);
      }
    }
    maybeFetch();
  }, [isPreview, orderId, previewMock]);

  const cfmt = (cents, currency = order?.currency || "GBP") =>
    (cents == null ? "" : new Intl.NumberFormat(undefined, { style: "currency", currency }).format(cents / 100));

  return (
    <section className="checkout-success">
      <header className="checkout-success__header">
        <div className="icon">✓</div>
        <div>
          <h1>Thank you!</h1>
          <p>Your order has been received{orderId ? ` (ID: ${orderId})` : ""}.</p>
          {order?.email && <p>A confirmation has been sent to <strong>{order.email}</strong>.</p>}
        </div>
      </header>

      {/* Summary card */}
      <div className="checkout-success__card">
        {loading ? (
          <div className="skeleton">Loading order…</div>
        ) : (
          <>
            {order?.lineItems?.length ? (
              <ul className="order-lines">
                {order.lineItems.map((li) => (
                  <li key={li.id} className="order-line">
                    {li.img ? <img src={li.img} alt="" /> : <div className="thumb-fallback" />}
                    <div className="line-main">
                      <div className="line-name">{li.name}</div>
                      <div className="line-meta">Qty {li.qty}{li.color ? ` · ${li.color}` : ""}</div>
                    </div>
                    <div className="line-price">{cfmt(li.priceCents * li.qty)}</div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">We’ll email the full summary when the order is confirmed.</p>
            )}

            <div className="totals">
              <div><span>Subtotal</span><span>{cfmt(order?.subtotalCents)}</span></div>
              <div><span>Shipping</span><span>{cfmt(order?.shippingCents)}</span></div>
              {order?.taxCents != null && <div><span>Tax</span><span>{cfmt(order.taxCents)}</span></div>}
              <div className="total"><span>Total</span><span>{cfmt(order?.totalCents)}</span></div>
            </div>

            {order?.address && (
              <div className="address">
                <div className="address-title">Shipping to</div>
                <div className="address-body">
                  {order.address.name}<br />
                  {order.address.city}{order.address.country ? `, ${order.address.country}` : ""}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      <div className="actions">
        <Link to="/account" className="btn secondary">View orders</Link>
        <Link to="/" className="btn">Continue shopping</Link>
      </div>

      {isPreview && (
        <p className="dev-note">
          Preview mode: add <code>order</code> and <code>email</code> params to test. Cart is not cleared.
        </p>
      )}
    </section>
  );
}
