# 🎵 AnimeQuiz - Système de Quiz Musical

Un système de quiz musical interactif avec lobby et correction automatique, déployable sur Railway.

## 🚀 Fonctionnalités

- **Lobby System** : Les joueurs peuvent rejoindre une salle avec un nom d'utilisateur
- **Démarrage de partie** : Le premier joueur peut lancer la partie quand il y a au moins 2 joueurs
- **Quiz musical** : Lecture d'extraits musicaux avec système de réponse
- **Correction automatique** : Les joueurs corrigent mutuellement leurs réponses
- **Panneau admin** : Gestion des salles et ajout de liens musicaux
- **Temps réel** : Communication via WebSocket pour une expérience fluide

## 🛠️ Technologies

- **Backend** : Node.js, Express, Socket.IO
- **Frontend** : React, Styled Components
- **Base de données** : MongoDB
- **Déploiement** : Railway

## 📦 Installation

### Prérequis
- Node.js (version 16+)
- MongoDB (local ou cloud)
- Compte Railway

### Installation locale

1. Cloner le projet
```bash
git clone <votre-repo>
cd AnimeQuiz
```

2. Installer les dépendances
```bash
npm run install-all
```

3. Configurer l'environnement
```bash
cp env.example .env
# Modifier les variables dans .env
```

4. Démarrer en mode développement
```bash
npm run dev
```

L'application sera accessible sur :
- Frontend : http://localhost:3000
- Backend : http://localhost:5000

## 🚀 Déploiement sur Railway

### 1. Préparer le projet
```bash
npm run build
```

### 2. Créer un projet Railway
1. Aller sur [Railway.app](https://railway.app)
2. Créer un nouveau projet
3. Connecter votre repository GitHub

### 3. Configuration des variables d'environnement
Dans Railway, ajouter ces variables :
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/animequiz
CLIENT_URL=https://votre-app.railway.app
NODE_ENV=production
```

### 4. Base de données MongoDB
- Créer un cluster MongoDB Atlas (gratuit)
- Configurer l'accès réseau (0.0.0.0/0 pour Railway)
- Créer un utilisateur avec les permissions de lecture/écriture

## 🎮 Utilisation

### Pour les joueurs
1. Aller sur l'URL de l'application
2. Entrer un nom d'utilisateur et l'ID de la salle
3. Attendre qu'un autre joueur rejoigne
4. Le premier joueur peut démarrer la partie
5. Écouter les musiques et répondre
6. Corriger les réponses des autres joueurs
7. Voir les résultats finaux

### Pour les administrateurs
1. Cliquer sur "Panneau Admin"
2. Créer une nouvelle salle
3. Ajouter des liens musicaux (YouTube, SoundCloud, etc.)
4. Donner l'ID de la salle aux joueurs

## 🔧 Configuration

### Variables d'environnement
- `PORT` : Port du serveur (défaut: 5000)
- `MONGODB_URI` : URL de connexion MongoDB
- `CLIENT_URL` : URL du frontend (pour CORS)

### Structure des salles
```json
{
  "name": "Nom de la salle",
  "description": "Description optionnelle",
  "musicLinks": [
    "https://youtube.com/watch?v=...",
    "https://soundcloud.com/..."
  ]
}
```

## 📁 Structure du projet

```
AnimeQuiz/
├── client/                 # Frontend React
│   ├── public/
│   ├── src/
│   │   ├── components/     # Composants React
│   │   └── App.js         # Application principale
│   └── package.json
├── server.js              # Serveur Express
├── package.json           # Dépendances backend
├── railway.json          # Configuration Railway
└── README.md
```

## 🐛 Résolution de problèmes

### Erreur de connexion MongoDB
- Vérifier l'URL de connexion
- S'assurer que l'IP est autorisée (0.0.0.0/0 pour Railway)

### Problèmes de CORS
- Vérifier que `CLIENT_URL` correspond à l'URL de déploiement

### Audio qui ne se lance pas
- Vérifier que les liens sont accessibles publiquement
- Tester les liens dans un navigateur

## 📝 Scripts disponibles

- `npm start` : Démarrer en production
- `npm run dev` : Développement avec hot reload
- `npm run build` : Construire le frontend
- `npm run install-all` : Installer toutes les dépendances

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature
3. Commit vos changements
4. Push vers la branche
5. Ouvrir une Pull Request

## 📄 Licence

MIT License - voir le fichier LICENSE pour plus de détails.

## 🎯 Roadmap

- [ ] Support de plus de formats audio
- [ ] Système de thèmes visuels
- [ ] Statistiques de parties
- [ ] Mode spectateur
- [ ] Chat intégré
- [ ] Système de tournois
