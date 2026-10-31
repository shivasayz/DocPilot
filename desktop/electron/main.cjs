const { app, BrowserWindow, ipcMain, Notification, screen } = require("electron");
const fs = require("fs");
const path = require("path");
const { COLLAPSED, boundsFor, clampAnchor, defaultAnchor } = require("./geometry.cjs");

/** @type {import("electron").BrowserWindow | null} */
let win = null;
let expanded = false;
let anchor = null;
let dragSession = null;
let placeToken = 0;

let appliedOnce = false;
let latest = {
  widget_enabled: true,
  auto_start: false,
  theme: "dark",
  position: "bottom-right",
  auto_sync: true,
  notifications_enabled: true,
};

function anchorFile() {
  return path.join(app.getPath("userData"), "widget-anchor.json");
}

function workArea() {
  return screen.getPrimaryDisplay().workArea;
}

function readAnchor(position) {
  try {
    const saved = JSON.parse(fs.readFileSync(anchorFile(), "utf8"));
    if (saved.position === position && Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
      return clampAnchor({ x: saved.x, y: saved.y }, workArea());
    }
  } catch {
    /* first launch */
  }
  return defaultAnchor(workArea(), position);
}

function saveAnchor() {
  if (!anchor) return;
  fs.mkdirSync(path.dirname(anchorFile()), { recursive: true });
  fs.writeFileSync(
    anchorFile(),
    JSON.stringify({ x: anchor.x, y: anchor.y, position: latest.position }),
  );
}

function notify(title, body) {
  if (!latest.notifications_enabled) return;
  if (!Notification.isSupported()) return;
  new Notification({ title, body }).show();
}

function setWidgetVisible(visible) {
  if (!win || win.isDestroyed()) return;
  if (visible) {
    win.setIgnoreMouseEvents(false);
    win.setAlwaysOnTop(true, "floating");
    win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    win.show();
    return;
  }
  expanded = false;
  win.setIgnoreMouseEvents(true, { forward: true });
  win.hide();
}

function place(isExpanded, animate) {
  if (!win || !anchor) return;
  expanded = isExpanded;
  anchor = clampAnchor(anchor, workArea());
  const target = boundsFor(anchor, expanded, latest.position);
  const token = ++placeToken;
  if (!animate) {
    win.setBounds(target);
    return;
  }
  const start = win.getBounds();
  const started = Date.now();
  const duration = 260;
  const step = () => {
    if (!win || token !== placeToken) return;
    const progress = Math.min(1, (Date.now() - started) / duration);
    const eased = 1 - (1 - progress) ** 4;
    win.setBounds({
      x: Math.round(start.x + (target.x - start.x) * eased),
      y: Math.round(start.y + (target.y - start.y) * eased),
      width: Math.round(start.width + (target.width - start.width) * eased),
      height: Math.round(start.height + (target.height - start.height) * eased),
    });
    if (progress < 1) setTimeout(step, 16);
  };
  step();
}

function applyLoginItem(autoStart) {
  try {
    app.setLoginItemSettings({ openAtLogin: !!autoStart });
    return { applied: true };
  } catch (error) {
    console.warn("setLoginItemSettings failed:", error);
    return { applied: false, error: String(error) };
  }
}

function createWindow() {
  anchor = readAnchor(latest.position);
  const initial = boundsFor(anchor, false, latest.position);
  win = new BrowserWindow({
    ...initial,
    x: initial.x,
    y: initial.y,
    width: COLLAPSED,
    height: COLLAPSED,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: false,
    resizable: false,
    movable: true,
    minimizable: false,
    maximizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false,
    },
  });

  win.setAlwaysOnTop(true, "floating");
  win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  win.setBackgroundColor("#00000000");

  win.once("ready-to-show", () => {
    setWidgetVisible(latest.widget_enabled);
  });

  const devUrl = process.env.VITE_DEV_SERVER_URL || "http://127.0.0.1:5174";
  if (!app.isPackaged) {
    win.loadURL(devUrl);
  } else {
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

ipcMain.handle("apply-settings", (_event, settings) => {
  const previousEnabled = latest.widget_enabled;
  const previousPosition = latest.position;
  latest = { ...latest, ...settings };
  const loginItem = applyLoginItem(latest.auto_start);
  if (!anchor || settings.position !== previousPosition) {
    anchor = settings.position !== previousPosition ? defaultAnchor(workArea(), latest.position) : readAnchor(latest.position);
    saveAnchor();
    place(expanded, false);
  }
  if (!latest.widget_enabled) {
    if (appliedOnce && previousEnabled) notify("DocPilot", "Widget is turned off.");
    appliedOnce = true;
    setWidgetVisible(false);
    return { visible: false, expanded, ...loginItem };
  }
  setWidgetVisible(true);
  if (appliedOnce && !previousEnabled) notify("DocPilot", "Widget is on.");
  appliedOnce = true;
  return { visible: !!win?.isVisible(), expanded, ...loginItem };
});

ipcMain.handle("set-expanded", (_event, value) => {
  if (!latest.widget_enabled) {
    setWidgetVisible(false);
    return { expanded: false, visible: false };
  }
  place(!!value, true);
  setWidgetVisible(true);
  if (value) {
    win?.focus();
    win?.webContents.send("widget-opened");
  }
  return { expanded, visible: !!win?.isVisible() };
});

ipcMain.handle("begin-drag", () => {
  dragSession = {
    cursor: screen.getCursorScreenPoint(),
    anchor: anchor ? { ...anchor } : defaultAnchor(workArea(), latest.position),
  };
});

ipcMain.handle("drag-move", () => {
  if (!dragSession) return;
  const cursor = screen.getCursorScreenPoint();
  anchor = clampAnchor(
    {
      x: dragSession.anchor.x + cursor.x - dragSession.cursor.x,
      y: dragSession.anchor.y + cursor.y - dragSession.cursor.y,
    },
    workArea(),
  );
  place(expanded, false);
});

ipcMain.handle("end-drag", () => {
  dragSession = null;
  saveAnchor();
});

app.whenReady().then(() => {
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
