import axios from "axios";

const origin =
  (import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export const api = axios.create({
  baseURL: `${origin}/api`,     // ensures every call hits your backend /api
  timeout: 10000,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});