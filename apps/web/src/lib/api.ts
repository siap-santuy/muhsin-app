export const API_BASE_URL =
  import.meta.env.VITE_API_URL ?? "http://localhost:3001";

export const SCHOOL_ID = import.meta.env.VITE_SCHOOL_ID ?? "";

export interface ApiEnvelope<T> {
  data: T;
  error: null | { message: string };
  meta: null;
}

export async function post<T>(
  path: string,
  body: unknown,
  token?: string
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const payload = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!res.ok || !payload?.data) {
    const message = payload?.error?.message ?? `Request failed (${res.status})`;
    throw new Error(message);
  }

  return payload.data;
}