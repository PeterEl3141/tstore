import express from "express";
import multer from "multer";
import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { protect, requireAdmin } from "../middleware/auth.js";

const router = express.Router();

// Multer: keep JSON body parsers BEFORE this route is fine; multer handles multipart
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 10MB
});

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// optional allowlist
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

router.post("/", protect, requireAdmin, upload.array("files", 5), async (req, res) => {
  try {
    // ✅ early checks to avoid silent success with no URLs
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message:
          "No files received. Make sure the field name is 'files' and you're sending multipart/form-data.",
      });
    }

    const out = [];

    for (const file of req.files) {
      if (!ALLOWED.has(file.mimetype)) {
        return res.status(400).json({ message: `Unsupported type: ${file.mimetype}` });
      }

      const ext = (file.originalname.split(".").pop() || "bin").toLowerCase();
      const key = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

      // If your bucket blocks ACLs, remove the ACL line entirely.
      const putParams = {
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      };
      // Uncomment ONLY if your bucket allows ACLs and you want public read via ACL.
      // putParams.ACL = "public-read";

      await s3.send(new PutObjectCommand(putParams));

      // Public URL
      const base = process.env.S3_PUBLIC_BASE?.replace(/\/+$/, "");
      out.push(`${base}/${key}`);
    }

    res.status(201).json({ urls: out });
  } catch (e) {
    console.error("Upload error:", e?.name, e?.message || e);
    const msg =
      e?.name === "AccessControlListNotSupported"
        ? "Bucket blocks ACLs; remove ACL:'public-read' from PutObjectCommand."
        : e?.message || "Upload failed";
    res.status(500).json({ message: msg });
  }
});

export default router;
