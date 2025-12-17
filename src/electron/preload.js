import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron-api", {
    listPrints: () => ipcRenderer.invoke('list-prints'),
    printTicket: (data) => ipcRenderer.invoke('print-ticket', data)
})


