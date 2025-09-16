import express from "express";
import { z } from "zod";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect, requireAdmin } from "../middleware/auth.js";
import { prisma } from "../lib/prisma.js";

const router = express.Router();
router.use(protect, requireAdmin);

// LIST (full fields for admin)
router.get("/", asyncHandler(async (req, res) => {
  const items = await prisma.tShirt.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true, name: true, slug: true, description: true,
      priceCents: true, currency: true, images: true,
      colorOptions: true, sizeOptions: true, category: true, status: true,
      createdAt: true, updatedAt: true,
    },
  });
  res.json({ items });
}));

// READ one (by id)
router.get("/:id", asyncHandler(async (req, res) => {
  const t = await prisma.tShirt.findUnique({
    where: { id: req.params.id },
    select: {
      id: true, name: true, slug: true, description: true,
      priceCents: true, currency: true, images: true,
      colorOptions: true, sizeOptions: true, category: true, status: true,
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
  priceCents: z.coerce.number().int().nonnegative(), // ← coerce "1500" -> 1500
  currency: z.string().min(1).default("GBP"),
  images: z.array(ImagePath).default([]),       
  colorOptions: z.array(z.string().min(1)).default([]),
  sizeOptions: z.array(z.string().min(1)).default([]),
  category: z.string().min(1), // or z.enum([...]) if you prefer
  status: z.enum(["DRAFT", "LIVE", "RETIRED"]).optional(),
}).strict(false); // ignore any extra keys quietly

const CreateSchema = BaseSchema;
const UpdateSchema = BaseSchema.partial(); // accept any subset on PATCH

router.post("/", asyncHandler(async (req, res) => {
  const parsed = CreateSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error("Create validation error:", parsed.error.issues, "BODY:", req.body);
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }
  const created = await prisma.tShirt.create({ data: parsed.data });
  res.status(201).json(created);
}));

router.patch("/:id", asyncHandler(async (req, res) => {
  const parsed = UpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    console.error("Update validation error:", parsed.error.issues, "BODY:", req.body);
    return res.status(400).json({ error: "Invalid payload", issues: parsed.error.issues });
  }
  const updated = await prisma.tShirt.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(updated);
}));

router.delete("/:id", asyncHandler(async (req, res) => {
  await prisma.tShirt.delete({ where: { id: req.params.id } });
  res.status(204).end();
}));

export default router;
