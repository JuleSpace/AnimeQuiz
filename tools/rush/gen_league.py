import json
D=json.load(open('/tmp/gen1.json'))
names={int(k):v for k,v in D['names'].items()}; types={int(k):v for k,v in D['types'].items()}; stats={int(k):v for k,v in D['stats'].items()}
legend=set(D['legend'])
TYPE_W={'Feu':'ember','Eau':'watergun','Plante':'leaf','Électrik':'thunder','Normal':'swift','Poison':'sludge','Sol':'mudbomb','Roche':'rockslide','Combat':'machpunch','Psy':'psychic','Spectre':'shadow','Glace':'icebeam','Dragon':'dracometeor','Insecte':'pinmissile','Vol':'aerialace','Fée':'dazzlinggleam','Acier':'flashcannon','Ténèbres':'bite'}
W={'pidgey':'aerialace','spearow':'aerialace','rattata':'bite','ekans':'bite','sandshrew':'nightslash','nidoranf':'doublekick','nidoranm':'doublekick',
'clefairy':'dazzlinggleam','vulpix':'willowisp','jigglypuff':'dazzlinggleam','zubat':'bite','oddish':'gigadrain','paras':'pinmissile','venonat':'psychic',
'diglett':'quake','meowth':'nightslash','psyduck':'watergun','mankey':'machpunch','growlithe':'flamethrower','poliwag':'bubble','abra':'psychic','machop':'machpunch',
'bellsprout':'leafblade','tentacool':'bubble','geodude':'rockslide','ponyta':'flametrail','slowpoke':'psychic','magnemite':'electroball','farfetchd':'aerialace',
'doduo':'aerialace','seel':'icebeam','grimer':'sludge','shellder':'icebeam','gastly':'shadow','onix':'rockslide','drowzee':'psychic','krabby':'bubble','voltorb':'spark',
'exeggcute':'seedbomb','cubone':'bonemerang','hitmonlee':'doublekick','hitmonchan':'machpunch','lickitung':'bodyslam','koffing':'sludge','rhyhorn':'quake','chansey':'swift',
'tangela':'gigadrain','kangaskhan':'machpunch','horsea':'hydropump','goldeen':'surf','staryu':'swift','mrmime':'psychic','scyther':'nightslash','jynx':'blizzard',
'electabuzz':'thunder','magmar':'flamethrower','pinsir':'nightslash','tauros':'bodyslam','magikarp':'bodyslam','lapras':'surf','ditto':'swift','eevee':'swift','porygon':'swift',
'omanyte':'rockslide','kabuto':'nightslash','aerodactyl':'rockslide','snorlax':'bodyslam','articuno':'blizzard','zapdos':'thunder','moltres':'firespin','dratini':'dracometeor',
'mewtwo':'psychic','mew':'psychic','caterpie':'pinmissile','weedle':'pinmissile'}
# (stat, goal, rarity)
U={
'caterpie':('runs',2,'Commun'),'weedle':('kills',1500,'Commun'),'pidgey':('dashes',100,'Commun'),'rattata':('kills',3000,'Commun'),'spearow':('catches',5,'Commun'),
'ekans':('typeKills:Poison',200,'Commun'),'pikachu':('buy',400,'Peu commun'),'sandshrew':('chests',10,'Commun'),'nidoranf':('runs',4,'Commun'),'nidoranm':('bestLevel',15,'Commun'),
'clefairy':('ults',15,'Peu commun'),'vulpix':('typeKills:Feu',3000,'Peu commun'),'jigglypuff':('altars',6,'Commun'),'zubat':('bestTime',300,'Commun'),'oddish':('typeKills:Plante',3000,'Commun'),
'paras':('berries',10,'Commun'),'venonat':('superHits',1500,'Commun'),'diglett':('bestKills',600,'Commun'),'meowth':('coins',1500,'Peu commun'),'psyduck':('typeKills:Eau',3000,'Peu commun'),
'mankey':('typeKills:Combat',150,'Commun'),'growlithe':('catches',15,'Peu commun'),'poliwag':('missions',10,'Commun'),'abra':('wins',1,'Rare'),'machop':('bosses',6,'Peu commun'),
'bellsprout':('evolutions',6,'Commun'),'tentacool':('bestLevel',20,'Commun'),'geodude':('alphas',2,'Commun'),'ponyta':('dashes',400,'Peu commun'),'slowpoke':('runs',10,'Peu commun'),
'magnemite':('typeKills:Électrik',400,'Peu commun'),'farfetchd':('superHits',5000,'Rare'),'doduo':('bestTime',420,'Peu commun'),'seel':('ults',40,'Peu commun'),'grimer':('typeKills:Poison',1500,'Peu commun'),
'shellder':('noHit',90,'Peu commun'),'gastly':('catches',30,'Rare'),'onix':('bosses',15,'Rare'),'drowzee':('missions',25,'Peu commun'),'krabby':('coins',5000,'Peu commun'),
'voltorb':('typeKills:Électrik',1500,'Peu commun'),'exeggcute':('bestLevel',25,'Peu commun'),'cubone':('alphas',6,'Rare'),'hitmonlee':('typeKills:Combat',800,'Rare'),'hitmonchan':('bestKills',1500,'Rare'),
'lickitung':('berries',40,'Peu commun'),'koffing':('typeCatches:Poison',10,'Peu commun'),'rhyhorn':('kills',25000,'Rare'),'chansey':('wins',3,'Rare'),'tangela':('typeKills:Plante',15000,'Rare'),
'kangaskhan':('catches',60,'Rare'),'horsea':('typeKills:Eau',15000,'Rare'),'goldeen':('runs',20,'Peu commun'),'staryu':('ults',80,'Rare'),'mrmime':('superHits',15000,'Rare'),
'scyther':('bestKills',2000,'Épique'),'jynx':('bestLevel',30,'Rare'),'electabuzz':('typeKills:Électrik',5000,'Rare'),'magmar':('typeKills:Feu',20000,'Rare'),'pinsir':('alphas',15,'Épique'),
'tauros':('dashes',1500,'Rare'),'magikarp':('runs',30,'Épique'),'lapras':('wins',5,'Épique'),'ditto':('evolutions',20,'Rare'),'eevee':('catches',100,'Épique'),'porygon':('missions',60,'Épique'),
'omanyte':('chests',80,'Rare'),'kabuto':('bosses',30,'Épique'),'aerodactyl':('wins',8,'Épique'),'snorlax':('kills',60000,'Épique'),'dratini':('wins',10,'Épique'),
'articuno':('winners',3,'Légendaire'),'zapdos':('winners',6,'Légendaire'),'moltres':('winners',10,'Légendaire'),'mewtwo':('wins',25,'Légendaire'),'mew':('league',60,'Légendaire')}
FREE={'bulbasaur','charmander','squirtle'}
fams=[]
for f in D['fams']:
    fid=f['id']; chain=f['chain']; br=f['branch']
    st=[stats[d] for d in chain+br]
    avg=lambda i: sum(s[i] for s in st)/len(st)
    hp=round(min(150,max(85,72+avg(0)*0.55+avg(2)*0.18)))
    spd=round(min(3.2,max(2.2,2.25+(avg(5)-35)/110*0.9)),2)
    n=len(chain)+(1 if br else 0)
    isLeg=f['base'] in legend
    power=1.3 if isLeg else (1.18 if n==1 else 1.07 if n==2 else 1.0)
    evos=[]
    if len(chain)==3: lv=[8,16]
    elif len(chain)==2: lv=[12]
    else: lv=[]
    for i,d in enumerate(chain[1:]):
        evos.append({'level':lv[i],'name':names[d],'dex':d,'hp':25 if i==0 and len(chain)==3 else 40})
    if fid=='magikarp': evos[0]['hp']=90
    if br:
        evos.append({'level':12,'hp':40,'choices':[{'id':str(d),'name':names[d],'dex':d,'types':types[d]} for d in br]})
    learn=sorted(set(t for d in chain+br for t in types[d]))
    u=U.get(fid)
    fam={'id':fid,'dex':f['base'],'name':names[f['base']],'types':types[f['base']],'hp':hp,'speed':spd,'power':power,'weapon':W.get(fid) or TYPE_W[types[f['base']][0]],
         'learn':learn,'evolutions':evos,'stats':stats[f['base']],'legendary':isLeg}
    if fid in FREE: fam['unlock']={'kind':'free'}; fam['rarity']='Commun'
    else: fam['unlock']={'kind':u[0],'goal':u[1]}; fam['rarity']=u[2]
    fams.append(fam)
forms={d:types[d] for d in range(1,152)}
out='/* Généré à partir de PokéAPI (noms, types, statistiques, évolutions). Ne pas éditer à la main : voir tools/gen_league.py */\n'
out+='export const LEAGUE_DATA = '+json.dumps(fams,ensure_ascii=False,separators=(',',':'))+';\n'
out+='export const GEN1_TYPES = '+json.dumps(forms,ensure_ascii=False,separators=(',',':'))+';\n'
out+='export const GEN1_NAMES = '+json.dumps({d:names[d] for d in range(1,152)},ensure_ascii=False,separators=(',',':'))+';\n'
out+='export const GEN1_STATS = '+json.dumps({d:stats[d] for d in range(1,152)},separators=(',',':'))+';\n'
open('/home/claude/AnimeQuiz/client/src/components/rushLeagueData.js','w').write(out)
print(len(fams), sum(1 for f in fams if f['unlock']['kind']=='free'))
missing=[f['id'] for f in D['fams'] if f['id'] not in U and f['id'] not in FREE]; print('missing unlock',missing)
