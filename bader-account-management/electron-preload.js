"use strict";

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("baderAI", {
  ask: (payload) => ipcRenderer.invoke("bader-ai:ask", payload),
});
