import { post } from "./client.js";

export function login(email, password) {
  return post("/api/auth/login", { email, password });
}

export function register(email, password) {
  return post("/api/auth/register", { email, password });
}

export function logout() {
  return post("/api/auth/logout");
}