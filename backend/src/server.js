import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import prisma from "./lib/prisma.js";

import path, { join, dirname } from "path";
import { fileURLToPath } from "url";

import healthRouter from "./routes/health.js";
import tshirtsRouter from "./routes/tshirts.js";
import usersRouter from "./routes/users.js";
import adminTShirts from "./routes/admin.tshirts.js";
import adminUploads from "./routes/admin.uploads.js";
import adminSpecs from "./routes/admin.specs.js";
import ordersRouter from "./routes/orders.js";
import paymentsRouter from "./routes/payments.js";
import adminOrders from "./routes/admin.orders.js";

import { notFound, errorHandler } from "./middleware/errorHandler.js";

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ✅ create the app FIRST
const app = express();

app.use("/uploads", (req, res, next) => {
    // Allow this resource to be used cross-origin (e.g., frontend on :5173)
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  }, express.static(join(__dirname, "../uploads")));

// (1) Mount webhook BEFORE JSON if your payments router contains an express.raw() handler
app.use("/api/payments", paymentsRouter);


// (2) Global middleware
app.use(express.json());
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));

// (3) Static uploads (after app exists is fine)
app.use("/uploads", express.static(join(__dirname, "../uploads")));

// (4) Other routes
app.use("/api", healthRouter);
app.use("/api/tshirts", tshirtsRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin/tshirts", adminTShirts);
app.use("/api/admin/uploads", adminUploads);
app.use("/api/payments", paymentsRouter);
app.use("/api/admin", adminSpecs);
app.use("/api/orders", ordersRouter);
app.use("/api/admin/orders", adminOrders);



// (5) 404 + error handlers
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Server listening on :${PORT}`));


if (process.env.ENABLE_FULFILLMENT_CRON === "true") {
  const INTERVAL_MS = 5 * 60 * 1000;
  setInterval(async () => {
    try {
      // pull last ~7 days orders that are PAID/SUBMITTED and not shipped
      const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const candidates = await prisma.order.findMany({
        where: {
          createdAt: { gte: since },
          gelatoOrderId: { not: null },
          shippedAt: null,
        },
        take: 50,
        orderBy: { createdAt: "desc" },
      });

      for (const o of candidates) {
        try {
          const g = await getGelatoOrder(o.gelatoOrderId);
          const newStatus = mapGelatoStatus(g);
          const { trackingUrl, trackingNumber, carrier } = extractTracking(g);
          const becameShipped = newStatus === "SHIPPED" && o.shippedAt == null;

          const updated = await prisma.order.update({
            where: { id: o.id },
            data: {
              gelatoStatus: g?.status || null,
              trackingUrl, trackingNumber, carrier,
              shippedAt: becameShipped ? new Date() : o.shippedAt,
              lastFulfillCheckAt: new Date(),
              lastFulfillError: null,
              status: becameShipped ? "FULFILLED" : o.status,
            },
          });

          if (becameShipped) {
            try { await sendOrderShippedEmail(updated); } catch {}
          }
        } catch (err) {
          await prisma.order.update({
            where: { id: o.id },
            data: { lastFulfillError: err?.response?.data?.message || String(err), lastFulfillCheckAt: new Date() }
          });
        }
      }
    } catch (e) {
      console.error("fulfillment cron error", e);
    }
  }, INTERVAL_MS);
}
