import csv, sys, os
D = sys.argv[1]
poke = {r['identifier']: r for r in csv.DictReader(open(f"{D}/pokemon.csv"))}
fr = {}
for r in csv.DictReader(open(f"{D}/pokemon_species_names.csv")):
    if r['local_language_id'] == '5': fr[r['pokemon_species_id']] = r['name']
home = {x[:-4] for x in open(sys.argv[2]).read().split() if x.endswith('.png')}
art = {x[:-4] for x in open(sys.argv[3]).read().split() if x.endswith('.png')}
for ident in sys.argv[4:]:
    r = poke.get(ident)
    if not r: print(f"!! {ident} introuvable"); continue
    print(f"{ident:28} id={r['id']:>6} species={r['species_id']:>5} fr={fr.get(r['species_id'],'?'):18} home={'Y' if r['id'] in home else '-'} art={'Y' if r['id'] in art else '-'}")
