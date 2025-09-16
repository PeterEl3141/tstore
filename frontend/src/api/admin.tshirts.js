import { api } from "./client";

export async function adminListTShirts() {
  const res = await api.get("/admin/tshirts");
  return res.data; // { items: [...] }
}

export async function adminGetTShirt(id) {
  const res = await api.get(`/admin/tshirts/${id}`);
  return res.data;
}

export async function adminCreateTShirt(payload) {
  const res = await api.post("/admin/tshirts", payload);
  return res.data;
}

export async function adminUpdateTShirt(id, payload) {
  const res = await api.patch(`/admin/tshirts/${id}`, payload);
  return res.data;
}

export async function adminDeleteTShirt(id) {
  await api.delete(`/admin/tshirts/${id}`);
}
