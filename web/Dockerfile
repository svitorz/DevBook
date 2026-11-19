# Build de produção do front, servido por nginx.

# 1) build: vue-tsc + vite build -> /app/dist
#    node:24-slim (glibc), não alpine: o package-lock foi gerado em glibc e os
#    binários nativos opcionais do bundler podem não vir para musl.
FROM node:24-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# A URL da API é embutida no JS no build. "/api" = mesma origem; o nginx
# encaminha para o container da API (ver nginx/default.conf.template).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# 2) runtime: só os arquivos estáticos + nginx
FROM nginx:1.27-alpine
# A imagem oficial passa os *.template por envsubst ao iniciar (usa API_UPSTREAM).
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
