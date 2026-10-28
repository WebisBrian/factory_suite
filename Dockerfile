# --- Build : export statique Next.js (dossier out/) ---
FROM node:22-alpine AS build
WORKDIR /app

# Dossier de travail indiqué aux utilisateurs dans le Hub (inliné au build).
ARG NEXT_PUBLIC_FACTORY_DATA_DIR=""
ENV NEXT_PUBLIC_FACTORY_DATA_DIR=$NEXT_PUBLIC_FACTORY_DATA_DIR
ENV NEXT_TELEMETRY_DISABLED=1

COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# --- Run : fichiers statiques servis par nginx, aucun serveur Node ---
FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/out /usr/share/nginx/html
EXPOSE 80
