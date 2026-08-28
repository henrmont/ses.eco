# --- Etapa 1: Build da aplicação ---
FROM node:24-alpine AS build
WORKDIR /app

# Copia arquivos de dependência
COPY package*.json ./
RUN npm ci --legacy-peer-deps

# Copia o restante do código e gera o build de produção
COPY . .
RUN npm run build -- --configuration production

# --- Etapa 2: Servidor de produção com Nginx ---
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Limpa o diretório padrão do Nginx
RUN rm -rf ./*

# Copia os arquivos gerados no build (Atenção ao nome do projeto!)
# Substitua 'NOME-DO-SEU-PROJETO' pelo name definido no seu angular.json
COPY --from=build /app/dist/eco.regulacao/browser ./

# Copia a configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]