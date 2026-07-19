export const API_BASE = "http://localhost:8000";

type ApiOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

export async function api<T>(endpoint: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail ?? `Error ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function uploadFile(file: File, token?: string): Promise<void> {
  const form = new FormData();
  form.append("file", file);

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}/knowledge-source/upload`, {
    method: "POST",
    headers,
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(err.detail ?? `Error ${res.status}`);
  }
}
