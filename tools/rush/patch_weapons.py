import re
p='swarmData.js'; s=open(p).read()
LEARN={'bulbasaur':['Plante'],'charmander':['Feu'],'squirtle':['Eau'],'pikachu':['Électrik'],'chikorita':['Plante'],'cyndaquil':['Feu'],'totodile':['Eau','Ténèbres'],'treecko':['Plante'],'torchic':['Feu','Combat'],'mudkip':['Eau','Sol'],'turtwig':['Plante','Sol'],'chimchar':['Feu','Combat'],'piplup':['Eau']}
for pid,types in LEARN.items():
    m=re.search(r"id: '%s',[^\n]*?weapon: '(\w+)',"%pid, s)
    assert m, pid
    s=s[:m.end()]+" learn: [%s],"%', '.join("'%s'"%t for t in types)+s[m.end():]
a="""/* ——— Attaques (5 niveaux). `at(lv)` renvoie les valeurs du niveau. `gen` 0 = disponible partout. ——— */"""
assert a in s
s=s.replace(a,"""/*
 * ——— Attaques (5 niveaux). `at(lv)` renvoie les valeurs du niveau. ———
 * Chaque starter commence avec son attaque signature. Au level-up il peut apprendre :
 *  - les attaques signature des autres starters *du même type* (`learn` du partenaire) ;
 *  - les capacités communes (`shared`), dont certaines se débloquent avec la Poussière (`cost`).
 */""")
for w in ['quake','swift','shadow']:
    a="  %s: {\n    gen: 0,"%w
    assert a in s, w
    s=s.replace(a,"  %s: {\n    shared: true,"%w)
NEWW = open('/tmp/claude-0/-home-claude/7806be41-42a4-5d8d-8dae-34bc3768b0b1/scratchpad/tools/neww.txt').read()
a="  /* — Johto — */"
s=s.replace(a,NEWW.rstrip('\n'),1)
a="""  scope: { name: 'Lentilscope', desc: '+6 % de chances de coup critique (dégâts ×1,8).', color: '#ff9a3c' }
};"""
assert a in s
s=s.replace(a,"""  scope: { name: 'Lentilscope', desc: '+6 % de chances de coup critique (dégâts ×1,8).', color: '#ff9a3c' },
  shellbell: { name: 'Grelot Coque', desc: 'Chaque K.O. a 6 % de chances de rendre 3 PV.', color: '#f2c6a0', cost: 350 },
  expshare: { name: 'Multi Exp', desc: '+8 % d’XP.', color: '#7fd0ff', cost: 400 },
  brightpowder: { name: 'Poudre Claire', desc: '4 % de chances d’esquiver un coup.', color: '#fff6c2', cost: 500 }
};""")
a="""  seedbomb: 'shoot', machpunch: 'attack', bubble: 'shoot'
};"""
assert a in s
s=s.replace(a,"""  seedbomb: 'shoot', machpunch: 'attack', bubble: 'shoot',
  icebeam: 'shoot', sludge: 'shoot', psychic: 'shoot', hurricane: 'shoot', dracometeor: 'shoot'
};

/** Le partenaire peut-il apprendre cette attaque ? (`unlocked` : capacités achetées) */
export const canLearn = (partner, id, unlocked = {}) => {
  const W = WEAPONS[id];
  if (!W || id === partner.weapon) return false;
  if (W.shared) return !W.cost || Boolean(unlocked[id]);
  return (partner.learn || []).includes(W.type);
};
/** L'objet est-il disponible ? */
export const canHold = (id, unlocked = {}) => !PASSIVES[id].cost || Boolean(unlocked[id]);""")
open(p,'w').write(s)
print('ok')
