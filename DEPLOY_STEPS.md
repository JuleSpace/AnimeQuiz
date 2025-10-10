# 🚀 Étapes de Déploiement Railway

## ✅ Étape 1 : Repository GitHub (Déjà fait)
Ton code est déjà commité et prêt.

## ✅ Étape 2 : URL MongoDB Railway (Déjà récupérée)
```
MONGODB_URI=mongodb://mongo:IbeSxXaAWBaHYfYprRddXQiXaKntEJOj@mongodb.railway.internal:27017
```

## 🚂 Étape 3 : Créer le projet Railway

### 3.1 Aller sur Railway
1. Aller sur [railway.app](https://railway.app)
2. Se connecter avec GitHub

### 3.2 Créer le projet
1. Cliquer "New Project"
2. Choisir "Deploy from GitHub repo"
3. Sélectionner votre repository `AnimeQuiz`
4. Railway va détecter automatiquement que c'est un projet Node.js

### 3.3 Ajouter MongoDB
1. Dans votre projet Railway, cliquer "New"
2. Sélectionner "Database" → "MongoDB"
3. Attendre le déploiement (1-2 minutes)

## ⚙️ Étape 4 : Configurer les variables

### 4.1 Variables pour le service web
Dans votre service web (pas MongoDB), aller dans "Variables" et ajouter :

```
MONGODB_URI=mongodb://mongo:IbeSxXaAWBaHYfYprRddXQiXaKntEJOj@mongodb.railway.internal:27017
CLIENT_URL=https://anime-quiz-production-XXXX.up.railway.app
NODE_ENV=production
PORT=5000
```

**Important :** Remplacer `anime-quiz-production-XXXX.up.railway.app` par l'URL réelle de votre app.

### 4.2 Obtenir l'URL de votre app
1. Dans votre service web, aller dans "Settings"
2. Section "Domains"
3. Copier l'URL générée par Railway
4. La coller dans `CLIENT_URL`

## 🎉 Étape 5 : Test

### 5.1 Vérifier le déploiement
1. Aller sur l'URL de votre app Railway
2. L'interface AnimeQuiz doit s'afficher

### 5.2 Tester le panneau admin
1. Cliquer "Panneau Admin"
2. Créer une nouvelle salle
3. Ajouter des liens YouTube
4. Noter l'ID de la salle généré

### 5.3 Tester le jeu
1. Ouvrir un nouvel onglet
2. Rejoindre la salle avec l'ID créé
3. Ouvrir un autre onglet avec un autre nom
4. Démarrer la partie et tester

## 🐛 En cas de problème

### Logs Railway
1. Dans Railway, aller dans "Deployments"
2. Cliquer sur le dernier déploiement
3. Voir les logs en temps réel

### Variables manquantes
- Vérifier que toutes les variables sont bien ajoutées
- S'assurer qu'il n'y a pas d'espaces dans les valeurs

### Connexion MongoDB
- Vérifier que le service MongoDB est bien déployé
- S'assurer que les deux services sont dans le même projet

## 🎯 Résultat attendu
- ✅ App accessible sur Railway
- ✅ Panneau admin fonctionnel
- ✅ Création de salles
- ✅ Ajout de liens musicaux
- ✅ Système de lobby
- ✅ Jeu multi-joueurs
- ✅ Correction automatique

## 📞 Support
Si tu as des problèmes :
1. Vérifier les logs Railway
2. Me montrer les erreurs
3. On débuggera ensemble !
