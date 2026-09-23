import { useCallback, useEffect, useRef, useState } from "react";
import {
  fetchWidgetSettings,
  getToken,
  login,
  setToken,
  type WidgetSettings,
} from "../services/settingsService";

type LoadStatus = "idle" | "loading" | "error";

/**
 * Loads widget settings from the API.
 * Refresh points: app start, after login, widget open (if auto_sync),
 * and every 2s while signed in so enable/disable applies immediately.
 */
export function useWidgetSettings() {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [authed, setAuthed] = useState(() => !!getToken());
  const settingsRef = useRef<WidgetSettings | null>(null);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setAuthed(false);
      setSettings(null);
      settingsRef.current = null;
      return;
    }
    if (!settingsRef.current) setStatus("loading");
    try {
      const next = await fetchWidgetSettings();
      settingsRef.current = next;
      setSettings(next);
      setStatus("idle");
      setError(null);
    } catch (err: unknown) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Request failed");
      if (!getToken()) setAuthed(false);
    }
  }, []);

  useEffect(() => {
    if (getToken()) void refresh();
  }, [refresh]);

  useEffect(() => {
    return window.desktop?.onWidgetOpened(() => {
      if (settingsRef.current?.auto_sync === false) return;
      void refresh();
    });
  }, [refresh]);

  useEffect(() => {
    if (!authed) return;
    const timer = window.setInterval(() => {
      void refresh();
    }, 2_000);
    return () => window.clearInterval(timer);
  }, [authed, refresh]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setError(null);
      await login(email, password);
      setAuthed(true);
      await refresh();
    },
    [refresh],
  );

  const signOut = useCallback(() => {
    setToken(null);
    setAuthed(false);
    setSettings(null);
    settingsRef.current = null;
  }, []);

  return { settings, status, error, authed, refresh, signIn, signOut };
}
