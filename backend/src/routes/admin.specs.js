import express from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = express.Router();
router.use(protect, requireAdmin);

/** List specs for a product */
router.get("/tshirts/:id/specs", asyncHandler(async (req, res) => {
  const specs = await prisma.printSpec.findMany({
    where: { tshirtId: req.params.id },
    orderBy: { version: "desc" },
    include: { variants: true },
  });
  res.json({ specs });
}));

/** Create next draft spec (version = max+1) */
router.post("/tshirts/:id/specs", asyncHandler(async (req, res) => {
  const max = await prisma.printSpec.aggregate({
    where: { tshirtId: req.params.id },
    _max: { version: true },
  });
  const next = (max._max.version ?? 0) + 1;
  const spec = await prisma.printSpec.create({
    data: { tshirtId: req.params.id, version: next, colors: [] },
  });
  res.status(201).json(spec);
}));

/** Update spec details (artwork, dpi, colors) */
const UpdateSpecSchema = z.object({
  frontFileUrl: z.string().url().optional().nullable(),
  backFileUrl:  z.string().url().optional().nullable(),
  dpi:          z.coerce.number().int().positive().optional(),
  colors:       z.array(z.string().min(1)).optional(),
});
router.patch("/specs/:specId", asyncHandler(async (req, res) => {
  const parsed = UpdateSpecSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues });
  const spec = await prisma.printSpec.update({
    where: { id: req.params.specId },
    data: parsed.data,
  });
  res.json(spec);
}));

/** Replace variants mapping (size+color -> productUid) */
const VariantSchema = z.object({ size: z.string(), color: z.string(), productUid: z.string().min(1) });
router.put("/specs/:specId/variants", asyncHandler(async (req, res) => {
  const arr = z.array(VariantSchema).safeParse(req.body);
  if (!arr.success) return res.status(400).json({ error: arr.error.issues });
  const specId = req.params.specId;

  // replace all
  await prisma.$transaction([
    prisma.printVariant.deleteMany({ where: { specId } }),
    prisma.printVariant.createMany({ data: arr.data.map(v => ({ ...v, specId })) }),
  ]);
  const spec = await prisma.printSpec.findUnique({ where: { id: specId }, include: { variants: true } });
  res.json(spec);
}));

/** Publish spec (locks it + set as current on product) */
router.post("/specs/:specId/publish", asyncHandler(async (req, res) => {
  const specId = req.params.specId;
  const spec = await prisma.printSpec.findUnique({ where: { id: specId }, include: { variants: true } });
  if (!spec) return res.status(404).json({ message: "Spec not found" });
  if (!spec.frontFileUrl && !spec.backFileUrl) return res.status(400).json({ message: "No artwork" });
  if (!spec.variants.length) return res.status(400).json({ message: "No variants mapping" });

  const updated = await prisma.printSpec.update({ where: { id: specId }, data: { isPublished: true } });
  await prisma.tShirt.update({ where: { id: spec.tshirtId }, data: { currentSpecId: specId, status: "LIVE" } });
  res.json(updated);
}));

export default router;
