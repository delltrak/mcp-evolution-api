# Guia de Solução de Problemas - MCP Evolution API

Este guia fornece soluções para problemas comuns que você pode encontrar ao configurar e usar o MCP Evolution API.

## Problemas de Implantação com Docker e Dokploy

### Erro: Arquivo .env não encontrado

**Problema**: O Dokploy não consegue encontrar o arquivo .env necessário.

**Solução**:
1. Verifique se o arquivo `.env` existe na raiz do projeto
2. Certifique-se de que o `.env` não está listado no `.gitignore`
3. Confirme que o arquivo foi commitado para o repositório

### Erro: Diretório dist não encontrado

**Problema**: O Docker não está gerando corretamente o diretório `dist` durante o build.

**Solução**:
1. Verifique se o Dockerfile inclui o comando `npm run build`
2. Confirme que o script de build está definido corretamente no `package.json`
3. Se necessário, pré-compile o código antes de fazer o push com `npm run build`

### Erro: Falha na instalação de dependências

**Problema**: O npm falha durante a instalação de dependências com erros de peer dependencies.

**Solução**:
1. Verifique se o Dockerfile usa a flag `--legacy-peer-deps`
2. Tente executar o build localmente para identificar problemas específicos
3. Se necessário, ajuste as versões das dependências no `package.json`

### Erro: Importação do SDK falha

**Problema**: Erros relacionados à importação do SDK do MCP.

**Solução**:
1. Verifique se todos os imports usam a extensão `.js` (necessário para ESM)
2. Certifique-se de que o `"type": "module"` está definido no `package.json`
3. Confirme que está usando a versão correta do SDK MCP

## Problemas de Conexão e Comunicação

### Erro: Servidor não inicia na porta configurada

**Problema**: O servidor não está acessível na porta configurada.

**Solução**:
1. Verifique se a variável `PORT` está corretamente definida no `.env`
2. Confirme que o docker-compose.yml mapeia corretamente as portas
3. Verifique se a porta não está sendo usada por outro serviço

### Erro: Cliente MCP não consegue se conectar via SSE

**Problema**: Clientes como Claude não conseguem se conectar ao servidor MCP.

**Solução**:
1. Verifique se o formato de resposta SSE está correto (deve usar `event:` e `data:`)
2. Confirme que os headers HTTP estão configurados corretamente
3. Teste a conexão SSE usando uma ferramenta como `curl`:
   ```
   curl -N http://localhost:4899/
   ```

### Erro: Conexão com a Evolution API falha

**Problema**: O servidor não consegue se comunicar com a Evolution API.

**Solução**:
1. Verifique se as variáveis de ambiente da Evolution API estão configuradas corretamente:
   - `EVOLUTION_API_URL`
   - `EVOLUTION_API_KEY`
   - `EVOLUTION_API_INSTANCE`
2. Confirme que a Evolution API está acessível a partir do container
3. Verifique os logs do servidor para erros específicos

## Problemas de Funcionamento

### Erro: As ferramentas MCP não aparecem no cliente

**Problema**: O cliente MCP conecta, mas não mostra as ferramentas disponíveis.

**Solução**:
1. Verifique se a resposta ao método `tools/list` está formatada corretamente
2. Confirme que o servidor está enviando a mensagem de inicialização correta
3. Teste a conexão com uma ferramenta como Postman enviando uma requisição:
   ```
   POST http://localhost:4899/
   Content-Type: application/json
   
   {
     "jsonrpc": "2.0",
     "method": "tools/list",
     "id": 1
   }
   ```

### Erro: As chamadas de ferramenta falham

**Problema**: As chamadas às ferramentas via MCP retornam erros.

**Solução**:
1. Verifique os logs do servidor para ver o erro específico
2. Confirme que os parâmetros enviados estão corretos
3. Teste a ferramenta diretamente com uma requisição:
   ```
   POST http://localhost:4899/
   Content-Type: application/json
   
   {
     "jsonrpc": "2.0",
     "method": "tools/call",
     "id": 2,
     "params": {
       "name": "getApiStatus",
       "parameters": {}
     }
   }
   ```

## Verificando o Status do Servidor

Para verificar se o servidor está funcionando corretamente, acesse:

```
GET http://localhost:4899/health
```

Se o servidor estiver operacional, você receberá uma resposta JSON com informações sobre o status.

## Obtendo Mais Ajuda

Se você continuar enfrentando problemas, abra uma issue no repositório do projeto:
https://github.com/IntuitivePhella/mcp-evolution-api/issues 