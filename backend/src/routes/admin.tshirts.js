import express from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = express.Router();
router.use(protect, requireAdmin);

// LIST (full fields for admin) — ordered by rank asc, then createdAt desc
router.get("/", asyncHandler(async (req, res) => {
  const items = await prisma.tShirt.findMany({
    orderBy: [{ rank: "asc" }, { createdAt: "desc" }],
    select: {
      id: true, name: true, slug: true, description: true,
      priceCents: true, currency: true, images: true,
      colorOptions: true, sizeOptions: true, category: true, status: true,
      rank: true,                               // ← include rank
      createdAt: true, updatedAt: true,
    },
  });
  res.json({ items });
}));

// READ one (by id) — include rank
router.get("/:id", asyncHandler(async (req, res) => {
  const t = await prisma.tShirt.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, slug: true, description: true,
      priceCents: true, currency: true, images: true,
      colorOptions: true, sizeOptions: true, category: true, status: true,
      rank: true,                               // ← include rank
      createdAt: true, updatedAt: true,
    },
  });
  if (!t) return res.status(404).json({ message: "Not found" });
  res.json(t);
}));

const ImagePath = z.string().refine(
  (s) => /^https?:\/\//i.test(s) || s.startsWith("/"),
  { message: "Image must be absolute URL or /relative/path" }
);

// Shared shape for create/update
const BaseSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  priceCents: z.coerce.number().int().nonnegative(),     // "1500" -> 1500
  currency: z.string().min(1).default("GBP"),
  images: z.array(ImagePath).default([]),
  colorOptions: z.array(z.string().min(1)).default([]),
  sizeOptions: z.array(z.string().min(1)).default([]),
  category: z.string().min(1),                            // "ARTIST" | "PIECE"
  status: z.enum(["DRAFT", "LIVE", "RETIRED"]).optional(),
  rank: z.coerce.number().int().min(1).default(1000),     // ← NEW
}).strict(false); // ignore extra keys quietly

const CreateSchema = BaseSchema;
const UpdateSchema = BaseSchema.partial(); // PATCH: any subset

// Helpers to normalize a payload before writing
function normalizeCreate(data) {
  return {
    ...data,
    category: data.category?.toUpperCase() ?? "ARTIST",
    status: (data.status ?? "DRAFT").toUpperCase(),
    rank: Number.isFinite(data.rank) ? data.rank : 1000,
  };
}
function normalizeUpdate(data) {
  const out = { ...data };
  if (out.category) out.category = out.category.toUpperCase();
  if (out.status) out.status = out.status.toUpperCase();
  if (out.rank != null) out.rank = Number.isFinite(out.rank) ? out.rank : 1000;
  return out;
}

router.post("/", asyncHandler(async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error("Create validation error:", parsed.error.issues, "BODY:", req.body);
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }
  const data = normalizeCreate(parsed.data);
  const created = await prisma.tShirt.create({ data });
  res.status(201).json(created);
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error("Update validation error:", parsed.error.issues, "BODY:", req.body);
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }
  const data = normalizeUpdate(parsed.data);
  const updated = await prisma.tShirt.update({ where: { id: req.params.id }, data });
  res.json(updated);
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await prisma.tShirt.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));

export default router;
