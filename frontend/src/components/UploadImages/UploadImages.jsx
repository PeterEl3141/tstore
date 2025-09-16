import { useState } from "react";
import { api } from "../../api/client";

export default function UploadImages({ onUploaded }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleChange(e) {
    setError("");
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const fd = new FormData();
    files.forEach(f => fd.append("files", f));

    setUploading(true);
    try {
      const res = await api.post("/admin/uploads", fd /* axios sets content-type */);
      const urls = Array.isArray(res?.data?.urls) ? res.data.urls : [];
      if (!urls.length) {
        setError("Upload succeeded but no URLs returned");
        return;
      }
      onUploaded?.(urls); // always an array
    } catch (err) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Upload failed";
      setError(String(msg));
    } finally {
      setUploading(false);
      // allow re-uploading the same file name
      e.target.value = "";
    }
  }

  return (
    <div className="uploader">
      <input type="file" multiple accept="image/*" onChange={handleChange} />
      {uploading && <div className="uploader-status">Uploading…</div>}
      {error && <div className="uploader-error">{error}</div>}
    </div>
  );
}
