import os, re, json, sys
OUT = sys.argv[1]
def load(p):
    try: return json.load(open(p, encoding="utf-8-sig"))
    except Exception as e: return None
models, posers, bad_json = {}, {}, []
for root, _, files in os.walk(f"{OUT}/assets"):
    for f in files:
        if not f.endswith(".json"): continue
        p = os.path.join(root, f); ns = p.split("/assets/")[1].split("/")[0]
        if "/bedrock/pokemon/models/" in p:
            j = load(p)
            if j is None: bad_json.append(p); continue
            bones = set()
            for g in j.get("minecraft:geometry", []):
                for b in g.get("bones", []): bones.add(b["name"])
            models[f"{ns}:{f[:-5]}"] = bones
        elif "/bedrock/pokemon/posers/" in p:
            j = load(p)
            if j is None: bad_json.append(p); continue
            posers[f"{ns}:{f[:-5]}"] = j
refs = {}  # poser -> set(models)
for root, _, files in os.walk(f"{OUT}/assets"):
    if "/bedrock/pokemon/resolvers" not in root: continue
    for f in files:
        j = load(os.path.join(root, f))
        if j is None: bad_json.append(os.path.join(root,f)); continue
        cur_p, cur_m = None, None
        for v in j.get("variations", []):
            cur_p = v.get("poser", cur_p); cur_m = v.get("model", cur_m)
            if cur_p and cur_m: refs.setdefault(cur_p, set()).add(cur_m)
problems, checked = [], 0
for pid, j in posers.items():
    parts = set(re.findall(r"q\.look\('([^']+)'\)", json.dumps(j)))
    for pose in (j.get("poses") or {}).values():
        for t in pose.get("transformedParts", []) or []: parts.add(t.get("part"))
    for mid in refs.get(pid, []):
        if mid not in models: continue  # modèle de base Cobblemon, non vérifiable ici
        checked += 1
        miss = sorted(p for p in parts if p and p not in models[mid])
        if miss: problems.append((pid, mid, miss))
print("JSON illisibles:", len(bad_json)); [print("  ", b) for b in bad_json[:20]]
print("couples poser/modèle vérifiés:", checked)
print("pièces manquantes:", len(problems)); [print("  ", *x) for x in problems]
