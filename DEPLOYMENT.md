# 🚀 Guide de Déploiement Railway

Ce guide vous explique comment déployer AnimeQuiz sur Railway étape par étape.

## 📋 Prérequis

1. Compte GitHub
2. Compte Railway (gratuit sur [railway.app](https://railway.app))
3. Base de données MongoDB (MongoDB Atlas gratuit)

## 🗄️ Configuration de MongoDB Atlas

### 1. Créer un cluster MongoDB
1. Aller sur [MongoDB Atlas](https://cloud.mongodb.com)
2. Créer un compte gratuit
3. Créer un nouveau cluster (choisir la région la plus proche)
4. Attendre que le cluster soit créé (2-3 minutes)

### 2. Configurer l'accès réseau
1. Dans le menu "Network Access"
2. Cliquer "Add IP Address"
3. Choisir "Allow Access from Anywhere" (0.0.0.0/0)
4. Confirmer

### 3. Créer un utilisateur de base de données
1. Dans le menu "Database Access"
2. Cliquer "Add New Database User"
3. Créer un utilisateur avec nom d'utilisateur et mot de passe
4. Choisir "Read and write to any database"
5. Confirmer

### 4. Obtenir la chaîne de connexion
1. Dans le menu "Clusters"
2. Cliquer "Connect" sur votre cluster
3. Choisir "Connect your application"
4. Copier la chaîne de connexion (remplacer `<password>` par votre mot de passe)

## 🚂 Déploiement sur Railway

### 1. Préparer le repository
1. Créer un nouveau repository GitHub
2. Pousser tout le code du projet
3. S'assurer que tous les fichiers sont bien présents

### 2. Créer un projet Railway
1. Aller sur [Railway.app](https://railway.app)
2. Se connecter avec GitHub
3. Cliquer "New Project"
4. Choisir "Deploy from GitHub repo"
5. Sélectionner votre repository AnimeQuiz
6. Railway va automatiquement détecter que c'est un projet Node.js

### 3. Configuration des variables d'environnement
Dans Railway, aller dans l'onglet "Variables" et ajouter :

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/animequiz
CLIENT_URL=https://votre-app.railway.app
NODE_ENV=production
PORT=5000
```

**Important** : Remplacer :
- `username` et `password` par vos identifiants MongoDB Atlas
- `cluster` par le nom de votre cluster
- `votre-app.railway.app` par l'URL fournie par Railway

### 4. Déploiement automatique
1. Railway va automatiquement construire et déployer votre application
2. Le processus prend 2-5 minutes
3. Vous verrez l'URL de votre application dans l'onglet "Deployments"

### 5. Configuration du domaine personnalisé (optionnel)
1. Dans l'onglet "Settings" de votre projet
2. Section "Domains"
3. Ajouter un domaine personnalisé si vous en avez un

## 🔧 Configuration finale

### 1. Tester l'application
1. Aller sur l'URL de votre application Railway
2. Vérifier que l'interface se charge correctement
3. Tester le panneau admin

### 2. Créer votre première salle
1. Cliquer sur "Panneau Admin"
2. Créer une nouvelle salle
3. Ajouter quelques liens musicaux (YouTube, SoundCloud, etc.)
4. Noter l'ID de la salle généré

### 3. Tester le jeu
1. Ouvrir un nouvel onglet
2. Rejoindre la salle avec l'ID créé
3. Ouvrir un autre onglet et rejoindre avec un autre nom
4. Démarrer une partie et tester le système

## 🐛 Résolution de problèmes courants

### Erreur de connexion MongoDB
- Vérifier que l'IP 0.0.0.0/0 est autorisée dans MongoDB Atlas
- Vérifier que le nom d'utilisateur et mot de passe sont corrects
- S'assurer que la chaîne de connexion est bien formatée

### Erreur CORS
- Vérifier que `CLIENT_URL` correspond exactement à l'URL Railway
- S'assurer qu'il n'y a pas d'espace ou caractère invisible

### Application qui ne se lance pas
- Vérifier les logs dans Railway (onglet "Deployments")
- S'assurer que le port 5000 est bien configuré
- Vérifier que toutes les dépendances sont installées

### Audio qui ne se lance pas
- Vérifier que les liens YouTube sont publics
- Tester les liens dans un navigateur
- S'assurer que les liens sont au bon format

## 📊 Monitoring et logs

### Voir les logs en temps réel
1. Dans Railway, aller dans l'onglet "Deployments"
2. Cliquer sur votre déploiement actuel
3. Voir les logs en temps réel

### Métriques de performance
1. Railway fournit des métriques de base
2. Pour plus de détails, considérer des services comme New Relic ou DataDog

## 🔄 Mise à jour de l'application

### Déploiement automatique
- Railway déploie automatiquement à chaque push sur la branche principale
- Pas besoin d'action manuelle

### Déploiement manuel
1. Faire vos modifications localement
2. Tester avec `npm run dev`
3. Pousser sur GitHub
4. Railway déploiera automatiquement

## 💰 Coûts

### Railway
- Plan gratuit : $5 de crédit par mois
- Suffisant pour des applications de test
- Pay-as-you-go pour plus d'usage

### MongoDB Atlas
- Plan gratuit M0 : 512 MB de stockage
- Suffisant pour des milliers de parties
- Pas de limite de temps

## 🎯 Optimisations

### Performance
- Activer la compression gzip dans Express
- Utiliser un CDN pour les assets statiques
- Optimiser les images et fichiers audio

### Sécurité
- Utiliser HTTPS (automatique avec Railway)
- Valider toutes les entrées utilisateur
- Limiter le taux de requêtes

## 📞 Support

En cas de problème :
1. Vérifier les logs Railway
2. Consulter la documentation Railway
3. Vérifier le statut des services Railway
4. Contacter le support si nécessaire

---

🎉 **Félicitations !** Votre application AnimeQuiz est maintenant déployée et prête à être utilisée !
