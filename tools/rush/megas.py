"""Planches « façon PMD » pour les Méga-Évolutions absentes de SpriteCollab,
à partir des sprites de pokeemerald-expansion (overworld 3 directions, ou face seule)."""
import sys, os, json, re
from PIL import Image
G, OUT, JS = sys.argv[1], sys.argv[2], sys.argv[3]
PREVIEW = sys.argv[4] if len(sys.argv) > 4 else None

def pal(f):
    L = open(f).read().split('\n')[3:19]
    return [tuple(map(int, l.split())) for l in L if l.strip()]

def load(png, palf):
    idx = Image.open(png)
    p = pal(palf)
    rgba = Image.new('RGBA', idx.size, (0, 0, 0, 0))
    ip, op = idx.load(), rgba.load()
    for y in range(idx.size[1]):
        for x in range(idx.size[0]):
            i = ip[x, y]
            if i: op[x, y] = p[i] + (255,)
    return rgba

def flip(im): return im.transpose(Image.FLIP_LEFT_RIGHT)

# Ordre des lignes PMD : bas, bas-droite, droite, haut-droite, haut, haut-gauche, gauche, bas-gauche
OW = {'3-mega': 'venusaur/mega', '9-mega': 'blastoise/mega', '6-megay': 'charizard/mega_y',
      '257-mega': 'blaziken/mega', '260-mega': 'swampert/mega'}
# sprite de face uniquement ; faces = côté vers lequel il regarde
FRONT = {'160-mega': ('feraligatr/mega', 'left'), '154-mega': ('meganium/mega', 'left'), '26-megax': ('raichu/mega_x', 'left'), '26-megay': ('raichu/mega_y', 'left')}

def sheet(rows_frames, w, h):
    n = len(rows_frames[0])
    s = Image.new('RGBA', (w * n, h * 8), (0, 0, 0, 0))
    for r, frames in enumerate(rows_frames):
        for i, f in enumerate(frames):
            s.alpha_composite(f, (i * w + (w - f.width) // 2, r * h + (h - f.height)))
    return s

src = open(JS).read()
m = re.search(r'const SWARM_SHEETS = (\{.*\});', src, re.S)
data = json.loads(m.group(1))
prev = []
for key, d in OW.items():
    im = load(f'{G}/{d}/overworld.png', f'{G}/{d}/overworld_normal.pal')
    fr = [im.crop((i * 32, 0, i * 32 + 32, 32)) for i in range(6)]
    down, up, left = fr[0:2], fr[2:4], fr[4:6]
    right = [flip(f) for f in left]
    rows = [down, right, right, right, up, left, left, left]
    W, H = 32, 40  # un peu de marge au-dessus (sauts, squash)
    os.makedirs(f'{OUT}/{key}', exist_ok=True)
    sheet(rows, W, H).save(f'{OUT}/{key}/Walk.png')
    sheet([[r[0]] for r in rows], W, H).save(f'{OUT}/{key}/Idle.png')
    data[key] = {'walk': {'src': 'Walk.png', 'w': W, 'h': H, 'd': [10, 10], 'rows': 8},
                 'idle': {'src': 'Idle.png', 'w': W, 'h': H, 'd': [60], 'rows': 8}}
    prev.append(sheet(rows, W, H))
for key, (d, faces) in FRONT.items():
    im = load(f'{G}/{d}/front.png', f'{G}/{d}/normal.pal').crop((0, 0, 64, 64))
    im = im.crop(im.getbbox())
    k = 46 / im.height
    im = im.resize((max(1, round(im.width * k)), 46), Image.NEAREST)
    L = im if faces == 'left' else flip(im)
    R = flip(L)
    # pas de marche : léger rebond d'un pixel
    def step(f, dy):
        c = Image.new('RGBA', (f.width, f.height + 1), (0, 0, 0, 0)); c.alpha_composite(f, (0, 1 - dy)); return c
    walkL, walkR = [step(L, 0), step(L, 1)], [step(R, 0), step(R, 1)]
    rows = [walkL, walkR, walkR, walkR, walkR, walkL, walkL, walkL]
    W, H = im.width + 4, 52
    os.makedirs(f'{OUT}/{key}', exist_ok=True)
    sheet(rows, W, H).save(f'{OUT}/{key}/Walk.png')
    sheet([[r[0]] for r in rows], W, H).save(f'{OUT}/{key}/Idle.png')
    data[key] = {'walk': {'src': 'Walk.png', 'w': W, 'h': H, 'd': [12, 12], 'rows': 8},
                 'idle': {'src': 'Idle.png', 'w': W, 'h': H, 'd': [60], 'rows': 8}}
    prev.append(sheet(rows, W, H))
open(JS, 'w').write(src[:m.start(1)] + json.dumps(data, separators=(',', ':')) + src[m.end(1):])
if PREVIEW:
    Wt = max(p.width for p in prev); Ht = sum(p.height for p in prev)
    out = Image.new('RGBA', (Wt, Ht), (60, 120, 60, 255)); y = 0
    for p in prev: out.alpha_composite(p, (0, y)); y += p.height
    out.resize((Wt * 2, Ht * 2), Image.NEAREST).save(PREVIEW)
print('ok', list(OW) + list(FRONT))
