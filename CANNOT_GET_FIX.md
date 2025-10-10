# ❌ Erreur "Cannot GET" - Solution

## 🔍 Problème
Quand vous allez sur le site Railway, vous voyez "Cannot GET" au lieu de l'interface AnimeQuiz.

## 🎯 Causes possibles

### 1. Build frontend échoué
Le dossier `client/build` n'existe pas ou est vide.

### 2. Variables d'environnement manquantes
`NODE_ENV=production` n'est pas défini.

### 3. Fichiers statiques non servis
Le serveur ne trouve pas les fichiers React.

## ✅ Solutions

### Solution 1: Vérifier les variables Railway
Dans Railway → Service Web → Variables, ajouter :
```
NODE_ENV=production
MONGODB_URI=mongodb://mongo:IbeSxXaAWBaHYfYprRddXQiXaKntEJOj@mongodb.railway.internal:27017
PORT=5000
CLIENT_URL=https://votre-app.railway.app
```

### Solution 2: Vérifier les logs Railway
1. Aller dans Railway → Deployments
2. Cliquer sur le dernier déploiement
3. Vérifier les logs :
   - ✅ `Build completed successfully`
   - ✅ `Dossier client/build trouvé`
   - ✅ `Serveur démarré sur le port 5000`

### Solution 3: Test des endpoints
Tester ces URLs :
- `https://votre-app.railway.app/health` → Doit retourner JSON
- `https://votre-app.railway.app/api/rooms` → Doit retourner `[]`
- `https://votre-app.railway.app/` → Doit afficher l'interface

### Solution 4: Redéployer
1. Dans Railway, aller dans Deployments
2. Cliquer "Redeploy" sur le dernier déploiement
3. Attendre la fin du processus

## 🔧 Debug avancé

### Vérifier le build local
```bash
cd client
npm run build
ls -la build/
```

### Vérifier la structure des fichiers
Le dossier `client/build` doit contenir :
- `index.html`
- `static/css/`
- `static/js/`

### Logs à surveiller
```
✅ Build completed successfully
✅ Dossier client/build trouvé
✅ Connexion MongoDB réussie
🚀 Serveur démarré sur le port 5000
```

## 🚨 Si rien ne marche

### Option 1: Rebuild complet
1. Supprimer le service web Railway
2. Recréer le service depuis GitHub
3. Reconfigurer toutes les variables
4. Redéployer

### Option 2: Vérifier le repository
1. S'assurer que tous les fichiers sont poussés sur GitHub
2. Vérifier que le `Dockerfile` est présent
3. Vérifier que `package.json` est correct

## 🎯 Résultat attendu
Après correction, vous devriez voir :
- Interface AnimeQuiz complète
- Bouton "Panneau Admin" fonctionnel
- Pas d'erreur "Cannot GET"
