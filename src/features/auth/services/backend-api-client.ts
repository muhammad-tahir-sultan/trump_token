import { getSessionToken } from "@/features/auth/services/session-service";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

async function authHeaders() {
  const token = await getSessionToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function backendGet(path: string) {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    method: "GET",
    headers: await authHeaders(),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || `Request failed with status ${res.status}`;
    try {
      const data = JSON.parse(text);
      message = data.message ?? message;
    } catch {
      // keep plain text message
    }
    throw new Error(message);
  }

  return res.json();
}

export async function backendPost(path: string, body: unknown) {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || `Request failed with status ${res.status}`;
    try {
      const data = JSON.parse(text);
      message = data.message ?? message;
    } catch {
      // keep plain text message
    }
    throw new Error(message);
  }

  return res.json();
}

export async function backendPatch(path: string, body: unknown) {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    let message = text || `Request failed with status ${res.status}`;
    try {
      const data = JSON.parse(text);
      message = data.message ?? message;
    } catch {
      // keep plain text message
    }
    throw new Error(message);
  }

  return res.json();
}
