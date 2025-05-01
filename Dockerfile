FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar todas as dependências (incluindo devDependencies para build)
RUN npm install

# Copiar código fonte
COPY . .

# Compilar o código
RUN npm run build

# Remover devDependencies e instalar apenas dependências de produção
RUN npm ci --only=production

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production

# Expor a porta para WebSocket
EXPOSE 3000

# Comando para iniciar o servidor
CMD ["node", "dist/index.js"] 