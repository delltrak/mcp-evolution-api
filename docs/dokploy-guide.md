# Guia de Implantação no Dokploy - MCP Evolution API

Este guia fornece instruções detalhadas para implantar o servidor MCP Evolution API no Dokploy, uma plataforma de hospedagem para Docker.

## Pré-requisitos

1. Uma conta no Dokploy
2. Acesso a um servidor Evolution API
3. Git instalado em sua máquina local

## Passo a Passo para Implantação

### 1. Preparação do Repositório

Clone o repositório e configure-o para o Dokploy:

```bash
# Clonar o repositório
git clone https://github.com/IntuitivePhella/mcp-evolution-api.git
cd mcp-evolution-api

# Gerar o arquivo .env através do assistente interativo
npm run setup

# Ou manualmente criar o arquivo .env
# IMPORTANTE: Certifique-se de que o arquivo .env está configurado com suas credenciais reais.
```

O script de configuração (`npm run setup`) irá solicitar:
- URL da Evolution API
- Chave API da Evolution API
- ID da instância WhatsApp

### 2. Remover .env do .gitignore

O Dokploy precisa do arquivo .env no repositório. Certifique-se de que o `.env` não está no `.gitignore`. Editamos isso para você no código, mas verifique novamente.

### 3. Verificar Configurações Docker

Verifique se o `docker-compose.yml` e o `Dockerfile` estão configurados corretamente:

```yaml
# docker-compose.yml deve ter:
version: '3.8'

services:
  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "4899:4899"
    expose:
      - "4899"
    environment:
      - NODE_ENV=production
      - PORT=4899
      - ENABLE_WEBSOCKET=true
      - EVOLUTION_API_URL=${EVOLUTION_API_URL}
      - EVOLUTION_API_KEY=${EVOLUTION_API_KEY}
      - EVOLUTION_API_INSTANCE=${EVOLUTION_API_INSTANCE}
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4899/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    volumes:
      - ./.env:/app/.env:ro
    networks:
      - mcp-network

networks:
  mcp-network:
    driver: bridge
```

### 4. Commit e Push para um Repositório

Commit as alterações no arquivo .env e outras configurações e envie para um repositório Git:

```bash
git add .
git commit -m "Configuração para Dokploy"
git push
```

### 5. Configuração no Dokploy

1. Acesse seu painel do Dokploy
2. Clique em "Adicionar Novo Serviço"
3. Selecione a opção GitHub/GitLab e conecte ao seu repositório
4. Configure o serviço:
   - Nome: `mcp-evolution-api`
   - Porta externa: `4899`
   - Porta interna: `4899`
   - Variáveis de ambiente: elas já estarão no arquivo .env
   - Opções de reinicialização: "Always" (recomendado)

### 6. Deploy

Clique em "Deploy" e aguarde o processo de build e implantação. O Dokploy irá:

1. Clonar o repositório
2. Construir a imagem Docker usando o Dockerfile
3. Iniciar o serviço com as configurações do docker-compose.yml

### 7. Verificação

Após o deploy, verifique se o serviço está funcionando corretamente:

1. Acesse `https://seu-dominio-dokploy.com/health` para verificar o status
2. A resposta deve ser um JSON com informações sobre o servidor MCP
3. Para testar a conexão SSE, use:
   ```bash
   curl -N https://seu-dominio-dokploy.com/
   ```

## Solução de Problemas Específicos do Dokploy

### Logs não aparecem

Se você não conseguir ver os logs no Dokploy:

1. Verifique a configuração de logging no Dokploy
2. Acesse o container via shell e verifique os logs:
   ```bash
   docker logs mcp-evolution-api
   ```

### Serviço não inicia

Se o serviço não iniciar:

1. Verifique se o buildpack Docker está selecionado no Dokploy
2. Confirme se o arquivo docker-compose.yml está na raiz do projeto
3. Verifique os logs de build para identificar falhas na construção da imagem

### Problemas de Conexão

Se o servidor estiver rodando, mas os clientes não conseguem se conectar:

1. Verifique se a porta 4899 está exposta corretamente
2. Confirme se o Dokploy está encaminhando corretamente o tráfego para a porta
3. Verifique as configurações de SSL/TLS se estiver usando HTTPS

## Atualização do Serviço

Para atualizar o serviço depois de fazer alterações:

1. Atualize seu código localmente
2. Execute `npm run setup` se houver alterações nas variáveis de ambiente
3. Commit e push para o repositório conectado ao Dokploy
4. No painel do Dokploy, clique em "Redeploy" para o serviço

## Backup e Restauração

O Dokploy oferece funcionalidades de backup e restauração:

1. Vá para a configuração do serviço no Dokploy
2. Clique em "Backup" para criar um snapshot do seu serviço
3. Para restaurar, selecione um backup anterior e clique em "Restaurar"

---

Para mais informações sobre a configuração do MCP Evolution API, consulte o [README principal](../README.md) e o [guia de solução de problemas](./troubleshooting.md). 