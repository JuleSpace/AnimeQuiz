p='swarmEngine.js'; s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a)); s=s.replace(a,b)

# — mise en place : autels et missions
rep("""  if (world.biomeName) g.banner = { text: world.biomeName, life: 2.6 };
""","""  if (world.biomeName) g.banner = { text: world.biomeName, life: 2.6 };

  // Autels : 3 points de la carte où l'on choisit une bénédiction
  for (let tries = 0; tries < 400 && g.altars.length < 3; tries += 1) {
    const x = world.B + 120 + Math.random() * (world.W - 2 * world.B - 240);
    const y = world.B + 120 + Math.random() * (world.H - 2 * world.B - 240);
    if (!world.walkable(x, y, false) || !world.walkable(x + 30, y, false) || !world.walkable(x - 30, y, false)) continue;
    if (Math.hypot(x - world.start.x, y - world.start.y) < 650) continue;
    if (g.altars.some((a) => Math.hypot(a.x - x, a.y - y) < 750)) continue;
    g.altars.push({ x, y, charge: 0, used: false, seed: Math.random() * 10 });
  }

  // Missions de la partie : 3 objectifs tirés au sort
  {
    const target = roster.foes[Math.floor(Math.random() * Math.min(4, roster.foes.length))];
    const MISSIONS = [
      { id: 'kills', label: 'Mets K.O. 500 Pokémon', goal: 500, prog: () => g.kills },
      { id: 'foe', label: `Mets K.O. 60 ${FOES[target].name}`, goal: 60, prog: () => g.killsBy[target] || 0 },
      { id: 'rocks', label: 'Brise 12 rochers fissurés', goal: 12, prog: () => g.rocks },
      { id: 'lvl15', label: 'Atteins le niveau 15 avant 5:00', goal: 15, prog: () => g.player.level, fail: () => g.t > 300 },
      { id: 'nohit', label: 'Tiens 90 s sans être touché', goal: 90, prog: () => Math.floor(Math.max(g.maxNoHit, g.t - g.lastHitT)) },
      { id: 'altars', label: 'Active 2 autels', goal: 2, prog: () => g.altarsUsed },
      { id: 'alpha', label: 'Bats un Pokémon Alpha', goal: 1, prog: () => g.alphaKills },
      { id: 'ult', label: 'Lance 3 fois ton ultime', goal: 3, prog: () => g.ults },
      { id: 'mini', label: 'Bats un boss', goal: 1, prog: () => g.bossKills }
    ].filter((m) => m.id !== 'altars' || g.altars.length >= 2);
    for (let i = MISSIONS.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [MISSIONS[i], MISSIONS[j]] = [MISSIONS[j], MISSIONS[i]]; }
    g.missions = MISSIONS.slice(0, 3).map((m) => ({ ...m, done: false, failed: false, value: 0 }));
  }
""")
# Alpha : plus lourd à repousser
rep("const k = (opts.knock ?? 3) * (f.boss ? 0.06 : f.def.heavy ? 0.4 : 1) * (f.elite ? 0.5 : 1);",
    "const k = (opts.knock ?? 3) * (f.boss ? 0.06 : f.def.heavy ? 0.4 : 1) * (f.elite ? 0.5 : 1) * (f.alpha ? 0.2 : 1);")
# finale vaincue en survie
rep("""      g.banner = { text: `${f.def.name} est K.O. ! La horde continue…`, life: 3 };""","""      g.banner = { text: `${f.def.name} est K.O. ! La horde continue…`, life: 3 };
      g.finalDown = true;""")

# — ultime, missions, autels, alphas, survie : logique
rep("""  const leaves = () => {""","""  /* ——— Ultime (touche R) ——— */
  const ULT = ultimateOf(partner);
  const onScreen = () => {
    const { vw, vh } = view();
    const p = g.player;
    return g.foes.filter((f) => !f.dead && !f.inert && Math.abs(f.x - p.x) < vw / 2 + 60 && Math.abs(f.y - p.y) < vh / 2 + 60);
  };
  const ultimate = () => {
    if (g.ult < 1 || g.over || g.paused) return false;
    const p = g.player;
    g.ult = 0;
    g.ults += 1;
    const power = 70 + p.level * 9;
    const type = partner.type;
    g.banner = { text: `${ULT.name} !`, life: 2 };
    g.flash = { color: ULT.color, life: 0.35, max: 0.35 };
    g.slow = 0.35;
    shake(0.9);
    p.inv = Math.max(p.inv, 1);
    if (type === 'Plante') {
      onScreen().forEach((f) => {
        hurt(f, power, p, { knock: 1, color: '#c8f2a8' });
        if (!f.boss) { f.slowT = 3.5; f.slowK = 0.12; }
        g.fx.push({ kind: 'slash', x: f.x, y: f.y - 8, a: rand(0, TAU), life: 0.3, max: 0.3 });
        for (let i = 0; i < 4; i += 1) particle({ kind: 'dot', x: f.x + rand(-10, 10), y: f.y, vx: rand(-0.5, 0.5), vy: -rand(2, 4), grav: 0.15, life: 0.6, color: pick(['#7ac74c', '#b8f070', '#ffd1ec']), size: 4 });
      });
      const heal = Math.round(p.maxHp * 0.25);
      p.hp = Math.min(p.maxHp, p.hp + heal);
      text(p.x, p.y - 60, `+${heal}`, '#6bd17a', true);
      g.zones.push({ kind: 'bloom', x: p.x, y: p.y, r: 260, life: 6, max: 6, dps: power * 0.15, heal: 1, slow: 0.4, tick: 0, seed: Math.random() * 1000 });
    } else if (type === 'Feu') {
      near(p.x, p.y, 420).forEach((f) => { if (!f.dead && !f.inert && dist2(f, p) < (380 + f.size * 0.4) ** 2) hurt(f, power * 1.6, p, { knock: 16, color: '#ffcf8a' }); });
      g.fx.push({ kind: 'blast', x: p.x, y: p.y, r: 380, life: 0.5, max: 0.5 });
      g.fx.push({ kind: 'ring', x: p.x, y: p.y, r: 30, max: 400, life: 0.55, color: '#ff6a1f' });
      g.fx.push({ kind: 'ring', x: p.x, y: p.y, r: 10, max: 300, life: 0.45, color: '#ffe08a' });
      decal({ kind: 'scorch', x: p.x, y: p.y, r: 300, life: 4 });
      for (let i = 0; i < 40; i += 1) {
        const a = rand(0, TAU); const v = rand(3, 9);
        particle({ kind: 'dot', x: p.x, y: p.y - 10, vx: Math.cos(a) * v, vy: Math.sin(a) * v * 0.7 - 1, life: rand(0.4, 0.8), color: pick(['#fff1a8', '#ffb347', '#ff6a1f', '#d23a1a']), size: rand(3, 6) });
      }
    } else if (type === 'Eau') {
      onScreen().forEach((f) => hurt(f, power * 0.9, p, { knock: 34, color: '#bfe3ff' }));
      g.fx.push({ kind: 'wave', x: p.x, y: p.y, r: 30, max: 700, life: 0.8 });
      g.fx.push({ kind: 'wave', x: p.x, y: p.y, r: 10, max: 480, life: 0.6 });
      p.inv = Math.max(p.inv, 2.5);
      for (let i = 0; i < 30; i += 1) { const a = rand(0, TAU); particle({ kind: 'dot', x: p.x, y: p.y - 10, vx: Math.cos(a) * rand(3, 8), vy: Math.sin(a) * rand(3, 8) * 0.7, life: 0.6, color: pick(['#e8f6ff', '#6390f0', '#3a7bff']), size: rand(3, 5) }); }
    } else {
      const { vh } = view();
      onScreen().sort(() => Math.random() - 0.5).slice(0, 30).forEach((f) => {
        hurt(f, power * 1.2, null, { knock: 0, color: '#fff27a' });
        if (!f.boss) { f.slowT = 2.6; f.slowK = 0.04; }
        const top = f.y - vh / 2 - 40;
        g.fx.push({ kind: 'bolt', points: [{ x: f.x + rand(-30, 30), y: top }, { x: f.x + rand(-20, 20), y: (top + f.y) / 2 }, { x: f.x, y: f.y - 14 - f.z }], life: 0.3, max: 0.3, color: '#ffe14a' });
        g.fx.push({ kind: 'spark', x: f.x, y: f.y - 14, life: 0.3, max: 0.3, r: 22 });
      });
    }
    if (callbacks.onUltimate) callbacks.onUltimate(ULT.name);
    return true;
  };

  /* ——— Autels ——— */
  const chooseBlessing = (id) => {
    if (!g.altarOpen) return;
    const p = g.player;
    const b = BLESSINGS.find((x) => x.id === id) || BLESSINGS[0];
    g.altarOpen = false;
    g.paused = false;
    g.altarsUsed += 1;
    last = performance.now();
    if (b.id === 'might') g.bless.dmg *= 1.15;
    if (b.id === 'wind') g.bless.speed *= 1.12;
    if (b.id === 'life') { p.maxHp += 30; p.hp = p.maxHp; }
    if (b.id === 'magnet') g.orbs.forEach((o) => { o.pulled = true; });
    if (b.id === 'storm') g.ult = 1;
    if (b.id === 'fortune') g.bless.dust += 80;
    g.blessings = [...(g.blessings || []), b.id];
    g.banner = { text: `${b.name} : ${b.desc}`, life: 2.6 };
    burst(p.x, p.y - 20, b.color, 20, 5, { up: 2 });
    g.fx.push({ kind: 'ring', x: p.x, y: p.y, r: 10, max: 140, life: 0.5, color: b.color });
    if (b.id === 'wisdom') gainXp(p.need - p.xp + 1);
  };
  const altarTick = (dt) => {
    const p = g.player;
    g.altars.forEach((a) => {
      if (a.used) return;
      const inside = Math.hypot(p.x - a.x, p.y - a.y) < 62;
      a.charge = inside ? a.charge + dt : Math.max(0, a.charge - dt * 2);
      if (inside && Math.random() < 0.4) particle({ kind: 'star', x: a.x + rand(-40, 40), y: a.y - rand(0, 50), vx: 0, vy: -0.8, life: 0.5, color: '#d8b8ff', size: 3 });
      if (a.charge >= 2.2) {
        a.used = true;
        const opts = [...BLESSINGS].sort(() => Math.random() - 0.5).slice(0, 3);
        g.altarOpen = true;
        g.paused = true;
        keys.clear();
        burst(a.x, a.y - 40, '#c08aff', 24, 5, { up: 2 });
        if (callbacks.onAltar) callbacks.onAltar(opts);
        else chooseBlessing(opts[0].id);
      }
    });
  };

  /* ——— Missions, Alphas et vagues infinies ——— */
  let missionAcc = 0;
  const missionTick = (dt) => {
    missionAcc += dt;
    if (missionAcc < 0.25) return;
    missionAcc = 0;
    const p = g.player;
    g.missions.forEach((m) => {
      if (m.done || m.failed) return;
      m.value = Math.min(m.goal, m.prog());
      if (m.value >= m.goal) {
        m.done = true;
        g.banner = { text: `Mission accomplie : ${m.label} !`, life: 2.8 };
        p.hp = Math.min(p.maxHp, p.hp + 30);
        g.ult = Math.min(1, g.ult + 0.25);
        text(p.x, p.y - 64, 'Mission !', '#ffd23a', true);
        burst(p.x, p.y - 20, '#ffd23a', 16, 4, { up: 2 });
        gainXp(Math.round(p.need * 0.5));
      } else if (m.fail && m.fail()) m.failed = true;
    });
  };
  const alphaTick = () => {
    if (!g.alphaAt.length || g.t < g.alphaAt[0]) return;
    const wave = [...WAVES].reverse().find((w) => g.t >= w.from) || WAVES[0];
    const id = pick(wave.foes);
    const f = spawnFoe(id, { alpha: true, elite: false });
    if (!f) return;
    g.alphaAt.shift();
    f.hp = Math.round(f.hp * 14); f.maxHp = f.hp;
    f.size *= 1.5; f.scale *= 1.6;
    f.dmg = Math.round(f.dmg * 1.8);
    f.speed *= 0.85;
    g.banner = { text: `Un ${f.def.name} Alpha rôde ! Bats-le pour un coffre`, life: 3 };
    shake(0.3);
  };
  const endlessTick = () => {
    if (!E.endless) return;
    const at = 540 * E.bossTime + 150 * (g.endlessWave + 1);
    if (g.t < at) return;
    const ids = [...roster.minis, roster.final];
    const id = ids[g.endlessWave % ids.length];
    const b = spawnFoe(id);
    if (!b) return;
    g.endlessWave += 1;
    b.hp = Math.round(b.hp * (1.5 + 0.8 * g.endlessWave) * E.bossHp); b.maxHp = b.hp;
    if (b.boss === 'final') b.boss = 'mini';
    g.banner = { text: `Vague infinie ${g.endlessWave} : ${b.def.name} revient, plus fort !`, life: 3 };
    shake(0.6);
  };

  const leaves = () => {""")
rep("""    g.t += dt;
    const s = stats();
""","""    g.t += dt;
    altarTick(dt);
    if (g.paused) return;
    missionTick(dt);
    alphaTick();
    endlessTick();
    const s = stats();
""")
# — rendu : autels au sol
rep("""    // Marques au sol
""","""    // Autels
    g.altars.forEach((a) => {
      if (a.x < vx0 - 100 || a.x > vx0 + vw + 100 || a.y < vy0 - 120 || a.y > vy0 + vh + 100) return;
      const pulse = 0.5 + Math.sin(g.t * 3 + a.seed) * 0.5;
      ctx.fillStyle = a.used ? 'rgba(60,50,80,.25)' : `rgba(176,120,255,${0.14 + pulse * 0.1})`;
      ctx.beginPath(); ctx.ellipse(a.x, a.y, 62, 38, 0, 0, TAU); ctx.fill();
      if (!a.used) {
        ctx.strokeStyle = 'rgba(216,184,255,.55)'; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.ellipse(a.x, a.y, 62, 38, 0, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
        if (a.charge > 0) {
          ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.ellipse(a.x, a.y, 66, 41, 0, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, a.charge / 2.2)); ctx.stroke();
        }
      }
      ctx.fillStyle = '#4a4258'; ctx.fillRect(a.x - 22, a.y - 10, 44, 14);
      ctx.fillStyle = '#6e6684'; ctx.fillRect(a.x - 18, a.y - 14, 36, 6);
      ctx.fillStyle = '#5a5270'; ctx.fillRect(a.x - 9, a.y - 44, 18, 32);
      ctx.fillStyle = '#7e769a'; ctx.fillRect(a.x - 9, a.y - 44, 6, 32);
      const oy = a.y - 58 - (a.used ? 0 : pulse * 4);
      if (!a.used) {
        const gl = ctx.createRadialGradient(a.x, oy, 2, a.x, oy, 30);
        gl.addColorStop(0, 'rgba(255,255,255,.9)'); gl.addColorStop(0.3, 'rgba(192,138,255,.7)'); gl.addColorStop(1, 'rgba(192,138,255,0)');
        ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(a.x, oy, 30, 0, TAU); ctx.fill();
      }
      ctx.fillStyle = a.used ? '#6a6478' : '#c08aff'; ctx.fillRect(a.x - 7, oy - 7, 14, 14);
      ctx.fillStyle = a.used ? '#8a8498' : '#f0e0ff'; ctx.fillRect(a.x - 5, oy - 5, 5, 5);
    });

    // Marques au sol
""")
# Alpha : aura rouge
rep("""    if (f.elite) {
      ctx.save();
      ctx.filter = 'hue-rotate(150deg) saturate(1.6) brightness(1.1)';
    }""","""    if (f.alpha) {
      ctx.fillStyle = `rgba(255,40,40,${0.22 + Math.sin(g.t * 5) * 0.08})`;
      ctx.beginPath(); ctx.ellipse(f.x, f.y, f.size * 0.9, f.size * 0.45, 0, 0, TAU); ctx.fill();
      ctx.save();
      ctx.filter = 'drop-shadow(0 0 4px rgba(255,40,40,.95)) saturate(1.2)';
      if (Math.random() < 0.3) particle({ kind: 'dot', x: f.x + rand(-f.size * 0.4, f.size * 0.4), y: f.y - rand(0, f.size), vx: 0, vy: -1, life: 0.5, color: pick(['#ff4a4a', '#ff9a6a']), size: 3 });
    }
    if (f.elite) {
      ctx.save();
      ctx.filter = 'hue-rotate(150deg) saturate(1.6) brightness(1.1)';
    }""")
rep("""    if (f.elite) {
      ctx.restore();
      if (Math.random() < 0.15)""","""    if (f.alpha) ctx.restore();
    if (f.elite) {
      ctx.restore();
      if (Math.random() < 0.15)""")
# flèches vers les Alphas, autels et alphas sur la mini-carte
rep("""    // Mini-carte
""","""    g.foes.forEach((f) => {
      if (!f.alpha || f.dead) return;
      const bx = (f.x - vx0) * zoom; const by = (f.y - vy0) * zoom;
      if (bx >= 0 && by >= 0 && bx <= w && by <= h) return;
      const a = Math.atan2(by - h / 2, bx - w / 2);
      ctx.save();
      ctx.translate(clamp(bx, 40, w - 40), clamp(by, 90, h - 40)); ctx.rotate(a);
      ctx.fillStyle = `rgba(255,60,60,${0.6 + Math.sin(g.t * 10) * 0.3})`;
      ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(-8, -8); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill();
      ctx.restore();
    });

    // Mini-carte
""")
rep("""    if (g.boss) {
      ctx.fillStyle = '#ffd23a';
      ctx.beginPath(); ctx.arc(mx0 + g.boss.x * ms""","""    g.altars.forEach((a) => {
      ctx.fillStyle = a.used ? '#6a6478' : '#c08aff';
      ctx.fillRect(mx0 + a.x * ms - 3, my0 + a.y * ms - 3, 6, 6);
    });
    g.foes.forEach((f) => {
      if (!f.alpha || f.dead) return;
      ctx.fillStyle = '#ff3a3a';
      ctx.beginPath(); ctx.arc(mx0 + f.x * ms, my0 + f.y * ms, 3.5, 0, TAU); ctx.fill();
    });
    if (g.boss) {
      ctx.fillStyle = '#ffd23a';
      ctx.beginPath(); ctx.arc(mx0 + g.boss.x * ms""")
# touche R
rep("""    if (down && (e.code === 'Escape' || e.code === 'KeyP') && callbacks.onPauseKey) callbacks.onPauseKey();""",
"""    if (down && (e.code === 'Escape' || e.code === 'KeyP') && callbacks.onPauseKey) callbacks.onPauseKey();
    if (down && e.code === 'KeyR' && !e.repeat) ultimate();""")
rep("window.__swarm = { g, world, dash, keys, choose, gainXp };","window.__swarm = { g, world, dash, keys, choose, gainXp, ultimate, chooseBlessing };")
# instantané
rep("""    remaining: Math.max(0, RUN_SECONDS - g.t)
  });""","""    remaining: Math.max(0, RUN_SECONDS - g.t),
    ult: g.ult,
    ultName: ULT.name,
    ultColor: ULT.color,
    ults: g.ults,
    missions: g.missions.map((m) => ({ id: m.id, label: m.label, goal: m.goal, value: m.value, done: m.done, failed: m.failed })),
    altarsUsed: g.altarsUsed,
    blessings: g.blessings || [],
    blessDust: g.bless.dust,
    alphaKills: g.alphaKills,
    alphaBy: g.alphaBy,
    endless: E.endless,
    endlessWave: g.endlessWave,
    finalDown: !!g.finalDown,
    slots: { weapons: E.maxWeapons, passives: E.maxPassives }
  });""")
rep("""    snapshot,
    choose,
    reroll,
    dash,""","""    snapshot,
    choose,
    reroll,
    dash,
    ultimate,
    chooseBlessing,""")
open(p,'w').write(s)
print('ok')
