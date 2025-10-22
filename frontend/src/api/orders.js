import { api } from "./client";


export const createCheckout = (payload) => api.post("/orders/checkout", payload).then(r=>r.data);

export function fetchMyOrders() {
    return api.get("/orders/mine").then(r => r.data);
  }