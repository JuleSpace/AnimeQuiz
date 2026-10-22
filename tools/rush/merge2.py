import os, re, shutil, json, sys
S = sys.argv[1]
# 1) Planeta converti au format 1.6+
PC = f"{S}/pla_conv"; shutil.rmtree(PC, ignore_errors=True)
pb = f"{S}/pla/assets/cobblemon/bedrock"; ob = f"{PC}/assets/cobblemon/bedrock/pokemon"
for d in os.listdir(f"{pb}/models"):
    name = d.split("_",1)[1]
    for a, b in [(f"{pb}/models/{d}", f"{ob}/models/{d}"), (f"{pb}/animations/{d}", f"{ob}/animations/{d}"), (f"{pb}/species/{d}", f"{ob}/resolvers/{d}")]:
        if os.path.isdir(a): shutil.copytree(a, b)
    os.makedirs(f"{ob}/posers/{d}", exist_ok=True); shutil.copy(f"{pb}/posers/{name}.json", f"{ob}/posers/{d}/{name}.json")
shutil.copytree(f"{S}/pla/assets/cobblemon/textures", f"{PC}/assets/cobblemon/textures")
# 2) priorités : du plus faible au plus fort (= ordre actuel en jeu)
packs = [("AllTheMons", f"{S}/atm"), ("2.21", f"{S}/p_221"), ("Planeta", PC)]
SPDIR = re.compile(r"/(?:bedrock/pokemon/(?:models|posers|resolvers|animations)|textures/pokemon)/\d+_([^/]+)/")
def species(root):
    out = set()
    for r, _, fs in os.walk(f"{root}/assets"):
        for f in fs:
            m = SPDIR.search(os.path.join(r, f) + ("/" if False else ""))
            if m: out.add(m.group(1))
    return out
sets = [species(p) for _, p in packs]
OUT = f"{S}/out2"; shutil.rmtree(OUT, ignore_errors=True); os.makedirs(OUT)
report = {}
for i, (name, root) in enumerate(packs):
    higher = set().union(*sets[i+1:]) if i+1 < len(sets) else set()
    kept = skipped = 0
    for r, _, fs in os.walk(f"{root}/assets"):
        for f in fs:
            src = os.path.join(r, f); rel = os.path.relpath(src, root)
            m = SPDIR.search("/" + rel)
            if m and m.group(1) in higher: skipped += 1; continue
            dst = os.path.join(OUT, rel); os.makedirs(os.path.dirname(dst), exist_ok=True); shutil.copy2(src, dst); kept += 1
    report[name] = (len(sets[i]), len(sets[i] - higher), kept, skipped)
# 3) Amphinobi : poser/animation de 2.21 incompatibles avec le modèle de base 1.8.2 (forme Sacha conservée)
for p in ["assets/cobblemon/bedrock/pokemon/posers/0658_greninja/greninja.json", "assets/cobblemon/bedrock/pokemon/animations/0658_greninja/greninja.animation.json"]:
    if os.path.exists(f"{OUT}/{p}"): os.remove(f"{OUT}/{p}"); print("retiré:", p)
shutil.copy(f"{S}/atm/pack.png", OUT); shutil.copy(f"{S}/atm/LICENSE", f"{OUT}/LICENSE_AllTheMons")
json.dump({"pack": {"pack_format": 34, "supported_formats": {"min_inclusive": 34, "max_inclusive": 48},
  "description": "§bAcademy Models§r\n§7Planeta > 2.21 > AllTheMons"}}, open(f"{OUT}/pack.mcmeta","w",encoding="utf-8"), ensure_ascii=False, indent=2)
for k,(tot,win,kept,sk) in report.items(): print(f"{k}: {tot} espèces, {win} gardées, {kept} fichiers copiés, {sk} écartés")
