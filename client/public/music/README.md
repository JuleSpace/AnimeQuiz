# Musiques de PokeArena

Les OST Pokémon ne sont pas dans le dépôt (droits d’auteur). Pour les entendre dans le jeu,
dépose tes propres fichiers **.mp3** dans ce dossier (`client/public/music/`) avec exactement
le nom indiqué ci-dessous. Les .mp3 de ce dossier sont ignorés par git.

Tu peux aussi héberger les fichiers ailleurs et définir `REACT_APP_MUSIC_URL`
(ex. `https://mon-cdn.example/pokearena-music`) au moment du build.

Une piste absente est remplacée automatiquement par un thème chiptune original composé
par le jeu (même ambiance : route, grotte, combat, Champion, Maître…).

Qui joue quoi :
- Carte, Poké Mart et événements : un thème de route lié au lieu de la région (fixe pour toute la région).
- Combats : le thème du dresseur. Champion d’Arène et Conseil 4 selon leur région d’origine,
  chaque Maître a le sien (Cynthia, Goyah, Tarak…), chaque chef de méchants aussi (Hélio, Ghetis…),
  les rivaux ont le thème de leur jeu. Environ 8 % des combats ordinaires passent le thème d’Hélio.
- Victoire, puis Panthéon à la fin de la run.

## Villes et menus

| Fichier | Piste |
|---|---|
| `town-newbark-hgss.mp3` | Bourg Geon — HeartGold / SoulSilver |
| `town-twinleaf-dp.mp3` | Bonaugure — Diamant / Perle |
| `town-nuvema-bw.mp3` | Renouet — Noir / Blanc |
| `town-vaniville-xy.mp3` | Bourg Croquis — X / Y |
| `olivine-hgss.mp3` | Oliville — HeartGold / SoulSilver |
| `sunyshore-dp.mp3` | Rivamar — Diamant / Perle |
| `undella-bw.mp3` | Port Yoneuve (été) — Noir / Blanc |
| `cyllage-xy.mp3` | Relifac-le-Haut — X / Y |

## Routes

| Fichier | Piste |
|---|---|
| `route-29-hgss.mp3` | Route 29 — HeartGold / SoulSilver |
| `route-30-hgss.mp3` | Route 30 — HeartGold / SoulSilver |
| `route-38-hgss.mp3` | Route 38 — HeartGold / SoulSilver |
| `national-park-hgss.mp3` | Parc Naturel — HeartGold / SoulSilver |
| `route-201-dp.mp3` | Route 201 — Diamant / Perle |
| `route-205-dp.mp3` | Route 205 — Diamant / Perle |
| `eterna-forest-dp.mp3` | Forêt de Vestigion — Diamant / Perle |
| `route-1-bw.mp3` | Route 1 — Noir / Blanc |
| `route-6-bw.mp3` | Route 6 — Noir / Blanc |
| `route-xy.mp3` | Thème des routes — X / Y |
| `route-47-hgss.mp3` | Route 47 — HeartGold / SoulSilver |
| `route-210-dp.mp3` | Route 210 — Diamant / Perle |
| `route-10-bw.mp3` | Route 10 — Noir / Blanc |
| `surf-hgss.mp3` | Surf — HeartGold / SoulSilver |

## Grottes et montagnes

| Fichier | Piste |
|---|---|
| `mt-coronet-dp.mp3` | Mont Couronné — Diamant / Perle |
| `dragonspiral-bw.mp3` | Tour Dragospire — Noir / Blanc |
| `union-cave-hgss.mp3` | Caves Jumelles — HeartGold / SoulSilver |
| `chargestone-bw.mp3` | Grotte Électrolithe — Noir / Blanc |
| `twist-mountain-bw.mp3` | Mont Foré — Noir / Blanc |
| `glittering-cave-xy.mp3` | Grotte Scintillante — X / Y |

## Neige

| Fichier | Piste |
|---|---|
| `ice-path-hgss.mp3` | Route de Glace — HeartGold / SoulSilver |
| `route-216-dp.mp3` | Route 216 — Diamant / Perle |
| `snowpoint-dp.mp3` | Frimapic — Diamant / Perle |
| `icirrus-bw.mp3` | Flocombe — Noir / Blanc |
| `snowbelle-xy.mp3` | Flusselles — X / Y |

## Volcans

| Fichier | Piste |
|---|---|
| `cinnabar-hgss.mp3` | Cramois’Île — HeartGold / SoulSilver |
| `stark-mountain-pt.mp3` | Mont Abrupt — Platine |
| `reversal-mountain-b2w2.mp3` | Mont Renverse — Noire 2 / Blanche 2 |
| `route-113-oras.mp3` | Route 113 — Rubis Oméga / Saphir Alpha |

## Ligue

| Fichier | Piste |
|---|---|
| `victory-road-hgss.mp3` | Route Victoire — HeartGold / SoulSilver |
| `league-dp.mp3` | Ligue Pokémon — Diamant / Perle |
| `victory-road-bw.mp3` | Route Victoire — Noir / Blanc |
| `league-bw.mp3` | Ligue Pokémon — Noir / Blanc |
| `league-xy.mp3` | Ligue Pokémon — X / Y |

## Combats de dresseurs

| Fichier | Piste |
|---|---|
| `battle-trainer-johto-hgss.mp3` | Combat ! Dresseur (Johto) — HeartGold / SoulSilver |
| `battle-trainer-kanto-hgss.mp3` | Combat ! Dresseur (Kanto) — HeartGold / SoulSilver |
| `battle-trainer-dp.mp3` | Combat ! Dresseur — Diamant / Perle |
| `battle-trainer-bw.mp3` | Combat ! Dresseur — Noir / Blanc |
| `battle-trainer-xy.mp3` | Combat ! Dresseur — X / Y |

## Champions d’Arène

| Fichier | Piste |
|---|---|
| `battle-gym-kanto-hgss.mp3` | Combat ! Champion d’Arène (Kanto) — HeartGold / SoulSilver |
| `battle-gym-johto-hgss.mp3` | Combat ! Champion d’Arène (Johto) — HeartGold / SoulSilver |
| `battle-gym-oras.mp3` | Combat ! Champion d’Arène — Rubis Oméga / Saphir Alpha |
| `battle-gym-dp.mp3` | Combat ! Champion d’Arène — Diamant / Perle |
| `battle-gym-bw.mp3` | Combat ! Champion d’Arène — Noir / Blanc |
| `battle-gym-xy.mp3` | Combat ! Champion d’Arène — X / Y |
| `battle-gym-swsh.mp3` | Combat ! Champion d’Arène — Épée / Bouclier |
| `battle-gym-sv.mp3` | Combat ! Champion d’Arène — Écarlate / Violet |

## Conseil 4

| Fichier | Piste |
|---|---|
| `battle-e4-oras.mp3` | Combat ! Conseil 4 — Rubis Oméga / Saphir Alpha |
| `battle-e4-dp.mp3` | Combat ! Conseil 4 — Diamant / Perle |
| `battle-e4-bw.mp3` | Combat ! Conseil 4 — Noir / Blanc |
| `battle-e4-xy.mp3` | Combat ! Conseil 4 — X / Y |
| `battle-e4-sm.mp3` | Combat ! Conseil 4 — Soleil / Lune |
| `battle-e4-sv.mp3` | Combat ! Conseil 4 — Écarlate / Violet |

## Maîtres

| Fichier | Piste |
|---|---|
| `battle-champion-hgss.mp3` | Combat ! Maître (Peter) — HeartGold / SoulSilver |
| `battle-red-hgss.mp3` | Combat contre Red — HeartGold / SoulSilver |
| `battle-blue-frlg.mp3` | Combat final ! Rival (Blue) — Rouge Feu / Vert Feuille |
| `battle-champion-oras.mp3` | Combat ! Maître — Rubis Oméga / Saphir Alpha |
| `battle-cynthia-dp.mp3` | Combat ! Maîtresse (Cynthia) — Diamant / Perle |
| `battle-champion-bw.mp3` | Combat ! Maître (Goyah) — Noir / Blanc |
| `battle-iris-b2w2.mp3` | Combat ! Maîtresse Iris — Noire 2 / Blanche 2 |
| `battle-diantha-xy.mp3` | Combat ! Maîtresse (Dianthéa) — X / Y |
| `battle-kukui-sm.mp3` | Combat ! Prof. Euphorbe — Soleil / Lune |
| `battle-leon-swsh.mp3` | Combat ! Tarak — Épée / Bouclier |
| `battle-geeta-sv.mp3` | Combat ! Alisma — Écarlate / Violet |
| `battle-nemona-sv.mp3` | Combat ! Menzi — Écarlate / Violet |

## Chefs des méchants

| Fichier | Piste |
|---|---|
| `battle-cyrus-dp.mp3` | Combat ! Chef de la Team Galaxie (Hélio) — Diamant / Perle |
| `battle-rocket-boss-hgss.mp3` | Combat ! Chef de la Team Rocket — HeartGold / SoulSilver |
| `battle-aqua-magma-leader-oras.mp3` | Combat ! Chef Aqua / Magma — Rubis Oméga / Saphir Alpha |
| `battle-ghetsis-bw.mp3` | Combat ! Ghetis — Noir / Blanc |
| `battle-lysandre-xy.mp3` | Combat ! Lysandre — X / Y |
| `battle-guzma-sm.mp3` | Combat ! Guzma — Soleil / Lune |

## Sbires

| Fichier | Piste |
|---|---|
| `battle-grunt-rocket-hgss.mp3` | Combat ! Team Rocket — HeartGold / SoulSilver |
| `battle-grunt-aqua-magma-oras.mp3` | Combat ! Team Aqua / Magma — Rubis Oméga / Saphir Alpha |
| `battle-grunt-galactic-dp.mp3` | Combat ! Team Galaxie — Diamant / Perle |
| `battle-grunt-plasma-bw.mp3` | Combat ! Team Plasma — Noir / Blanc |
| `battle-grunt-flare-xy.mp3` | Combat ! Team Flare — X / Y |
| `battle-grunt-skull-sm.mp3` | Combat ! Team Skull — Soleil / Lune |

## Rivaux

| Fichier | Piste |
|---|---|
| `battle-rival-hgss.mp3` | Combat ! Rival — HeartGold / SoulSilver |
| `battle-rival-oras.mp3` | Combat ! Timmy — Rubis Oméga / Saphir Alpha |
| `battle-rival-dp.mp3` | Combat ! Rival — Diamant / Perle |
| `battle-rival-bw.mp3` | Combat ! Rival — Noir / Blanc |
| `battle-rival-b2w2.mp3` | Combat ! Rival — Noire 2 / Blanche 2 |
| `battle-rival-xy.mp3` | Combat ! Rival — X / Y |
| `battle-rival-sm.mp3` | Combat ! Rival — Soleil / Lune |
| `battle-rival-swsh.mp3` | Combat ! Rival — Épée / Bouclier |
| `battle-rival-sv.mp3` | Combat ! Rival — Écarlate / Violet |

## Victoires

| Fichier | Piste |
|---|---|
| `victory-trainer-hgss.mp3` | Victoire ! (Dresseur) — HeartGold / SoulSilver |
| `victory-trainer-dp.mp3` | Victoire ! (Dresseur) — Diamant / Perle |
| `victory-gym-dp.mp3` | Victoire ! (Champion d’Arène) — Diamant / Perle |
| `victory-champion-bw.mp3` | Victoire ! (Maître) — Noir / Blanc |

## Panthéon

| Fichier | Piste |
|---|---|
| `hall-of-fame-hgss.mp3` | Panthéon — HeartGold / SoulSilver |
| `hall-of-fame-dp.mp3` | Panthéon — Diamant / Perle |

