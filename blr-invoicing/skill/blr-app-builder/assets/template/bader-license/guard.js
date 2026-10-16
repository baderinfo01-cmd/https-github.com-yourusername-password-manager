/**
 * Bader License — Electron guard
 * One function to protect the whole app: it shows the activation window while the program is
 * not licensed, and only calls your createWindow() once a valid license is active.
 *
 * In your main process (electron main.js / background.js):
 *
 *     const { app, ipcMain, BrowserWindow } = require('electron');
 *     const { guardApp } = require('./bader-license/guard');
 *
 *     app.whenReady().then(() => {
 *         guardApp({ ipcMain, BrowserWindow, createWindow });
 *     });
 *
 *     function createWindow() {
 *         const win = new BrowserWindow({ width: 1200, height: 800, webPreferences: { ... } });
 *         win.loadURL(startUrl);   // your Next.js / app window
 *     }
 */
'use strict';

const path = require('path');
const BaderLicense = require('./license');

let license = null;

/**
 * @param {object}   opts
 * @param {object}   opts.ipcMain       electron ipcMain
 * @param {Function} opts.BrowserWindow electron BrowserWindow
 * @param {Function} opts.createWindow  your function that opens the real app window
 * @param {object}  [opts.config]       overrides for license-config.js (optional)
 * @param {string}  [opts.configFile]   path to license-config.js (default: next to this file)
 */
async function guardApp(opts) {
    const { ipcMain, BrowserWindow, createWindow } = opts;
    const configFile = opts.configFile || path.join(__dirname, 'license-config.js');
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const config = Object.assign({}, require(configFile), opts.config || {});
    license = new BaderLicense(config);
    license.registerIpc(ipcMain);

    const s = await license.status();
    if (s.valid) {
        createWindow();
        return license;
    }
    openActivationWindow(BrowserWindow, createWindow, config);
    return license;
}

function openActivationWindow(BrowserWindow, createWindow, config) {
    const win = new BrowserWindow({
        width: 520,
        height: 680,
        resizable: false,
        fullscreenable: false,
        maximizable: false,
        title: (config.app_name || 'App') + ' — License',
        icon: path.join(__dirname, '..', 'build', 'icon.png'),
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            sandbox: false,
        },
    });
    win.setMenuBarVisibility(false);
    win.loadFile(path.join(__dirname, 'activation.html'));

    // When a check turns the license valid (activation or "continue"), open the app and close this.
    let opened = false;
    const poll = setInterval(async () => {
        const s = await license.status();
        if (s.valid && !opened) {
            opened = true;
            clearInterval(poll);
            createWindow();
            if (!win.isDestroyed()) win.close();
        }
    }, 800);

    win.on('closed', () => clearInterval(poll));
}

/** Access the license object elsewhere (e.g. to gate a Pro feature with license.hasEdition('pro')). */
function getLicense() {
    return license;
}

module.exports = { guardApp, getLicense };
