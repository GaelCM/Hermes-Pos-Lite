import { app, BrowserWindow, ipcMain } from "electron";
import path from 'path';
import { utilsController } from './controllers/utils.js';
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
            contextIsolation: true, // Requerido para contextBridge en preload.js
        },
    });

    if (isDev) {
        // En desarrollo, carga desde el servidor local de Vite
        mainWindow.loadURL('http://localhost:5173');
        // mainWindow.webContents.openDevTools(); // Opcional: abrir herramientas de desarrollo
    } else {
        // En producción, carga el archivo generado
        mainWindow.loadFile(path.join(app.getAppPath(), '/dist-react/index.html'));
    }
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