import axios from "axios";

const BASE =
  process.env.GELATO_ENV === "sandbox"
    ? "https://order.gelatoapis.com"   // same base, keys control env
    : "https://order.gelatoapis.com";

export const gelato = axios.create({
  baseURL: BASE,
  headers: {
    "Content-Type": "application/json",
    "X-API-KEY": process.env.GELATO_API_KEY,
  },
  timeout: 15000,
});
