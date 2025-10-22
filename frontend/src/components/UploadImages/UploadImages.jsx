import { useState } from "react";
import { api } from "../../api/client";

const MAX_FILES = 5;
const MAX_MB = 10; // must match server (10MB)
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

export default function UploadImages({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(e) {
    setError("");
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    // Basic client-side validation
    if (picked.length > MAX_FILES) {
      setError(`Please select up to ${MAX_FILES} files.`);
      e.target.value = "";
      return;
    }
    for (const f of picked) {
      if (!ALLOWED.has(f.type)) {
        setError(`Unsupported type: ${f.type || "unknown"}. Use JPG/PNG/WebP/SVG.`);
        e.target.value = "";
        return;
      }
      if (f.size > MAX_MB * 1024 * 1024) {
        setError(`"${f.name}" is larger than ${MAX_MB}MB.`);
        e.target.value = "";
        return;
      }
    }

    const fd = new FormData();
    picked.forEach(f => fd.append("files", f)); // field name MUST be "files"

    setUploading(true);
    try {
      // IMPORTANT: don't set a hard content-type; let Axios add the boundary.
      const { data } = await api.post("/admin/uploads", fd, {
        headers: { "Content-Type": undefined },
      });

      const urls = Array.isArray(data?.urls) ? data.urls : [];
      if (!urls.length) {
        throw new Error(data?.message || "Upload succeeded but server returned no URLs.");
      }
      onUploaded?.(urls); // array of absolute S3 URLs
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 413 ? "File too large (over server limit)." : null) ||
        err?.message ||
        "Upload failed";
      setError(String(msg));
    } finally {
      setUploading(false);
      // allow re-selecting the same filename next time
      e.target.value = "";
    }
  }

  return (
    <div className="uploader">
      <input type="file" multiple accept="image/*" onChange={handleChange} />
      {uploading && <div className="uploader-status">Uploading…</div>}
      {error && <div className="uploader-error" style={{color:"crimson"}}>{error}</div>}
    </div>
  );
}
