p='swarmData.js'; s=open(p).read()
def rep(a,b):
    global s
    assert s.count(a)==1,(a[:70],s.count(a)); s=s.replace(a,b)
NEW = """  /* — Capacités communes (Météores, Séisme… et celles-ci) — */
  rockslide: {
    shared: true,
    name: 'Éboulement',
    type: 'Roche',
    color: '#b08a5a',
    desc: (lv) => `${2 + Math.ceil(lv / 2)} rochers tombent sur les ennemis proches et les assomment.`,
    at: (lv) => ({ cd: 2.6 - lv * 0.16, dmg: 20 + lv * 7, count: 2 + Math.ceil(lv / 2), blast: 44 + lv * 4, range: 340 })
  },
  aerialace: {
    shared: true,
    name: 'Aéropiqué',
    type: 'Vol',
    color: '#c8e8ff',
    desc: (lv) => `Une lame de vent qui fend ${lv + 1} ennemis à la suite. Elle ne rate jamais.`,
    at: (lv) => ({ cd: 1.4 - lv * 0.08, dmg: 12 + lv * 5, chains: lv + 1, range: 300 })
  },
  bodyslam: {
    shared: true,
    name: 'Plaquage',
    type: 'Normal',
    color: '#e8e0c8',
    desc: (lv) => `Ton esquive devient une charge : elle blesse et repousse tout ce que tu traverses (${16 + lv * 8} dégâts) et se recharge ${10 + lv * 4} % plus vite.`,
    at: (lv) => ({ dmg: 16 + lv * 8, cdr: 0.1 + lv * 0.04 })
  },
  blizzard: {
    shared: true,
    cost: 500,
    name: 'Blizzard',
    type: 'Glace',
    color: '#bfefff',
    desc: (lv) => `${6 + lv * 2} éclats de glace partent tout autour de toi, transpercent et ralentissent.`,
    at: (lv) => ({ cd: 2.8 - lv * 0.18, dmg: 10 + lv * 4, count: 6 + lv * 2, speed: 5.5 })
  },
  dazzlinggleam: {
    shared: true,
    cost: 550,
    name: 'Éclat Magique',
    type: 'Fée',
    color: '#ffb8e8',
    desc: () => 'Un éclair de lumière rose qui blesse tous les ennemis autour de toi.',
    at: (lv) => ({ cd: 3 - lv * 0.2, dmg: 18 + lv * 7, radius: 210 + lv * 18 })
  },
  nightslash: {
    shared: true,
    cost: 600,
    name: 'Tranche-Nuit',
    type: 'Ténèbres',
    color: '#8a6ad6',
    desc: (lv) => `Tranche ${lv + 1} ennemis proches dans l’ombre, avec +25 % de chances de coup critique.`,
    at: (lv) => ({ cd: 1.3 - lv * 0.07, dmg: 15 + lv * 6, count: lv + 1, range: 150 })
  },
  flashcannon: {
    shared: true,
    cost: 650,
    name: 'Luminocanon',
    type: 'Acier',
    color: '#d8e0ee',
    desc: () => 'Une sphère d’acier brillante qui traverse toute la horde.',
    at: (lv) => ({ cd: 2.2 - lv * 0.15, dmg: 30 + lv * 10, size: 14 + lv * 2, speed: 4.6 })
  },
  hyperbeam: {
    shared: true,
    cost: 1000,
    name: 'Ultralaser',
    type: 'Normal',
    color: '#ffb347',
    desc: () => 'Un rayon colossal qui pulvérise tout sur une longue ligne. Très lent à recharger.',
    at: (lv) => ({ cd: 7 - lv * 0.5, dmg: 90 + lv * 30, len: 720, w: 34 + lv * 3 })
  },
  dracometeor: {"""
rep("  dracometeor: {", NEW)
rep("""  willowisp: 'shoot', surf: 'attack', hydropump: 'shoot', whirlpool: 'shoot', gigadrain: 'shoot'
};""","""  willowisp: 'shoot', surf: 'attack', hydropump: 'shoot', whirlpool: 'shoot', gigadrain: 'shoot',
  rockslide: 'shoot', aerialace: 'attack', bodyslam: 'attack', blizzard: 'shoot', dazzlinggleam: 'shoot',
  nightslash: 'attack', flashcannon: 'shoot', hyperbeam: 'shoot'
};

/* ——— Ultime : une attaque surpuissante par type de starter (touche R) ——— */
export const ULTIMATES = {
  Plante: { name: 'Tempête Florale', color: '#7ac74c', desc: 'Des lianes jaillissent sous toute la horde : gros dégâts, ennemis enracinés, et tu récupères un quart de tes PV.' },
  Feu: { name: 'Déflagration', color: '#ff6a1f', desc: 'Une énorme explosion autour de toi, puis un anneau de flammes.' },
  Eau: { name: 'Hydroblast', color: '#3a7bff', desc: 'Un raz-de-marée qui balaie l’écran, repousse tout très loin et te rend invincible un instant.' },
  Électrik: { name: 'Fatal-Foudre', color: '#ffe14a', desc: 'Une pluie d’éclairs sur les ennemis à l’écran, qui restent paralysés.' }
};
export const ultimateOf = (partner) => ULTIMATES[partner?.type] || ULTIMATES.Électrik;

/* ——— Autels : bénédictions au choix ——— */
export const BLESSINGS = [
  { id: 'might', name: 'Autel de la Force', desc: '+15 % de dégâts jusqu’à la fin de la partie.', color: '#ff6a5a' },
  { id: 'wind', name: 'Autel du Vent', desc: '+12 % de vitesse jusqu’à la fin de la partie.', color: '#7fe0ff' },
  { id: 'life', name: 'Autel de la Vie', desc: 'Soin complet et +30 PV max.', color: '#5fd98a' },
  { id: 'wisdom', name: 'Autel du Savoir', desc: 'Tu gagnes un niveau tout de suite.', color: '#b48cff' },
  { id: 'magnet', name: 'Autel de l’Aimant', desc: 'Attire tous les bonbons d’XP de la carte.', color: '#c0c6d6' },
  { id: 'storm', name: 'Autel de l’Orage', desc: 'Ta jauge d’ultime se remplit entièrement.', color: '#ffe14a' },
  { id: 'fortune', name: 'Autel de la Fortune', desc: '+80 Poussière Étoile à la fin de la partie.', color: '#ffd447' }
];""")
open(p,'w').write(s)
print('ok')
