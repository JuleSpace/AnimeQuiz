# Modèles 3D du mode Sonic Bonk

- `default.glb` : « RobotExpressive » de Tomás Laulhé (modifié par Don McCurdy), domaine public (CC0 1.0).
  Utilisé pour tous les persos, teinté à leur couleur.

## Mettre ton propre modèle pour un perso

Dépose un fichier `<id>.glb` ici : `sonic.glb`, `tails.glb`, `knuckles.glb`, `shadow.glb` ou `amy.glb`.
Il remplace automatiquement le modèle par défaut pour ce perso, sans toucher au code.

Le modèle doit être riggé (squelette) et contenir ses animations dans le même fichier.
Les animations sont reconnues par leur nom :

| Rôle | Noms reconnus (contient…) |
|---|---|
| Repos | idle, stand |
| Course | run, sprint |
| Marche | walk |
| Saut | jump, fall, air |
| Attaque | punch, attack, slash |
| K.O. | death, die |
| Victoire | dance, victory, wave, thumb |

La taille est ajustée automatiquement (2 m de haut), le perso doit regarder vers +Z.
Astuce : Mixamo (gratuit) rigge un modèle humanoïde et ajoute Idle / Run / Jump ; exporte en FBX,
puis convertis en .glb avec Blender (Fichier > Exporter > glTF 2.0, animations cochées).
