# STAGE 1: Bauen
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build -- --configuration production

# STAGE 2: Servieren
FROM nginx:alpine
# Kopiere das fertige Angular-Paket in den Webserver
# ACHTUNG: 'recipe-manager' muss exakt so heißen wie in deiner angular.json (outputPath)
# Meistens dist/recipe-manager/browser oder dist/recipe-manager
COPY --from=build /app/dist/recipe-manager/browser /usr/share/nginx/html

# Kopiere unsere Nginx Config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
