import axios from "axios";

const origin = (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/+$/, "");

export const api = axios.create({
  // Dev (no VITE_API_URL): "/api" -> hits Vite proxy.
  // Prod (VITE_API_URL set): "<origin>/api".
  baseURL: origin ? `${origin}/api` : "/api",
  timeout: 10000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// HOT-FIX: allow both api.get('/tshirts') and api.get('/api/tshirts')
api.interceptors.request.use((config) => {
  if (typeof config.url === "string" && config.url.startsWith("/api/")) {
    config.url = config.url.replace(/^\/api\//, "/");
  }
  return config;
});
