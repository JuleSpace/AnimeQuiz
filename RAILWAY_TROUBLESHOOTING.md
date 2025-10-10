# 🔧 Dépannage Railway

## ❌ Erreur "Healthcheck failure"

### Problème
Le déploiement échoue au niveau du healthcheck, même si le build réussit.

### Solutions

#### 1. Vérifier les variables d'environnement
S'assurer que toutes les variables sont correctement configurées :
```
MONGODB_URI=mongodb://mongo:xxx@mongodb.railway.internal:27017
CLIENT_URL=https://votre-app.railway.app
NODE_ENV=production
PORT=5000
```

#### 2. Vérifier la connexion MongoDB
- S'assurer que le service MongoDB est déployé
- Copier la variable `MONGO_URL` du service MongoDB
- Les deux services doivent être dans le même projet

#### 3. Vérifier les logs
1. Aller dans Railway > Deployments
2. Cliquer sur le dernier déploiement
3. Voir les logs pour identifier l'erreur

#### 4. Tester manuellement
Une fois déployé, tester :
- `https://votre-app.railway.app/health` → doit retourner `{"status":"OK"}`
- `https://votre-app.railway.app/api/rooms` → doit retourner `[]`

## 🔍 Vérifications courantes

### Variables manquantes
```
❌ MONGODB_URI manquante → App ne peut pas se connecter à la DB
❌ NODE_ENV manquante → App ne sait pas qu'elle est en production
❌ CLIENT_URL incorrecte → Problèmes de CORS
```

### Problèmes de build
```
❌ Dépendances manquantes → Vérifier package.json
❌ Erreurs de compilation → Vérifier les logs de build
❌ Dockerfile incorrect → Vérifier la structure
```

### Problèmes de connexion
```
❌ MongoDB non accessible → Vérifier le service DB
❌ Port incorrect → Vérifier PORT=5000
❌ URL incorrecte → Vérifier CLIENT_URL
```

## 🚀 Solutions rapides

### Redéployer
1. Dans Railway, aller dans Deployments
2. Cliquer "Redeploy" sur le dernier déploiement
3. Attendre la fin du processus

### Réinitialiser les variables
1. Aller dans Settings > Variables
2. Supprimer toutes les variables
3. Les rajouter une par une
4. Redéployer

### Vérifier les services
1. S'assurer que le service web est déployé
2. S'assurer que le service MongoDB est déployé
3. Les deux doivent être dans le même projet

## 📞 Support

Si le problème persiste :
1. Copier les logs d'erreur
2. Vérifier que toutes les étapes du DEPLOY_STEPS.md sont suivies
3. Me montrer les erreurs pour débugger ensemble
