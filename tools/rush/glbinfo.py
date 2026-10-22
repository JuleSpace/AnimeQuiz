import sys, json, struct
for f in sys.argv[1:]:
    b = open(f,'rb').read()
    n = struct.unpack('<I', b[12:16])[0]
    j = json.loads(b[20:20+n])
    print('==', f.split('/')[-1], len(b)//1024, 'KB')
    print(' anims:', [(a.get('name'), len(a['channels'])) for a in j.get('animations', [])])
    print(' skins:', len(j.get('skins', [])), 'meshes:', len(j.get('meshes', [])), 'nodes:', len(j.get('nodes', [])), 'images:', [(i.get('mimeType'), j['bufferViews'][i['bufferView']]['byteLength']//1024 if 'bufferView' in i else 0) for i in j.get('images', [])])
    mins=[1e9]*3; maxs=[-1e9]*3
    for m in j.get('meshes', []):
        for p in m['primitives']:
            a = j['accessors'][p['attributes']['POSITION']]
            for k in range(3): mins[k]=min(mins[k],a['min'][k]); maxs[k]=max(maxs[k],a['max'][k])
    print(' raw bbox', [round(x,2) for x in mins], [round(x,2) for x in maxs])
    roots = j['scenes'][0]['nodes']
    for r in roots[:3]:
        nd=j['nodes'][r]; print(' root', nd.get('name'), {k:nd[k] for k in ('rotation','scale','translation','matrix') if k in nd})
    exts = j.get('extensionsUsed', []); print(' ext', exts)
