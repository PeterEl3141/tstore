import express from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";
import { protect } from "../middleware/auth.js";


const prisma = new PrismaClient(); 
const router = express.Router({ mergeParams: true });

const bodySchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(2000),
  authorName: z.string().trim().min(1).max(80).optional(),
});

const parsePaging = (q) => {
  const limit = Math.min(Number(q.limit) || 10, 50);
  const offset = Math.max(Number(q.offset) || 0, 0);
  return { limit, offset };
};

// 3 reviews per hour per product per IP (basic spam control)
const createLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.ip}:${req.params.id}`,
});

// GET /api/tshirts/:id/reviews
router.get("/", async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit, offset } = parsePaging(req.query);

    const [items, count] = await Promise.all([
      prisma.review.findMany({
        where: { tshirtId: id },
        orderBy: { createdAt: "desc" },
        take: limit,
        skip: offset,
        select: {
          id: true,
          rating: true,
          title: true,
          body: true,
          authorName: true,
          createdAt: true,
          authorEmail: true,
        },
      }),
      prisma.review.count({ where: { tshirtId: id } }),
    ]);

    res.json({ items, count });
  } catch (err) {
    next(err);
  }
});

// GET /api/tshirts/:id/reviews/summary
router.get("/summary", async (req, res, next) => {
  try {
    const { id } = req.params;
    const agg = await prisma.review.aggregate({
      _avg: { rating: true },
      _count: true,
      where: { tshirtId: id },
    });
    res.json({
      count: agg._count,
      avgRating: agg._avg.rating ? Number(agg._avg.rating.toFixed(2)) : null,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/tshirts/:id/reviews
router.post("/", createLimiter, async (req, res, next) => {
  try {
    const { id } = req.params;
    const parsed = bodySchema.safeParse({
      ...req.body,
      rating: Number(req.body?.rating),
    });
    if (!parsed.success) {
      return res.status(400).json({ message: "Invalid review", issues: parsed.error.issues });
    }

    const { rating, title, body, authorName } = parsed.data;
    const review = await prisma.review.create({
      data: { tshirtId: id, rating, title, body, authorName: authorName ?? null, authorEmail: req.user?.email ?? null,  },
      select: {
        id: true, rating: true, title: true, body: true,
        authorName: true, authorEmail: true, createdAt: true,
    },
    
    });

    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
});


// DELETE /api/tshirts/:id/reviews/:reviewId
router.delete("/:reviewId", protect, async (req, res, next) => {
  try {
    const { id, reviewId } = req.params;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review || review.tshirtId !== id) {
      return res.status(404).json({ message: "Review not found" });
    }

    // Admins can delete anything; authors can delete their own
    const isAdmin = req.user?.role === "ADMIN" || req.user?.isAdmin === true;
    const isAuthor =
      (review.authorEmail && req.user?.email && review.authorEmail.toLowerCase() === req.user.email.toLowerCase());

    if (!isAdmin && !isAuthor) {
      return res.status(403).json({ message: "Not allowed to delete this review" });
    }

    await prisma.review.delete({ where: { id: reviewId } });
    res.status(204).end();
  } catch (err) { next(err); }
});



export default router;
