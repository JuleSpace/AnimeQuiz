p='swarmEngine.js'; s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a)); s=s.replace(a,b)

# — déplacer le bloc Alpha après l'animation de K.O.
a0=s.index("    if (f.alpha) {\n      // Pokémon Alpha vaincu")
a1=s.index("    if (f.boss) g.bossKills += 1;")
block=s[a0:a1]; s=s[:a0]+s[a1:]
rep("    burst(f.x, f.y - 12, f.def.color || '#ffffff', f.boss ? 30 : 5, f.boss ? 8 : 4);\n",
    "    burst(f.x, f.y - 12, f.def.color || '#ffffff', f.boss ? 30 : 5, f.boss ? 8 : 4);\n"+block)

# — nouvelles attaques communes
rep("""    if (id === 'bubble') {
      const target = nearest(p.x, p.y, 380);""","""    /* — Attaques communes (achetables ou gratuites) — */
    if (id === 'rockslide') {
      // Éboulement : des rochers tombent sur des ennemis au hasard
      const pool = near(p.x, p.y, v.range).filter((f) => !f.inert && !f.dead && dist2(f, p) < v.range ** 2);
      if (!pool.length) return 0.3;
      cast(id, pool[0]);
      for (let i = 0; i < v.count; i += 1) {
        const t = pool[Math.floor(Math.random() * pool.length)];
        const delay = 0.3 + i * 0.1;
        g.fx.push({ kind: 'meteor', rock: true, x: t.x + rand(-16, 16), y: t.y + rand(-16, 16), life: 0.3 + delay, max: 0.3, fall: delay, done: false, dmg: v.dmg, blast: v.blast });
      }
      return v.cd;
    }
    if (id === 'aerialace') {
      // Aéropique : une lame d'air qui rebondit d'ennemi en ennemi, jamais ratée
      let target = nearest(p.x, p.y, v.range);
      if (!target) return 0.2;
      cast(id, target);
      const hit = new Set();
      let prev = { x: p.x, y: p.y - 18 };
      for (let i = 0; i < v.chains && target; i += 1) {
        hurt(target, v.dmg, prev, { knock: 2, color: '#e8f4ff' });
        hit.add(target);
        g.fx.push({ kind: 'airslash', x: prev.x, y: prev.y, tx: target.x, ty: target.y - 14 - target.z, life: 0.22, max: 0.22, delay: i * 0.05 });
        prev = { x: target.x, y: target.y - 14 - target.z };
        target = nearest(target.x, target.y, 200, hit);
      }
      return v.cd;
    }
    if (id === 'bodyslam') return 1; // Plaquage agit pendant l'esquive
    if (id === 'blizzard') {
      // Blizzard : des éclats de glace partent dans toutes les directions et ralentissent
      if (!nearest(p.x, p.y, 520)) return 0.25;
      cast(id, null);
      for (let i = 0; i < v.count; i += 1) {
        const a = (i / v.count) * TAU + rand(-0.12, 0.12) + g.t;
        g.shots.push({ kind: 'shard', x: from.x, y: from.y, vx: Math.cos(a) * v.speed, vy: Math.sin(a) * v.speed, r: 7, dmg: v.dmg, life: 1.1, pierce: true, hit: new Set(), ang: a, slow: true });
      }
      for (let i = 0; i < 10; i += 1) particle({ kind: 'dot', x: p.x + rand(-30, 30), y: p.y - 20 + rand(-20, 20), vx: rand(-1, 1), vy: rand(-1, 0.5), life: 0.5, color: pick(['#ffffff', '#c8f2ff', '#8ad8ff']), size: 3 });
      return v.cd;
    }
    if (id === 'dazzlinggleam') {
      // Éclat Magique : un flash de lumière rose qui frappe tout autour
      if (!nearest(p.x, p.y, v.radius)) return 0.25;
      cast(id, null);
      near(p.x, p.y, v.radius + 30).forEach((f) => {
        if (f.dead || dist2(f, p) > (v.radius + f.size * 0.4) ** 2) return;
        hurt(f, v.dmg, p, { knock: 4, color: '#ffd6f2' });
      });
      g.fx.push({ kind: 'ring', x: p.x, y: p.y - 10, r: 20, max: v.radius, life: 0.35, color: '#ff9ad8' });
      g.fx.push({ kind: 'ring', x: p.x, y: p.y - 10, r: 10, max: v.radius * 0.7, life: 0.28, color: '#ffffff' });
      for (let i = 0; i < 16; i += 1) {
        const a = rand(0, TAU); const d = rand(20, v.radius);
        particle({ kind: 'star', x: p.x + Math.cos(a) * d, y: p.y - 10 + Math.sin(a) * d * 0.7, vx: 0, vy: -0.6, life: rand(0.3, 0.6), color: pick(['#ffffff', '#ffc6ea', '#ff7ac8']), size: rand(3, 5) });
      }
      g.flash = g.flash || { color: '#ffd6f2', life: 0.05, max: 0.05 };
      return v.cd;
    }
    if (id === 'nightslash') {
      // Tranche-Nuit : griffes sombres sur les ennemis proches, critiques fréquents
      const hit = new Set();
      for (let i = 0; i < v.count; i += 1) { const t = nearest(p.x, p.y, v.range, hit); if (t) hit.add(t); }
      if (!hit.size) return 0.15;
      cast(id, [...hit][0]);
      hit.forEach((f) => {
        hurt(f, v.dmg, p, { knock: 3, color: '#c8a8ff', critBonus: 0.25 });
        g.fx.push({ kind: 'claw', x: f.x, y: f.y - 16 - f.z, a: rand(-0.4, 0.4), life: 0.2, max: 0.2 });
      });
      return v.cd;
    }
    if (id === 'flashcannon') {
      // Luminocanon : une boule d'acier qui traverse la ligne
      const target = nearest(p.x, p.y, 700);
      if (!target) return 0.2;
      cast(id, target);
      const a = Math.atan2(target.y - p.y, target.x - p.x);
      g.shots.push({ kind: 'shadow', steel: true, x: from.x, y: from.y, vx: Math.cos(a) * v.speed, vy: Math.sin(a) * v.speed, r: v.size, dmg: v.dmg, life: 3, pierce: true, hit: new Set(), spin: 0 });
      return v.cd;
    }
    if (id === 'hyperbeam') {
      // Ultralaser : un rayon gigantesque, très lent à recharger
      const target = nearest(p.x, p.y, v.len);
      if (!target) return 0.3;
      cast(id, target);
      const a = Math.atan2(target.y - p.y, target.x - p.x);
      const ux = Math.cos(a); const uy = Math.sin(a);
      near(p.x + ux * v.len / 2, p.y + uy * v.len / 2, v.len / 2 + 60).forEach((f) => {
        if (f.dead) return;
        const rx = f.x - p.x; const ry = f.y - p.y;
        const along = rx * ux + ry * uy; const across = Math.abs(-rx * uy + ry * ux);
        if (along < 0 || along > v.len || across > v.w + f.size * 0.4) return;
        hurt(f, v.dmg, p, { knock: 8, color: '#fff2c8' });
      });
      g.fx.push({ kind: 'icebeam', hyper: true, x: from.x, y: from.y, ang: a, len: v.len, w: v.w, life: 0.5, max: 0.5 });
      shake(0.35);
      return v.cd;
    }
    if (id === 'bubble') {
      const target = nearest(p.x, p.y, 380);""")

# — rendu : météores rocheux
rep("""          ctx.fillStyle = '#8a6aff'; ctx.beginPath(); ctx.arc(sx, sy, 9, 0, TAU); ctx.fill();
          ctx.fillStyle = '#fff1c8'; ctx.beginPath(); ctx.arc(sx - 2, sy - 2, 4, 0, TAU); ctx.fill();""","""          if (f.rock) {
            ctx.fillStyle = '#6e5236'; ctx.fillRect(sx - 10, sy - 9, 20, 18);
            ctx.fillStyle = '#a07a52'; ctx.fillRect(sx - 8, sy - 9, 14, 8);
          } else {
            ctx.fillStyle = '#8a6aff'; ctx.beginPath(); ctx.arc(sx, sy, 9, 0, TAU); ctx.fill();
            ctx.fillStyle = '#fff1c8'; ctx.beginPath(); ctx.arc(sx - 2, sy - 2, 4, 0, TAU); ctx.fill();
          }""")
rep("""      burst(fx.x, fx.y - 6, '#b49cff', 12, 5, { grav: 0.3, up: 1.5 });
      burst(fx.x, fx.y - 6, '#ffb347', 6, 4, { grav: 0.3, up: 1.5 });""","""      burst(fx.x, fx.y - 6, fx.rock ? '#8a6a44' : '#b49cff', 12, 5, { grav: 0.3, up: 1.5 });
      burst(fx.x, fx.y - 6, fx.rock ? '#c8a878' : '#ffb347', 6, 4, { grav: 0.3, up: 1.5 });""")
# impact : couleur rocheuse
s=s.replace("grad.addColorStop(0, `rgba(255,250,235,${1 - kk})`); grad.addColorStop(0.45, `rgba(160,120,255,${0.9 - kk})`); grad.addColorStop(1, 'rgba(90,40,200,0)');",
 "grad.addColorStop(0, `rgba(255,250,235,${1 - kk})`); grad.addColorStop(0.45, f.rock ? `rgba(170,130,80,${0.9 - kk})` : `rgba(160,120,255,${0.9 - kk})`); grad.addColorStop(1, f.rock ? 'rgba(90,60,30,0)' : 'rgba(90,40,200,0)');",1)
# Ultralaser : rayon doré
rep("""        ctx.fillStyle = f.water ? 'rgba(60,130,255,.5)' : 'rgba(140,220,255,.45)'; ctx.fillRect(0, -f.w, f.len, f.w * 2);
        ctx.fillStyle = f.water ? '#7fc0ff' : '#c8f2ff'; ctx.fillRect(0, -f.w * 0.5, f.len, f.w);""","""        ctx.fillStyle = f.hyper ? 'rgba(255,170,60,.5)' : f.water ? 'rgba(60,130,255,.5)' : 'rgba(140,220,255,.45)'; ctx.fillRect(0, -f.w, f.len, f.w * 2);
        ctx.fillStyle = f.hyper ? '#ffe08a' : f.water ? '#7fc0ff' : '#c8f2ff'; ctx.fillRect(0, -f.w * 0.5, f.len, f.w);""")
# Luminocanon : boule d'acier
rep("""        grad.addColorStop(0, '#1a0d2b'); grad.addColorStop(0.55, '#4b2a7a'); grad.addColorStop(0.8, 'rgba(139,107,214,.6)'); grad.addColorStop(1, 'rgba(139,107,214,0)');""",
"""        if (sh.steel) { grad.addColorStop(0, '#ffffff'); grad.addColorStop(0.5, '#c8d4e6'); grad.addColorStop(0.8, 'rgba(140,160,190,.6)'); grad.addColorStop(1, 'rgba(140,160,190,0)'); } else { grad.addColorStop(0, '#1a0d2b'); grad.addColorStop(0.55, '#4b2a7a'); grad.addColorStop(0.8, 'rgba(139,107,214,.6)'); grad.addColorStop(1, 'rgba(139,107,214,0)'); }""")
rep("""      if (sh.kind === 'shadow' && Math.random() < 0.7) particle(""","""      if (sh.kind === 'shadow' && !sh.steel && Math.random() < 0.7) particle(""")
# éclats de glace : ralentissement + rendu
rep("""          hurt(f, sh.dmg, { x: sh.x - sh.vx, y: sy - sh.vy }, { knock: sh.kind === 'shadow' ? 5 : 3, color: sh.kind === 'water' ? '#bfe3ff' : '#b48cff' });""",
"""          hurt(f, sh.dmg, { x: sh.x - sh.vx, y: sy - sh.vy }, { knock: sh.kind === 'shadow' ? 5 : 3, color: sh.kind === 'water' || sh.kind === 'shard' ? '#bfe3ff' : sh.steel ? '#e6ecf5' : '#b48cff' });
          if (sh.slow && !f.inert && !f.boss) { f.slowT = 1.6; f.slowK = 0.5; }""")
rep("""      if (sh.kind === 'shadow') {
        ctx.save();
        ctx.translate(sh.x, sh.y);""","""      if (sh.kind === 'shard') {
        ctx.save();
        ctx.translate(sh.x, sh.y); ctx.rotate(sh.ang);
        ctx.fillStyle = '#8ad8ff'; ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-6, -5); ctx.lineTo(-3, 0); ctx.lineTo(-6, 5); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.fillRect(-2, -1, 8, 2);
        ctx.restore();
        return;
      }
      if (sh.kind === 'shadow') {
        ctx.save();
        ctx.translate(sh.x, sh.y);""")
# fx : lame d'air et griffes
rep("""      } else if (f.kind === 'slash') {""","""      } else if (f.kind === 'airslash') {
        const kk = clamp((k * f.max - (f.delay || 0)) / (f.max * 0.6), 0, 1);
        ctx.save();
        ctx.globalAlpha = 1 - k;
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 4;
        ctx.beginPath(); ctx.moveTo(f.x, f.y); ctx.lineTo(f.x + (f.tx - f.x) * kk, f.y + (f.ty - f.y) * kk); ctx.stroke();
        ctx.strokeStyle = '#9ad8ff'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(f.tx, f.ty, 10 + k * 10, -0.8, 0.8); ctx.stroke();
        ctx.restore();
      } else if (f.kind === 'claw') {
        ctx.save();
        ctx.translate(f.x, f.y); ctx.rotate(f.a);
        ctx.strokeStyle = `rgba(200,168,255,${1 - k})`; ctx.lineWidth = 3;
        for (let i = -1; i <= 1; i += 1) { ctx.beginPath(); ctx.moveTo(-14 + i * 7, -14); ctx.lineTo(10 + i * 7, 14); ctx.stroke(); }
        ctx.strokeStyle = `rgba(30,10,50,${1 - k})`; ctx.lineWidth = 1;
        for (let i = -1; i <= 1; i += 1) { ctx.beginPath(); ctx.moveTo(-13 + i * 7, -12); ctx.lineTo(9 + i * 7, 12); ctx.stroke(); }
        ctx.restore();
      } else if (f.kind === 'slash') {""")
open(p,'w').write(s)
print('ok')
