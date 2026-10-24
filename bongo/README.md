# Bongo Stream

Overlay de stream façon Bongo Cat : un personnage tape **Q W E R** (le Q plus gros) et bouge la souris en même temps que toi,
même quand le jeu (LoL…) a le focus. À ajouter dans OBS en **Source navigateur** : `http://localhost:7373/` (800 × 500, fond transparent).

## Installer
Télécharge l'artefact `bongo-stream-windows` de la dernière construction dans l'onglet **Actions** du dépôt
(workflow « Bongo Stream (Windows) »), dézippe, lance `Bongo-Stream-Setup.exe` (ou la version portable).

## Ton personnage
Réglages → « Ouvrir le dossier », puis dépose des PNG transparents de **800 × 500**, alignés entre eux :
`body.png`, `hand-up.png`, `hand-1.png` … `hand-4.png`, `mouse-hand.png`, et en option `desk.png`, `keys.png`.
Une image absente est remplacée par le dessin par défaut. Dessine-les « à plat » : l'appli incline toute la scène (7° par défaut), comme le style Bongo.

## Développer
```
cd bongo
npm install
npm start
```
