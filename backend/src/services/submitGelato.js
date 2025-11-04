// src/services/submitGelato.js

import { gelato } from "../lib/gelato.js";
// If your prisma export is default, change to: import prisma from "../lib/prisma.js";
import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

/**
 * Optional brand inside-neck label (PNG/JPG) you uploaded to S3.
 * Example:
 *   BRAND_LABEL_INSIDE_URL=https://tstore-uploads.s3.eu-north-1.amazonaws.com/logo.png
 */
const brandNeckUrl = (process.env.BRAND_LABEL_INSIDE_URL || "").trim();

/** Build a stable idempotency key per order/PI so retries don't duplicate orders in Gelato */
function idemKey(orderId, paymentIntentId) {
  return `order-${orderId}-pi-${paymentIntentId}`;
}

/** Mild phone cleanup so Gelato accepts it */
function normalizePhone(phone = "", country = "") {
  const p = String(phone).trim();
  if (!p) return "";  // allowed; Gelato may warn, but will accept
  return p.replace(/[^0-9+()\-\s]/g, "");
}

/** Map our Order shipping fields to Gelato's address payload */
function toGelatoAddress(order) {
  const phone = normalizePhone(order.shippingPhone, order.shippingCountry);
  return {
    companyName: order.shippingName || undefined, // optional
    firstName: order.shippingName || "Customer",
    lastName: "",
    addressLine1: order.shippingLine1,
    addressLine2: order.shippingLine2 || "",
    state:       order.shippingState  || "",
    city:        order.shippingCity,
    postCode:    order.shippingPostCode,
    country:     order.shippingCountry, // must be ISO-2 (e.g. "GB", "US")
    email:       order.email,
    phone,
  };
}

/** Return address (from env) required by Gelato */
function returnAddressFromEnv() {
  return {
    companyName: process.env.RETURN_NAME || "Returns",
    addressLine1: process.env.RETURN_LINE1 || "",
    addressLine2: process.env.RETURN_LINE2 || "",
    state:        process.env.RETURN_STATE   || "",
    city:         process.env.RETURN_CITY    || "",
    postCode:     process.env.RETURN_POSTCODE|| "",
    country:      process.env.RETURN_COUNTRY || "US",
    email:        process.env.RETURN_EMAIL   || "support@example.com",
    phone:        process.env.RETURN_PHONE   || "n/a",
  };
}

/**
 * Helper: build the per-item `files` array that Gelato expects.
 * - Gelato accepts "default" (front) and "back" for apparel DTG.
 * - We append "neck-inner" if BRAND_LABEL_INSIDE_URL is present.
 *
 * If you ever hit a 4xx from Gelato about unsupported print areas for a SKU,
 * simply remove the neck-inner push for that SKU before submitting.
 */
function buildFilesForItem({ frontUrl, backUrl }) {
  const files = [];
  if (frontUrl) files.push({ type: "default",   url: frontUrl }); // "default" = front
  if (backUrl)  files.push({ type: "back",      url: backUrl  });
  if (brandNeckUrl) files.push({ type: "inner-neck", url: brandNeckUrl });
  return files;
}

/**
 * Creates a Gelato order for a PAID order.
 * Safe to call multiple times: will no-op if gelatoOrderId is already set.
 */
export async function submitGelatoOrderForPaymentIntent(paymentIntentId) {
  // 1) Find the order for this PaymentIntent
  const order = await prisma.order.findFirst({
    where: { paymentIntentId },
    include: { items: true },
  });
  if (!order) return { skipped: true, reason: "order_not_found" };
  if (order.gelatoOrderId) {
    return { skipped: true, reason: "already_submitted", gelatoOrderId: order.gelatoOrderId };
  }

  // 2) Load PrintSpecs used by the line items (to get front/back artwork)
  const specIds = Array.from(new Set(order.items.map(i => i.specId).filter(Boolean)));
  const specs = await prisma.printSpec.findMany({
    where: { id: { in: specIds } },
    select: { id: true, frontFileUrl: true, backFileUrl: true },
  });
  const specById = new Map(specs.map(s => [s.id, s]));

  // 3) Build the Gelato items array
  const items = order.items.map((li) => {
    const spec = li.specId ? specById.get(li.specId) : null;

    // Build files for this item (front/back + optional neck-inner from env)
    const files = buildFilesForItem({
      frontUrl: spec?.frontFileUrl || null,
      backUrl:  spec?.backFileUrl  || null,
    });

    return {
      itemReferenceId: li.id,
      productUid: li.variantProductUid, // REQUIRED: must be a valid Gelato product UID
      files,
      quantity: li.qty,
    };
  });

  // 4) Compose the full Gelato order payload
  const body = {
    orderType: "order",
    orderReferenceId: order.id,
    customerReferenceId: order.email,
    currency: order.currency, // you've switched to GBP site-wide
    items,
    shipmentMethodUid: process.env.GELATO_SHIPMENT_UID || "express",
    shippingAddress: toGelatoAddress(order),
    returnAddress: returnAddressFromEnv(),
    metadata: [{ key: "payment_intent_id", value: order.paymentIntentId || "" }],
  };

  // 5) Use an idempotency key so retries don't create duplicate Gelato orders
  const headers = {
    "Idempotency-Key": idemKey(order.id, order.paymentIntentId || crypto.randomUUID())
  };

  // (Optional) DEBUG: uncomment to verify files being sent
  // console.log("Gelato items[0].files", items[0]?.files);

  // 6) Submit to Gelato
  const resp = await gelato.post("/v4/orders", body, { headers });
  const gelatoOrderId = resp.data?.id || resp.data?.orderId || null;

  // 7) Mark our order as submitted + store Gelato ID
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
