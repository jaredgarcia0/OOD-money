import { get, post, put, del } from "./client";

export function getPaychecks() {
  return get("/api/paychecks");
}

export function addPaycheck(data: unknown) {
  return post("/api/paychecks", data);
}

export function updatePaycheck(id: number, data: unknown) {
  return put(`/api/paychecks/${id}`, data);
}

export function deletePaycheck(id: number) {
  return del(`/api/paychecks/${id}`);
}
