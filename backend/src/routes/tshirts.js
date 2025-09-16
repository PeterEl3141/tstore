import express from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  listTShirts,
  getTShirtById,
  getTShirtBySlug,
  listReviewsForTShirt,
} from "../controllers/tshirts.controller.js";

const router = express.Router();

const paramsWithId = z.object({ id: z.string().cuid() });
const paramsWithSlug = z.object({ slug: z.string().min(1) });

const queryList = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(50).optional(),
  category: z.enum(["ARTIST", "PIECE"]).optional(),
});

// GET /tshirts?page=&pageSize=&category=
router.get("/", validate(queryList, "query"), asyncHandler(listTShirts));

// GET /tshirts/:id
router.get("/:id", validate(paramsWithId, "params"), asyncHandler(getTShirtById));

// GET /tshirts/slug/:slug  (friendlier detail page)
router.get("/slug/:slug", validate(paramsWithSlug, "params"), asyncHandler(getTShirtBySlug));

// GET /tshirts/:id/reviews
router.get("/:id/reviews", validate(paramsWithId, "params"), asyncHandler(listReviewsForTShirt));

export default router;
