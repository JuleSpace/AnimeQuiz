"""Génère les nouvelles lignées (stats calibrées sur le roster existant) pour pokeArenaData.js."""
import csv, json, sys

S = '/tmp/claude-0/-home-claude/7806be41-42a4-5d8d-8dae-34bc3768b0b1/scratchpad'
D = f'{S}/pokeapi/data/v2/csv'
poke = {r['identifier']: r for r in csv.DictReader(open(f'{D}/pokemon.csv'))}
byid = {r['id']: r for r in poke.values()}
fr = {r['pokemon_species_id']: r['name'] for r in csv.DictReader(open(f'{D}/pokemon_species_names.csv')) if r['local_language_id'] == '5'}
stats = {}
for r in csv.DictReader(open(f'{D}/pokemon_stats.csv')):
    stats.setdefault(r['pokemon_id'], {})[int(r['stat_id'])] = int(r['base_stat'])
TYPE_FR = {1: 'Normal', 2: 'Combat', 3: 'Vol', 4: 'Poison', 5: 'Sol', 6: 'Roche', 7: 'Insecte', 8: 'Spectre', 9: 'Acier',
           10: 'Feu', 11: 'Eau', 12: 'Plante', 13: 'Électrik', 14: 'Psy', 15: 'Glace', 16: 'Dragon', 17: 'Ténèbres', 18: 'Fée'}
ptypes = {}
for r in csv.DictReader(open(f'{D}/pokemon_types.csv')):
    ptypes.setdefault(r['pokemon_id'], []).append((int(r['slot']), TYPE_FR[int(r['type_id'])]))
home = {x[:-4] for x in open(f'{S}/home_ids.txt').read().split() if x.endswith('.png')}

# médianes du roster actuel (coût, étoile) -> (pv, atk, spd)
MED = {
    (1, 1): (400, 42, 13), (1, 2): (760, 82, 13), (1, 3): (1220, 135, 14),
    (2, 1): (380, 50, 13), (2, 2): (800, 105, 14), (2, 3): (1240, 158, 15),
    (3, 1): (400, 55, 13), (3, 2): (820, 118, 14), (3, 3): (1260, 174, 16),
    (4, 1): (500, 72, 13), (4, 2): (920, 132, 14), (4, 3): (1480, 200, 15),
    (5, 1): (760, 120, 16), (5, 2): (1170, 180, 17), (5, 3): (1640, 245, 18),
}

def clamp(v, a, b):
    return max(a, min(b, v))

def info(ident):
    r = poke[ident]
    pid = r['id']
    st = stats[pid]
    types = [t for _, t in sorted(ptypes[pid])]
    assert pid in home, f'pas de sprite home pour {ident}'
    return pid, fr[r['species_id']], types, st

def game_stats(cost, star, st_final, st_self):
    hp0, atk0, spd0 = MED[(cost, star)]
    bulk = st_final[1] + (st_final[3] + st_final[5]) / 2
    off = max(st_final[2], st_final[4])
    hpF = clamp((bulk / 160) ** 0.5, 0.86, 1.18)
    atkF = clamp((off / 105) ** 0.5, 0.86, 1.18)
    hp = int(round(hp0 * hpF / 10) * 10)
    atk = int(round(atk0 * atkF))
    spd = int(clamp(spd0 + round((st_self[6] - 75) / 22), 8, 21))
    return hp, atk, spd

def js_types(types):
    return f"'{types[0]}'" if len(types) == 1 else '[' + ', '.join(f"'{t}'" for t in types) + ']'

def S_(name, types, hp, atk, spd, dex):
    return f"S('{name}', {js_types(types)}, {hp}, {atk}, {spd}, {dex})"

def esc(s):
    return s.replace("'", "’")

def spell_js(sp):
    parts = [f"name: '{esc(sp['name'])}'", f"desc: '{esc(sp['desc'])}'"]
    for k, v in sp.items():
        if k in ('name', 'desc'):
            continue
        if isinstance(v, bool):
            parts.append(f"{k}: {'true' if v else 'false'}")
        elif isinstance(v, str):
            parts.append(f"{k}: '{v}'")
        elif isinstance(v, dict):
            parts.append(f"{k}: {{ " + ', '.join(f'{kk}: {vv}' for kk, vv in v.items()) + ' }')
        else:
            parts.append(f'{k}: {v}')
    return '{ ' + ', '.join(parts) + ' }'

def build(fam):
    cost = fam['cost']
    idents = fam['stages']  # liste d’identifiants (stades réels hors branche)
    branch = fam.get('branch')
    names = fam.get('names', {})
    finals = [b['stages'][-1] for b in branch['forms']] if branch else [idents[-1]]
    st_final = info(finals[0])[3]
    out_stages = []
    real = idents[:]
    def mk(ident, star, override_name=None):
        pid, name, types, st = info(ident)
        hp, atk, spd = game_stats(cost, star, st_final, st)
        return S_(override_name or names.get(ident, name), types, hp, atk, spd, pid), name, types, (hp, atk, spd, pid)
    if not branch:
        n = len(real)
        if n == 1:
            s1, name, types, (hp, atk, spd, pid) = mk(real[0], 1)
            nm = names.get(real[0], name)
            out_stages = [s1, S_(f'{nm} ★', types, *game_stats(cost, 2, st_final, info(real[0])[3]), pid),
                          S_(f'{nm} ★★', types, *game_stats(cost, 3, st_final, info(real[0])[3]), pid)]
        elif n == 2:
            a = mk(real[0], 1)
            b = mk(real[1], 2)
            nm = names.get(real[1], b[1])
            pid = b[3][3]
            out_stages = [a[0], b[0], S_(f'{nm} ★', b[2], *game_stats(cost, 3, st_final, info(real[1])[3]), pid)]
        else:
            out_stages = []
            for i in range(3):
                dup = i > 0 and real[i] == real[i - 1]
                nm = (names.get(real[i], info(real[i])[1]) + ' ★') if dup else None
                out_stages.append(mk(real[i], i + 1, nm)[0])
        body = '[' + ', '.join(out_stages) + ']'
        return f"  L('{fam['id']}', {cost}, {fam.get('roles', [])!r}, {fam['range']},\n    {spell_js(fam['spell'])},\n    {body})".replace('"', "'")
    at = branch['at']
    pre = []
    for i in range(at - 1):
        dup = i > 0 and real[i] == real[i - 1]
        nm = (names.get(real[i], info(real[i])[1]) + ' ★') if dup else None
        pre.append(mk(real[i], i + 1, nm)[0])
    forms = []
    for f in branch['forms']:
        st_list = []
        for k, ident in enumerate(f['stages']):
            star = at + k
            st_list.append(mk(ident, star)[0])
        # complète jusqu’au ★3 en répétant la dernière forme (devient Méga si connue)
        last = f['stages'][-1]
        while at + len(st_list) - 1 < 3:
            star = at + len(st_list)
            pid, name, types, st = info(last)
            nm = names.get(last, name)
            st_list.append(S_(f'{nm} ★', types, *game_stats(cost, star, st_final, st), pid))
        forms.append(f"      {{ id: '{f['id']}', stages: [" + ', '.join(st_list) + '] }')
    body = '[' + ', '.join(pre) + ']'
    return (f"  L('{fam['id']}', {cost}, {fam.get('roles', [])!r}, {fam['range']},\n    {spell_js(fam['spell'])},\n    {body},\n"
            f"    {{ at: {at}, forms: [\n" + ',\n'.join(forms) + '\n    ] })').replace('"', "'")

FAMS = json.load(open(sys.argv[1]))
print(',\n'.join(build(f) for f in FAMS))
