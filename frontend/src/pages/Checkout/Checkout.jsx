// frontend/src/pages/Checkout/Checkout.jsx
import { useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { createCheckout } from "../../api/orders";
import { useCart } from "../../contexts/Cart/CartContext.jsx";
import "./Checkout.css";

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
      confirmParams: { return_url: window.location.origin + "/checkout/success" },
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
  const [starting, setStarting] = useState(false);

  // Customer input
  const [email, setEmail] = useState("");
  const [addr, setAddr] = useState({
    name: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postCode: "",
    country: "GB", // ISO-2 preferred; user can overwrite
  });

  // Basic guard to enable the button
  const canStart = useMemo(() => {
    return Boolean(
      items?.length > 0 &&
      email &&
      addr.name &&
      addr.line1 &&
      addr.city &&
      addr.postCode &&
      addr.country
    );
  }, [items, email, addr]);

  // Normalize a free-text country to ISO-2 where possible
  function toISO2(country) {
    if (!country) return "GB";
    const up = String(country).trim().toUpperCase();
    if (up.length === 2) return up;
    const MAP = {
      UK: "GB",
      "UNITED KINGDOM": "GB",
      "GREAT BRITAIN": "GB",
      "UNITED STATES": "US",
      USA: "US",
    };
    return MAP[up] || "GB";
  }

  // This is what was missing
  async function startCheckout(e) {
    e.preventDefault();
    if (!canStart || starting) return;

    setStarting(true);
    setErr("");

    try {
      const API = import.meta.env.VITE_API_URL;

      // 1) Region eligibility
      const iso2 = toISO2(addr.country);
      const eligRes = await fetch(`${API}/api/shipping/eligibility?country=${encodeURIComponent(iso2)}`, {
        credentials: "include",
      });
      const elig = await eligRes.json();
      if (!eligRes.ok || elig.eligible === false) {
        const reason = elig?.reason || "unavailable";
        throw new Error(
          reason === "sanctioned"
            ? "Sorry, we currently can’t ship to your country."
            : "Shipping to your country is unavailable right now."
        );
      }

      // 2) Create PaymentIntent via your server
      const payload = {
        currency: "GBP",
        email,
        shippingAddress: { ...addr, country: iso2 }, // ensure ISO-2
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

  return (
    <section className="checkout">
      <h1 className="checkout-title">Checkout</h1>

      {!clientSecret && (
        <form onSubmit={startCheckout} className="checkout-form">
          <label>
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <label>
            <span>Name</span>
            <input
              value={addr.name}
              onChange={(e) => setAddr((a) => ({ ...a, name: e.target.value }))}
              required
            />
          </label>

          <label>
            <span>Phone</span>
            <input
              type="tel"
              value={addr.phone}
              onChange={(e) => setAddr((a) => ({ ...a, phone: e.target.value }))}
              placeholder="+44 7123 456789"
              required
            />
          </label>

          <label>
            <span>Address line 1</span>
            <input
              value={addr.line1}
              onChange={(e) => setAddr((a) => ({ ...a, line1: e.target.value }))}
              required
            />
          </label>

          <label>
            <span>Address line 2 (optional)</span>
            <input
              value={addr.line2}
              onChange={(e) => setAddr((a) => ({ ...a, line2: e.target.value }))}
            />
          </label>

          <div className="field-row">
            <label>
              <span>City</span>
              <input
                value={addr.city}
                onChange={(e) => setAddr((a) => ({ ...a, city: e.target.value }))}
                required
              />
            </label>

            <label>
              <span>County/State (optional)</span>
              <input
                value={addr.state}
                onChange={(e) => setAddr((a) => ({ ...a, state: e.target.value }))}
              />
            </label>
          </div>

          <div className="field-row">
            <label>
              <span>Postcode</span>
              <input
                value={addr.postCode}
                onChange={(e) => setAddr((a) => ({ ...a, postCode: e.target.value }))}
                required
              />
            </label>

            <label>
              <span>Country (ISO-2 or name)</span>
              <input
                value={addr.country}
                onChange={(e) => setAddr((a) => ({ ...a, country: e.target.value }))}
                required
                placeholder="GB"
              />
            </label>
          </div>

          {err && <div className="form-error">{err}</div>}

          <button className="btn-primary" type="submit" disabled={!canStart || starting}>
            {starting ? "Preparing payment…" : "Continue to payment"}
          </button>
        </form>
      )}

      {clientSecret && (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm clientSecret={clientSecret} />
        </Elements>
      )}
    </section>
  );
}
