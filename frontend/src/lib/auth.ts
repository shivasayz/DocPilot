import { useSyncExternalStore } from "react";

export type User = {
  name: string;
  email: string;
  avatar: string;
};

const STORAGE_KEY = "copilot.auth.user";

let currentUser: User | null = (() => {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

const listeners = new Set<() => void>();
function notify() { listeners.forEach((l) => l()); }

export function login(user: User) {
  currentUser = user;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  notify();
}

export function signup(user: User) {
  login(user);
}

export function logout() {
  currentUser = null;
  localStorage.removeItem(STORAGE_KEY);
  notify();
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
  return { user, isAuthenticated: !!user, login, signup, logout };
}
