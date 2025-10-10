# ⚙️ Configuration Variables Railway

## 🔍 Problème identifié
L'application essaie de se connecter à `localhost:27017` au lieu d'utiliser l'URL MongoDB Railway.

## ✅ Solution : Configurer les variables d'environnement

### 1. Aller dans Railway
1. Ouvrir votre projet Railway
2. Cliquer sur le **service web** (pas MongoDB)
3. Aller dans l'onglet **"Variables"**

### 2. Ajouter ces variables exactement comme ceci :

```
MONGODB_URI=mongodb://mongo:IbeSxXaAWBaHYfYprRddXQiXaKntEJOj@mongodb.railway.internal:27017
NODE_ENV=production
PORT=5000
CLIENT_URL=https://votre-app.railway.app
```

### 3. Obtenir votre URL Railway
1. Dans le service web, aller dans **"Settings"**
2. Section **"Domains"**
3. Copier l'URL (ex: `anime-quiz-production-xxxx.up.railway.app`)
4. Remplacer `votre-app.railway.app` par cette URL

### 4. Variables importantes
- ✅ `MONGODB_URI` : URL complète de votre MongoDB Railway
- ✅ `NODE_ENV=production` : Indique que l'app est en production
- ✅ `PORT=5000` : Port sur lequel l'app écoute
- ✅ `CLIENT_URL` : URL de votre app Railway (pour CORS)

## 🔧 Vérification

### Après avoir ajouté les variables :
1. Railway va automatiquement redémarrer l'application
2. Les logs devraient maintenant montrer :
   ```
   🔗 Tentative de connexion MongoDB: mongodb://***:***@mongodb.railway.internal:27017
   ✅ Connexion MongoDB réussie
   ```

### Test des endpoints :
- `https://votre-app.railway.app/health` → `{"status":"OK","database":"connected"}`
- `https://votre-app.railway.app/api/rooms` → `[]`

## 🚨 Erreurs courantes

### Variable MONGODB_URI manquante
```
❌ Erreur: connect ECONNREFUSED localhost:27017
✅ Solution: Ajouter MONGODB_URI dans Railway Variables
```

### URL incorrecte
```
❌ Erreur: Invalid connection string
✅ Solution: Vérifier que l'URL MongoDB est complète
```

### NODE_ENV manquante
```
❌ Erreur: App ne sert pas les fichiers statiques
✅ Solution: Ajouter NODE_ENV=production
```

## 📋 Checklist finale

- [ ] Service MongoDB déployé sur Railway
- [ ] Service Web déployé sur Railway
- [ ] Variable `MONGODB_URI` ajoutée (copiée du service MongoDB)
- [ ] Variable `NODE_ENV=production` ajoutée
- [ ] Variable `PORT=5000` ajoutée
- [ ] Variable `CLIENT_URL` ajoutée avec la bonne URL
- [ ] Application redéployée automatiquement
- [ ] Test `/health` fonctionne
- [ ] Test `/api/rooms` fonctionne

## 🎯 Résultat attendu
Une fois toutes les variables configurées, l'application devrait :
- Se connecter à MongoDB Railway
- Afficher l'interface web
- Permettre la création de salles
- Fonctionner complètement
