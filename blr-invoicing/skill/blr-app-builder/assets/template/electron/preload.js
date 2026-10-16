"use strict";

const { contextBridge, ipcRenderer } = require("electron");
const inv = (ch, ...a) => ipcRenderer.invoke(ch, ...a);

// Every call resolves to { ok:true, data } or { ok:false, error }. The page never gets ipcRenderer or Node.
contextBridge.exposeInMainWorld("bridge", {
  db: {
    list: (kind) => inv("app:db:list", kind),
    get: (kind, id) => inv("app:db:get", kind, id),
    save: (kind, doc) => inv("app:db:save", kind, doc),
    remove: (kind, id) => inv("app:db:remove", kind, id),
    batch: (ops) => inv("app:db:batch", ops),
    next: (name) => inv("app:db:next", name),
    audit: (action, detail) => inv("app:db:audit", action, detail),
  },
  auth: {
    hasUsers: () => inv("app:auth:has-users"),
    setup: (p) => inv("app:auth:setup", p),
    login: (u, p) => inv("app:auth:login", u, p),
    logout: () => inv("app:auth:logout"),
    current: () => inv("app:auth:current"),
    users: () => inv("app:auth:users"),
    saveUser: (u) => inv("app:auth:save-user", u),
    deleteUser: (id) => inv("app:auth:delete-user", id),
    changePassword: (o, n) => inv("app:auth:change-password", o, n),
    recover: (u, k, n) => inv("app:auth:recover", u, k, n),
    newRecovery: (pw) => inv("app:auth:new-recovery", pw),
  },
  backup: {
    export: (password) => inv("app:backup:export", password),
    restore: (password) => inv("app:backup:restore", password),
    openFolder: () => inv("app:backup:open-folder"),
  },
  file: {
    saveText: (name, text) => inv("app:file:save-text", name, text),
    saveBytes: (name, base64) => inv("app:file:save-bytes", name, base64),
    openText: (exts) => inv("app:file:open-text", exts),
  },
  print: {
    printers: () => inv("app:print:printers"),
    html: (html, opts) => inv("app:print:html", html, opts),
    pdf: (html, name, opts) => inv("app:print:pdf", html, name, opts),
  },
  app: {
    info: () => inv("app:app:info"),
    openExternal: (url) => inv("app:app:open-external", url),
  },
});

// Read-only license view; the page can never grant itself a license.
contextBridge.exposeInMainWorld("baderLicense", {
  status: () => ipcRenderer.invoke("bader-license:status"),
  recheck: () => ipcRenderer.invoke("bader-license:recheck"),
});
