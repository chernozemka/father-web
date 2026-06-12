# syntax=docker/dockerfile:1

# --- Stage 1: build the static site ---
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies (cached unless package files change)
COPY package*.json ./
RUN npm ci

# Build the app
COPY . .
RUN npm run build

# --- Stage 2: serve with nginx ---
FROM nginx:1.27-alpine AS runtime

# SPA-aware nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Static build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
