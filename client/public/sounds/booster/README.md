# Vrais sons du jeu pour l'ouverture des boosters

`index.json` dit quel son joue à quel moment. Une valeur peut être :
- un nom de fichier déposé dans ce dossier (mp3, ogg ou wav) ;
- un lien https direct vers un son ;
- vide : le son synthétisé reste.

Si un fichier listé est absent, le son synthétisé joue à sa place.

| Clé     | Moment                                        | Son choisi                                   |
|---------|-----------------------------------------------|----------------------------------------------|
| `crack` | chaque coup sur l'œuf                         | `chao-break.wav` (à déposer, voir plus bas)  |
| `chirp` | juste après chaque coup                       | « Chao! » (101soundboards, en lien direct)   |
| `rev`   | la charge, 7 fois de plus en plus aigu        | `spindash.wav` (à déposer)                   |
| `hatch` | l'éclosion                                    | `chao-pop.wav` (à déposer)                   |
| `rings` | juste après l'éclosion                        | synthétisé (pluie d'anneaux)                 |
| `happy` | la carte sort de l'œuf                        | « Chao x3 » (101soundboards, en lien direct) |
| `ring`  | la carte se retourne                          | synthétisé (anneau ramassé)                  |
| `laugh` | juste après                                   | « Hi! » (101soundboards, en lien direct)     |

## Fichiers à déposer ici

Ils viennent de l'archive « Sound Effects » de Sonic Adventure 2: Battle sur The Sounds Resource
(https://sounds.spriters-resource.com/media/assets/399/401965.zip). Copie-les ici en les renommant :

| Fichier de l'archive | Nom à donner |
|---|---|
| `Sound Effects/Chao Sounds/chao_sound_std_CHAO SOUNDS/Chao sound effects/016.Synth_MLT_chao_sound_std_break.wav` | `chao-break.wav` |
| `Sound Effects/Character Sound Effects/se_ch_sn_SONIC SHADOW AMY METAL/016.Synth_MLT_se_ch_sn_Spindash Charge without Ancient Light Begin.wav` | `spindash.wav` |
| `Sound Effects/Chao Sounds/chao_sound_std_CHAO SOUNDS/Chao sound effects/039.Synth_MLT_chao_sound_std_pop.wav` | `chao-pop.wav` |

Les cris de Chao sont lus directement depuis 101soundboards. Pour ne plus dépendre de ce site,
télécharge les mp3, dépose-les ici et remplace les liens par leurs noms de fichier.
