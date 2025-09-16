import { gelato } from "../lib/gelato.js";
import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

function idemKey(orderId, paymentIntentId) {
  // idempotency across retries; Gelato accepts custom headers
  return `order-${orderId}-pi-${paymentIntentId}`;
}

function normalizePhone(phone = "", country = "") {
  const p = String(phone).trim();
  if (!p) return "";                        // allowed but Gelato might warn
  // Basic cleanup (allow digits, +, spaces, () and -)
  const cleaned = p.replace(/[^0-9+()\-\s]/g, "");
  return cleaned;
}

function toGelatoAddress(order) {
  const phone = normalizePhone(order.shippingPhone, order.shippingCountry);

  return {
    companyName: order.shippingName || undefined,
    firstName: order.shippingName || "Customer",
    lastName: "",
    addressLine1: order.shippingLine1,
    addressLine2: order.shippingLine2 || "",
    state: order.shippingState || "",
    city: order.shippingCity,
    postCode: order.shippingPostCode,
    country: order.shippingCountry, // ISO-2, e.g. "US"
    email: order.email,
    phone,
  };
}

function returnAddressFromEnv() {
  return {
    companyName: process.env.RETURN_NAME || "Returns",
    addressLine1: process.env.RETURN_LINE1 || "",
    addressLine2: process.env.RETURN_LINE2 || "",
    state: process.env.RETURN_STATE || "",
    city: process.env.RETURN_CITY || "",
    postCode: process.env.RETURN_POSTCODE || "",
    country: process.env.RETURN_COUNTRY || "US",
    email: process.env.RETURN_EMAIL || "support@example.com",
    phone: process.env.RETURN_PHONE || "n/a",
  };
}

/**
 * Creates a Gelato order for a PAID order.
 * Safe to call multiple times: will no-op if gelatoOrderId is already set.
 */
export async function submitGelatoOrderForPaymentIntent(paymentIntentId) {
  const order = await prisma.order.findFirst({
    where: { paymentIntentId },
    include: {
      items: true,
    },
  });
  if (!order) return { skipped: true, reason: "order_not_found" };
  if (order.gelatoOrderId) return { skipped: true, reason: "already_submitted", gelatoOrderId: order.gelatoOrderId };

  // Pull spec + artwork for each item (they all usually share the same spec, but don’t assume)
  const specIds = Array.from(new Set(order.items.map(i => i.specId).filter(Boolean)));
  const specs = await prisma.printSpec.findMany({
    where: { id: { in: specIds } },
    select: { id: true, frontFileUrl: true, backFileUrl: true },
  });
  const specById = new Map(specs.map(s => [s.id, s]));

  // Build Gelato payload
  const items = order.items.map((li) => {
    const spec = li.specId ? specById.get(li.specId) : null;
    const files = [];
    if (spec?.frontFileUrl) files.push({ type: "default", url: spec.frontFileUrl });
    if (spec?.backFileUrl)  files.push({ type: "back",    url: spec.backFileUrl  });

    return {
      itemReferenceId: li.id,
      productUid: li.variantProductUid, // REQUIRED: mapped earlier in your spec
      files,                            // front/back artwork
      quantity: li.qty,
    };
  });

  const body = {
    orderType: "order",
    orderReferenceId: order.id,
    customerReferenceId: order.email,
    currency: order.currency,
    items,
    shipmentMethodUid: process.env.GELATO_SHIPMENT_UID || "express",
    shippingAddress: toGelatoAddress(order),
    returnAddress: returnAddressFromEnv(),
    metadata: [{ key: "payment_intent_id", value: order.paymentIntentId || "" }],
  };

  const headers = { "Idempotency-Key": idemKey(order.id, order.paymentIntentId || crypto.randomUUID()) };

  const resp = await gelato.post("/v4/orders", body, { headers });
  const gelatoOrderId = resp.data?.id || resp.data?.orderId || null;

  await prisma.order.update({
    where: { id: order.id },
    data: {
      gelatoOrderId,
      status: "SUBMITTED",
      submittedAt: new Date(),
    },
  });

  return { ok: true, gelatoOrderId };
}
