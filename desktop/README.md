# Poké Prairie : appli de bureau

Un bandeau toujours visible au-dessus de la barre des tâches, qui affiche la page `bullys-lair.dev/#prairie`.
Même compte et même sauvegarde que le site. Hors ligne, le jeu continue (service worker du site + sauvegarde locale)
et se resynchronise au retour du réseau.

## Télécharger
GitHub construit l'appli à chaque modification du dossier `desktop/` :
https://github.com/JuleSpace/AnimeQuiz/releases/tag/prairie-latest

- `Poke-Prairie-Setup.exe` : installation en un clic.
- `Poke-Prairie-portable.exe` : sans installation.

Windows peut afficher « éditeur inconnu » (l'appli n'est pas signée) : « Informations complémentaires » puis « Exécuter quand même ».

## Construire soi-même
```
cd desktop
npm install
npm start        # lancer en test
npm run dist     # fabriquer les .exe dans desktop/release
```
`PRAIRIE_URL=http://localhost:3000/#prairie npm start` pointe l'appli sur un serveur local.

## Utilisation
- Clic sur l'icône près de l'horloge : afficher / masquer. Clic droit : menu (premier plan, lancement au démarrage, quitter).
- ▴ ouvre le panneau complet (Pokédex, boîte, boutique), ▾ le replie en bandeau.
