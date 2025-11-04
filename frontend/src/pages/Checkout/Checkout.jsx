// frontend/src/pages/Checkout/Checkout.jsx
import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { createCheckout } from "../../api/orders";
import { useCart } from "../../contexts/Cart/CartContext.jsx";
import { useEffect } from "react";
import './Checkout.css'
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

  // Helper: normalize country to ISO-2 (handles common names)
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

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        setErr("");
        setClientSecret(null);

        // Build your payload (keep your current values / form bindings)
        const payload = {
          currency: "GBP",
          email: "buyer@example.com",
          shippingAddress: {
            name: "Buyer Name",
            line1: "123 Main St",
            line2: "",
            city: "New York",
            state: "NY",
            postCode: "10001",
            country: "US", // can be "US" or a full name like "United States"
            phone: "+1 555 123 4567", // optional if you added phone
          },
          items: items.map(i => ({
            productId: i.id,
            size: i.size,
            color: i.color,
            qty: i.qty,
          })),
        };

        // --- REGION ELIGIBILITY CHECK (server) ---
        const API = import.meta.env.VITE_API_URL;
        const iso2 = toISO2(payload.shippingAddress.country);
        const res = await fetch(
          `${API}/api/shipping/eligibility?country=${encodeURIComponent(iso2)}`,
          { credentials: "include" }
        );
        const el = await res.json();

        if (!res.ok || el.eligible === false) {
          const reason = el?.reason || "unavailable";
          throw new Error(
            reason === "sanctioned"
              ? "Sorry, we currently can’t ship to your country."
              : "Shipping to your country is unavailable right now."
          );
        }

        // Ensure payload uses ISO-2 for the server
        payload.shippingAddress.country = iso2;

        // --- CREATE CHECKOUT / PAYMENT INTENT ---
        const data = await createCheckout(payload);
        if (cancelled) return;
        setClientSecret(data.clientSecret);
      } catch (e) {
        if (cancelled) return;
        setErr(e?.response?.data?.message || e.message || "Checkout failed");
      }
    }

    if (items && items.length > 0) run();
    return () => { cancelled = true; };
  }, [items]);
  // ----- return (...) goes below -----

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
              onChange={(e) => setAddr(a => ({ ...a, phone: e.target.value }))}
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
              <span>Country (ISO-2)</span>
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
