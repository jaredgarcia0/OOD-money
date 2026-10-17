import { post } from "./client";

export function login(email: string, password: string) {
  return post("/api/auth/login", { email, password });
}

export function register(email: string, password: string) {
  return post("/api/auth/register", { email, password });
}

export function logout() {
  return post("/api/auth/logout");
  
}
