# 🚀 Déploiement Rapide avec Railway + MongoDB

## Étapes en 5 minutes

### 1. 📁 Créer le repository GitHub
```bash
# Sur GitHub, créer un nouveau repo puis :
git remote add origin https://github.com/ton-username/anime-quiz.git
git push -u origin master
```

### 2. 🚂 Créer le projet Railway
1. Aller sur [Railway.app](https://railway.app)
2. Se connecter avec GitHub
3. Cliquer "New Project" → "Deploy from GitHub repo"
4. Sélectionner votre repository `anime-quiz`

### 3. 🗄️ Ajouter MongoDB
1. Dans votre projet Railway, cliquer "New"
2. Sélectionner "Database" → "MongoDB"
3. Attendre le déploiement (1-2 min)

### 4. ⚙️ Configurer les variables
Dans le service web (pas MongoDB), ajouter :
```
MONGODB_URI=<copier MONGO_URL du service MongoDB>
CLIENT_URL=https://ton-app.railway.app
NODE_ENV=production
```

### 5. 🎉 C'est tout !
- Railway déploie automatiquement
- L'URL de votre app s'affiche dans "Deployments"
- Les services sont automatiquement connectés

## 🎮 Test rapide
1. Aller sur votre URL Railway
2. Cliquer "Panneau Admin"
3. Créer une salle avec des liens YouTube
4. Noter l'ID de la salle
5. Ouvrir 2 onglets et tester avec des noms différents

## 💡 Avantages Railway MongoDB
- ✅ Connexion privée (plus rapide)
- ✅ Pas de configuration réseau
- ✅ 1 GB gratuit inclus
- ✅ Gestion automatique
- ✅ Sauvegardes automatiques

## 🆘 En cas de problème
- Vérifier les logs dans Railway "Deployments"
- S'assurer que `MONGODB_URI` est bien copié du service MongoDB
- Les deux services doivent être dans le même projet Railway
