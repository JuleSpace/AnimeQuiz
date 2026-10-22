import os, re, json, sys
OUT = sys.argv[1]
fixes = {"atm_remodels:spoink":["neck"],"cobblemon:ironbundle":["head_ai"],"cobblemon:charjabug":["head"],"cobblemon:chiyu":["head"],"cobblemon:burmy":["head","neck"],"cobblemon:frigibax":["head"],"cobblemon:darmanitan_zen":["head"],"cobblemon:darmanitan_galar":["head"],"cobblemon:darmanitan_galar_zen":["head_ai"],"cobblemon:dedenne":["head"],"cobblemon:trubbish":["head"],"cobblemon:ironvaliant":["head"],"cobblemon:articuno_galar":["neck"],"cobblemon:vikavolt":["neck"],"cobblemon:electrike":["head"],"cobblemon:wormadam":["head","neck"]}
for root,_,files in os.walk(f"{OUT}/assets"):
    if "/bedrock/pokemon/posers" not in root: continue
    for f in files:
        ns = root.split("/assets/")[1].split("/")[0]; pid=f"{ns}:{f[:-5]}"
        if pid not in fixes: continue
        p=os.path.join(root,f); j=json.load(open(p,encoding="utf-8-sig")); n=0
        for pose in (j.get("poses") or {}).values():
            a=pose.get("animations")
            if isinstance(a,list):
                new=[x for x in a if not any(x.replace(" ","")==f"q.look('{b}')" for b in fixes[pid])]
                n+=len(a)-len(new); pose["animations"]=new
        json.dump(j,open(p,"w",encoding="utf-8"),indent=2); print(pid, "q.look retirés:", n)
