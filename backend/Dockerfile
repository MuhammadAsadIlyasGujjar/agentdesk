# ---------- Stage 1: build ----------
# Multi-stage build: pehle TypeScript compile karo, phir sirf JS ship karo.
FROM node:22-alpine AS build
WORKDIR /app

# package.json pehle copy karte hain taake npm ci ki docker layer cache ho jaye
COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Stage 2: runtime ----------
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=build /app/dist ./dist

EXPOSE 3000
CMD ["node", "dist/main.js"]
