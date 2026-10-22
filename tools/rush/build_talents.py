S = '/tmp/claude-0/-home-claude/7806be41-42a4-5d8d-8dae-34bc3768b0b1/scratchpad'
OUT = '/home/claude/AnimeQuiz/client/src/components/pokeArenaTalents.js'

old = open(f'{S}/old_talents.js', encoding='utf-8').read()
head = old[:old.index("/** Talent de chaque lignée. */")].rstrip()
head = head.replace(
    " *  serene                   ses sorts étourdissent en plus 30% du temps\n */",
    """ *  serene                   ses sorts étourdissent en plus 30% du temps
 *  tinted                   ses coups peu efficaces font des dégâts normaux
 *  contrary                 les baisses de stats deviennent des hausses
 *  stamina                  chaque coup reçu réduit les suivants de 4% (jusqu’à -30%)
 *  onHitAtk                 chaque coup reçu donne +X% ATK
 */""")
assert head.endswith("};")

extra = """
  delestage: { name: 'Délestage', desc: '+30% SPD.', spdMul: 1.3 },
  bouleDePoils: { name: 'Boule de Poils', desc: 'Subit 40% de dégâts en moins des attaques normales (hors sorts).', autoGuard: 0.6 },
  regardVif: { name: 'Regard Vif', desc: 'Ses coups ignorent l’esquive et les talents défensifs.', pierce: true },
  lentiteintee: { name: 'Lentiteintée', desc: 'Ses coups peu efficaces font quand même des dégâts normaux.', tinted: true },
  lavabo: { name: 'Lavabo', desc: 'Immunisé à Eau ; un coup Eau lui donne +20% ATK.', immune: ['Eau'], immuneAtk: 0.2 },
  hydratation: { name: 'Hydratation', desc: 'Immunisé aux poisons et brûlures.', cleanse: true },
  griffeDure: { name: 'Griffe Dure', desc: '+20% de dégâts sur toutes ses attaques.', atkMul: 1.2 },
  contestataire: { name: 'Contestataire', desc: 'Les baisses d’ATK et de SPD qu’il subit deviennent des hausses.', contrary: true },
  epineDeFer: { name: 'Épine de Fer', desc: 'Renvoie 15% des dégâts subis à l’attaquant.', thorns: 0.15 },
  receveur: { name: 'Receveur', desc: '+12% ATK pour chaque allié mis KO.', supreme: 0.12 },
  endurance: { name: 'Endurance', desc: 'Chaque coup reçu réduit les dégâts suivants de 4% (jusqu’à -30%).', stamina: true },
  creaHerbe: { name: 'Créa-Herbe', desc: 'Soigne l’allié le plus blessé de 5% à chaque tour.', allyHeal: 0.05 },
  creaPsy: { name: 'Créa-Psy', desc: 'Début du combat : +12% ATK aux alliés Psy.', teamAtk: { mult: 0.12, type: 'Psy' } },
  pointEnergie: { name: 'Point Énergie', desc: 'Début du combat : +8% ATK à toute l’équipe.', teamAtk: { mult: 0.08 } },
  chargeRocheuse: { name: 'Charge Rocheuse', desc: 'Ses sorts font +25% de dégâts.', spellMul: 1.25 },
  filature: { name: 'Filature', desc: 'Les 2 premiers tours : +50% de dégâts.', surge: { turns: 2, atk: 0.5 } },
  selPurificateur: { name: 'Sel Purificateur', desc: 'Immunisé aux poisons et brûlures ; les attaques Spectre lui font moitié moins mal.', cleanse: true, resist: { Spectre: 0.5 } },
  electromorphose: { name: 'Électromorphose', desc: 'Chaque coup reçu : +6% ATK.', onHitAtk: 0.06 },
  mycelium: { name: 'Force Mycélium', desc: 'Ses coups ignorent les talents défensifs adverses.', pierce: true },
  libero: { name: 'Libéro', desc: 'Change de type avant d’attaquer : ses coups ne sont jamais résistés.', protean: true }
};
"""
head = head[:-2].rstrip() + "," + extra

mapping = """
eevee adaptabilite|fletch ailesBourrasque|mudkip torrent|shroom technicien|magikarp intimidation|litwick infiltration|bidoof lunatique|wooper absorbeEau|mareep statik|azurill coloforce|rowlet engrais|cynda brasier|chinchou absorbeVolt|gastly levitation|scyther technicien|sneasel pression|riolu coeurNoble|mankey acharne|growlithe intimidation|abra gardeMagik|trapinch levitation|roserade pointPoison|ralts calque|toxel punkRock|zorua-h illusion|honedge declicTactique|gligar soinPoison|spheal isograisse|mimikyu deguisement|noibat infiltration|tinkatink briseMoule|misdreavus levitation|charcadet torche|dreepy infiltration|rookidee miroirArmure|dratini multiecaille|beldum corpsSain|tyrunt prognathe|pawniard generalSupreme|gible peauDure|larvesta corpsArdent|frigibax echangeThermique|froakie proteen|ironval chargeQuantique|celebi medicNature|dialga pression|mew synchro|pheromosa boostChimere|darkrai mauvaisReve|lugia multiecaille|axew briseMoule
charmander forceSoleil|sprigatito proteen|torchic turbo|totodile sansLimite|snivy contestataire|grubbin levitation|cubone teteDeRoc|clodsire absorbeEau|gholdengo corpsEnOr|lilligant chlorophylle|drifloon delestage|sableye farceur|mawile coloforce|absol chanceux|aron fermete|bagon intimidation|deino levitation|shaymin medicNature|zapdos pression|rayquaza aerolock|raichu statik|spinda piedsConfus|greavard bouleDePoils|cetoddle isograisse|capsakid chlorophylle|flamigo querelleur|applin gloutonnerie|bulbasaur engrais|squirtle torrent|chien-pao epeeFleau|iron-hands chargeQuantique|lapras absorbeEau|exegg chlorophylle|articuno pression|machop cran|nido sansLimite|sand baigneSable|pidgey regardVif|pinsir briseMoule|geodude fermete|magnemite magnepiege|clefairy gardeMagik|mewtwo pression|sentret regardVif|chikorita engrais|swinub isograisse|tyrogue technicien|zubat infiltration|hoothoot lentiteintee|shuckle fermete|horsea sniper|larvitar sableVolant|onix fermete|togepi serenite|treecko engrais|electrike paratonnerre|snorunt corpsGel|taillow cran|nincada turbo|jirachi serenite|buneary joliSourire|chimchar poingDeFer|piplup torrent|turtwig engrais|shinx intimidation|shellos lavabo|combee pression|cranidos briseMoule|spiritomb infiltration|skorupi armurbaston|giratina pression|minccino technicien|tepig brasier|oshawott tranchant|blitzle paratonnerre|cubchoo glissade|timburr cran|venipede pointPoison|drilbur baigneSable|ducklett hydratation|munna anticipation|sewaddle essaim|roggenrola sableVolant|karrablast armurbaston|cottonee farceur|kyurem pression|meloetta serenite|fennekin brasier|chespin pareBalles|helioptile peauSeche|bergmite fermete|hawlucha delestage|skrelp adaptabilite|binacle griffeDure|espurr farceur|goomy poisseux|inkay contestataire|klefki farceur|yveltal auraTenebreuse|diancie corpsSain|stufful bouleDePoils|litten intimidation|popplio torrent|togedemaru epineDeFer|crabrawler poingDeFer|passimian receveur|salandit corrosion|mudbray endurance|oricorio danseuse|oranguru attention|rockruff annuleGarde|jangmo pareBalles|fomantis contestataire|lunala multiecaille|marshadow technicien|grimer-a toxitouche|scorbunny libero|sobble sniper|grookey creaHerbe|snom ecailleGlace|falinks armurbaston|zigzagoon-g acharne|yamask-g corpsMaudit|corsola-g corpsMaudit|meowth-g griffeDure|impidimp farceur|hatenna miroirMagik|blipbug essaim|indeedee creaPsy|stonjourner pointEnergie|eternatus pression|zarude medicNature|girafarig gloutonnerie|fuecoco brasier|quaxly impudence|starly intimidation|milcery voileSucre|furfrou toisonEpaisse|vivillon ecranPoudre|ogerpon masque|miraidon moteurHadron|roaring paleosynthese|toedscool mycelium|bombirdier chargeRocheuse|tarountula filature|nacli selPurificateur|bellibolt electromorphose
teddiursa cran|swablu medicNature|chatot piedsConfus|lillipup querelleur|drampa colerique|victini victorieux|remoraid sniper|barboach anticipation|keldeo coeurNoble|tapu-fini creaBrume|pansage gloutonnerie|phantump recolte|tynamo levitation|zeraora absorbeVolt|raging-bolt paleosynthese|amaura alerteNeige|vulpix-a alerteNeige|iron-bundle chargeQuantique|pancham briseMoule|farfetchd-g chanceux|mareanie regeForce|zygarde rassemblement|sandygast sableHumide|golett poingDeFer|aerodactyl teteDeRoc|landorus sansLimite|solosis gardeMagik|scream-tail paleosynthese|wurmple essaim|slither-wing paleosynthese|kabuto glissade|rhyhorn solideRoc|terrakion coeurNoble|glimmet debrisToxiques|shuppet corpsMaudit|zorua illusion|morpeko declicFringale|magearna coeurDeCoq|igglybuff joliSourire|xerneas auraFeerique|koffing gazInhibiteur|munchlax isograisse|groudon secheresse|zacian lameIndomptable
"""
pairs = [p.split() for p in mapping.replace('\n', '|').split('|') if p.strip()]
lines = []
for k, v in pairs:
    key = f"'{k}'" if '-' in k else k
    lines.append(f"  {key}: P.{v}")
body = "\n\n/** Talent de chaque lignée (talent officiel du Pokémon, adapté au combat auto). */\nexport const TALENTS = {\n" + ",\n".join(lines) + "\n};\n"
open(OUT, 'w', encoding='utf-8').write(head + body)
print(len(pairs), 'talents')
