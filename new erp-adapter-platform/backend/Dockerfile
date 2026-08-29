# Backend ERP Adapter Platform - NestJS
FROM node:20-slim

WORKDIR /app

# Installation des dependances systeme pour Prisma
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Copie des fichiers de dependances
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Installation des dependances
RUN npm install

# Generation du client Prisma
RUN npx prisma generate

# Copie du code source
COPY . .

# Exposition du port
EXPOSE 3000

# Script de demarrage avec migration automatique
CMD ["sh", "-c", "npx prisma migrate deploy && npm run start:dev"]
