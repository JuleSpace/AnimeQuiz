// Poké Prairie, appli de bureau : une fenêtre sans bordure, posée en bandeau au-dessus de la barre des tâches.
// Elle affiche la page du jeu sur bullys-lair.dev (même compte, même sauvegarde que le site).
// Hors ligne, le service worker du site sert la dernière version gardée en cache ; la sauvegarde reste dans l'appli
// et se resynchronise au retour du réseau.
const { app, BrowserWindow, ipcMain, screen, shell, Tray, Menu, nativeImage } = require('electron')
const path = require('node:path')
const fs = require('node:fs')

const SITE = process.env.PRAIRIE_URL || 'https://bullys-lair.dev/#prairie'
const SITE_ORIGIN = new URL(SITE).origin
const STRIP_H = 84
const PANEL_H = 760

app.setName('Poké Prairie')
if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0) }

const prefsFile = () => path.join(app.getPath('userData'), 'prefs.json')
const readPrefs = () => { try { return JSON.parse(fs.readFileSync(prefsFile(), 'utf8')) } catch { return {} } }
const writePrefs = (p) => { try { fs.writeFileSync(prefsFile(), JSON.stringify({ ...readPrefs(), ...p })) } catch { /* disque indisponible */ } }

let win = null
let tray = null
let mode = 'strip'

/** Place la fenêtre en bas de l'écran principal, au-dessus de la barre des tâches. */
function place() {
  if (!win) return
  const area = screen.getPrimaryDisplay().workArea
  const h = mode === 'panel' ? Math.min(PANEL_H, area.height) : STRIP_H
  const w = mode === 'panel' ? Math.min(1180, area.width) : Math.min(760, area.width)
  win.setBounds({ x: Math.round(area.x + (area.width - w) / 2), y: area.y + area.height - h, width: w, height: h })
}

function applyTop() {
  if (!win) return
  const top = readPrefs().top !== false
  win.setAlwaysOnTop(top, 'screen-saver')
}

function createWindow() {
  win = new BrowserWindow({
    width: 760,
    height: STRIP_H,
    frame: false,
    transparent: true,
    resizable: false,
    skipTaskbar: true,
    show: false,
    hasShadow: false,
    backgroundColor: '#00000000',
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.cjs'), contextIsolation: true, sandbox: true, backgroundThrottling: false }
  })
  place()
  applyTop()
  win.loadURL(SITE)
  win.once('ready-to-show', () => win.show())

  // Premier lancement sans réseau (rien en cache) : petite page d'attente avec « Réessayer »
  win.webContents.on('did-fail-load', (_e, code, _desc, url, isMain) => {
    if (!isMain || code === -3) return
    win.loadFile(path.join(__dirname, 'offline.html'), { query: { url: SITE } })
  })
  // Liens externes dans le vrai navigateur ; le site et la connexion Discord restent dans l'appli
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
  win.webContents.on('will-navigate', (e, url) => {
    const u = new URL(url)
    if (u.origin === SITE_ORIGIN || u.hostname.endsWith('discord.com') || u.protocol === 'file:') {
      if (u.origin === SITE_ORIGIN && !u.hash) { setMode('panel') } // page de connexion du site : on lui laisse de la place
      return
    }
    e.preventDefault()
    shell.openExternal(url)
  })
  win.on('closed', () => { win = null })
}

function setMode(next) {
  mode = next === 'panel' ? 'panel' : 'strip'
  place()
}

function showWin() {
  if (!win) createWindow()
  else { win.show(); applyTop() }
}

function buildTray() {
  const icon = nativeImage.createFromPath(path.join(__dirname, 'build', 'icon.png')).resize({ width: 16, height: 16 })
  tray = new Tray(icon)
  tray.setToolTip('Poké Prairie')
  const menu = () => Menu.buildFromTemplate([
    { label: 'Afficher la prairie', click: () => { showWin(); setMode('strip') } },
    { label: 'Ouvrir le panneau', click: () => { showWin(); setMode('panel') } },
    { label: 'Masquer', click: () => win && win.hide() },
    { type: 'separator' },
    { label: 'Toujours au premier plan', type: 'checkbox', checked: readPrefs().top !== false, click: (i) => { writePrefs({ top: i.checked }); applyTop() } },
    { label: 'Lancer au démarrage', type: 'checkbox', checked: app.getLoginItemSettings().openAtLogin, click: (i) => app.setLoginItemSettings({ openAtLogin: i.checked }) },
    { label: 'Ouvrir le site dans le navigateur', click: () => shell.openExternal(SITE) },
    { label: 'Revenir à la prairie', click: () => { showWin(); win && win.loadURL(SITE) } },
    { type: 'separator' },
    { label: 'Quitter', click: () => app.quit() }
  ])
  tray.setContextMenu(menu())
  tray.on('click', () => { if (win && win.isVisible()) win.hide(); else showWin() })
  tray.on('right-click', () => tray.setContextMenu(menu()))
}

ipcMain.on('prairie:version', (e) => { e.returnValue = app.getVersion() })
ipcMain.on('prairie:mode', (_e, m) => setMode(m))
ipcMain.on('prairie:hide', () => win && win.hide())
ipcMain.on('prairie:top:get', (e) => { e.returnValue = readPrefs().top !== false })
ipcMain.on('prairie:top:set', (_e, on) => { writePrefs({ top: !!on }); applyTop() })
ipcMain.on('prairie:autostart:get', (e) => { e.returnValue = app.getLoginItemSettings().openAtLogin })
ipcMain.on('prairie:autostart:set', (_e, on) => app.setLoginItemSettings({ openAtLogin: !!on }))

app.on('second-instance', () => showWin())
app.whenReady().then(() => {
  createWindow()
  buildTray()
  screen.on('display-metrics-changed', place)
  screen.on('display-added', place)
  screen.on('display-removed', place)
})
// La fenêtre fermée, l'appli reste dans la zone de notification (comme un jeu « idle »)
app.on('window-all-closed', (e) => { e.preventDefault() })
