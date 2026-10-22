p='swarmEngine.js'; s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a)); s=s.replace(a,b)

rep("RUN_SECONDS, WEAPONS, buildRoster, canHold, canLearn, megaOf, xpToNext","RUN_SECONDS, WEAPONS, BLESSINGS, FOES as FOE_DEFS, buildRoster, canHold, canLearn, megaOf, ultimateOf, xpToNext")
rep("    bossTime: 1, noBerry: false, foeDmg: 1, bossHp: 1, unlocks: {}, roster: null, ...(effects || {})",
    "    bossTime: 1, noBerry: false, foeDmg: 1, bossHp: 1, unlocks: {}, roster: null,\n    maxWeapons: MAX_WEAPONS, maxPassives: MAX_PASSIVES, ultRate: 1, endless: false, ...(effects || {})")
# état supplémentaire
rep("    killsBy: {},\n    met: {},\n","""    killsBy: {},
    met: {},
    ult: 0,
    ults: 0,
    bless: { dmg: 1, speed: 1, dust: 0 },
    altars: [],
    altarsUsed: 0,
    altarOpen: false,
    alphaKills: 0,
    alphaBy: {},
    alphaAt: [150, 330],
    missions: [],
    endlessAt: 0,
    endlessWave: 0,
""")
# stats : bénédictions
rep("      dmg: (1 + 0.12 * (g.passives.protein || 0) + 0.04 * g.megaLv) * (mega ? (mk === 'x' ? 1.45 : 1.3) : 1) * E.dmg,",
    "      dmg: (1 + 0.12 * (g.passives.protein || 0) + 0.04 * g.megaLv) * (mega ? (mk === 'x' ? 1.45 : 1.3) : 1) * E.dmg * g.bless.dmg,")
rep("      speed: (1 + 0.08 * (g.passives.carbos || 0) + mega * (mk === 'x' ? 0.22 : 0.12)) * (p.slowT > 0 ? 0.55 : 1) * E.speed,",
    "      speed: (1 + 0.08 * (g.passives.carbos || 0) + mega * (mk === 'x' ? 0.22 : 0.12)) * (p.slowT > 0 ? 0.55 : 1) * E.speed * g.bless.speed,")
# crit bonus
rep("    const crit = !f.inert && Math.random() < s.crit;","    const crit = !f.inert && Math.random() < s.crit + (opts.critBonus || 0);")
# kill : jauge d'ultime, alpha, coffre
rep("""    g.kills += 1;
    g.killsBy[f.id] = (g.killsBy[f.id] || 0) + 1;""","""    g.kills += 1;
    g.killsBy[f.id] = (g.killsBy[f.id] || 0) + 1;
    g.ult = Math.min(1, g.ult + (f.boss ? 0.2 : f.alpha ? 0.3 : f.elite ? 0.05 : 0.011) * E.ultRate);
    if (f.alpha) {
      // Pokémon Alpha vaincu : coffre et entrée « Alpha » au Pokédex
      g.alphaKills += 1;
      g.alphaBy[f.id] = (g.alphaBy[f.id] || 0) + 1;
      g.pickups.push({ x: f.x, y: f.y, kind: 'chest', z: 6, vz: 6 });
      for (let i = 0; i < 10; i += 1) dropOrb(f.x, f.y, 3);
      g.banner = { text: `${f.def.name} Alpha est K.O. ! Un coffre est tombé`, life: 2.6 };
      g.fx.push({ kind: 'ring', x: f.x, y: f.y, r: 10, max: 180, life: 0.6, color: '#ff4a4a' });
      shake(0.5);
      return;
    }""")
# victoire finale : mode survie infinie
rep("""    if (f.boss === 'final') {
      g.slow = 1.2;
      g.flash = { color: '#ffffff', life: 0.5, max: 0.5 };
      shake(1);
      g.over = 'win';""","""    if (f.boss === 'final' && E.endless) {
      // Survie infinie : le légendaire tombe, la horde continue
      g.slow = 0.8;
      g.flash = { color: '#ffffff', life: 0.4, max: 0.4 };
      shake(0.8);
      for (let i = 0; i < 20; i += 1) dropOrb(f.x, f.y, 3);
      g.pickups.push({ x: f.x, y: f.y, kind: 'chest', z: 6, vz: 6 });
      g.banner = { text: `${f.def.name} est K.O. ! La horde continue…`, life: 3 };
      return;
    }
    if (f.boss === 'final') {
      g.slow = 1.2;
      g.flash = { color: '#ffffff', life: 0.5, max: 0.5 };
      shake(1);
      g.over = 'win';""")
# coffre : ramassage
rep("""        } else if (b.kind === 'magnet') {
          g.orbs.forEach((o) => { o.pulled = true; });""","""        } else if (b.kind === 'chest') {
          p.hp = Math.min(p.maxHp, p.hp + 40);
          g.ult = Math.min(1, g.ult + 0.35);
          text(p.x, p.y - 60, 'Coffre Alpha !', '#ffd23a', true);
          burst(p.x, p.y - 20, '#ffd23a', 18, 5, { up: 2 });
          gainXp(p.need - p.xp + 1);
        } else if (b.kind === 'magnet') {
          g.orbs.forEach((o) => { o.pulled = true; });""")
rep("""      } else if (b.kind === 'magnet') {
        ctx.fillStyle = '#d23a3a'; ctx.fillRect(b.x - 9, y - 8, 6, 14); ctx.fillRect(b.x - 9, y - 8, 18, 6);""","""      } else if (b.kind === 'chest') {
        ctx.fillStyle = '#5a2a10'; ctx.fillRect(b.x - 13, y - 10, 26, 20);
        ctx.fillStyle = '#a8642a'; ctx.fillRect(b.x - 12, y - 9, 24, 18);
        ctx.fillStyle = '#c8843a'; ctx.fillRect(b.x - 12, y - 9, 24, 6);
        ctx.fillStyle = '#ffd23a'; ctx.fillRect(b.x - 13, y - 3, 26, 3); ctx.fillRect(b.x - 3, y - 5, 6, 7);
      } else if (b.kind === 'magnet') {
        ctx.fillStyle = '#d23a3a'; ctx.fillRect(b.x - 9, y - 8, 6, 14); ctx.fillRect(b.x - 9, y - 8, 18, 6);""")
# emplacements d'attaques et d'objets (talents)
rep("    if (ownedW.length < MAX_WEAPONS) Object.keys(WEAPONS)","    if (ownedW.length < E.maxWeapons) Object.keys(WEAPONS)")
rep("    if (ownedP.length < MAX_PASSIVES) Object.keys(PASSIVES)","    if (ownedP.length < E.maxPassives) Object.keys(PASSIVES)")
# esquive : Plaquage
rep("""    p.dash = { cd: DASH_CD * stats().cd * E.dashCd, t: 0.17, vx: dx * 15, vy: dy * 15 };""","""    const slam = g.weapons.bodyslam ? WEAPONS.bodyslam.at(g.weapons.bodyslam.lv) : null;
    p.dash = { cd: DASH_CD * stats().cd * E.dashCd * (slam ? 1 - slam.cdr : 1), t: 0.17, vx: dx * 15, vy: dy * 15, slam, hit: new Set() };""")
rep("""    if (p.dash.t > 0) {
      p.dash.t -= dt;""","""    if (p.dash.t > 0) {
      p.dash.t -= dt;
      if (p.dash.slam) {
        // Plaquage : la charge blesse et repousse
        near(p.x, p.y, 70).forEach((f) => {
          if (f.dead || p.dash.hit.has(f) || dist2(f, p) > (34 + f.size * 0.4) ** 2) return;
          p.dash.hit.add(f);
          hurt(f, p.dash.slam.dmg, p, { knock: 10, color: '#fff2c8' });
          g.fx.push({ kind: 'punch', x: f.x, y: f.y - 16, life: 0.16, max: 0.16 });
        });
      }""")
# setPaused : autel ouvert
rep("""    setPaused(v) {
      if (g.pendingLevels && !v) return;""","""    setPaused(v) {
      if ((g.pendingLevels || g.altarOpen) && !v) return;""")
open(p,'w').write(s)
print('ok')
