const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("desktop", {
  applySettings: (settings) => ipcRenderer.invoke("apply-settings", settings),
  setExpanded: (expanded) => ipcRenderer.invoke("set-expanded", expanded),
  beginDrag: () => ipcRenderer.invoke("begin-drag"),
  dragMove: () => ipcRenderer.invoke("drag-move"),
  endDrag: () => ipcRenderer.invoke("end-drag"),
  onWidgetOpened: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("widget-opened", listener);
    return () => ipcRenderer.removeListener("widget-opened", listener);
  },
  onToggleExpanded: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("toggle-expanded", listener);
    return () => ipcRenderer.removeListener("toggle-expanded", listener);
  },
});
