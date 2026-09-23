export type WidgetTheme = "dark" | "light";
export type WidgetPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right";

export type WidgetSettings = {
  widget_enabled: boolean;
  auto_start: boolean;
  theme: WidgetTheme;
  position: WidgetPosition;
  auto_sync: boolean;
  keyboard_shortcut: string;
  notifications_enabled: boolean;
};

const TOKEN_KEY = "copilot.auth.token";

export const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function errorDetail(res: Response, fallback: string): Promise<string> {
  const err = await res.json().catch(() => ({ detail: fallback }));
  const detail = (err as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    const message = detail
      .map((item) =>
        typeof item === "object" && item && "msg" in item ? String((item as { msg: unknown }).msg) : String(item),
      )
      .join(", ");
    return message || fallback;
  }
  return fallback;
}

export async function login(email: string, password: string): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) {
    throw new Error("Email and password are required");
  }
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: normalizedEmail, password }),
  });
  if (!res.ok) throw new Error(await errorDetail(res, "Login failed"));
  const data = (await res.json()) as { access_token: string };
  const profile = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${data.access_token}` },
  });
  if (!profile.ok) {
    setToken(null);
    throw new Error(await errorDetail(profile, "Login failed"));
  }
  setToken(data.access_token);
}

export async function fetchWidgetSettings(token = getToken()): Promise<WidgetSettings> {
  if (!token) throw new Error("Not signed in");
  const res = await fetch(`${API_BASE}/api/v1/widget/settings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 401) {
    setToken(null);
    throw new Error("Session expired");
  }
  if (!res.ok) throw new Error(await errorDetail(res, "Could not load widget settings"));
  return res.json() as Promise<WidgetSettings>;
}
