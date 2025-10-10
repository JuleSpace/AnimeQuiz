# Dockerfile pour Railway
FROM node:18-alpine

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers package.json
COPY package*.json ./
COPY client/package*.json ./client/

# Installer les dépendances du backend
RUN npm install

# Installer les dépendances du frontend
WORKDIR /app/client
RUN npm install

# Revenir au répertoire racine
WORKDIR /app

# Copier tout le code source
COPY . .

# Construire le frontend
WORKDIR /app/client
RUN npm run build

# Revenir au répertoire racine
WORKDIR /app

# Exposer le port
EXPOSE 5000

# Commande de démarrage
CMD ["npm", "start"]
