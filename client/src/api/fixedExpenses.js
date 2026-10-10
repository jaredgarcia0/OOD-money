import { get, post, put, del } from "./client.js";

export function getFixedExpenses() {
  return get("/api/fixed-expenses");
}

export function addFixedExpense(data) {
  return post("/api/fixed-expenses", data);
}

export function updateFixedExpense(id, data) {
  return put(`/api/fixed-expenses/${id}`, data);
}

export function deleteFixedExpense(id) {
  return del(`/api/fixed-expenses/${id}`);
}