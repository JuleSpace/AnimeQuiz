p='swarmMeta.js'; s=open(p).read()
def rep(a,b,n=1):
    global s
    assert s.count(a)==n,(a[:80],s.count(a)); s=s.replace(a,b)
rep("import {","import {",1) if False else None
rep("""  { id: 'mega', branch: 'mastery', tier: 2, name: 'Lien Méga', max: 1, base: 450, desc: () => 'La Méga-Gemme ne demande que 2 niveaux' }
];""","""  { id: 'mega', branch: 'mastery', tier: 2, name: 'Lien Méga', max: 1, base: 450, desc: () => 'La Méga-Gemme ne demande que 2 niveaux' },
  { id: 'ultcharge', branch: 'force', tier: 1, name: 'Ferveur', max: 3, base: 110, desc: (r) => `Jauge d’ultime +${r * 15} % plus rapide` },
  { id: 'slotp', branch: 'mastery', tier: 1, name: 'Sacoche', max: 1, base: 600, desc: () => '+1 emplacement d’objet (5 au lieu de 4)' },
  { id: 'slotw', branch: 'mastery', tier: 2, name: 'Cinquième capacité', max: 1, base: 900, desc: () => '+1 emplacement d’attaque (5 au lieu de 4)' }
];""")
rep("""  { id: 'dex100', name: 'Encyclopédiste', desc: 'Pokédex : 100 espèces vaincues.', reward: 400 }
];""","""  { id: 'dex100', name: 'Encyclopédiste', desc: 'Pokédex : 100 espèces vaincues.', reward: 400 },
  { id: 'mission3', name: 'Carnet rempli', desc: 'Réussis les 3 missions d’une même partie.', reward: 200 },
  { id: 'missions25', name: 'Agent de terrain', desc: 'Réussis 25 missions au total.', reward: 300 },
  { id: 'alpha1', name: 'Chasseur d’Alpha', desc: 'Bats un Pokémon Alpha.', reward: 100 },
  { id: 'alpha10', name: 'Dompteur d’Alpha', desc: 'Bats 10 Pokémon Alpha au total.', reward: 300 },
  { id: 'altar3', name: 'Pèlerin', desc: 'Active les 3 autels d’une même partie.', reward: 150 },
  { id: 'ult10', name: 'Coup de grâce ultime', desc: 'Lance 10 ultimes au total.', reward: 120 },
  { id: 'endless12', name: 'Increvable', desc: 'Survie infinie : tiens 12 minutes.', reward: 300 },
  { id: 'endless20', name: 'Éternel', desc: 'Survie infinie : tiens 20 minutes.', reward: 800 }
];""")
rep("""    noBerry: !!mod?.noBerry
  };""","""    noBerry: !!mod?.noBerry,
    ultRate: 1 + r('ultcharge') * 0.15,
    maxWeapons: MAX_WEAPONS + (r('slotw') ? 1 : 0),
    maxPassives: MAX_PASSIVES + (r('slotp') ? 1 : 0)
  };""")
rep("""    ranks: { ...(m0.ranks || {}) }, legends: { ...(m0.legends || {}) }, biomes: { ...(m0.biomes || {}) }, unlocks: { ...(m0.unlocks || {}) }
  };""","""    ranks: { ...(m0.ranks || {}) }, legends: { ...(m0.legends || {}) }, biomes: { ...(m0.biomes || {}) }, unlocks: { ...(m0.unlocks || {}) },
    endless: { ...(m0.endless || {}) }, alphas: { ...(m0.alphas || {}) }
  };""")
rep("""  if (run.result === 'win') add('Victoire', 200);""","""  if (run.result === 'win') add('Victoire', 200);
  const missionsDone = (run.missions || []).filter((x) => x.done).length;
  add(`${missionsDone} mission${missionsDone > 1 ? 's' : ''} réussie${missionsDone > 1 ? 's' : ''}`, missionsDone * 60);
  add(`${run.alphaKills || 0} Alpha vaincu${(run.alphaKills || 0) > 1 ? 's' : ''}`, (run.alphaKills || 0) * 50);
  if (run.endless && run.t > 540) add('Survie infinie', (run.t - 540) / 3 + (run.endlessWave || 0) * 40);
  add('Autel de la Fortune', run.blessDust || 0);""")
rep("""  m.starters[run.partnerId] = true;""","""  m.starters[run.partnerId] = true;
  m.missionsDone = (m.missionsDone || 0) + missionsDone;
  m.ults = (m.ults || 0) + (run.ults || 0);
  Object.entries(run.alphaBy || {}).forEach(([id, n]) => { m.alphas[id] = (m.alphas[id] || 0) + n; });
  const alphaTotal = Object.values(m.alphas).reduce((a, b) => a + b, 0);
  let endlessRecord = false;
  if (run.endless && run.t > (m.endless[run.gen] || 0)) { m.endless[run.gen] = run.t; endlessRecord = true; }
  if (run.endless && run.finalDown && run.finalBoss) m.legends[run.finalBoss] = true;
  // Historique : les 15 dernières parties
  m.history = [{
    at: Date.now(), partnerId: run.partnerId, gen: run.gen, result: run.result, t: Math.round(run.t), kills: run.kills, level: run.level,
    rank, biome: run.biome, endless: !!run.endless, missions: missionsDone, finalBoss: run.finalBoss, weapons: run.weaponIds || []
  }, ...(m0.history || [])].slice(0, 15);""")
rep("""  done('dex100', dexCount >= 100);""","""  done('dex100', dexCount >= 100);
  done('mission3', missionsDone >= 3);
  done('missions25', m.missionsDone >= 25);
  done('alpha1', alphaTotal >= 1);
  done('alpha10', alphaTotal >= 10);
  done('altar3', (run.altarsUsed || 0) >= 3);
  done('ult10', m.ults >= 10);
  done('endless12', run.endless && run.t >= 720);
  done('endless20', run.endless && run.t >= 1200);""")
rep("""  return { meta: m, earned: base, bonus, lines, unlocked, dailyDone, rankUp: rankUp ? m.ranks[run.gen] : 0 };""",
    """  return { meta: m, earned: base, bonus, lines, unlocked, dailyDone, rankUp: rankUp ? m.ranks[run.gen] : 0, endlessRecord };""")
open(p,'w').write(s)
print('ok')
