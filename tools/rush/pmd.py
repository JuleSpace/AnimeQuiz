import sys, os, json, shutil, xml.etree.ElementTree as ET
from PIL import Image
src, out, js = sys.argv[1], sys.argv[2], sys.argv[3]
WANT = ['Walk','Idle','Attack','Hurt','Shoot']
data = {}
FORMS = {'0006/0001': '6-mega', '0254/0001': '254-mega', '0157/0001': '157-hisui'}
items = [(d, str(int(d))) for d in sorted(os.listdir(src)) if os.path.exists(os.path.join(src, d, 'AnimData.xml'))]
items += [(f, k) for f, k in FORMS.items() if os.path.exists(os.path.join(src, f, 'AnimData.xml'))]
for d, key in items:
    p = os.path.join(src, d)
    root = ET.parse(os.path.join(p,'AnimData.xml')).getroot()
    anims = {a.findtext('Name'): a for a in root.find('Anims')}
    def res(n, depth=0):
        a = anims.get(n)
        if a is None: return None, None
        c = a.findtext('CopyOf')
        return (res(c, depth+1) if c and depth < 5 else (n, a))
    entry = {}
    os.makedirs(os.path.join(out, key), exist_ok=True)
    for w in WANT:
        n, a = res(w)
        if a is None: continue
        f = os.path.join(p, f'{n}-Anim.png')
        if not os.path.exists(f): continue
        fw, fh = int(a.findtext('FrameWidth')), int(a.findtext('FrameHeight'))
        im = Image.open(f)
        dur = [int(x.text) for x in a.find('Durations')]
        rows = im.height // fh
        dst = os.path.join(out, key, f'{n}.png')
        shutil.copy(f, dst)
        e = {'src': f'{n}.png', 'w': fw, 'h': fh, 'd': dur, 'rows': rows}
        hit = a.findtext('HitFrame')
        if hit is not None: e['hit'] = int(hit)
        entry[w.lower()] = e
    data[key] = entry
    print(d, {k:(v['w'],v['h'],len(v['d']),v['rows']) for k,v in entry.items()})
with open(js,'w') as fh:
    fh.write('/**\n * Planches animées PMD (PMDCollab SpriteCollab, CC BY-NC 4.0) : taille des cases, durées (en 1/60 s) et nombre de directions.\n * Généré automatiquement — ne pas éditer à la main.\n */\n')
    fh.write('const SWARM_SHEETS = ' + json.dumps(data, separators=(',',':')) + ';\n\nexport default SWARM_SHEETS;\n')
