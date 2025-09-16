// src/controllers/tshirts.controller.js
import { prisma } from "../lib/prisma.js";

export async function listTShirts(req, res) {
  const q = res.locals?.validated?.query ?? req.query ?? {};
  const page = Math.max(1, Number(q.page ?? 1));
  const pageSize = Math.min(50, Math.max(1, Number(q.pageSize ?? 12)));
  const take = pageSize;
  const skip = (page - 1) * take;

  const where = q.category ? { category: q.category } : undefined;

  const [items, total] = await Promise.all([
    prisma.tShirt.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take,
      select: {
        id: true, name: true, slug: true,
        priceCents: true, currency: true, images: true, category: true,
        createdAt: true,
        _count: { select: { reviews: true } },
      },
    }),
    prisma.tShirt.count({ where }),
  ]);

  res.json({ items, page, pageSize: take, total });
}

export async function getTShirtById(req, res) {
  const p = res.locals?.validated?.params ?? req.params;
  const tshirt = await prisma.tShirt.findUnique({ where: { id: p.id } });
  if (!tshirt) { res.status(404); throw new Error("T-shirt not found"); }
  res.json(tshirt);
}

// controllers/tshirts.controller.js
export async function getTShirtBySlug(req, res) {
  const { slug } = req.params;
  const tshirt = await prisma.tShirt.findUnique({
    where: { slug },
    include: {
      currentSpec: true,                 // <-- important
      reviews: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!tshirt) { res.status(404); throw new Error("T-shirt not found"); }
  res.json(tshirt);
}


export async function listReviewsForTShirt(req, res) {
  const p = res.locals?.validated?.params ?? req.params;
  const exists = await prisma.tShirt.findUnique({ where: { id: p.id }, select: { id: true } });
  if (!exists) { res.status(404); throw new Error("T-shirt not found"); }
  const reviews = await prisma.review.findMany({
    where: { tshirtId: p.id },
    orderBy: { createdAt: "desc" },
  });
  res.json(reviews);
}
