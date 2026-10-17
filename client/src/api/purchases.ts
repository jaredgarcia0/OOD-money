import { get, post, put, del } from "./client";

export function getPurchases() {
  return get("/api/purchases");
}

export function addPurchase(data: unknown) {
  return post("/api/purchases", data);
}

export function updatePurchase(id: number, data: unknown) {
  return put(`/api/purchases/${id}`, data);
}

export function deletePurchase(id: number) {
  return del(`/api/purchases/${id}`);
}
