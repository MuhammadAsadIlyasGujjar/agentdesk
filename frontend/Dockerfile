# ---------- Stage 1: Angular build ----------
FROM node:22-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ---------- Stage 2: nginx serve ----------
FROM nginx:alpine
# Angular ka application builder output dist/<project>/browser mein deta hai
COPY --from=build /app/dist/agentdesk/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
