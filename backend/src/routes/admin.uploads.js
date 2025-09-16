// src/routes/admin.uploads.js
import express from "express";
import multer from "multer";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

const s3 = new S3Client({
  region: process.env.AWS_REGION, // e.g., "eu-west-2"
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// allow common image types
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

router.post("/", protect, requireAdmin, upload.array("files", 5), async (req, res, next) => {
  try {
    const out = [];

    for (const file of req.files || []) {
      if (!ALLOWED.has(file.mimetype)) {
        return res.status(400).json({ message: `Unsupported type: ${file.mimetype}` });
      }

      const ext = (file.originalname.split(".").pop() || "bin").toLowerCase();
      const key = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

      await s3.send(new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,            // e.g., "tstore-uploads"
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        // DO NOT set ACL when bucket blocks ACLs; public read is via bucket policy
        // ACL: "public-read",
        CacheControl: "public, max-age=31536000, immutable", // optional, nice for CDN/browser caching
      }));

      // e.g., https://tstore-uploads.s3.eu-west-2.amazonaws.com/<key>
      out.push(`${process.env.S3_PUBLIC_BASE}/${key}`);
    }

    res.status(201).json({ urls: out });
  } catch (e) {
    console.error("S3 upload error:", e?.name, e?.message, e?.$metadata || e);
    next(e);
  }
});

export default router;
