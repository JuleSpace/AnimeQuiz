p='swarmEngine.js'; s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a)); s=s.replace(a,b)
def rep1(a,b):
    global s
    assert a in s, a[:80]; s=s.replace(a,b,1)
rep("CAST_ANIM, FOES, GEN_BOSSES, GEN_WAVES, MAX_LEVEL,","CAST_ANIM, FOES, MAX_LEVEL,")
rep("RUN_SECONDS, WEAPONS, megaOf, xpToNext","RUN_SECONDS, WEAPONS, buildRoster, canHold, canLearn, megaOf, xpToNext")
rep("    bossTime: 1, noBerry: false, ...(effects || {})","    bossTime: 1, noBerry: false, foeDmg: 1, bossHp: 1, unlocks: {}, roster: null, ...(effects || {})")
rep("""  const WAVES = GEN_WAVES[gen] || GEN_WAVES[1];
  const BOSSES = (GEN_BOSSES[gen] || GEN_BOSSES[1]).map((b) => ({ ...b, at: Math.round(b.at * E.bossTime) }));""",
"""  // Roster de la partie : espèces et boss tirés au sort dans le pool de la génération
  const roster = E.roster || buildRoster(gen);
  const WAVES = roster.waves;
  const BOSSES = roster.bosses.map((b) => ({ ...b, at: Math.round(b.at * E.bossTime) }));""")
rep("""      dmg: Math.max(2, Math.round(def.dmg * (def.boss ? 1 : 0.7 + g.t / 360) * (elite ? 1.4 : 1))),""",
"""      dmg: Math.max(2, Math.round(def.dmg * (def.boss ? 1 : 0.7 + g.t / 360) * (elite ? 1.4 : 1) * E.foeDmg)),""")
rep("""      const b = spawnFoe(next.id);
      if (b) {""","""      const b = spawnFoe(next.id);
      if (b) {
        b.hp = Math.round(b.hp * (next.hpMul || 1) * E.bossHp);
        b.maxHp = b.hp;""")
# objets
rep("""    p.xp += v * E.xp;""","""    p.xp += v * E.xp * (1 + 0.08 * (g.passives.expshare || 0));""")
rep("""    if (p.inv > 0 || g.over || p.dash.t > 0) return;
    amount = Math.max(1, Math.round(amount * E.armor));""","""    if (p.inv > 0 || g.over || p.dash.t > 0) return;
    // Poudre Claire : petite chance d'esquiver
    if (g.passives.brightpowder && Math.random() < 0.04 * g.passives.brightpowder) {
      p.inv = 0.35;
      text(p.x, p.y - 56, 'Esquivé !', '#fff6c2');
      return;
    }
    amount = Math.max(1, Math.round(amount * E.armor));""")
# options de level-up
rep("""    // Attaques proposées : celles de la génération choisie + les communes
    if (ownedW.length < MAX_WEAPONS) Object.keys(WEAPONS).filter((id) => !g.weapons[id] && (WEAPONS[id].gen === 0 || WEAPONS[id].gen === gen)).forEach((id) => opts.push({ kind: 'weapon', id, lv: 1 }));""",
"""    // Attaques proposées : celles du même type que le starter + les capacités communes débloquées
    if (ownedW.length < MAX_WEAPONS) Object.keys(WEAPONS).filter((id) => !g.weapons[id] && canLearn(partner, id, E.unlocks)).forEach((id) => opts.push({ kind: 'weapon', id, lv: 1 }));""")
rep("""    if (ownedP.length < MAX_PASSIVES) Object.keys(PASSIVES).filter((id) => !g.passives[id]).forEach""",
"""    if (ownedP.length < MAX_PASSIVES) Object.keys(PASSIVES).filter((id) => !g.passives[id] && canHold(id, E.unlocks)).forEach""")
# nouvelles attaques
rep("""    if (id === 'bubble') {
      const target = nearest(p.x, p.y, 380);""","""    if (id === 'icebeam') {
      // Laser Glace : rayon instantané qui traverse la ligne et ralentit
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
        hurt(f, v.dmg, p, { knock: 1.5, color: '#d8f6ff' });
        if (!f.inert && !f.boss) { f.slowT = v.slowT; f.slowK = v.slow; }
      });
      g.fx.push({ kind: 'icebeam', x: from.x, y: from.y, ang: a, len: v.len, w: v.w, life: 0.3, max: 0.3 });
      return v.cd;
    }
    if (id === 'sludge') {
      const targets = [nearest(p.x, p.y, 420)].filter(Boolean);
      if (!targets.length) return 0.2;
      if (v.count > 1) { const t2 = nearest(p.x, p.y, 420, new Set(targets)); if (t2) targets.push(t2); }
      cast(id, targets[0]);
      targets.forEach((t) => g.shots.push({ kind: 'lob', sub: 'toxic', x: p.x, y: p.y, sx: p.x, sy: p.y, tx: t.x, ty: t.y, t: 0, dur: 0.6, h: 80, dmg: v.dmg, blast: v.puddle * 0.7, puddle: v.puddle, dps: v.dps, zlife: v.life, life: 1 }));
      return v.cd;
    }
    if (id === 'psychic') {
      // Psyko : vise les ennemis les plus résistants
      const pool = near(p.x, p.y, v.range).filter((f) => !f.inert && !f.dead && dist2(f, p) < v.range ** 2).sort((a, b) => b.hp - a.hp).slice(0, v.count);
      if (!pool.length) return 0.25;
      cast(id, pool[0]);
      pool.forEach((f, i) => {
        hurt(f, v.dmg, p, { knock: 9, color: '#ffc6ea' });
        g.fx.push({ kind: 'psy', x: f.x, y: f.y - 16 - f.z, r: f.size * 0.7, life: 0.4 + i * 0.03, max: 0.4 + i * 0.03 });
      });
      g.fx.push({ kind: 'ring', x: p.x, y: p.y - 10, r: 10, max: 60, life: 0.3, color: '#ff7ac8' });
      return v.cd;
    }
    if (id === 'hurricane') {
      cast(id, nearest(p.x, p.y, 500));
      for (let i = 0; i < v.count; i += 1) {
        const t = nearest(p.x, p.y, 500);
        const a = t ? Math.atan2(t.y - p.y, t.x - p.x) + (i ? Math.PI : 0) : rand(0, TAU);
        g.shots.push({ kind: 'tornado', x: p.x, y: p.y, vx: Math.cos(a) * 1.6, vy: Math.sin(a) * 1.6, r: v.radius, dps: v.dps, pull: v.pull, life: v.life, max: v.life, tick: 0, spin: 0 });
      }
      return v.cd;
    }
    if (id === 'dracometeor') {
      // Draco-Météore : des météores tombent sur les ennemis proches après un sifflement
      const pool = near(p.x, p.y, v.range).filter((f) => !f.inert && !f.dead && dist2(f, p) < v.range ** 2);
      if (!pool.length) return 0.3;
      cast(id, pool[0]);
      for (let i = 0; i < v.count; i += 1) {
        const t = pool[Math.floor(Math.random() * pool.length)];
        const delay = 0.45 + i * 0.12;
        g.fx.push({ kind: 'meteor', x: t.x + rand(-20, 20), y: t.y + rand(-20, 20), life: 0.35 + delay, max: 0.35, fall: delay, done: false, dmg: v.dmg, blast: v.blast });
      }
      return v.cd;
    }
    if (id === 'bubble') {
      const target = nearest(p.x, p.y, 380);""")
# météores : impact
rep("""    // Double Pied : les coups partent avec un léger décalage
    g.fx.forEach((fx) => {""","""    // Draco-Météore : impact à la fin de la chute
    g.fx.forEach((fx) => {
      if (fx.kind !== 'meteor' || fx.done || fx.life > fx.max) return;
      fx.done = true;
      near(fx.x, fx.y, fx.blast + 30).forEach((f) => { if ((f.x - fx.x) ** 2 + (f.y - fx.y) ** 2 < (fx.blast + f.size * 0.4) ** 2) hurt(f, fx.dmg, fx, { knock: 6, color: '#d8c8ff' }); });
      burst(fx.x, fx.y - 6, '#b49cff', 12, 5, { grav: 0.3, up: 1.5 });
      burst(fx.x, fx.y - 6, '#ffb347', 6, 4, { grav: 0.3, up: 1.5 });
      decal({ kind: 'crack', x: fx.x, y: fx.y, r: fx.blast * 0.7, life: 2, seed: Math.random() * 1000 });
      shake(0.08);
    });
    // Double Pied : les coups partent avec un léger décalage
    g.fx.forEach((fx) => {""")
# lob toxique
rep("""          if (sh.sub === 'mud') {
            g.zones.push({ kind: 'mud', x: sh.tx, y: sh.ty, r: sh.puddle, life: 3, max: 3, dps: sh.dps, slow: 0.5, tick: 0 });
            burst(sh.tx, sh.ty - 6, '#8a5a2a', 12, 4, { grav: 0.3, up: 1.5 });
          } else {""","""          if (sh.sub === 'mud') {
            g.zones.push({ kind: 'mud', x: sh.tx, y: sh.ty, r: sh.puddle, life: 3, max: 3, dps: sh.dps, slow: 0.5, tick: 0 });
            burst(sh.tx, sh.ty - 6, '#8a5a2a', 12, 4, { grav: 0.3, up: 1.5 });
          } else if (sh.sub === 'toxic') {
            g.zones.push({ kind: 'toxic', x: sh.tx, y: sh.ty, r: sh.puddle, life: sh.zlife, max: sh.zlife, dps: sh.dps, tick: 0, seed: Math.random() * 1000 });
            burst(sh.tx, sh.ty - 6, '#b06ad6', 12, 4, { grav: 0.3, up: 1.5 });
          } else {""")
# tornade : mise à jour
rep1("""    // Projectiles
    g.shots.forEach((sh) => {
      if (sh.kind === 'blade') {""","""    // Projectiles
    g.shots.forEach((sh) => {
      if (sh.kind === 'tornado') {
        // Vent Violent : erre vers la horde, aspire et frappe
        sh.life -= dt; sh.spin += dt * 9; sh.tick -= dt;
        const t = nearest(sh.x, sh.y, 360);
        if (t) { const a = Math.atan2(t.y - sh.y, t.x - sh.x); sh.vx += Math.cos(a) * 0.06; sh.vy += Math.sin(a) * 0.06; }
        sh.vx += rand(-0.08, 0.08); sh.vy += rand(-0.08, 0.08);
        const sp = Math.hypot(sh.vx, sh.vy); if (sp > 2) { sh.vx = (sh.vx / sp) * 2; sh.vy = (sh.vy / sp) * 2; }
        sh.x += sh.vx * 60 * dt; sh.y += sh.vy * 60 * dt;
        near(sh.x, sh.y, sh.r * 1.8).forEach((f) => {
          if (f.dead || f.inert) return;
          const dx = sh.x - f.x; const dy = sh.y - f.y; const d = Math.hypot(dx, dy) || 1;
          if (d > sh.r * 1.8) return;
          if (!f.boss) { f.kx += (dx / d) * sh.pull * dt * 6; f.ky += (dy / d) * sh.pull * dt * 6; }
          if (sh.tick <= 0 && d < sh.r + f.size * 0.4) hurt(f, sh.dps * 0.25, null, { silent: Math.random() < 0.5, color: '#e0f2ff' });
        });
        if (sh.tick <= 0) sh.tick = 0.25;
        if (Math.random() < 0.5) particle({ kind: 'dot', x: sh.x + rand(-sh.r, sh.r), y: sh.y + rand(-10, 4), vx: rand(-1, 1), vy: -rand(0.5, 1.6), life: 0.4, color: pick(['#ffffff', '#c8e8ff', '#a8c8e8']), size: 2 });
        return;
      }
      if (sh.kind === 'blade') {""")
# Grelot Coque
rep("""  const kill = (f) => {""","""  const kill = (f) => {
    if (!f.inert && g.passives.shellbell && Math.random() < 0.06 * g.passives.shellbell) {
      const pl = g.player;
      pl.hp = Math.min(pl.maxHp, pl.hp + 3);
      text(pl.x + 12, pl.y - 52, '+3', '#6bd17a');
    }""")
# dessin : lob toxique, tornade
rep("""        if (sh.sub === 'mud') {
          ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.arc(sh.x, y, 8, 0, TAU); ctx.fill();""","""        if (sh.sub === 'toxic') {
          ctx.fillStyle = '#5a2a7a'; ctx.beginPath(); ctx.arc(sh.x, y, 8, 0, TAU); ctx.fill();
          ctx.fillStyle = '#b06ad6'; ctx.beginPath(); ctx.arc(sh.x - 2, y - 2, 5, 0, TAU); ctx.fill();
        } else if (sh.sub === 'mud') {
          ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.arc(sh.x, y, 8, 0, TAU); ctx.fill();""")
rep("""      if (sh.kind === 'bubble') {
        ctx.fillStyle = 'rgba(160,215,255,.35)';""","""      if (sh.kind === 'tornado') {
        const a = Math.min(1, sh.life / 0.4) * Math.min(1, (sh.max - sh.life) / 0.2 + 0.2);
        shadow(sh.x, sh.y + 2, sh.r * 0.7, 0.18 * a);
        ctx.save();
        ctx.globalAlpha = a;
        for (let i = 0; i < 6; i += 1) {
          const k = i / 5;
          const w = sh.r * (0.35 + k * 0.75);
          const yy = sh.y - k * sh.r * 1.6;
          ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,.85)' : 'rgba(170,210,240,.75)';
          ctx.lineWidth = 3;
          ctx.beginPath(); ctx.ellipse(sh.x + Math.sin(sh.spin + i) * 6, yy, w, w * 0.32, 0, sh.spin + i, sh.spin + i + 4.2); ctx.stroke();
        }
        ctx.restore();
        return;
      }
      if (sh.kind === 'bubble') {
        ctx.fillStyle = 'rgba(160,215,255,.35)';""")
# dessin : zone toxique
rep("""      } else if (z.kind === 'ghostfire') {""","""      } else if (z.kind === 'toxic') {
        // Bombe Beurk : flaque violette qui bouillonne
        ctx.fillStyle = `rgba(90,30,120,${0.5 * a})`;
        ctx.beginPath(); ctx.ellipse(z.x, z.y, z.r, z.r * 0.6, 0, 0, TAU); ctx.fill();
        ctx.fillStyle = `rgba(176,106,214,${0.45 * a})`;
        ctx.beginPath(); ctx.ellipse(z.x - z.r * 0.15, z.y - z.r * 0.08, z.r * 0.55, z.r * 0.3, 0, 0, TAU); ctx.fill();
        if (Math.random() < 0.12) particle({ kind: 'dot', x: z.x + rand(-z.r, z.r) * 0.6, y: z.y + rand(-z.r, z.r) * 0.3, vx: 0, vy: -rand(0.3, 0.8), life: 0.5, color: pick(['#d9a6ff', '#b06ad6']), size: 3 });
      } else if (z.kind === 'ghostfire') {""")
# dessin : effets laser, psy, météore
rep("""      } else if (f.kind === 'spark') {""","""      } else if (f.kind === 'icebeam') {
        ctx.save();
        ctx.translate(f.x, f.y); ctx.rotate(f.ang);
        ctx.globalAlpha = 1 - k;
        ctx.fillStyle = 'rgba(140,220,255,.45)'; ctx.fillRect(0, -f.w, f.len, f.w * 2);
        ctx.fillStyle = '#c8f2ff'; ctx.fillRect(0, -f.w * 0.5, f.len, f.w);
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, -f.w * 0.18, f.len, f.w * 0.36);
        for (let i = 0; i < 8; i += 1) { ctx.fillStyle = '#ffffff'; ctx.fillRect((i / 8) * f.len + rand(0, 20), rand(-f.w, f.w), 4, 4); }
        ctx.restore();
      } else if (f.kind === 'psy') {
        ctx.strokeStyle = `rgba(255,122,200,${1 - k})`;
        ctx.lineWidth = 3;
        for (let i = 0; i < 3; i += 1) {
          const r = f.r * (0.3 + k + i * 0.25);
          ctx.beginPath(); ctx.ellipse(f.x, f.y, r, r * 0.6, 0, 0, TAU); ctx.stroke();
        }
      } else if (f.kind === 'meteor') {
        if (!f.done) {
          // chute : traînée en diagonale + cercle d'impact au sol
          const fall = 1 - Math.max(0, (f.life - f.max) / f.fall);
          ctx.strokeStyle = `rgba(180,156,255,${0.3 + fall * 0.5})`; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.ellipse(f.x, f.y, f.blast * fall, f.blast * fall * 0.6, 0, 0, TAU); ctx.stroke();
          const sx = f.x - 220 * (1 - fall); const sy = f.y - 420 * (1 - fall);
          ctx.strokeStyle = 'rgba(255,200,120,.5)'; ctx.lineWidth = 8;
          ctx.beginPath(); ctx.moveTo(sx - 40, sy - 76); ctx.lineTo(sx, sy); ctx.stroke();
          ctx.fillStyle = '#8a6aff'; ctx.beginPath(); ctx.arc(sx, sy, 9, 0, TAU); ctx.fill();
          ctx.fillStyle = '#fff1c8'; ctx.beginPath(); ctx.arc(sx - 2, sy - 2, 4, 0, TAU); ctx.fill();
        } else {
          const kk = 1 - f.life / f.max;
          const r = f.blast * (0.4 + kk * 0.9);
          const grad = ctx.createRadialGradient(f.x, f.y, 1, f.x, f.y, r);
          grad.addColorStop(0, `rgba(255,250,235,${1 - kk})`); grad.addColorStop(0.45, `rgba(160,120,255,${0.9 - kk})`); grad.addColorStop(1, 'rgba(90,40,200,0)');
          ctx.fillStyle = grad;
          ctx.beginPath(); ctx.arc(f.x, f.y, r, 0, TAU); ctx.fill();
        }
      } else if (f.kind === 'spark') {""")
open(p,'w').write(s)
print('ok')
