import { api } from "./client";

export async function adminUploadFiles(files) {
  const form = new FormData();
  for (const f of files) form.append("files", f);
  const res = await api.post("/admin/uploads", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data; // { files: [{filename, url, ...}] }
}
