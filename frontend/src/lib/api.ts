export const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined) || "http://localhost:8000";

type ApiOptions = {
  method?: string;
  body?: unknown;
  token?: string;
};

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;
let handlingUnauthorized = false;

export function setUnauthorizedHandler(handler: UnauthorizedHandler) {
  unauthorizedHandler = handler;
}

function triggerUnauthorized() {
  if (handlingUnauthorized) return;
  handlingUnauthorized = true;
  try {
    unauthorizedHandler?.();
  } finally {
    setTimeout(() => {
      handlingUnauthorized = false;
    }, 1000);
  }
}

function errorMessage(err: unknown, fallback: string): string {
  if (!err || typeof err !== "object") return fallback;
  const detail = (err as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) =>
        typeof d === "object" && d && "msg" in d ? String((d as { msg: unknown }).msg) : String(d),
      )
      .join(", ");
  }
  return fallback;
}

async function rejectIfUnauthorized(res: Response, hadToken: boolean): Promise<void> {
  if (res.status === 401 && hadToken) {
    triggerUnauthorized();
    throw new Error("Session expired");
  }
}

export async function api<T>(endpoint: string, opts: ApiOptions = {}): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  await rejectIfUnauthorized(res, !!opts.token);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(errorMessage(err, `Error ${res.status}`));
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export type KnowledgeSource = {
  id: string;
  name: string;
  file_name: string;
  type: string;
  file_size: number;
  status: string;
  chunks_count: number;
  auto_sync: boolean;
  last_indexed_at: string | null;
  created_at: string | null;
};

export type SearchResponse = {
  query: string;
  answer: string;
  sources: string[];
  chunks_used: number;
};

export type IngestResponse = {
  user_id: string;
  documents_loaded: number;
  notes_loaded?: number;
  note_chunks?: number;
  orphans_removed?: number;
  chunks_count: number;
  sources_updated: number;
  faiss_dir: string;
  status: string;
};

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

  await rejectIfUnauthorized(res, !!token);

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: "Upload failed" }));
    throw new Error(errorMessage(err, `Error ${res.status}`));
  }
}

export function listKnowledgeSources(token?: string) {
  return api<KnowledgeSource[]>("/knowledge-source/", { token });
}

export function ingestKnowledgeSources(token?: string) {
  return api<IngestResponse>("/knowledge-source/ingest", { method: "POST", token });
}

export function searchKnowledge(query: string, topK = 5, token?: string) {
  return api<SearchResponse>("/knowledge-source/search", {
    method: "POST",
    token,
    body: { query, top_k: topK },
  });
}

export function deleteKnowledgeSource(id: string, token?: string) {
  return api<{ ok: boolean; id: string }>(`/knowledge-source/${id}`, {
    method: "DELETE",
    token,
  });
}

export type WidgetSettings = {
  widget_enabled: boolean;
  auto_start: boolean;
  theme: "dark" | "light";
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  auto_sync: boolean;
  keyboard_shortcut: string;
  notifications_enabled: boolean;
};

export function getWidgetSettings(token?: string) {
  return api<WidgetSettings>("/api/v1/widget/settings", { token });
}

export function updateWidgetSettings(body: Partial<WidgetSettings>, token?: string) {
  return api<WidgetSettings>("/api/v1/widget/settings", {
    method: "PUT",
    token,
    body,
  });
}
