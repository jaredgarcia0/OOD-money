import { get } from "./client.js";

export function getBudget(paycheckId) {
  const query = paycheckId ? `?paycheckId=${paycheckId}` : "";
  return get(`/api/budget${query}`);
}