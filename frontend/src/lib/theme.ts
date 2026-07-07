import { useSyncExternalStore } from "react";

type Theme = "dark" | "light";

function getThemeKey(): string {
  if (typeof window === "undefined") return "copilot.theme";
  const token = localStorage.getItem("copilot.auth.token");
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return `copilot.theme.${payload.sub}`;
    } catch {}
  }
  return "copilot.theme";
}

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem(getThemeKey()) as Theme) || "dark";
}

let currentTheme: Theme = getStoredTheme();

const listeners = new Set<() => void>();
function notify() { listeners.forEach((l) => l()); }

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (theme === "light") root.classList.add("light");
}

export function setTheme(theme: Theme) {
  currentTheme = theme;
  localStorage.setItem(getThemeKey(), theme);
  applyTheme(theme);
  notify();
}

export function getTheme(): Theme {
  return currentTheme;
}

export function loadUserTheme() {
  currentTheme = getStoredTheme();
  applyTheme(currentTheme);
  notify();
}

export function useTheme() {
  const theme = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    () => currentTheme,
    () => "dark" as Theme,
  );
  return { theme, setTheme };
}

// Apply after hydration, not on module load
let initialized = false;
export function initTheme() {
  if (initialized) return;
  initialized = true;
  currentTheme = getStoredTheme();
  applyTheme(currentTheme);
  notify();
}
