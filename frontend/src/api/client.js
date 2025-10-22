// src/api/client.js
import axios from "axios";

// IMPORTANT: ensure this is set in Vercel -> Project -> Settings -> Environment Variables
// Key: VITE_API_URL  Value: https://api.con-fuoco.co.uk
const BASE_URL =
  (import.meta.env && import.meta.env.VITE_API_URL) ||
  ""; // fallback to same-origin (only for local dev)

export const api = axios.create({
  baseURL: BASE_URL.replace(/\/$/, ""), // remove trailing slash if present
  timeout: 15000,
});

// Attach JWT if you use Authorization header (typical for your app)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // If sending FormData, let the browser set the multipart boundary
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  }
  return config;
});
