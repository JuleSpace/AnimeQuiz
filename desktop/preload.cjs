// Pont entre la page du jeu et l'appli : la page s'en sert pour passer du bandeau au panneau, etc.
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('prairieDesktop', {
  version: () => ipcRenderer.sendSync('prairie:version'),
  setMode: (mode) => ipcRenderer.send('prairie:mode', mode === 'panel' ? 'panel' : 'strip'),
  hide: () => ipcRenderer.send('prairie:hide'),
  getTop: () => ipcRenderer.sendSync('prairie:top:get'),
  setTop: (on) => ipcRenderer.send('prairie:top:set', !!on),
  getAutostart: () => ipcRenderer.sendSync('prairie:autostart:get'),
  setAutostart: (on) => ipcRenderer.send('prairie:autostart:set', !!on)
})
