(async () => {
    try {
        await import('./main.js');
    } catch (e) {
        console.error('Failed to load Electron main process:', e);
        process.exit(1);
    }
})();
