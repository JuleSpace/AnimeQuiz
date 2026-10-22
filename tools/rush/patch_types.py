p='swarmEngine.js'; s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a)); s=s.replace(a,b)

NEW = r"""    /* — Attaques de type (gratuites pour les starters du même type) — */
    if (id === 'spark') {
      // Étincelle : décharge en cercle autour du joueur
      if (!nearest(p.x, p.y, v.radius + 30)) return 0.15;
      cast(id, null);
      near(p.x, p.y, v.radius + 30).forEach((f) => {
        if (f.dead || dist2(f, p) > (v.radius + f.size * 0.4) ** 2) return;
        hurt(f, v.dmg, p, { knock: 3, color: '#fff27a' });
        if (!f.inert && !f.boss) { f.slowT = v.slowT; f.slowK = v.slow; }
        g.fx.push({ kind: 'spark', x: f.x, y: f.y - 14, life: 0.16, max: 0.16, r: 14 });
      });
      g.fx.push({ kind: 'ring', x: p.x, y: p.y - 8, r: 14, max: v.radius, life: 0.22, color: '#ffe14a' });
      for (let i = 0; i < 8; i += 1) particle({ kind: 'spark', x: p.x + rand(-v.radius, v.radius) * 0.7, y: p.y - 10 + rand(-v.radius, v.radius) * 0.5, vx: rand(-2, 2), vy: rand(-2, 2), life: 0.15, color: '#fff27a', size: 3 });
      return v.cd;
    }
    if (id === 'thunderwave') {
      // Cage-Éclair : paralyse les ennemis les plus proches
      const hit = new Set();
      for (let i = 0; i < v.count; i += 1) { const t = nearest(p.x, p.y, v.range, hit); if (t) hit.add(t); }
      if (!hit.size) return 0.25;
      cast(id, [...hit][0]);
      hit.forEach((f) => {
        hurt(f, v.dmg, p, { knock: 0.5, color: '#fff27a' });
        if (!f.inert) { f.slowT = f.boss ? v.stun * 0.4 : v.stun; f.slowK = f.boss ? 0.6 : 0.12; f.paraT = v.stun; }
        g.fx.push({ kind: 'bolt', points: [from, { x: f.x, y: f.y - 14 - f.z }], life: 0.18, max: 0.18, color: W.color });
      });
      return v.cd;
    }
    if (id === 'electroball') {
      const target = nearest(p.x, p.y, 480);
      if (!target) return 0.2;
      cast(id, target);
      const base = Math.atan2(target.y - p.y, target.x - p.x);
      for (let i = 0; i < v.count; i += 1) {
        const a = base + (i - (v.count - 1) / 2) * 0.3;
        g.shots.push({ kind: 'ember', elec: true, x: from.x, y: from.y, vx: Math.cos(a) * v.speed, vy: Math.sin(a) * v.speed, r: 9, dmg: v.dmg, blast: v.blast, life: 1.5, color: W.color });
      }
      return v.cd;
    }
    if (id === 'irontail' || id === 'flamethrower') {
      // Coup en arc (Queue de Fer) ou jet en cône (Lance-Flammes) vers l'ennemi le plus proche
      const target = nearest(p.x, p.y, v.range + 30);
      if (!target) return 0.15;
      cast(id, target);
      const a = Math.atan2(target.y - p.y, target.x - p.x);
      near(p.x, p.y, v.range + 40).forEach((f) => {
        if (f.dead) return;
        const dx = f.x - p.x; const dy = f.y - p.y; const d = Math.hypot(dx, dy);
        let diff = Math.atan2(dy, dx) - a; while (diff > Math.PI) diff -= TAU; while (diff < -Math.PI) diff += TAU;
        if (d < v.range + f.size * 0.4 && Math.abs(diff) < v.arc) hurt(f, v.dmg, p, { knock: v.knock, color: id === 'irontail' ? '#e6ecf5' : '#ffb347' });
      });
      if (id === 'irontail') {
        g.fx.push({ kind: 'sweep', x: p.x, y: p.y - 12, a, r: v.range, arc: v.arc, life: 0.2, max: 0.2 });
        shake(0.05);
      } else {
        for (let i = 0; i < 26; i += 1) {
          const aa = a + rand(-v.arc, v.arc) * 0.8; const sp = rand(3, 7);
          particle({ kind: 'dot', x: from.x, y: from.y, vx: Math.cos(aa) * sp, vy: Math.sin(aa) * sp, life: (v.range / (sp * 60)) * rand(0.8, 1.1), color: pick(['#fff1a8', '#ffb347', '#ff6a1f', '#e0401a']), size: rand(3, 6) });
        }
      }
      return v.cd;
    }
    if (id === 'firespin') {
      // Danse Flammes : un anneau de flammes autour du joueur
      if (!nearest(p.x, p.y, v.radius + 140)) return 0.3;
      cast(id, null);
      for (let i = 0; i < v.n; i += 1) {
        const a = (i / v.n) * TAU;
        g.zones.push({ kind: 'fire', x: p.x + Math.cos(a) * v.radius, y: p.y + Math.sin(a) * v.radius * 0.7, r: 24, life: v.life, max: v.life, dps: v.dps, tick: rand(0, 0.25) });
      }
      g.fx.push({ kind: 'ring', x: p.x, y: p.y, r: 20, max: v.radius, life: 0.35, color: '#ff8a3a' });
      return v.cd;
    }
    if (id === 'willowisp') {
      if (!nearest(p.x, p.y, 600)) return 0.2;
      cast(id, nearest(p.x, p.y, 600));
      for (let i = 0; i < v.count; i += 1) {
        const a = (i / v.count) * TAU + g.t;
        g.shots.push({ kind: 'wisp', x: from.x, y: from.y, vx: Math.cos(a) * v.speed, vy: Math.sin(a) * v.speed, r: 7, dmg: v.dmg, life: 2.6, homing: true, speed: v.speed, burn: v.burn, color: W.color });
      }
      return v.cd;
    }
    if (id === 'surf') {
      // Surf : une vague autour du joueur qui repousse loin (touche aussi les volants)
      if (!nearest(p.x, p.y, v.radius + 40)) return 0.3;
      cast(id, null);
      near(p.x, p.y, v.radius + 40).forEach((f) => { if (!f.dead && dist2(f, p) < (v.radius + f.size * 0.4) ** 2) hurt(f, v.dmg, p, { knock: v.knock, color: '#bfe3ff' }); });
      g.fx.push({ kind: 'wave', x: p.x, y: p.y, r: 20, max: v.radius, life: 0.45, max2: 0.45 });
      for (let i = 0; i < 22; i += 1) {
        const a = rand(0, TAU);
        particle({ kind: 'dot', x: p.x + Math.cos(a) * v.radius * 0.6, y: p.y + Math.sin(a) * v.radius * 0.4, vx: Math.cos(a) * 2.5, vy: -rand(1, 3), grav: 0.25, life: rand(0.4, 0.7), color: pick(['#ffffff', '#bfe3ff', '#4fa8ff']), size: rand(2, 4) });
      }
      return v.cd;
    }
    if (id === 'hydropump') {
      // Hydrocanon : rayon d'eau qui transperce la ligne
      const target = nearest(p.x, p.y, v.len);
      if (!target) return 0.2;
      cast(id, target);
      const a = Math.atan2(target.y - p.y, target.x - p.x);
      const ux = Math.cos(a); const uy = Math.sin(a);
      near(p.x + ux * v.len / 2, p.y + uy * v.len / 2, v.len / 2 + 40).forEach((f) => {
        if (f.dead) return;
        const rx = f.x - p.x; const ry = f.y - p.y;
        const along = rx * ux + ry * uy; const across = Math.abs(-rx * uy + ry * ux);
        if (along < 0 || along > v.len || across > v.w + f.size * 0.4) return;
        hurt(f, v.dmg, p, { knock: 5, color: '#bfe3ff' });
      });
      g.fx.push({ kind: 'icebeam', water: true, x: from.x, y: from.y, ang: a, len: v.len, w: v.w, life: 0.3, max: 0.3 });
      return v.cd;
    }
    if (id === 'whirlpool') {
      cast(id, nearest(p.x, p.y, 500));
      const t = nearest(p.x, p.y, 500);
      const a = t ? Math.atan2(t.y - p.y, t.x - p.x) : rand(0, TAU);
      g.shots.push({ kind: 'tornado', water: true, x: p.x, y: p.y, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, r: v.radius, dps: v.dps, pull: v.pull, life: v.life, max: v.life, tick: 0, spin: 0 });
      return v.cd;
    }
    if (id === 'gigadrain') {
      // Méga-Sangsue : draine des ennemis et soigne
      const hit = new Set();
      for (let i = 0; i < v.count; i += 1) { const t = nearest(p.x, p.y, v.range, hit); if (t) hit.add(t); }
      if (!hit.size) return 0.2;
      cast(id, [...hit][0]);
      let healed = 0;
      hit.forEach((f) => {
        hurt(f, v.dmg, p, { knock: 1, color: '#c8f2a8' });
        if (!f.inert) healed += v.heal;
        for (let i = 0; i < 6; i += 1) particle({ kind: 'dot', x: f.x + rand(-8, 8), y: f.y - 14 + rand(-8, 8), vx: (p.x - f.x) / 22, vy: (p.y - 18 - f.y) / 22, life: 0.36, color: pick(['#9be06a', '#d8ffb8']), size: 3 });
      });
      if (healed) { p.hp = Math.min(p.maxHp, p.hp + healed); text(p.x + 14, p.y - 50, `+${healed}`, '#6bd17a'); }
      return v.cd;
    }
    if (id === 'bubble') {
      const target = nearest(p.x, p.y, 380);"""
rep("""    if (id === 'bubble') {
      const target = nearest(p.x, p.y, 380);""", NEW)

# feux follets : traînée + flamme au contact ; Boule Élek : couleurs
rep("""      if (sh.kind === 'ember' && Math.random() < 0.8) particle({ kind: 'dot', x: sh.x + rand(-3, 3), y: sh.y + rand(-3, 3), vx: -sh.vx * 0.1, vy: -rand(0.3, 1), life: rand(0.2, 0.4), color: pick(sh.blue ? ['#d8f4ff', '#6ac8ff', '#2a6bff'] : ['#ffdd57', '#ff9a3c', '#ff5a1f']), size: rand(2, 4) });""",
"""      if (sh.kind === 'ember' && Math.random() < 0.8) particle({ kind: 'dot', x: sh.x + rand(-3, 3), y: sh.y + rand(-3, 3), vx: -sh.vx * 0.1, vy: -rand(0.3, 1), life: rand(0.2, 0.4), color: pick(sh.elec ? ['#ffffff', '#fff27a', '#ffd21a'] : sh.blue ? ['#d8f4ff', '#6ac8ff', '#2a6bff'] : ['#ffdd57', '#ff9a3c', '#ff5a1f']), size: rand(2, 4) });
      if (sh.kind === 'wisp' && Math.random() < 0.7) particle({ kind: 'dot', x: sh.x + rand(-3, 3), y: sh.y + rand(-3, 3), vx: 0, vy: -rand(0.4, 1), life: 0.35, color: pick(['#c8d0ff', '#8a9aff', '#5a6aff']), size: rand(2, 4) });""")
rep("""            particle({ kind: 'dot', x: sh.x, y: sh.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: rand(0.25, 0.5), color: pick(sh.blue ? ['#e8f8ff', '#6ac8ff', '#2a6bff'] : ['#fff1a8', '#ffb347', '#ff6a1f']), size: rand(2, 5) });
          }
          smoke(sh.x, sh.y, 3, 'rgba(90,80,80,.55)', 12);
          decal({ kind: 'scorch', x: sh.x, y: sy, r: sh.blast * 0.7, life: 2.5 });
          shake(0.04);""","""            particle({ kind: 'dot', x: sh.x, y: sh.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: rand(0.25, 0.5), color: pick(sh.elec ? ['#ffffff', '#fff27a', '#ffd21a'] : sh.blue ? ['#e8f8ff', '#6ac8ff', '#2a6bff'] : ['#fff1a8', '#ffb347', '#ff6a1f']), size: rand(2, 5) });
          }
          if (sh.elec) g.fx.push({ kind: 'spark', x: sh.x, y: sh.y, life: 0.2, max: 0.2, r: sh.blast * 0.6 });
          else {
            smoke(sh.x, sh.y, 3, 'rgba(90,80,80,.55)', 12);
            decal({ kind: 'scorch', x: sh.x, y: sy, r: sh.blast * 0.7, life: 2.5 });
          }
          shake(0.04);""")
rep("""        } else {
          hurt(f, sh.dmg, { x: sh.x - sh.vx, y: sy - sh.vy }, { knock: 2.5, color: '#fff3a0' });
          burst(sh.x, sh.y, '#fff3a0', 5, 3);
        }""","""        } else if (sh.kind === 'wisp') {
          hurt(f, sh.dmg, { x: sh.x - sh.vx, y: sy - sh.vy }, { knock: 1.5, color: '#c8d0ff' });
          g.zones.push({ kind: 'fire', wisp: true, x: f.x, y: f.y + 2, r: 20, life: 1.6, max: 1.6, dps: sh.burn, tick: 0 });
          burst(sh.x, sh.y, '#8a9aff', 6, 3);
        } else {
          hurt(f, sh.dmg, { x: sh.x - sh.vx, y: sy - sh.vy }, { knock: 2.5, color: '#fff3a0' });
          burst(sh.x, sh.y, '#fff3a0', 5, 3);
        }""")
# dessin des projectiles : feu follet, Boule Élek
rep("""      // Flammèche
      const grad = ctx.createRadialGradient(sh.x, sh.y, 1, sh.x, sh.y, sh.r * 2);""","""      if (sh.kind === 'wisp') {
        const gw = ctx.createRadialGradient(sh.x, sh.y, 1, sh.x, sh.y, sh.r * 2.2);
        gw.addColorStop(0, '#ffffff'); gw.addColorStop(0.35, '#b8c4ff'); gw.addColorStop(0.7, '#5a6aff'); gw.addColorStop(1, 'rgba(60,70,255,0)');
        ctx.fillStyle = gw;
        ctx.beginPath(); ctx.arc(sh.x, sh.y, sh.r * 2.2, 0, TAU); ctx.fill();
        return;
      }
      // Flammèche
      const grad = ctx.createRadialGradient(sh.x, sh.y, 1, sh.x, sh.y, sh.r * 2);""")
rep("""      if (sh.blue) { grad.addColorStop(0, '#f2fbff');""","""      if (sh.elec) { grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.3, '#fff27a'); grad.addColorStop(0.65, '#f7c61c'); grad.addColorStop(1, 'rgba(255,220,40,0)'); }
      else if (sh.blue) { grad.addColorStop(0, '#f2fbff');""")
# tornade d'eau (Siphon)
rep("""          ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,.85)' : 'rgba(170,210,240,.75)';""","""          ctx.strokeStyle = sh.water ? (i % 2 ? 'rgba(200,240,255,.9)' : 'rgba(60,140,230,.85)') : (i % 2 ? 'rgba(255,255,255,.85)' : 'rgba(170,210,240,.75)');""")
rep("""        if (Math.random() < 0.5) particle({ kind: 'dot', x: sh.x + rand(-sh.r, sh.r), y: sh.y + rand(-10, 4), vx: rand(-1, 1), vy: -rand(0.5, 1.6), life: 0.4, color: pick(['#ffffff', '#c8e8ff', '#a8c8e8']), size: 2 });""",
"""        if (Math.random() < 0.5) particle({ kind: 'dot', x: sh.x + rand(-sh.r, sh.r), y: sh.y + rand(-10, 4), vx: rand(-1, 1), vy: -rand(0.5, 1.6), life: 0.4, color: pick(sh.water ? ['#ffffff', '#7fc8ff', '#3a8aff'] : ['#ffffff', '#c8e8ff', '#a8c8e8']), size: 2 });""")
# feu follet au sol : flamme bleutée
rep("""      } else if (z.kind === 'fire') {
        const fl = 0.8 + Math.sin(g.t * 20 + z.x) * 0.2;
        ctx.fillStyle = `rgba(255,120,30,${0.35 * a * fl})`;""","""      } else if (z.kind === 'fire' && z.wisp) {
        const fl = 0.8 + Math.sin(g.t * 16 + z.x) * 0.2;
        ctx.fillStyle = `rgba(90,100,255,${0.35 * a * fl})`;
        ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(200,210,255,${0.55 * a * fl})`;
        ctx.beginPath(); ctx.ellipse(z.x, z.y - 2, z.r * 0.45, z.r * 0.3, 0, 0, TAU); ctx.fill();
      } else if (z.kind === 'fire') {
        const fl = 0.8 + Math.sin(g.t * 20 + z.x) * 0.2;
        ctx.fillStyle = `rgba(255,120,30,${0.35 * a * fl})`;""")
# effets : rayon d'eau, coup de queue, vague
rep("""        ctx.fillStyle = 'rgba(140,220,255,.45)'; ctx.fillRect(0, -f.w, f.len, f.w * 2);
        ctx.fillStyle = '#c8f2ff'; ctx.fillRect(0, -f.w * 0.5, f.len, f.w);""","""        ctx.fillStyle = f.water ? 'rgba(60,130,255,.5)' : 'rgba(140,220,255,.45)'; ctx.fillRect(0, -f.w, f.len, f.w * 2);
        ctx.fillStyle = f.water ? '#7fc0ff' : '#c8f2ff'; ctx.fillRect(0, -f.w * 0.5, f.len, f.w);""")
rep("""      } else if (f.kind === 'psy') {""","""      } else if (f.kind === 'sweep') {
        // Queue de Fer : arc métallique
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = '#e6ecf5'; ctx.lineWidth = 10 * (1 - k) + 2;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r, f.r * 0.7, 0, f.a - f.arc * (0.3 + k), f.a + f.arc * (0.3 + k)); ctx.stroke();
        ctx.strokeStyle = '#8a95a8'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, f.r * 0.82, f.r * 0.57, 0, f.a - f.arc * (0.3 + k), f.a + f.arc * (0.3 + k)); ctx.stroke();
        ctx.restore();
      } else if (f.kind === 'wave') {
        // Surf : une vague qui s'étend
        const r = f.r + (f.max - f.r) * Math.min(1, k);
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = '#3a7bff'; ctx.lineWidth = 14 * (1 - k) + 3;
        ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.7, 0, 0, TAU); ctx.stroke();
        ctx.strokeStyle = '#e8f6ff'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.ellipse(f.x, f.y - 4, r * 0.97, r * 0.68, 0, 0, TAU); ctx.stroke();
        ctx.globalAlpha = 1;
      } else if (f.kind === 'psy') {""")
open(p,'w').write(s)
print('ok')
