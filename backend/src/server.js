// src/server.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import path, { join, dirname } from "path";
import { fileURLToPath } from "url";

import prisma from "./lib/prisma.js";

import healthRouter from "./routes/health.js";
import tshirtsRouter from "./routes/tshirts.js";
import usersRouter from "./routes/users.js";
import adminTShirts from "./routes/admin.tshirts.js";
import adminUploads from "./routes/admin.uploads.js";
import adminSpecs from "./routes/admin.specs.js";
import ordersRouter from "./routes/orders.js";
import paymentsRouter from "./routes/payments.js";
import adminOrders from "./routes/admin.orders.js";
import shippingRoutes from "./routes/shipping.js";

import { notFound, errorHandler } from "./middleware/errorHandler.js";
import { getGelatoOrder, mapGelatoStatus, extractTracking } from "./services/gelato.js";
import { sendOrderShippedEmail } from "./services/mailer.js";

// __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Trust Railway/Proxy so secure cookies work
app.set("trust proxy", 1);

// --- Static uploads (with CORP header) ---
app.use(
  "/uploads",
  (req, res, next) => {
    // Allow this static resource cross-origin (front-end on a different domain)
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static(join(__dirname, "../uploads"))
);

// --- Stripe webhook BEFORE any JSON body parser ---
app.use("/api/payments", paymentsRouter);

// --- CORS allow-list (with cookies) ---
const allowlist = new Set([
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://con-fuoco.co.uk",
  "https://www.con-fuoco.co.uk",
  ...(process.env.CORS_ALLOWLIST
    ? process.env.CORS_ALLOWLIST.split(",").map((s) => s.trim())
    : []),
]);

function isAllowed(origin) {
  if (!origin) return true; // SSR / curl / same-origin
  try {
    const url = new URL(origin);
    const { hostname } = url;

    // exact match
    if (allowlist.has(origin)) return true;

    // any Vercel preview
    if (hostname.endsWith(".vercel.app")) return true;

    // any localhost/127.0.0.1 on any port
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;

    return false;
  } catch {
    return false;
  }
}

const corsOptions = {
  origin: (origin, cb) => {
    if (isAllowed(origin)) return cb(null, true);
    console.warn("CORS blocked origin:", origin);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    return cors(corsOptions)(req, res, () => res.sendStatus(204));
  }
  next();
});


// --- Global middleware ---
app.use(express.json({ limit: "1mb" })); // keep webhook raw above
app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.disable("x-powered-by");

// --- API routes ---
app.use("/api", healthRouter);
app.use("/api/tshirts", tshirtsRouter);
app.use("/api/users", usersRouter);
app.use("/api/admin/tshirts", adminTShirts);
app.use("/api/admin/uploads", adminUploads);
app.use("/api/admin", adminSpecs);
app.use("/api/orders", ordersRouter);
app.use("/api/admin/orders", adminOrders);
app.use("/api/shipping", shippingRoutes);

// --- 404 + error handlers ---
app.use(notFound);
app.use(errorHandler);

// --- Start server ---
const PORT = process.env.PORT ?? 3000;
app.listen(PORT, () => console.log(`Server listening on :${PORT}`));

// --- Fulfilment polling (optional; enable with ENABLE_FULFILLMENT_CRON=true) ---
if (process.env.ENABLE_FULFILLMENT_CRON === "true") {
  const INTERVAL_MS = 5 * 60 * 1000;
  setInterval(async () => {
    try {
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
              trackingUrl,
              trackingNumber,
              carrier,
              shippedAt: becameShipped ? new Date() : o.shippedAt,
              lastFulfillCheckAt: new Date(),
              lastFulfillError: null,
              status: becameShipped ? "FULFILLED" : o.status,
            },
          });

          if (becameShipped) {
            try {
              await sendOrderShippedEmail(updated);
            } catch {}
          }
        } catch (err) {
          await prisma.order.update({
            where: { id: o.id },
            data: {
              lastFulfillError:
                err?.response?.data?.message || String(err),
              lastFulfillCheckAt: new Date(),
            },
          });
        }
      }
    } catch (e) {
      console.error("fulfillment cron error", e);
    }
  }, INTERVAL_MS);
}



