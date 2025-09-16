// frontend/src/pages/Checkout/Checkout.jsx
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { createCheckout } from "../../api/orders";
import { useCart } from "../../contexts/Cart/CartContext.jsx";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

function CheckoutForm({ clientSecret }) {
  const stripe = useStripe();
  const elements = useElements();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setBusy(true);
    setErr("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin + "/checkout/success",
      },
    });

    if (error) setErr(error.message || "Payment failed");
    setBusy(false);
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 520 }}>
      <PaymentElement />
      {err && <div style={{ color: "crimson" }}>{err}</div>}
      <button disabled={!stripe || busy}>{busy ? "Processing…" : "Pay now"}</button>
    </form>
  );
}

export default function Checkout() {
  const { items } = useCart();
  const [clientSecret, setClientSecret] = useState(null);
  const [err, setErr] = useState("");

  // Email + shipping address form state
  const [email, setEmail] = useState("");
  const [addr, setAddr] = useState({
    name: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postCode: "",
    country: "GB",
    phone: "", 
  });
  const [starting, setStarting] = useState(false);

  const canStart =
    email &&
    addr.name &&
    addr.line1 &&
    addr.city &&
    addr.postCode &&
    addr.country &&
    addr.phone && addr.phone.trim().length >= 4 &&   
    items.length > 0;

  async function startCheckout(e) {
    e.preventDefault();
    if (!canStart) return;
    setErr("");
    setStarting(true);
    setClientSecret(null);

    try {
      const payload = {
        currency: "GBP",
        email,
        shippingAddress: addr,
        items: items.map((i) => ({
          productId: i.id,
          size: i.size,
          color: i.color,
          qty: i.qty,
        })),
      };

      const data = await createCheckout(payload);
      setClientSecret(data.clientSecret);
    } catch (e) {
      setErr(e?.response?.data?.message || e.message || "Checkout failed");
    } finally {
      setStarting(false);
    }
  }

  if (items.length === 0 && !clientSecret) {
    return <p>Your cart is empty.</p>;
  }

  return (
    <section className="checkout" style={{ display: "grid", gap: 16 }}>
      <h1>Checkout</h1>

      {/* Step 1: collect contact + shipping; create PaymentIntent */}
      {!clientSecret && (
        <form onSubmit={startCheckout} className="checkout-form" style={{ display: "grid", gap: 12, maxWidth: 520 }}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <label>
            Name
            <input
              value={addr.name}
              onChange={(e) => setAddr((a) => ({ ...a, name: e.target.value }))}
              required
            />
          </label>

          <label>
            Phone
            <input
              value={addr.phone}
              onChange={(e) => setAddr(a => ({ ...a, phone: e.target.value }))}
              placeholder="+44 7123 456789"
              required
            />
          </label>

          <label>
            Address line 1
            <input
              value={addr.line1}
              onChange={(e) => setAddr((a) => ({ ...a, line1: e.target.value }))}
              required
            />
          </label>

          <label>
            Address line 2 (optional)
            <input
              value={addr.line2}
              onChange={(e) => setAddr((a) => ({ ...a, line2: e.target.value }))}
            />
          </label>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              City
              <input
                value={addr.city}
                onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))}
                required
              />
            </label>

            <label>
              County/State (optional)
              <input
                value={addr.state}
                onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))}
              />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <label>
              Postcode
              <input
                value={addr.postCode}
                onChange={(e) => setAddr((a) => ({ ...a, postCode: e.target.value }))}
                required
              />
            </label>

            <label>
              Country (ISO-2)
              <input
                value={addr.country}
                onChange={(e) =>
                  setAddr((a) => ({ ...a, country: e.target.value.toUpperCase() }))
                }
                required
                placeholder="GB"
              />
            </label>
          </div>

          {err && <div style={{ color: "crimson" }}>{err}</div>}
          <button type="submit" disabled={!canStart || starting}>
            {starting ? "Preparing payment…" : "Continue to payment"}
          </button>
        </form>
      )}

      {/* Step 2: render PaymentElement with returned clientSecret */}
      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} />
        </Elements>
      )}
    </section>
  );
}
