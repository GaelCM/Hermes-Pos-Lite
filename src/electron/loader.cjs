const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Solo desactivamos la aceleración en sistemas de 32 bits (equipos antiguos)
// En sistemas de 64 bits (como el tuyo con la RTX 3060), se mantiene ACTIVA para máxima fluidez.
if (process.platform === 'win32' && process.arch === 'ia32') {
    app.disableHardwareAcceleration();
}


const { pathToFileURL } = require('url');

const logPath = path.join(app.getPath('userData'), 'loader-error-log.txt');

(async () => {
    try {
        const mainPath = path.resolve(__dirname, 'main.js');
        await import(pathToFileURL(mainPath).href);
    } catch (e) {
        const timestamp = new Date().toISOString();
        const errorMessage = `[${timestamp}] Failed to load Electron main process: ${e.message}\n${e.stack}\n`;
        fs.appendFileSync(logPath, errorMessage);
        console.error(errorMessage);
        process.exit(1);
    }
})();
