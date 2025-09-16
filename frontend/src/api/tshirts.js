import { api } from "./client";


export const fetchTShirts = async (params = {}) => {
  try {
    const res = await api.get("/tshirts", { params });
    const data = res.data;
    // Normalize to { items, page, pageSize, total }
    if (Array.isArray(data?.items)) return data;
    if (Array.isArray(data)) {
      return { items: data, page: 1, pageSize: data.length, total: data.length };
    }
    return { items: [], page: 1, pageSize: 0, total: 0 };
  } catch (e) {
    return { items: [], page: 1, pageSize: 0, total: 0 };
  }
};
export const fetchTShirtBySlug = async (slug) => {
  const res = await api.get(`/tshirts/slug/${slug}`);
  return res.data; // includes reviews[]
};