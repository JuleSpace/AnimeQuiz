const { contextBridge, ipcRenderer } = require('electron')
contextBridge.exposeInMainWorld('bongo', {
  getCfg: () => ipcRenderer.invoke('cfg:get'),
  setCfg: (patch) => ipcRenderer.invoke('cfg:set', patch),
  openSkin: () => ipcRenderer.invoke('skin:open'),
  reloadSkin: () => ipcRenderer.invoke('skin:reload'),
  copyUrl: () => ipcRenderer.invoke('url:copy'),
  recordKey: (i) => ipcRenderer.invoke('key:record', i),
  keyNames: () => ipcRenderer.invoke('key:names')
})
