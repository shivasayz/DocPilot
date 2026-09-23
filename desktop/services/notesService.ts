import { API_BASE, getToken, setToken } from "./settingsService";

export type QuickNote = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  favorite: boolean;
  updated_at: string;
  created_at: string;
};

async function authFetch(path: string, init: RequestInit = {}) {
  const token = getToken();
  if (!token) throw new Error("Not signed in");
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (res.status === 401) {
    setToken(null);
    throw new Error("Session expired");
  }
  return res;
}

async function errorDetail(res: Response, fallback: string) {
  const err = await res.json().catch(() => ({ detail: fallback }));
  return typeof err.detail === "string" ? err.detail : fallback;
}

export async function listNotes(): Promise<QuickNote[]> {
  const res = await authFetch("/notes/");
  if (!res.ok) throw new Error(await errorDetail(res, "Could not load notes"));
  return res.json() as Promise<QuickNote[]>;
}

export async function createNote(title: string, content: string): Promise<QuickNote> {
  const res = await authFetch("/notes/", {
    method: "POST",
    body: JSON.stringify({ title, content, pinned: false, favorite: false }),
  });
  if (!res.ok) throw new Error(await errorDetail(res, "Could not save note"));
  return res.json() as Promise<QuickNote>;
}

export async function deleteNote(id: string): Promise<void> {
  const res = await authFetch(`/notes/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error(await errorDetail(res, "Could not delete note"));
  }
}
