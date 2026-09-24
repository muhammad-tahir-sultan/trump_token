import { getSessionToken } from "@/features/auth/services/session-service";

const BACKEND_API_URL = process.env.BACKEND_API_URL ?? "http://localhost:5000/api";

async function authHeaders() {
  const token = await getSessionToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function sanitizeErrorMessage(rawMessage: string, status?: number): string {
  if (
    rawMessage.includes("FUNCTION_INVOCATION_FAILED") ||
    rawMessage.includes("A server error has occurred") ||
    rawMessage.includes("Internal Server Error") ||
    (status !== undefined && status >= 500)
  ) {
    return "Service is temporarily unavailable. Please try again shortly.";
  }
  return rawMessage;
}

async function handleResponse(res: Response) {
  if (!res.ok) {
    const text = await res.text();
    let message = text || `Request failed with status ${res.status}`;
    try {
      const data = JSON.parse(text);
      message = data.message ?? message;
    } catch {
      message = sanitizeErrorMessage(message, res.status);
    }
    throw new Error(message);
  }

  return res.json();
}

export async function backendGet(path: string) {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    method: "GET",
    headers: await authHeaders(),
    cache: "no-store",
  });

  return handleResponse(res);
}

export async function backendPost(path: string, body: unknown) {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    method: "POST",
    headers: await authHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return handleResponse(res);
}

export async function backendPatch(path: string, body: unknown) {
  const res = await fetch(`${BACKEND_API_URL}${path}`, {
    method: "PATCH",
    headers: await authHeaders(),
    body: JSON.stringify(body),
    cache: "no-store",
  });

  return handleResponse(res);
}
