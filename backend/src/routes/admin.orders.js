import express from "express";
import asyncHandler from "express-async-handler";
import prisma from "../lib/prisma.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { getGelatoOrder, mapGelatoStatus, extractTracking } from "../services/gelato.js";
import { sendOrderShippedEmail } from "../services/mailer.js";

const router = express.Router();


// GET /api/admin/orders?limit=20&cursor=ORDER_ID
router.get("/", protect, requireAdmin, asyncHandler(async (req, res) => {
    const limit = Math.min(parseInt(req.query.limit || "20", 10), 50);
    const cursor = req.query.cursor || null;
  
    const where = {}; // (optional: add filters later)
    const orders = await prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
      select: {
        id: true, createdAt: true, status: true, email: true,
        totalCents: true, currency: true,
        gelatoStatus: true, gelatoOrderId: true, shippedAt: true,
        trackingUrl: true, trackingNumber: true, carrier: true,
        _count: { select: { items: true } },
      },
    });
  
    const hasMore = orders.length > limit;
    if (hasMore) orders.pop();
  
    res.json({
      items: orders,
      nextCursor: hasMore ? orders[orders.length - 1].id : null,
    });
  }));
  
  // GET /api/admin/orders/:id
  router.get("/:id", protect, requireAdmin, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: { select: { id: true, productId: true, name: true, size: true, color: true, qty: true, priceCents: true } },
      },
    });
    if (!order) return res.status(404).json({ message: "Not found" });
    res.json(order);
  }));

// Refresh a single order from Gelato and update local fields
router.post("/:id/refresh-fulfillment", protect, requireAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const order = await prisma.order.findUnique({ where: { id } });
  if (!order?.gelatoOrderId) return res.status(400).json({ message: "No Gelato order id." });

  try {
    const g = await getGelatoOrder(order.gelatoOrderId);
    const newStatus = mapGelatoStatus(g);
    const { trackingUrl, trackingNumber, carrier } = extractTracking(g);

    // detect shipped transition to trigger email once
    const becameShipped = newStatus === "SHIPPED" && order.shippedAt == null;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        gelatoStatus: g?.status || null,
        trackingUrl,
        trackingNumber,
        carrier,
        shippedAt: becameShipped ? new Date() : order.shippedAt,
        lastFulfillCheckAt: new Date(),
        lastFulfillError: null,
        // Optional: also lift main status when shipped
        status: becameShipped ? "FULFILLED" : order.status,
      },
    });

    if (becameShipped) {
      try { await sendOrderShippedEmail(updated); } catch {}
    }

    res.json({ ok: true, order: updated, gelato: g });
  } catch (e) {
    console.error("Fulfillment refresh error:", e?.response?.data || e);
    await prisma.order.update({
      where: { id },
      data: { lastFulfillError: e?.response?.data?.message || String(e), lastFulfillCheckAt: new Date() }
    });
    res.status(502).json({ ok: false, message: "Refresh failed", detail: e?.response?.data || String(e) });
  }
}));

export default router;
