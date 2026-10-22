"""Nouvelles lignées (vague 3) : spec compacte -> new_fams3.json + talents3.json."""
import json

AIM_TXT = {'front': '', 'weak': ' sur le plus faible', 'back': ' sur la cible la plus loin', 'tank': ' sur la cible la plus tanky',
           'random': ' sur une cible au hasard', 'aoe2': ' sur 2 cibles', 'all': ' sur tous les ennemis'}


def sp(name, every, mult, aim='front', typ=None, **fx):
    bits = []
    if fx.get('stun'): bits.append('étourdit')
    if fx.get('slow'): bits.append(f"ralentit (SPD -{fx['slow']})")
    if fx.get('shred'): bits.append(f"ignore {int(fx['shred'] * 100)}% PV")
    if fx.get('shield'): bits.append(f"bouclier {int(fx['shield'] * 100)}% PV")
    if fx.get('healAlly'): bits.append(f"soigne {int(fx['healAlly'] * 100)}%")
    if fx.get('dot'): bits.append('empoisonne' if fx['dot'].get('kind') != 'burn' else 'brûle')
    if fx.get('atkBreak'): bits.append(f"baisse l’ATK de {int(fx['atkBreak'] * 100)}%")
    if fx.get('selfAtk'): bits.append(f"+{int(fx['selfAtk'] * 100)}% ATK pour lui")
    if fx.get('teamAtk'): bits.append(f"+{int(fx['teamAtk'] * 100)}% ATK d’équipe")
    if fx.get('stealAtk'): bits.append('vole de l’ATK')
    if fx.get('allyBuff'): bits.append('l’allié le plus lent gagne 3 SPD')
    if fx.get('recoil'): bits.append(f"perd {int(fx['recoil'] * 100)}% de ses PV")
    t = f' {typ}' if typ else ''
    desc = f"Tous les {every} tours : {int(round(mult * 100))}% ATK{t}{AIM_TXT[aim]}"
    if bits: desc += ' + ' + ', '.join(bits)
    desc += '.'
    out = {'name': name, 'desc': desc, 'every': every, 'mult': mult, 'aim': aim}
    if 'dot' in fx:
        fx = dict(fx)
        d = fx.pop('dot')
        out['dot'] = {'pct': d.get('pct', 0.05), 'turns': d.get('turns', 3)}
    out.update(fx)
    return out


F = []
T = {}


def fam(id_, cost, rng, stages, spell, talent, roles=None, branch=None, names=None):
    f = {'id': id_, 'cost': cost, 'range': rng, 'stages': stages, 'spell': spell}
    if roles: f['roles'] = roles
    if branch: f['branch'] = branch
    if names: f['names'] = names
    F.append(f)
    T[id_] = talent


# ——— Coût 1 ———
fam('weedle', 1, 1, ['weedle', 'kakuna', 'beedrill'], sp('Dard-Venin', 3, 1.5, 'weak', 'Poison', dot={'pct': 0.05}), 'essaim')
fam('oddish', 1, 2, ['oddish', 'gloom'], sp('Poudre Toxik', 4, 1.2, 'aoe2', dot={'pct': 0.05}), 'chlorophylle',
    branch={'at': 3, 'forms': [{'id': 'rafflesia', 'stages': ['vileplume']}, {'id': 'joliflor', 'stages': ['bellossom']}]})
fam('bellsprout', 1, 1, ['bellsprout', 'weepinbell', 'victreebel'], sp('Tranch’Herbe', 3, 1.7, 'front', 'Plante', shred=0.08), 'chlorophylle')
fam('whismur', 1, 2, ['whismur', 'loudred', 'exploud'], sp('Mégaphone', 4, 1.3, 'all'), 'punkRock')
fam('pidove', 1, 2, ['pidove', 'tranquill', 'unfezant'], sp('Lame d’Air', 3, 1.6, 'back', 'Vol'), 'regardVif')
fam('pikipek', 1, 3, ['pikipek', 'trumbeak', 'toucannon'], sp('Bec-Canon', 4, 2.0, 'tank', 'Vol'), 'technicien')
fam('wooloo', 1, 1, ['wooloo', 'dubwool'], sp('Coup d’Boule', 3, 1.5, 'front', shield=0.12), 'toisonEpaisse')
fam('tandemaus', 1, 1, ['tandemaus', 'maushold-family-of-four'], sp('Prolifération', 3, 1.4, 'aoe2'), 'technicien', names={'maushold-family-of-four': 'Famignol'})
fam('skwovet', 1, 1, ['skwovet', 'greedent'], sp('Grosse Bouchée', 3, 1.5, 'front', healAlly=0.08), 'gloutonnerie')
fam('lechonk', 1, 1, ['lechonk', 'oinkologne-male'], sp('Charge', 3, 1.6, 'front'), 'gloutonnerie', names={'oinkologne-male': 'Fragroin'})
fam('kricketot', 1, 2, ['kricketot', 'kricketune'], sp('Plaie-Croix', 3, 1.8, 'weak', 'Insecte'), 'essaim')
fam('hoppip', 1, 3, ['hoppip', 'skiploom', 'jumpluff'], sp('Para-Spore', 4, 1.1, 'aoe2', stun=True), 'chlorophylle')
fam('seel', 1, 2, ['seel', 'dewgong'], sp('Laser Glace', 3, 1.6, 'front', 'Glace', slow=2), 'isograisse')
fam('smoliv', 1, 3, ['smoliv', 'dolliv', 'arboliva'], sp('Tir d’Olive', 4, 1.4, 'aoe2', healAlly=0.05), 'creaHerbe')
fam('buizel', 1, 1, ['buizel', 'floatzel'], sp('Aqua-Jet', 3, 1.6, 'weak', 'Eau'), 'glissade')

# ——— Coût 2 ———
fam('tentacool', 2, 2, ['tentacool', 'tentacruel'], sp('Toxik', 3, 1.4, 'aoe2', dot={'pct': 0.06}), 'corpsSain')
fam('shellder', 2, 1, ['shellder', 'cloyster'], sp('Stalactite', 3, 1.9, 'front', 'Glace'), 'technicien')
fam('drowzee', 2, 3, ['drowzee', 'hypno'], sp('Hypnose', 4, 1.3, 'random', stun=True), 'insomnie', roles=['Mage'])
fam('natu', 2, 3, ['natu', 'xatu'], sp('Psyko', 3, 1.7, 'back', 'Psy'), 'miroirMagik', roles=['Mage'])
fam('snubbull', 2, 1, ['snubbull', 'granbull'], sp('Croc Fatal', 3, 1.7, 'front', atkBreak=0.1), 'intimidation')
fam('sandile', 2, 1, ['sandile', 'krokorok', 'krookodile'], sp('Séisme', 4, 1.4, 'aoe2', 'Sol'), 'intimidation')
fam('tympole', 2, 2, ['tympole', 'palpitoad', 'seismitoad'], sp('Ébullition', 3, 1.6, 'front', 'Eau', dot={'pct': 0.04, 'kind': 'burn'}), 'glissade')
fam('elgyem', 2, 3, ['elgyem', 'beheeyem'], sp('Psyko', 3, 1.8, 'weak', 'Psy'), 'analyste' if False else 'synchro', roles=['Mage'])
fam('rufflet', 2, 1, ['rufflet'], sp('Rapace', 3, 1.9, 'front', 'Vol', recoil=0.05), 'temeraire',
    branch={'at': 2, 'forms': [{'id': 'unys', 'stages': ['braviary']}, {'id': 'hisui', 'stages': ['braviary-hisui']}]},
    names={'braviary-hisui': 'Gueriaigle de Hisui'})
fam('vullaby', 2, 1, ['vullaby', 'mandibuzz'], sp('Vibrobscur', 3, 1.5, 'weak', 'Ténèbres', shield=0.1), 'armurfragile')
fam('skiddo', 2, 1, ['skiddo', 'gogoat'], sp('Encornebois', 3, 1.6, 'front', 'Plante', healAlly=0.06), 'herbivore' if False else 'medicNature')
fam('pumpkaboo', 2, 2, ['pumpkaboo-average', 'gourgeist-average'], sp('Bombe Graine', 3, 1.5, 'aoe2'), 'recolte',
    names={'pumpkaboo-average': 'Pitrouille', 'gourgeist-average': 'Banshitrouye'})
fam('wattrel', 2, 3, ['wattrel', 'kilowattrel'], sp('Vent Électrique', 3, 1.5, 'aoe2', 'Électrik'), 'electromorphose')
fam('maschiff', 2, 1, ['maschiff', 'mabosstiff'], sp('Mâchouille', 3, 1.7, 'front', atkBreak=0.12), 'intimidation')
fam('shroodle', 2, 2, ['shroodle', 'grafaiai'], sp('Gribouille', 3, 1.4, 'weak', dot={'pct': 0.06}), 'toxitouche')
fam('nymble', 2, 1, ['nymble', 'lokix'], sp('Première Impression', 3, 2.0, 'front', 'Insecte'), 'temeraire')
fam('snover', 2, 2, ['snover', 'abomasnow'], sp('Blizzard', 4, 1.5, 'aoe2', 'Glace', slow=2), 'alerteNeige')
fam('dewpider', 2, 1, ['dewpider', 'araquanid'], sp('Aqua-Bulle', 3, 1.7, 'front', 'Eau', shield=0.1), 'hydratation')

# ——— Coût 3 ———
fam('slakoth', 3, 1, ['slakoth', 'vigoroth', 'slaking'], sp('Giga Impact', 4, 2.6, 'front', selfSlow=1), 'forcePure', roles=['Force'])
fam('happiny', 3, 2, ['happiny', 'chansey', 'blissey'], sp('Œuf de Vie', 3, 1.0, 'front', healAlly=0.14, shield=0.1), 'coeurSoin')
fam('vanillite', 3, 3, ['vanillite', 'vanillish', 'vanilluxe'], sp('Blizzard', 4, 1.5, 'all', 'Glace'), 'rideauNeige', roles=['Mage'])
fam('tangela', 3, 1, ['tangela', 'tangrowth'], sp('Martobois', 3, 1.8, 'front', 'Plante', recoil=0.04), 'regeForce')
fam('stantler', 3, 2, ['stantler', 'wyrdeer'], sp('Sorcellerie', 3, 1.7, 'weak', 'Psy', slow=2), 'intimidation')
fam('klink', 3, 1, ['klink', 'klang', 'klinklang'], sp('Lancécrou', 3, 1.6, 'front', 'Acier', selfAtk=0.1), 'corpsSain')
fam('sizzlipede', 3, 1, ['sizzlipede', 'centiskorch'], sp('Fouet de Feu', 3, 1.6, 'aoe2', 'Feu', dot={'pct': 0.05, 'kind': 'burn'}), 'torche')
fam('yanma', 3, 3, ['yanma', 'yanmega'], sp('Bourdon', 3, 1.7, 'back', 'Insecte'), 'turbo')
fam('lickitung', 3, 1, ['lickitung', 'lickilicky'], sp('Écrasement', 3, 1.6, 'front', stun=True), 'tempoPerso' if False else 'impassible')
fam('dunsparce', 3, 2, ['dunsparce', 'dudunsparce-two-segment'], sp('Draco-Charge', 3, 1.8, 'front', 'Dragon'), 'serenite',
    names={'dudunsparce-two-segment': 'Deusolourdo'})
fam('archen', 3, 1, ['archen', 'archeops'], sp('Acrobatie', 3, 2.1, 'weak', 'Vol'), 'temeraire')
fam('tirtouga', 3, 1, ['tirtouga', 'carracosta'], sp('Aqua-Brèche', 3, 1.8, 'front', 'Eau'), 'solideRoc')
fam('shieldon', 3, 1, ['shieldon', 'bastiodon'], sp('Garde Large', 4, 1.0, 'front', shield=0.25), 'fermete')
fam('anorith', 3, 1, ['anorith', 'armaldo'], sp('Plaie-Croix', 3, 1.9, 'front', 'Insecte'), 'armurbaston')
fam('omanyte', 3, 3, ['omanyte', 'omastar'], sp('Hydrocanon', 4, 2.1, 'back', 'Eau'), 'glissade')
fam('lileep', 3, 2, ['lileep', 'cradily'], sp('Giga-Sangsue', 3, 1.5, 'front', 'Plante', healAlly=0.08), 'lavabo')
fam('cufant', 3, 1, ['cufant', 'copperajah'], sp('Gigamarteau', 4, 2.3, 'front', 'Acier'), 'forcePure', roles=['Force'])
fam('clauncher', 3, 3, ['clauncher', 'clawitzer'], sp('Vibraqua', 3, 1.8, 'back', 'Eau'), 'mitraillette' if False else 'sniper', roles=['Mage'])
fam('varoom', 3, 1, ['varoom', 'revavroom'], sp('Turbo-Moteur', 3, 1.8, 'front', 'Acier', allyBuff=True), 'motorise')
fam('bronzor', 3, 2, ['bronzor', 'bronzong'], sp('Gyroballe', 4, 1.6, 'tank', 'Acier', shield=0.12), 'levitation')
fam('tauros', 3, 1, ['tauros'], sp('Plaquage', 3, 1.9, 'front', recoil=0.05), 'intimidation', roles=['Force'])

# ——— Coût 4 ———
fam('great-tusk', 4, 1, ['great-tusk'], sp('Défense Brute', 3, 2.0, 'front', 'Combat', shield=0.1), 'paleosynthese', roles=['Force'])
fam('flutter-mane', 4, 3, ['flutter-mane'], sp('Éclat Magique', 3, 1.6, 'aoe2', 'Fée'), 'paleosynthese', roles=['Mage'])
fam('iron-treads', 4, 1, ['iron-treads'], sp('Rapid Spin', 3, 1.8, 'front', 'Acier', allyBuff=True), 'chargeQuantique')
fam('iron-moth', 4, 3, ['iron-moth'], sp('Danse Flammes', 3, 1.7, 'aoe2', 'Feu', dot={'pct': 0.05, 'kind': 'burn'}), 'chargeQuantique', roles=['Mage'])
fam('iron-jugulis', 4, 3, ['iron-jugulis'], sp('Vibrobscur', 3, 1.9, 'weak', 'Ténèbres'), 'chargeQuantique')
fam('sandy-shocks', 4, 2, ['sandy-shocks'], sp('Tonnerre', 3, 1.8, 'back', 'Électrik', stun=True), 'paleosynthese')
fam('nihilego', 4, 3, ['nihilego'], sp('Bombe Beurk', 3, 1.6, 'aoe2', dot={'pct': 0.06}), 'boostChimere', roles=['Mage'])
fam('buzzwole', 4, 1, ['buzzwole'], sp('Marteau-Poing', 3, 2.3, 'front', 'Combat', selfAtk=0.08), 'boostChimere', roles=['Force'])
fam('kartana', 4, 1, ['kartana'], sp('Lame Feuille', 3, 2.4, 'weak', 'Plante'), 'boostChimere')
fam('xurkitree', 4, 3, ['xurkitree'], sp('Fatal-Foudre', 4, 2.3, 'back', 'Électrik'), 'boostChimere', roles=['Mage'])
fam('poipole', 4, 3, ['poipole', 'naganadel'], sp('Dard Dragon', 3, 1.8, 'back', 'Poison'), 'boostChimere')
fam('type-null', 4, 1, ['type-null', 'silvally'], sp('Multi-Attaque', 3, 1.9, 'front'), 'multiType' if False else 'adaptabilite',
    names={'type-null': 'Type:0'})
fam('uxie', 4, 3, ['uxie'], sp('Bâillement', 4, 1.2, 'random', 'Psy', stun=True), 'levitation', roles=['Mage'])
fam('mesprit', 4, 3, ['mesprit'], sp('Ondes Psy', 3, 1.6, 'aoe2', 'Psy', healAlly=0.06), 'levitation', roles=['Mage'])
fam('azelf', 4, 3, ['azelf'], sp('Explonuit', 3, 2.0, 'weak', 'Psy'), 'levitation', roles=['Mage'])
fam('cresselia', 4, 2, ['cresselia'], sp('Danse Lune', 4, 1.3, 'front', 'Psy', shield=0.15, healAlly=0.08), 'levitation')
fam('regirock', 4, 1, ['regirock'], sp('Lame de Roc', 3, 1.8, 'front', 'Roche', shield=0.12), 'corpsSain')
fam('regice', 4, 3, ['regice'], sp('Laser Glace', 3, 1.8, 'back', 'Glace', slow=3), 'corpsSain')
fam('registeel', 4, 1, ['registeel'], sp('Luminocanon', 3, 1.7, 'front', 'Acier', shield=0.15), 'corpsSain')
fam('okidogi', 4, 1, ['okidogi'], sp('Chaîne Malsaine', 3, 1.8, 'front', 'Poison', dot={'pct': 0.06}), 'toxitouche', roles=['Force'])
fam('munkidori', 4, 3, ['munkidori'], sp('Chaîne Malsaine', 3, 1.7, 'weak', 'Poison', dot={'pct': 0.06}), 'toxitouche')
fam('fezandipiti', 4, 2, ['fezandipiti'], sp('Danse Ailes', 3, 1.6, 'aoe2', 'Vol', dot={'pct': 0.05}), 'toxitouche')

# ——— Coût 5 ———
fam('regigigas', 5, 1, ['regigigas'], sp('Presse', 4, 2.8, 'tank'), 'forcePure', roles=['Force'])
fam('zamazenta', 5, 1, ['zamazenta', 'zamazenta', 'zamazenta-crowned'], sp('Bouclier Maximus', 4, 2.0, 'front', 'Acier', shield=0.2), 'lameIndomptable',
    names={'zamazenta-crowned': 'Zamazenta (Bouclier Suprême)'})
fam('volcanion', 5, 3, ['volcanion'], sp('Jet de Vapeur', 4, 2.2, 'aoe2', 'Eau', dot={'pct': 0.05, 'kind': 'burn'}), 'absorbeEau', roles=['Mage'])
fam('necrozma', 5, 2, ['necrozma'], sp('Photo-Geyser', 4, 2.4, 'tank', 'Psy'), 'prismArmor' if False else 'filtre' if False else 'multiecaille',
    branch={'at': 2, 'forms': [{'id': 'criniere', 'stages': ['necrozma-dusk', 'necrozma-ultra']}, {'id': 'ailes', 'stages': ['necrozma-dawn', 'necrozma-ultra']}]},
    names={'necrozma-dusk': 'Necrozma Crinière du Couchant', 'necrozma-dawn': 'Necrozma Ailes de l’Aurore', 'necrozma-ultra': 'Ultra-Necrozma'})
fam('deoxys', 5, 3, ['deoxys-normal'], sp('Psycho Boost', 4, 2.4, 'weak', 'Psy', selfAtk=-0.0), 'pression',
    branch={'at': 2, 'forms': [{'id': 'attaque', 'stages': ['deoxys-attack']}, {'id': 'defense', 'stages': ['deoxys-defense']}, {'id': 'vitesse', 'stages': ['deoxys-speed']}]},
    names={'deoxys-normal': 'Deoxys', 'deoxys-attack': 'Deoxys (Attaque)', 'deoxys-defense': 'Deoxys (Défense)', 'deoxys-speed': 'Deoxys (Vitesse)'})
fam('genesect', 5, 3, ['genesect'], sp('Techno-Buster', 3, 2.1, 'back', 'Insecte'), 'teledetection' if False else 'adaptabilite')
fam('hoopa', 5, 3, ['hoopa', 'hoopa', 'hoopa-unbound'], sp('Furie Dimension', 4, 2.4, 'weak', 'Ténèbres', shred=0.12), 'gardeMagik',
    names={'hoopa-unbound': 'Hoopa Déchaîné'})
fam('moltres', 5, 3, ['moltres'], sp('Lance-Soleil', 4, 2.2, 'aoe2', 'Feu', dot={'pct': 0.05, 'kind': 'burn'}), 'pression',
    branch={'at': 2, 'forms': [{'id': 'kanto', 'stages': ['moltres']}, {'id': 'galar', 'stages': ['moltres-galar']}]},
    names={'moltres-galar': 'Sulfura de Galar'})
fam('cobalion', 5, 1, ['cobalion'], sp('Lame Sainte', 3, 2.0, 'front', 'Acier', shred=0.1), 'coeurNoble')
fam('virizion', 5, 1, ['virizion'], sp('Lame Feuille', 3, 2.1, 'weak', 'Plante', shred=0.1), 'coeurNoble')
fam('tornadus', 5, 3, ['tornadus-incarnate', 'tornadus-incarnate', 'tornadus-therian'], sp('Vent Violent', 4, 1.9, 'aoe2', 'Vol'), 'farceur',
    names={'tornadus-incarnate': 'Boréas', 'tornadus-therian': 'Boréas (Totémique)'})
fam('thundurus', 5, 3, ['thundurus-incarnate', 'thundurus-incarnate', 'thundurus-therian'], sp('Fatal-Foudre', 4, 2.1, 'back', 'Électrik', stun=True), 'farceur',
    names={'thundurus-incarnate': 'Fulguris', 'thundurus-therian': 'Fulguris (Totémique)'})
fam('chi-yu', 5, 3, ['chi-yu'], sp('Flamme Bleue', 4, 2.2, 'aoe2', 'Feu'), 'auraTenebreuse' if False else 'epeeFleau', roles=['Mage'])
fam('ting-lu', 5, 1, ['ting-lu'], sp('Ruine', 4, 1.6, 'all', 'Sol'), 'epeeFleau')
fam('wo-chien', 5, 2, ['wo-chien'], sp('Ruine', 4, 1.4, 'all', 'Plante', healAlly=0.06), 'epeeFleau')
fam('tapu-koko', 5, 2, ['tapu-koko'], sp('Ire de la Nature', 4, 2.0, 'weak', 'Électrik'), 'teraVoltage' if False else 'peauElectrik')
fam('tapu-lele', 5, 3, ['tapu-lele'], sp('Choc Psy', 3, 1.9, 'back', 'Psy'), 'creaPsy', roles=['Mage'])
fam('tapu-bulu', 5, 1, ['tapu-bulu'], sp('Martobois', 3, 2.2, 'front', 'Plante', recoil=0.05), 'creaHerbe', roles=['Force'])
fam('pecharunt', 5, 2, ['pecharunt'], sp('Chaîne Malsaine', 3, 1.6, 'aoe2', 'Poison', dot={'pct': 0.07}), 'toxitouche')
fam('meltan', 5, 1, ['meltan', 'melmetal'], sp('Poing Lourd', 4, 2.4, 'front', 'Acier'), 'fermete', roles=['Force'])
fam('calyrex', 5, 3, ['calyrex', 'calyrex'], sp('Psyko', 3, 1.8, 'back', 'Psy'), 'gardeMagik',
    branch={'at': 3, 'forms': [{'id': 'froid', 'stages': ['calyrex-ice']}, {'id': 'effroi', 'stages': ['calyrex-shadow']}]},
    names={'calyrex-ice': 'Sylveroy Cavalier du Froid', 'calyrex-shadow': 'Sylveroy Cavalier d’Effroi'})
fam('walking-wake', 5, 3, ['walking-wake'], sp('Hydro-Vapeur', 4, 2.3, 'aoe2', 'Eau'), 'paleosynthese', roles=['Mage'])
fam('iron-leaves', 5, 1, ['iron-leaves'], sp('Lame Psychique', 3, 2.2, 'weak', 'Plante', shred=0.1), 'chargeQuantique')

for f in F:
    if f['spell'].get('selfAtk') == -0.0:
        f['spell'].pop('selfAtk')
S = '/tmp/claude-0/-home-claude/7806be41-42a4-5d8d-8dae-34bc3768b0b1/scratchpad/tools'
json.dump(F, open(f'{S}/new_fams3.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(T, open(f'{S}/talents3.json', 'w', encoding='utf-8'), ensure_ascii=False)
from collections import Counter
print(len(F), Counter(f['cost'] for f in F))
