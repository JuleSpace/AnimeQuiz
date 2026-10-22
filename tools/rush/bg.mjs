import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
import fs from 'fs';
const tag = process.argv[2] || 'base';
const steps = (process.argv[3] || '0,60,200').split(',').map(Number);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
p.on('pageerror', (e) => console.log('ERR', e.message, e.stack?.split('\n').slice(0, 4).join(' | ')));
p.on('console', (m) => { if (m.type() === 'error' && !/Failed to load/.test(m.text())) console.log('CONSOLE', m.text().slice(0, 300)); });

await p.route((u) => !u.href.startsWith('http://localhost'), (r) => r.fulfill({ status: 404, body: '' }));
await p.route(/\/api\/me$/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: { id: 'u1', name: 'Jules', avatar: '' } }) }));
await p.route(/\/api\/auth\/config/, (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"discord":false,"accounts":true}' }));
await p.addInitScript(() => { window.__RUSH_DEBUG = true; });
await p.goto('http://localhost:8778/index.html#pokerush', { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(2500);
await p.locator('.rx-menu-btn.is-big').click({ noWaitAfter: true }); await p.waitForTimeout(500);
await p.waitForTimeout(1500); await p.waitForTimeout(300);
await p.waitForTimeout(800); await p.keyboard.press("Enter");
await p.waitForFunction(() => window.__rush, null, { timeout: 60000 });
await p.evaluate(() => window.__rush.stop());
await p.waitForTimeout(2500);
let done = 0;
await p.setViewportSize({ width: 1920, height: 1080 }); await p.waitForTimeout(800);
const variants = [[0.32, 24, 0.6], [0.26, 30, -0.9], [0.4, 20, 2.2]];
let i = 0;
await p.evaluate(() => { const R = window.__rush; R.step(40); R.g.levelQueue = []; });
for (const [pitch, dist, dy] of variants) {
  const data = await p.evaluate(([pitch, dist, dy]) => { const R = window.__rush; R.g.cam.pitch = pitch; R.g.cam.dist = dist; R.g.cam.yaw += dy; for (let i = 0; i < 20; i += 1) R.render(); return R.renderer.domElement.toDataURL('image/jpeg', 0.88); }, [pitch, dist, dy]);
  fs.writeFileSync(`bg_${i}.jpg`, Buffer.from(data.split(',')[1], 'base64')); i += 1;
}
await b.close();
