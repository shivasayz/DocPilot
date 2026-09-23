/// <reference types="vite/client" />

import type { WidgetSettings } from "../services/settingsService";

type DesktopBridge = {
  applySettings: (settings: WidgetSettings) => Promise<{ visible: boolean; expanded: boolean }>;
  setExpanded: (expanded: boolean) => Promise<{ expanded: boolean; visible: boolean }>;
  beginDrag: () => Promise<void>;
  dragMove: () => Promise<void>;
  endDrag: () => Promise<void>;
  onWidgetOpened: (callback: () => void) => () => void;
  onToggleExpanded: (callback: () => void) => () => void;
};

declare global {
  interface Window {
    desktop?: DesktopBridge;
  }
}

export {};
