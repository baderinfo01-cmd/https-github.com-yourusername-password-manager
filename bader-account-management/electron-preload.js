"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("baderAI", {
  ask: (payload) => ipcRenderer.invoke("bader-ai:ask", payload),
  breachRange: (prefix) => ipcRenderer.invoke("bader-ai:breach-range", prefix),
});

// Read-only license view. The renderer can never grant itself a license.
contextBridge.exposeInMainWorld("baderLicense", {
  status: () => ipcRenderer.invoke("bader-license:status"),
  recheck: () => ipcRenderer.invoke("bader-license:recheck"),
});

contextBridge.exposeInMainWorld("baderApp", {
  // device / OS / app version and (optionally) the approximate place of this sign-in
  session: (opts) => ipcRenderer.invoke("bader-app:session", opts),
  // end-to-end encrypted sync relay (network goes through the main process)
  syncPost: (url, body) => ipcRenderer.invoke("bader-sync:post", url, body),
  // the main process asks the UI to lock (screen lock, sleep, minimize)
  onLock: (cb) => {
    const handler = () => cb();
    ipcRenderer.on("bader-app:lock", handler);
    return () => ipcRenderer.removeListener("bader-app:lock", handler);
  },
});
