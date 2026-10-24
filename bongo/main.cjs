// Bongo Stream : écoute le clavier et la souris en arrière-plan (même quand le jeu a le focus)
// et anime un personnage dans une page web locale, à ajouter dans OBS en « Source navigateur » :
//   http://localhost:7373/          (fond transparent)
// La fenêtre de l'appli montre la même page avec les réglages.
const { app, BrowserWindow, ipcMain, shell, Tray, Menu, nativeImage, screen } = require('electron')
const path = require('node:path')
const fs = require('node:fs')
const http = require('node:http')
const { WebSocketServer } = require('ws')
const { uIOhook, UiohookKey } = require('uiohook-napi')

const PORT = Number(process.env.BONGO_PORT) || 7373
const WEB = path.join(__dirname, 'web')
if (!app.requestSingleInstanceLock()) { app.quit(); process.exit(0) }

const userDir = () => app.getPath('userData')
const skinDir = () => path.join(userDir(), 'skin')
const cfgFile = () => path.join(userDir(), 'config.json')
const DEFAULT_CFG = {
  keys: ['Q', 'W', 'E', 'R'],
  bigFirst: 1.35, // taille du Q par rapport aux autres touches
  mouseRange: 1, // amplitude du mouvement de la main sur la souris
  background: 'transparent', // transparent | green | #rrggbb
  scale: 1
}
const readCfg = () => { try { return { ...DEFAULT_CFG, ...JSON.parse(fs.readFileSync(cfgFile(), 'utf8')) } } catch { return { ...DEFAULT_CFG } } }
const writeCfg = (c) => { fs.mkdirSync(userDir(), { recursive: true }); fs.writeFileSync(cfgFile(), JSON.stringify(c, null, 2)) }

/* ——— Serveur local : la page, la config, les images perso, et le flux des touches (WebSocket) ——— */
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.json': 'application/json', '.glb': 'model/gltf-binary', '.mjs': 'text/javascript' }
const send = (res, code, body, type = 'text/plain') => { res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'Access-Control-Allow-Origin': '*' }); res.end(body) }
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost')
  if (url.pathname === '/config.json') return send(res, 200, JSON.stringify({ ...readCfg(), skin: listSkin() }), TYPES['.json'])
  if (url.pathname.startsWith('/vendor/three/')) {
    const base = path.dirname(require.resolve('three/package.json'))
    const f = path.join(base, decodeURIComponent(url.pathname.slice('/vendor/three/'.length)))
    if (!f.startsWith(base) || !fs.existsSync(f)) return send(res, 404, 'introuvable')
    return send(res, 200, fs.readFileSync(f), TYPES[path.extname(f)] || 'application/octet-stream')
  }
  if (url.pathname.startsWith('/skin/')) {
    const f = path.join(skinDir(), path.basename(decodeURIComponent(url.pathname.slice(6))))
    if (!f.startsWith(skinDir()) || !fs.existsSync(f)) return send(res, 404, 'introuvable')
    return send(res, 200, fs.readFileSync(f), TYPES[path.extname(f).toLowerCase()] || 'application/octet-stream')
  }
  const rel = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '')
  const f = path.join(WEB, rel)
  if (!f.startsWith(WEB) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return send(res, 404, 'introuvable')
  return send(res, 200, fs.readFileSync(f), TYPES[path.extname(f)] || 'application/octet-stream')
})
const wss = new WebSocketServer({ server, path: '/events' })
const broadcast = (msg) => { const s = JSON.stringify(msg); wss.clients.forEach((c) => { if (c.readyState === 1) c.send(s) }) }
wss.on('connection', (ws) => ws.send(JSON.stringify({ t: 'hello', cfg: { ...readCfg(), skin: listSkin() } })))

/** Images perso du dossier skin (body.png, hand-up.png, hand-1.png… mouse-hand.png, desk.png) ou un modèle 3D .glb. */
function listSkin() {
  try { return fs.readdirSync(skinDir()).filter((f) => /\.(png|gif|webp|svg|glb)$/i.test(f)) } catch { return [] }
}

/* ——— Écoute globale du clavier et de la souris ——— */
const keyIndex = () => readCfg().keys.map((k) => UiohookKey[String(k).toUpperCase()] ?? -1)
let codes = []
let lastMove = 0
function startHook() {
  codes = keyIndex()
  uIOhook.on('keydown', (e) => { const i = codes.indexOf(e.keycode); if (i >= 0) broadcast({ t: 'key', i, down: true }) })
  uIOhook.on('keyup', (e) => { const i = codes.indexOf(e.keycode); if (i >= 0) broadcast({ t: 'key', i, down: false }) })
  uIOhook.on('mousemove', (e) => {
    const now = Date.now()
    if (now - lastMove < 16) return // 60 fois par seconde suffit
    lastMove = now
    const d = screen.getDisplayNearestPoint({ x: e.x, y: e.y }).bounds
    broadcast({ t: 'mouse', x: (e.x - d.x) / d.width, y: (e.y - d.y) / d.height })
  })
  uIOhook.on('mousedown', (e) => broadcast({ t: 'click', b: e.button, down: true }))
  uIOhook.on('mouseup', (e) => broadcast({ t: 'click', b: e.button, down: false }))
  uIOhook.start()
}

/* ——— Fenêtre de réglages ——— */
let win = null
let tray = null
function createWindow() {
  win = new BrowserWindow({
    width: 980, height: 720, title: 'Bongo Stream', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'web', 'preload.cjs'), contextIsolation: true }
  })
  win.loadURL(`http://localhost:${PORT}/?settings=1`)
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
  win.on('close', (e) => { if (!app.isQuitting) { e.preventDefault(); win.hide() } })
}
ipcMain.handle('cfg:get', () => ({ ...readCfg(), skin: listSkin(), port: PORT, skinDir: skinDir() }))
ipcMain.handle('cfg:set', (_e, patch) => {
  const c = { ...readCfg(), ...patch }
  writeCfg(c)
  codes = keyIndex()
  broadcast({ t: 'cfg', cfg: { ...c, skin: listSkin() } })
  return c
})
ipcMain.handle('skin:open', () => { fs.mkdirSync(skinDir(), { recursive: true }); shell.openPath(skinDir()) })
ipcMain.handle('skin:reload', () => { broadcast({ t: 'cfg', cfg: { ...readCfg(), skin: listSkin() } }); return listSkin() })
ipcMain.handle('url:copy', () => { require('electron').clipboard.writeText(`http://localhost:${PORT}/`); return true })

app.whenReady().then(() => {
  fs.mkdirSync(skinDir(), { recursive: true })
  server.listen(PORT, '127.0.0.1', () => {
    createWindow()
    try { startHook() } catch (e) { console.error('Écoute clavier impossible', e) }
  })
  server.on('error', (e) => { console.error(e); createWindow() })
  tray = new Tray(nativeImage.createFromPath(path.join(__dirname, 'build', 'icon.png')).resize({ width: 16, height: 16 }))
  tray.setToolTip('Bongo Stream')
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Réglages', click: () => { if (win) win.show() } },
    { label: 'Ouvrir le dossier des images', click: () => shell.openPath(skinDir()) },
    { type: 'separator' },
    { label: 'Quitter', click: () => { app.isQuitting = true; app.quit() } }
  ]))
  tray.on('click', () => win && win.show())
})
app.on('second-instance', () => win && win.show())
app.on('before-quit', () => { app.isQuitting = true; try { uIOhook.stop() } catch { /* déjà arrêté */ } })
app.on('window-all-closed', (e) => e.preventDefault())
