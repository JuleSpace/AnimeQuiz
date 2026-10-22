import os, re, shutil, json, sys
S = sys.argv[1]
ATM, PLA, OUT = f"{S}/atm", f"{S}/pla", f"{S}/out"
shutil.rmtree(OUT, ignore_errors=True)
# 1) copie ATM (assets + meta, sans data/ ni preuves)
os.makedirs(OUT)
shutil.copytree(f"{ATM}/assets", f"{OUT}/assets")
for f in ["LICENSE", "pack.png"]:
    shutil.copy(f"{ATM}/{f}", OUT)
removed = []
# 2) retirer d'ATM les espèces couvertes par Planeta
pla_species = [d.split("_",1)[1] for d in os.listdir(f"{PLA}/assets/cobblemon/bedrock/models")]
for root, dirs, files in os.walk(f"{OUT}/assets", topdown=True):
    for d in list(dirs):
        m = re.fullmatch(r"\d+_(.+)", d)
        if m and m.group(1) in pla_species and ("/bedrock/pokemon/" in root + "/" or "/textures/pokemon" in root):
            shutil.rmtree(os.path.join(root, d)); removed.append(os.path.relpath(os.path.join(root, d), OUT)); dirs.remove(d)
# 3) Amphinobi : poser/animation ATM incompatibles avec le modèle de base 1.8.2
for sub in ["posers", "animations"]:
    p = f"{OUT}/assets/cobblemon/bedrock/pokemon/{sub}/0658_greninja"
    if os.path.isdir(p): shutil.rmtree(p); removed.append(os.path.relpath(p, OUT))
# 4) Planeta converti au format Cobblemon 1.6+
pb = f"{PLA}/assets/cobblemon/bedrock"; ob = f"{OUT}/assets/cobblemon/bedrock/pokemon"
added = 0
for d in os.listdir(f"{pb}/models"):
    name = d.split("_",1)[1]
    pairs = [(f"{pb}/models/{d}", f"{ob}/models/{d}"),
             (f"{pb}/animations/{d}", f"{ob}/animations/{d}"),
             (f"{pb}/species/{d}", f"{ob}/resolvers/{d}")]
    for a, b in pairs:
        if os.path.isdir(a): shutil.copytree(a, b, dirs_exist_ok=True); added += len(os.listdir(a))
    pz = f"{pb}/posers/{name}.json"
    if os.path.exists(pz):
        os.makedirs(f"{ob}/posers/{d}", exist_ok=True); shutil.copy(pz, f"{ob}/posers/{d}/{name}.json"); added += 1
shutil.copytree(f"{PLA}/assets/cobblemon/textures", f"{OUT}/assets/cobblemon/textures", dirs_exist_ok=True)
json.dump({"pack": {"pack_format": 34, "supported_formats": {"min_inclusive": 34, "max_inclusive": 48},
  "description": "§bAcademy Models§r\n§7AllTheMons R4.0 + Planeta (prioritaire)"}},
  open(f"{OUT}/pack.mcmeta", "w", encoding="utf-8"), ensure_ascii=False, indent=2)
print("retirés:", len(removed)); [print("  -", r) for r in removed]
print("fichiers Planeta ajoutés (hors textures):", added)
