import { get } from "./client";

export function getBudget(paycheckId?: number) {
  const query = paycheckId ? `?paycheckId=${paycheckId}` : "";
  return get(`/api/budget${query}`);
}
