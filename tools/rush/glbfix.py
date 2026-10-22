import sys, json, struct, io
from PIL import Image
src, dst = sys.argv[1], sys.argv[2]
maxdim = int(sys.argv[3]) if len(sys.argv) > 3 else 1024
b = open(src, 'rb').read()
jlen = struct.unpack('<I', b[12:16])[0]
j = json.loads(b[20:20 + jlen])
p = 20 + jlen
blen = struct.unpack('<I', b[p:p + 4])[0]
bin_ = b[p + 8:p + 8 + blen]
# 1) matériaux spéculaire/brillance -> métal/rugosité
for m in j.get('materials', []):
    ext = m.get('extensions', {}).pop('KHR_materials_pbrSpecularGlossiness', None)
    if ext is None: continue
    pbr = m.setdefault('pbrMetallicRoughness', {})
    if 'diffuseTexture' in ext: pbr['baseColorTexture'] = ext['diffuseTexture']
    if 'diffuseFactor' in ext: pbr['baseColorFactor'] = ext['diffuseFactor']
    pbr['metallicFactor'] = 0.0
    pbr['roughnessFactor'] = round(1.0 - ext.get('glossinessFactor', 0.3), 3)
    pbr.pop('metallicRoughnessTexture', None)
    if not m['extensions']: m.pop('extensions')
for key in ('extensionsUsed', 'extensionsRequired'):
    if key in j:
        j[key] = [e for e in j[key] if e != 'KHR_materials_pbrSpecularGlossiness']
        if not j[key]: j.pop(key)
# 2) images trop grandes -> réduites
views = [bin_[v.get('byteOffset', 0):v.get('byteOffset', 0) + v['byteLength']] for v in j['bufferViews']]
for img in j.get('images', []):
    if 'bufferView' not in img: continue
    data = views[img['bufferView']]
    try:
        im = Image.open(io.BytesIO(data))
    except Exception:
        continue
    if max(im.size) <= maxdim and len(data) < 150_000: continue
    if max(im.size) > maxdim:
        k = maxdim / max(im.size); im = im.resize((max(1, int(im.width * k)), max(1, int(im.height * k))), Image.LANCZOS)
    out = io.BytesIO()
    im.save(out, 'PNG', optimize=True)
    if out.tell() < len(data): views[img['bufferView']] = out.getvalue()
# 3) on recolle le binaire
blob = bytearray()
for i, v in enumerate(j['bufferViews']):
    while len(blob) % 4: blob.append(0)
    v['byteOffset'] = len(blob); v['byteLength'] = len(views[i]); v['buffer'] = 0
    blob += views[i]
while len(blob) % 4: blob.append(0)
j['buffers'] = [{'byteLength': len(blob)}]
js = json.dumps(j, separators=(',', ':')).encode()
while len(js) % 4: js += b' '
total = 12 + 8 + len(js) + 8 + len(blob)
with open(dst, 'wb') as f:
    f.write(struct.pack('<III', 0x46546C67, 2, total))
    f.write(struct.pack('<II', len(js), 0x4E4F534A)); f.write(js)
    f.write(struct.pack('<II', len(blob), 0x004E4942)); f.write(blob)
print(dst, len(b) // 1024, '->', total // 1024, 'KB')
