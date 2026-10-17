import { get, post, put, del } from "./client";

export function getFixedExpenses() {
  return get("/api/fixed-expenses");
}

export function addFixedExpense(data: unknown) {
  return post("/api/fixed-expenses", data);
}

export function updateFixedExpense(id: number, data: unknown) {
  return put(`/api/fixed-expenses/${id}`, data);
}

export function deleteFixedExpense(id: number) {
  return del(`/api/fixed-expenses/${id}`);
}
