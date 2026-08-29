# Frontend ERP Adapter Platform - React
FROM node:20-alpine

WORKDIR /app

# Copie des fichiers de dependances
COPY package.json package-lock.json* ./

# Installation des dependances
RUN npm install

# Copie du code source
COPY . .

# Exposition du port
EXPOSE 3000

# Demarrage de l'application React
CMD ["npm", "start"]
