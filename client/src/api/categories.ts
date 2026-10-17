import { get, post, put, del } from "./client";

export function getCategories() {
  return get("/api/categories");
}

export function addCategory(data: unknown) {
  return post("/api/categories", data);
}

export function updateCategory(id: number, data: unknown) {
  return put(`/api/categories/${id}`, data);
}

export function deleteCategory(id: number) {
  return del(`/api/categories/${id}`);
}
