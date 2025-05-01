FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies para build)
RUN npm install --legacy-peer-deps

# Copiar código fonte
COPY . .

# Limpar cache do npm e reinstalar dependências
RUN npm cache clean --force && \
    rm -rf node_modules && \
    npm install --legacy-peer-deps

# Compilar o código
RUN npm run build

# Remover devDependencies e instalar apenas dependências de produção
RUN npm ci --only=production --legacy-peer-deps

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=4899
ENV ENABLE_WEBSOCKET=true

# Expor a porta para WebSocket
EXPOSE 4899

# Comando para iniciar o servidor
CMD ["node", "dist/index.js"] 