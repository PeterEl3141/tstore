// src/api/client.js
import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL, // e.g. https://api.con-fuoco.co.uk
  timeout: 10000,
  withCredentials: true, // if your admin routes rely on cookies
});

// If the body is FormData, let the browser set multipart boundary.
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    // Some setups add JSON headers globally—remove them for FormData.
    delete config.headers["Content-Type"];
    delete config.headers["content-type"];
  }
  return config;
});
