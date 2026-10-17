// This is the file every page will use to talk to your Express API, instead of each page writing its own fetch() calls.

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const res = await fetch(`${API_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export function get(path: string) {
  return request(path);
}

export function post(path: string, data?: unknown) {
  return request(path, { method: "POST", body: JSON.stringify(data) });
}

export function put(path: string, data: unknown) {
  return request(path, { method: "PUT", body: JSON.stringify(data) });
}

export function del(path: string) {
  return request(path, { method: "DELETE" });
}
