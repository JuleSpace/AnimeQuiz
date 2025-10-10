# 🔧 Problème MongoDB Railway - Solution

## ❌ Erreur actuelle
```
❌ Erreur connexion MongoDB: getaddrinfo ENOTFOUND mongodb.railway.internal
```

## 🔍 Cause du problème
L'URL MongoDB dans Railway n'est pas correctement configurée. Le nom d'hôte `mongodb.railway.internal` n'est pas trouvé.

## ✅ Solution : Vérifier l'URL MongoDB

### 1. Aller dans Railway
1. Ouvrir ton projet Railway
2. Cliquer sur le **service MongoDB** (pas le service web)
3. Aller dans l'onglet **"Variables"**

### 2. Copier la bonne variable
Tu devrais voir une variable comme :
- `MONGO_URL` (pas `MONGODB_URI`)
- Ou `MONGODB_URI`

### 3. Format correct de l'URL
L'URL devrait ressembler à :
```
mongodb://mongo:motdepasse@containers-us-west-xxx.railway.app:xxxxx
```
ou
```
mongodb://mongo:motdepasse@mongodb.railway.internal:27017
```

### 4. Configurer dans le service web
1. Aller dans le **service web** (pas MongoDB)
2. Variables → Ajouter/Modifier :
```
MONGODB_URI=<URL_COMPLETE_COPIEE_DU_SERVICE_MONGODB>
NODE_ENV=production
PORT=5000
CLIENT_URL=https://amq-maisparmoiwesh.up.railway.app
```

## 🔧 Alternative : Utiliser MONGO_URL

Si Railway génère `MONGO_URL` au lieu de `MONGODB_URI`, modifions le code :

### Option 1: Changer la variable
Dans Railway, utiliser `MONGO_URL` au lieu de `MONGODB_URI`

### Option 2: Ajouter les deux
```
MONGO_URL=<URL_FROM_MONGODB_SERVICE>
MONGODB_URI=<URL_FROM_MONGODB_SERVICE>
```

## 🎯 Vérification

Après correction, les logs devraient afficher :
```
🔗 Tentative de connexion MongoDB: mongodb://***:***@containers-us-west-xxx.railway.app:xxxxx
✅ Connexion MongoDB réussie
```

## 🚨 Si le problème persiste

### Vérifier les services
1. S'assurer que le service MongoDB est bien déployé
2. Vérifier qu'il n'est pas en erreur
3. Les deux services doivent être dans le même projet Railway

### URL alternative
Parfois Railway génère des URLs avec des domaines différents :
- `containers-us-west-xxx.railway.app`
- `containers-us-east-xxx.railway.app`
- `mongodb.railway.internal`

Utilise toujours celle fournie par Railway dans les variables du service MongoDB.
