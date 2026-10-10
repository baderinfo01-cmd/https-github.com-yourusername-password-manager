/**
 * Bader License — preload bridge for the activation window.
 * Exposes a small, read-only API to the activation page. The renderer can ask the main process
 * to activate a code, but can never grant itself a license: the decision stays in the main process.
 */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('baderLicense', {
    status: () => ipcRenderer.invoke('bader-license:status'),
    activate: (code) => ipcRenderer.invoke('bader-license:activate', String(code || '')),
    recheck: () => ipcRenderer.invoke('bader-license:recheck'),
    config: () => ipcRenderer.invoke('bader-license:config'),
    // The main process tells the window to close itself after a successful activation
    onActivated: (cb) => ipcRenderer.on('bader-license:activated', cb),
});
