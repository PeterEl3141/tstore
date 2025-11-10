import express from "express";
import { z } from "zod";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { Router } from "express";
import { protect } from "../middleware/auth.js";


const stripe = new Stripe(process.env.STRIPE_SECRET);
const router = express.Router();

const CheckoutSchema = z.object({
  currency: z.string().default("GBP"),
  email: z.string().email(),
  shippingAddress: z.object({
    name: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional().nullable(),
    city: z.string().min(1),
    state: z.string().optional().nullable(),
    postCode: z.string().min(1),
    country: z.string().min(2).max(2),
    phone: z.string()
      .min(4, "Phone too short")
      .max(20, "Phone too long")
      .regex(/^[\d+().\-\s]+$/, "Phone format invalid"),  // simple allowlist 
  }),
  items: z.array(z.object({
    productId: z.string(),
    size: z.string(),
    color: z.string(),
    qty: z.coerce.number().int().positive(),
  })).min(1),
});

router.post("/checkout", asyncHandler(async (req, res) => {
    const parsed = CheckoutSchema.safeParse(req.body);
    if (!parsed.success) {
      console.error("Checkout validation error:", parsed.error.issues, "BODY:", req.body);
      return res.status(400).json({ message: "Invalid payload", issues: parsed.error.issues });
    }
  
    const { currency, email, shippingAddress, items } = parsed.data;
    if (currency.toUpperCase() !== "GBP") {
        return res.status(400).json({ message: "Only GBP is supported at the moment" });
      }
    if (!items.length) return res.status(400).json({ message: "Cart is empty" });
  
    let subtotal = 0;
    const orderItems = [];
  
    for (const li of items) {
      const t = await prisma.tShirt.findUnique({
        where: { id: li.productId },
        include: { currentSpec: { include: { variants: true } } },
      });
      if (!t) return res.status(400).json({ message: `Product not found: ${li.productId}` });
      if (!t.currentSpec) return res.status(400).json({ message: `Product not available (no published spec): ${t.name}` });
  
      const wantedSize = String(li.size).trim().toUpperCase();
      const wantedColor = String(li.color).trim().toUpperCase();
      const variant = t.currentSpec.variants.find(v =>
        v.size.trim().toUpperCase() === wantedSize &&
        v.color.trim().toUpperCase() === wantedColor
      );
      if (!variant) {
        console.warn("Variant not found", {
          product: t.name,
          wanted: `${li.size}/${li.color}`,
          have: t.currentSpec.variants.map(v => `${v.size}/${v.color}`)
        });
        return res.status(400).json({ message: `Variant not available: ${t.name} ${li.size}/${li.color}` });
      }
  
      const unit = t.priceCents || 0;
      if (unit <= 0) return res.status(400).json({ message: `Invalid price for ${t.name}` });
  
      const line = unit * li.qty;
      subtotal += line;
  
      orderItems.push({
        productId: t.id,
        productName: t.name,
        productSlug: t.slug,
        size: li.size,
        color: li.color,
        qty: li.qty,
        unitPriceCents: unit,
        lineTotalCents: line,
        specId: t.currentSpec.id,
        variantProductUid: variant.productUid,
      });
    }
  
    const shipping = 0;
    const tax = 0;
    const total = subtotal + shipping + tax;
  
    if (total < 50) { // Stripe min ~ $0.50
      return res.status(400).json({ message: `Order total too low (${total}); add items.` });
    }
    if (!process.env.STRIPE_SECRET) {
      console.error("Missing STRIPE_SECRET");
      return res.status(500).json({ message: "Server misconfigured (STRIPE_SECRET)" });
    }
  
    const order = await prisma.order.create({
      data: {
        status: "DRAFT",
        currency,
        email,
        subtotalCents: subtotal,
        shippingCents: shipping,
        taxCents: tax,
        totalCents: total,
        specId: orderItems[0]?.specId ?? null,
        shippingName: shippingAddress.name,
        shippingLine1: shippingAddress.line1,
        shippingLine2: shippingAddress.line2 ?? null,
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state ?? null,
        shippingPostCode: shippingAddress.postCode,
        shippingCountry: shippingAddress.country,
        shippingPhone: shippingAddress.phone, 
        items: { create: orderItems },
      },
    });
  
    const pi = await stripe.paymentIntents.create({
      amount: total,
      currency: currency.toLowerCase(),
      receipt_email: email,
      metadata: { orderId: order.id },
      automatic_payment_methods: { enabled: true },
    });
  
    await prisma.order.update({ where: { id: order.id }, data: { paymentIntentId: pi.id } });
    res.json({ clientSecret: pi.client_secret, orderId: order.id });
  }));




  router.get("/mine", protect, async (req, res, next) => {
  try {
    const email = req.user.email;

    const orders = await prisma.order.findMany({
      where: { email },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        gelatoStatus: true,
        createdAt: true,
        totalCents: true,
        currency: true,
        trackingUrl: true,
        trackingNumber: true,
        carrier: true,
        items: {
          select: {
            id: true,
            productName: true,      // <- exists
            productSlug: true,      // <- exists
            color: true,
            size: true,
            qty: true,
            unitPriceCents: true,   // <- exists
            // lineTotalCents: true, // optional if you want it too
          },
        },
      },
    });

    // Map DB fields -> frontend fields (what Account.jsx expects)
    const normalized = orders.map(o => ({
      id: o.id,
      status: o.status,
      gelatoStatus: o.gelatoStatus,
      createdAt: o.createdAt,
      totalCents: o.totalCents,
      currency: o.currency,
      trackingUrl: o.trackingUrl,
      trackingNumber: o.trackingNumber,
      carrier: o.carrier,
      items: o.items.map(it => ({
        id: it.id,
        name: it.productName,                 // map
        slug: it.productSlug ?? null,
        color: it.color ?? null,
        size: it.size ?? null,
        qty: it.qty ?? 1,
        priceCents: it.unitPriceCents ?? 0,   // map
      })),
    }));

    res.json({ items: normalized });
  } catch (e) {
    next(e);
  }
});


export default router;
