import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { healthCheck } from "../controllers/health.controller.js";

const router = express.Router();
router.get("/health", asyncHandler(healthCheck));
export default router;
