import os, re, json, sys
OUT = sys.argv[1]
def load(p):
    try: return json.load(open(p, encoding="utf-8-sig"))
    except Exception: return None
models, posers = {}, {}
for r,_,fs in os.walk(f"{OUT}/assets"):
    for f in fs:
        if not f.endswith(".json"): continue
        p=os.path.join(r,f); ns=p.split("/assets/")[1].split("/")[0]
        if "/bedrock/pokemon/models/" in p:
            j=load(p)
            if j: models[f"{ns}:{f[:-5]}"]={b["name"] for g in j.get("minecraft:geometry",[]) for b in g.get("bones",[])}
        elif "/bedrock/pokemon/posers/" in p: posers[f"{ns}:{f[:-5]}"]=p
refs={}
for r,_,fs in os.walk(f"{OUT}/assets"):
    if "/bedrock/pokemon/resolvers" not in r: continue
    for f in fs:
        j=load(os.path.join(r,f)) or {}
        cp=cm=None
        for v in j.get("variations",[]):
            cp=v.get("poser",cp); cm=v.get("model",cm)
            if cp and cm: refs.setdefault(cp,set()).add(cm)
tot=0
for pid,p in posers.items():
    ms=[models[m] for m in refs.get(pid,[]) if m in models]
    if not ms: continue
    bones=set.intersection(*ms); j=load(p)
    if j is None: continue
    n=0
    for pose in (j.get("poses") or {}).values():
        a=pose.get("animations")
        if isinstance(a,list):
            new=[x for x in a if not isinstance(x,str) or not (m:=re.fullmatch(r"\s*q\.look\('([^']+)'\)\s*",x)) or m.group(1) in bones]
            n+=len(a)-len(new); pose["animations"]=new
    if n: json.dump(j,open(p,"w",encoding="utf-8"),indent=2); tot+=n; print(f"  {pid}: {n} q.look retirés")
print("total q.look retirés:", tot)
