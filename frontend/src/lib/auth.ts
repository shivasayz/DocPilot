import { useSyncExternalStore } from "react";
import { api } from "./api";
import { loadUserTheme } from "./theme";

export type User = {
  id?: string;
  name: string;
  email: string;
  avatar: string;
  gender?: string;
};

const USER_KEY = "copilot.auth.user";
const TOKEN_KEY = "copilot.auth.token";

let currentUser: User | null = (() => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

const listeners = new Set<() => void>();
function notify() { listeners.forEach((l) => l()); }

function setUser(user: User | null, token?: string) {
  currentUser = user;
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else if (!user) {
    localStorage.removeItem(TOKEN_KEY);
  }
  notify();
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<User> {
  const { access_token } = await api<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: { email, password },
  });

  const userData = await api<{ id: string; name: string; email: string; gender?: string }>("/auth/me", {
    token: access_token,
  });

  const user: User = {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    gender: userData.gender ?? undefined,
    avatar: userData.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
  };

  setUser(user, access_token);
  loadUserTheme();
  return user;
}

export async function signup(
  name: string,
  email: string,
  password: string,
  profile?: { gender?: string; occupation?: string; organization?: string; heard_from?: string; use_case?: string },
): Promise<User> {
  const { access_token } = await api<{ access_token: string }>("/auth/signup", {
    method: "POST",
    body: { name, email, password, ...profile },
  });

  const user: User = {
    name,
    email,
    gender: profile?.gender,
    avatar: name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2),
  };

  setUser(user, access_token);
  loadUserTheme();
  return user;
}

export function logout() {
  setUser(null);
}

export function getUser(): User | null {
  return currentUser;
}

export function useAuth() {
  const user = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => currentUser,
    () => null,
  );
  return { user, isAuthenticated: !!user, login, signup, logout, getToken };
}
