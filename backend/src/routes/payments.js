// routes/payments.js
import express from "express";
import stripePkg from "stripe";
import prisma from "../lib/prisma.js";
import { submitGelatoOrderForPaymentIntent } from "../services/submitGelato.js";
import { sendOrderConfirmedEmail } from "../services/mailer.js";

const router = express.Router();
const stripe = stripePkg(process.env.STRIPE_SECRET);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;
    try {
      const sig = req.headers["stripe-signature"];
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error("Stripe webhook verify failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      if (event.type === "payment_intent.succeeded") {
        const pi = event.data.object;

        // 1) Find order by PaymentIntent
        let order = await prisma.order.findFirst({
          where: { paymentIntentId: pi.id },
        });
        if (!order) {
          console.warn("No order for PI", pi.id);
          return res.json({ received: true });
        }

        // 2) Mark PAID if still DRAFT
        if (order.status === "DRAFT") {
          order = await prisma.order.update({
            where: { id: order.id },
            data: { status: "PAID" },
          });
        }

        // 3) Send confirmation email once
        try {
          // If you added confirmationSentAt to the model, keep the guard:
          if (!order.confirmationSentAt) {
            await sendOrderConfirmedEmail(order);
            await prisma.order.update({
              where: { id: order.id },
              data: { confirmationSentAt: new Date() },
            });
          }
        } catch (mailErr) {
          console.error("Email send failed:", mailErr?.response?.data || mailErr);
        }

        // 4) Submit to Gelato (idempotent)
        try {
          const r = await submitGelatoOrderForPaymentIntent(pi.id);
          if (r.ok) {
            console.log("Gelato order submitted:", r.gelatoOrderId);
          } else {
            console.log("Gelato submission skipped:", r.reason);
          }
        } catch (e) {
          console.error("Gelato order submission failed:", e?.response?.data || e);
        }
      }

      res.json({ received: true });
    } catch (e) {
      console.error("Webhook handler error", e);
      res.status(500).json({ error: "handler_failed" });
    }
  }
);

export default router;
