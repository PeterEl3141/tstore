import axios from "axios";

const GELATO_BASE = process.env.GELATO_BASE || "https://order.gelatoapis.com";
const GKEY = process.env.GELATO_API_KEY;

export async function getGelatoOrder(gelatoOrderId) {
  const url = `${GELATO_BASE}/v4/orders/${gelatoOrderId}`;
  const res = await axios.get(url, {
    headers: { "X-API-KEY": GKEY, "Content-Type": "application/json" },
  });
  return res.data; // includes status, shipments, tracking, etc.
}

// simple mapper; adjust if you like different states
export function mapGelatoStatus(g) {
  const s = (g?.status || "").toUpperCase();
  if (s.includes("SHIPPED")) return "SHIPPED";
  if (s.includes("IN_PRODUCTION") || s.includes("PRODUCTION")) return "IN_PRODUCTION";
  if (s.includes("CANCEL")) return "CANCELLED";
  if (s.includes("CREATED") || s.includes("RECEIVED") || s.includes("QUEUED")) return "SUBMITTED";
  return s || "UNKNOWN";
}

export function extractTracking(g) {
  // Gelato response often contains shipments/fulfillments
  const shipments = g?.shipments || g?.fulfillments || [];
  for (const s of shipments) {
    const url = s?.trackingUrl || s?.tracking?.url;
    const num = s?.trackingNumber || s?.tracking?.number;
    const carrier = s?.carrier || s?.tracking?.carrier;
    if (url || num) return { trackingUrl: url || null, trackingNumber: num || null, carrier: carrier || null };
  }
  return { trackingUrl: null, trackingNumber: null, carrier: null };
}
