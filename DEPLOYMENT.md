# 🚀 Guide de Déploiement Railway

Ce guide vous explique comment déployer AnimeQuiz sur Railway étape par étape.

## 📋 Prérequis

1. Compte GitHub
2. Compte Railway (gratuit sur [railway.app](https://railway.app))
3. Base de données MongoDB (MongoDB Atlas gratuit)

## 🗄️ Configuration de MongoDB avec Railway

### 1. Ajouter MongoDB à votre projet Railway
1. Dans votre projet Railway, cliquer sur "New"
2. Sélectionner "Database" puis "MongoDB"
3. Railway va automatiquement créer une instance MongoDB
4. Attendre que le service soit déployé (1-2 minutes)

### 2. Obtenir la chaîne de connexion
1. Cliquer sur votre service MongoDB
2. Aller dans l'onglet "Variables"
3. Copier la variable `MONGO_URL` ou `MONGODB_URI`
4. Cette URL contient déjà les identifiants et la configuration

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
Dans Railway, aller dans l'onglet "Variables" de votre service web et ajouter :

```
MONGODB_URI=<copier depuis le service MongoDB Railway>
CLIENT_URL=https://votre-app.railway.app
NODE_ENV=production
PORT=5000
```

**Important** : 
- Copier directement la variable `MONGO_URL` du service MongoDB Railway
- Remplacer `votre-app.railway.app` par l'URL fournie par Railway
- Railway gère automatiquement la connexion entre les services

### 4. Déploiement automatique
1. Railway va automatiquement construire et déployer votre application
2. Le processus prend 2-5 minutes
3. Vous verrez l'URL de votre application dans l'onglet "Deployments"
4. Les services MongoDB et Web sont automatiquement connectés

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
- Vérifier que le service MongoDB est bien déployé sur Railway
- Copier correctement la variable `MONGO_URL` du service MongoDB
- S'assurer que les deux services (web et MongoDB) sont dans le même projet Railway

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

### MongoDB Railway
- Service intégré gratuit avec Railway
- 1 GB de stockage inclus
- Connexion privée entre services (plus rapide et sécurisé)
- Pas de configuration réseau nécessaire

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
