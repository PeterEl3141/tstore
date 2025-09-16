import { api } from "./client";

export async function listAdminOrders(params = {}) {
  const { cursor = null, limit = 20 } = params;
  const { data } = await api.get("/admin/orders", { params: { cursor, limit } });
  return data; // { items, nextCursor }
}

export async function getAdminOrder(id) {
  const { data } = await api.get(`/admin/orders/${id}`);
  return data;
}

export async function refreshFulfillment(id) {
  const { data } = await api.post(`/admin/orders/${id}/refresh-fulfillment`);
  return data;
}
