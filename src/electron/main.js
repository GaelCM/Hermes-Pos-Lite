import { app, BrowserWindow, ipcMain } from "electron";
import path from 'path';
import fs from 'fs';
import { utilsController } from './controllers/utils.js';

// Archivo de log para diagnóstico en producción
const logPath = path.join(app.getPath('userData'), 'error-log.txt');
function logError(message) {
    const timestamp = new Date().toISOString();
    fs.appendFileSync(logPath, `[${timestamp}] ${message}\n`);
}

process.on('uncaughtException', (error) => {
    logError(`Uncaught Exception: ${error.message}\n${error.stack}`);
    app.quit();
});

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
    app.quit();
} else {
    app.on('second-instance', (event, commandLine, workingDirectory) => {
        const windows = BrowserWindow.getAllWindows();
        if (windows.length > 0) {
            const mainWindow = windows[0];
            if (mainWindow.isMinimized()) mainWindow.restore();
            mainWindow.focus();
        }
    });
}
import { offlineController } from "./controllers/offline.js";


function createWindow() {
    const isDev = !app.isPackaged;

    const mainWindow = new BrowserWindow({
        width: 1920,
        height: 1080,
        icon: path.join(app.getAppPath(), 'src/electron/logo.jpg'),
        webPreferences: {
            preload: path.join(app.getAppPath(), 'src/electron/preload.cjs'),
            nodeIntegration: true,
            contextIsolation: true,
        },
    });

    /*if (isDev) {
        mainWindow.loadURL('http://localhost:5173');
    } else {
        mainWindow.loadFile(path.join(app.getAppPath(), 'dist-react', 'index.html'));
    }*/
    mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
}

app.whenReady().then(() => {
    // Inicializamos el controlador de utilidades
    utilsController();
    offlineController();

    createWindow();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});