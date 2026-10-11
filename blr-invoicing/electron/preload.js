"use strict";

const { contextBridge, ipcRenderer } = require("electron");
const inv = (ch, ...a) => ipcRenderer.invoke(ch, ...a);

// every call resolves to { ok:true, data } or { ok:false, error }
contextBridge.exposeInMainWorld("blr", {
  db: {
    list: (kind) => inv("blr:db:list", kind),
    get: (kind, id) => inv("blr:db:get", kind, id),
    save: (kind, doc) => inv("blr:db:save", kind, doc),
    remove: (kind, id) => inv("blr:db:remove", kind, id),
    batch: (ops) => inv("blr:db:batch", ops),
    next: (name) => inv("blr:db:next", name),
    audit: (action, detail) => inv("blr:db:audit", action, detail),
  },
  auth: {
    hasUsers: () => inv("blr:auth:has-users"),
    setup: (p) => inv("blr:auth:setup", p),
    login: (u, p) => inv("blr:auth:login", u, p),
    logout: () => inv("blr:auth:logout"),
    current: () => inv("blr:auth:current"),
    users: () => inv("blr:auth:users"),
    saveUser: (u) => inv("blr:auth:save-user", u),
    deleteUser: (id) => inv("blr:auth:delete-user", id),
    changePassword: (o, n) => inv("blr:auth:change-password", o, n),
  },
  backup: {
    export: (password) => inv("blr:backup:export", password),
    restore: (password) => inv("blr:backup:restore", password),
    openFolder: () => inv("blr:backup:open-folder"),
  },
  file: {
    saveText: (name, text) => inv("blr:file:save-text", name, text),
    saveBytes: (name, base64) => inv("blr:file:save-bytes", name, base64),
    openText: (exts) => inv("blr:file:open-text", exts),
  },
  print: {
    printers: () => inv("blr:print:printers"),
    html: (html, opts) => inv("blr:print:html", html, opts),
    pdf: (html, name, opts) => inv("blr:print:pdf", html, name, opts),
  },
  ai: {
    hasKey: () => inv("blr-ai:has-key"),
    setKey: (k) => inv("blr-ai:set-key", k),
    ask: (p) => inv("blr-ai:ask", p),
    scan: (p) => inv("blr-ai:scan", p),
  },
  app: {
    info: () => inv("blr:app:info"),
    openExternal: (url) => inv("blr:app:open-external", url),
  },
});

// Read-only license view; the page can never grant itself a license.
contextBridge.exposeInMainWorld("baderLicense", {
  status: () => ipcRenderer.invoke("bader-license:status"),
  recheck: () => ipcRenderer.invoke("bader-license:recheck"),
});
