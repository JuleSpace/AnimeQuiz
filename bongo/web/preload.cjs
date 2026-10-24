const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('bongo', {
  getCfg: () => ipcRenderer.invoke('cfg:get'),
  setCfg: (patch) => ipcRenderer.invoke('cfg:set', patch),
  openSkin: () => ipcRenderer.invoke('skin:open'),
  reloadSkin: () => ipcRenderer.invoke('skin:reload'),
  copyUrl: () => ipcRenderer.invoke('url:copy')
})
