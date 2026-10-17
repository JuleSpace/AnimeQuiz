# Musiques de PokeArena

Ordre de priorité pour chaque piste :
1. **YouTube** : les pistes avec un lien (colonne YouTube) sont lues dans un mini-lecteur
   (bouton ♪ de la barre du haut). Pour en ajouter ou en changer, édite `TRACKS` dans
   `client/src/components/pokeArenaMusic.js` (`Y('Titre', 'ambiance', ['idVidéo'])`).
2. **Fichier** : sinon, un .mp3 déposé ici (`client/public/music/`) avec le nom indiqué.
   Les .mp3 de ce dossier sont ignorés par git.
3. **Thème original** : sinon, un thème chiptune composé par le jeu.

Tu peux aussi héberger les fichiers ailleurs et définir `REACT_APP_MUSIC_URL`
(ex. `https://mon-cdn.example/pokearena-music`) au moment du build.

Qui joue quoi :
- Carte, Poké Mart et événements : un thème lié au lieu de la région (fixe pour toute la région).
- Combats : le thème du dresseur. Champion d’Arène et Conseil 4 selon leur région d’origine,
  chaque Maître a le sien (Cynthia, Goyah, Tarak…), chaque chef de méchants aussi (Hélio, Ghetis…),
  les rivaux ont le thème de leur jeu. Environ 8 % des combats ordinaires passent le thème d’Hélio.
- Menus : génériques VF de l’anime (saisons 3, 8, 9) et thèmes de villes ; génériques à la fin d’une run gagnée.
- Sbires des méchants : Miror B. (Pokémon XD).

## Villes et menus

| Fichier | Piste | YouTube |
|---|---|---|
| `op-saison-3-vf.mp3` | Pokémon Johto — Générique saison 3 (VF) | [ca_AUEJmkLo](https://youtu.be/ca_AUEJmkLo) · [FLJij1Ethl0](https://youtu.be/FLJij1Ethl0) |
| `op-saison-8-vf.mp3` | Pokémon Invincible — Générique saison 8 (VF) | [Np-vs6bXZAE](https://youtu.be/Np-vs6bXZAE) |
| `op-saison-9-vf.mp3` | Pokémon Advanced Battle — Générique saison 9 (VF) | [8kKzydj7XbU](https://youtu.be/8kKzydj7XbU) · [bLf8IMffDuY](https://youtu.be/bLf8IMffDuY) |
| `port-yoneuve-bw.mp3` | Port Yoneuve — Noir / Blanc 2 | [2YZ1ouxhzaM](https://youtu.be/2YZ1ouxhzaM) |
| `bourg-en-vol-oras.mp3` | Bourg-en-Vol — Rubis Oméga / Saphir Alpha | [xa-ngQFKark](https://youtu.be/xa-ngQFKark) |
| `la-porte-xy.mp3` | La Porte — X / Y | [rtvln-rF3Rw](https://youtu.be/rtvln-rF3Rw) · [rtvIn-rF3Rw](https://youtu.be/rtvIn-rF3Rw) |

## Routes

| Fichier | Piste | YouTube |
|---|---|---|
| `parc-naturel-hgss.mp3` | Parc Naturel — HeartGold / SoulSilver | [4ujh7lvcsRs](https://youtu.be/4ujh7lvcsRs) · [4ujh7IvcsRs](https://youtu.be/4ujh7IvcsRs) |
| `route-209-dp.mp3` | Route 209 (jour) — Diamant / Perle | [pmCpbZQXo9A](https://youtu.be/pmCpbZQXo9A) |
| `route-15-xy.mp3` | Route 15 — X / Y | [ANamw2Fs6VY](https://youtu.be/ANamw2Fs6VY) |
| `pont-hameau-b2w2.mp3` | Pont du Hameau — Noir / Blanc 2 | [Gju6j3f2xTc](https://youtu.be/Gju6j3f2xTc) |

## Grottes et montagnes

| Fichier | Piste | YouTube |
|---|---|---|
| `donjons-mysteres-1.mp3` | Pokémon Donjon Mystère : Explorateurs (piste 1) | [WKLBhjeN27o](https://youtu.be/WKLBhjeN27o) |
| `donjons-mysteres-2.mp3` | Pokémon Donjon Mystère : Explorateurs (piste 2) | [MvVwQ37VhkA](https://youtu.be/MvVwQ37VhkA) |

## Neige

| Fichier | Piste | YouTube |
|---|---|---|
| `route-216-nuit-dp.mp3` | Route 216 (nuit) — Diamant / Perle | [nayAS2WTMP0](https://youtu.be/nayAS2WTMP0) |

## Ligue

| Fichier | Piste | YouTube |
|---|---|---|
| `ligue-dp.mp3` | Ligue Pokémon — Diamant / Perle | [u83mX9tGG9E](https://youtu.be/u83mX9tGG9E) |

## Combats de dresseurs

| Fichier | Piste | YouTube |
|---|---|---|
| `battle-trainer-johto-hgss.mp3` | Combat ! Dresseur (Johto) — HeartGold / SoulSilver |  |
| `battle-trainer-kanto-hgss.mp3` | Combat ! Dresseur (Kanto) — HeartGold / SoulSilver |  |
| `battle-trainer-dp.mp3` | Combat ! Dresseur — Diamant / Perle |  |
| `battle-trainer-bw.mp3` | Combat ! Dresseur — Noir / Blanc |  |
| `battle-trainer-xy.mp3` | Combat ! Dresseur — X / Y |  |

## Champions d’Arène

| Fichier | Piste | YouTube |
|---|---|---|
| `battle-gym-kanto-hgss.mp3` | Combat ! Champion d’Arène (Kanto) — HeartGold / SoulSilver |  |
| `battle-gym-johto-hgss.mp3` | Combat ! Champion d’Arène (Johto) — HeartGold / SoulSilver |  |
| `battle-gym-oras.mp3` | Combat ! Champion d’Arène — Rubis Oméga / Saphir Alpha |  |
| `battle-gym-dp.mp3` | Combat ! Champion d’Arène — Diamant / Perle |  |
| `battle-gym-bw.mp3` | Combat ! Champion d’Arène — Noir / Blanc |  |
| `battle-gym-xy.mp3` | Combat ! Champion d’Arène — X / Y |  |
| `battle-gym-swsh.mp3` | Combat ! Champion d’Arène — Épée / Bouclier |  |
| `battle-gym-sv.mp3` | Combat ! Champion d’Arène — Écarlate / Violet |  |

## Conseil 4

| Fichier | Piste | YouTube |
|---|---|---|
| `battle-e4-oras.mp3` | Combat ! Conseil 4 — Rubis Oméga / Saphir Alpha |  |
| `battle-e4-dp.mp3` | Combat ! Conseil 4 — Diamant / Perle |  |
| `battle-e4-bw.mp3` | Combat ! Conseil 4 — Noir / Blanc |  |
| `battle-e4-xy.mp3` | Combat ! Conseil 4 — X / Y |  |
| `battle-e4-sm.mp3` | Combat ! Conseil 4 — Soleil / Lune |  |
| `battle-e4-sv.mp3` | Combat ! Conseil 4 — Écarlate / Violet |  |

## Maîtres

| Fichier | Piste | YouTube |
|---|---|---|
| `battle-champion-hgss.mp3` | Combat ! Maître (Peter) — HeartGold / SoulSilver |  |
| `battle-red-hgss.mp3` | Combat contre Red — HeartGold / SoulSilver |  |
| `battle-blue-frlg.mp3` | Combat final ! Rival (Blue) — Rouge Feu / Vert Feuille |  |
| `battle-champion-oras.mp3` | Combat ! Maître — Rubis Oméga / Saphir Alpha |  |
| `battle-cynthia-dp.mp3` | Combat ! Maîtresse (Cynthia) — Diamant / Perle | [DfJYs5boP9A](https://youtu.be/DfJYs5boP9A) |
| `battle-champion-bw.mp3` | Combat ! Maître (Goyah) — Noir / Blanc |  |
| `battle-iris-b2w2.mp3` | Combat ! Maîtresse Iris — Noire 2 / Blanche 2 |  |
| `battle-diantha-xy.mp3` | Combat ! Maîtresse (Dianthéa) — X / Y |  |
| `battle-kukui-sm.mp3` | Combat ! Prof. Euphorbe — Soleil / Lune |  |
| `battle-leon-swsh.mp3` | Combat ! Tarak — Épée / Bouclier |  |
| `battle-geeta-sv.mp3` | Combat ! Alisma — Écarlate / Violet |  |
| `battle-nemona-sv.mp3` | Combat ! Menzi — Écarlate / Violet |  |

## Chefs des méchants

| Fichier | Piste | YouTube |
|---|---|---|
| `battle-cyrus-dp.mp3` | Combat ! Chef de la Team Galaxie (Hélio) — Diamant / Perle | [SE5dBmWml34](https://youtu.be/SE5dBmWml34) · [-X_OBgeo59o](https://youtu.be/-X_OBgeo59o) · [mA6WXoiQi34](https://youtu.be/mA6WXoiQi34) |
| `battle-rocket-boss-hgss.mp3` | Combat ! Chef de la Team Rocket — HeartGold / SoulSilver |  |
| `battle-aqua-magma-leader-oras.mp3` | Combat ! Chef Aqua / Magma — Rubis Oméga / Saphir Alpha |  |
| `battle-ghetsis-bw.mp3` | Combat ! Ghetis — Noir / Blanc |  |
| `battle-lysandre-xy.mp3` | Combat ! Lysandre — X / Y |  |
| `battle-guzma-sm.mp3` | Combat ! Guzma — Soleil / Lune |  |

## Sbires

| Fichier | Piste | YouTube |
|---|---|---|
| `miroir-b-xd.mp3` | Miror B. — Pokémon XD | [WuhqoZvyntA](https://youtu.be/WuhqoZvyntA) |
| `battle-grunt-rocket-hgss.mp3` | Combat ! Team Rocket — HeartGold / SoulSilver |  |
| `battle-grunt-aqua-magma-oras.mp3` | Combat ! Team Aqua / Magma — Rubis Oméga / Saphir Alpha |  |
| `battle-grunt-galactic-dp.mp3` | Combat ! Team Galaxie — Diamant / Perle |  |
| `battle-grunt-plasma-bw.mp3` | Combat ! Team Plasma — Noir / Blanc |  |
| `battle-grunt-flare-xy.mp3` | Combat ! Team Flare — X / Y |  |
| `battle-grunt-skull-sm.mp3` | Combat ! Team Skull — Soleil / Lune |  |

## Rivaux

| Fichier | Piste | YouTube |
|---|---|---|
| `battle-rival-hgss.mp3` | Combat ! Rival — HeartGold / SoulSilver |  |
| `battle-rival-oras.mp3` | Combat ! Timmy — Rubis Oméga / Saphir Alpha |  |
| `battle-rival-dp.mp3` | Combat ! Rival — Diamant / Perle |  |
| `battle-rival-bw.mp3` | Combat ! Rival — Noir / Blanc |  |
| `battle-rival-b2w2.mp3` | Combat ! Rival — Noire 2 / Blanche 2 |  |
| `battle-rival-xy.mp3` | Combat ! Rival — X / Y |  |
| `battle-rival-sm.mp3` | Combat ! Rival — Soleil / Lune |  |
| `battle-rival-swsh.mp3` | Combat ! Rival — Épée / Bouclier |  |
| `battle-rival-sv.mp3` | Combat ! Rival — Écarlate / Violet |  |

