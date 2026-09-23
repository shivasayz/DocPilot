import { useCallback, useEffect, useRef, useState } from "react";
import { useWidgetSettings } from "../hooks/useWidgetSettings";
import { FloatingWidget } from "./FloatingWidget";

export function App() {
  const { settings, error, authed, signIn, signOut } = useWidgetSettings();
  const [open, setOpen] = useState(false);
  const lastApplied = useRef("");
  const position = settings?.position ?? "bottom-right";
  const theme = settings?.theme ?? "dark";

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.position = position;
  }, [theme, position]);

  useEffect(() => {
    if (!settings) return;
    const key = JSON.stringify(settings);
    if (key === lastApplied.current) return;
    lastApplied.current = key;
    void window.desktop?.applySettings(settings);
    if (!settings.widget_enabled) setOpen(false);
  }, [settings]);

  const setExpanded = useCallback((next: boolean) => {
    setOpen(next);
    void window.desktop?.setExpanded(next);
  }, []);

  useEffect(() => {
    return window.desktop?.onToggleExpanded(() => {
      setOpen((current) => {
        const next = !current;
        void window.desktop?.setExpanded(next);
        return next;
      });
    });
  }, []);

  if (settings && !settings.widget_enabled) return null;

  return (
    <FloatingWidget
      open={open}
      position={position}
      theme={theme}
      authed={authed}
      error={error}
      onOpen={() => setExpanded(true)}
      onClose={() => setExpanded(false)}
      onSignIn={signIn}
      onSignOut={() => {
        signOut();
        setExpanded(false);
      }}
    />
  );
}
