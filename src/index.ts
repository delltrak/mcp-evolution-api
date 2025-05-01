import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { config } from './config.js';
import { EvolutionApiService } from './services/evolutionApiService.js';
import 'dotenv/config';

// Inicializa o serviço da Evolution API
const evolutionService = new EvolutionApiService();

// Inicializa o aplicativo Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Conjunto de clientes conectados via SSE
const clients = new Set<Response>();

// Rota principal para verificação de saúde
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'running',
    message: 'MCP Evolution API is running',
    version: config.mcp.version
  });
});

// ===== IMPLEMENTAÇÃO DO MCP VIA SSE =====

// Rota SSE: clientes se conectam aqui para receber eventos MCP
app.get('/mcp/events', (req: Request, res: Response) => {
  // Cabeçalhos obrigatórios para SSE
  res.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.flushHeaders(); // envia os headers imediatamente

  // Adiciona este cliente ao conjunto
  clients.add(res);
  console.log(`🛰️ Cliente conectado (total: ${clients.size})`);

  // Envia um evento de boas-vindas para inicialização
  res.write(`event: welcome\n`);
  res.write(`data: ${JSON.stringify({
    jsonrpc: "2.0",
    method: "initialize",
    params: {
      serverInfo: {
        name: config.mcp.name,
        version: config.mcp.version
      }
    }
  })}\n\n`);

  // Envia a lista de ferramentas disponíveis automaticamente
  // após a conexão inicial
  setTimeout(() => {
    const toolsListMessage = {
      jsonrpc: "2.0",
      id: "auto-tools-list",
      result: {
        tools: [
          {
            name: "getApiStatus",
            description: "Verifica o status da Evolution API",
            parameters: {}
          },
          {
            name: "getInstanceStatus",
            description: "Verifica o status da instância do WhatsApp",
            parameters: {}
          },
          {
            name: "sendTextMessage",
            description: "Envia uma mensagem de texto",
            parameters: {
              type: "object",
              properties: {
                number: {
                  type: "string",
                  description: "Número do destinatário no formato internacional"
                },
                text: {
                  type: "string",
                  description: "Texto da mensagem a ser enviada"
                }
              },
              required: ["number", "text"]
            }
          },
          {
            name: "sendMedia",
            description: "Envia uma mídia (imagem, documento, vídeo, áudio)",
            parameters: {
              type: "object",
              properties: {
                number: {
                  type: "string",
                  description: "Número do destinatário no formato internacional"
                },
                url: {
                  type: "string",
                  description: "URL da mídia a ser enviada"
                },
                mediaType: {
                  type: "string",
                  enum: ["image", "document", "video", "audio"],
                  description: "Tipo de mídia"
                }
              },
              required: ["number", "url", "mediaType"]
            }
          }
        ]
      }
    };
    
    res.write(`event: tools/list\n`);
    res.write(`data: ${JSON.stringify(toolsListMessage)}\n\n`);
  }, 1000);

  // Envia heartbeat a cada 20 segundos para manter a conexão viva
  const heartbeat = setInterval(() => {
    res.write(`event: ping\n`);
    res.write(`data: {}\n\n`);
  }, 20 * 1000);

  // Remove o cliente quando ele desconectar
  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(res);
    console.log(`❌ Cliente desconectado (total: ${clients.size})`);
  });
});

// Rota para receber chamadas de ferramentas e outros eventos MCP
app.post('/mcp/send', async (req: Request, res: Response) => {
  console.log('Recebida requisição POST:', JSON.stringify(req.body));
  const message = req.body;
  
  // Processa a mensagem recebida
  let responseMessage;
  
  if (message.method === 'tools/call') {
    // Chamada de ferramenta
    const toolName = message.params.name;
    const toolArgs = message.params.parameters;
    
    try {
      let result;
      
      // Executa a ferramenta solicitada
      if (toolName === 'getApiStatus') {
        try {
          const apiInfo = await evolutionService.getApiInfo();
          result = {
            content: [{ 
              type: "text", 
              text: `Evolution API v${apiInfo.version} está rodando. Status: ${apiInfo.status}` 
            }]
          };
        } catch (error) {
          result = {
            content: [{ 
              type: "text", 
              text: `Erro ao conectar à Evolution API: ${(error as Error).message}` 
            }]
          };
        }
      } else if (toolName === 'getInstanceStatus') {
        try {
          const status = await evolutionService.getInstanceStatus();
          result = {
            content: [{ 
              type: "text", 
              text: `Status da instância: ${status.state || "Desconhecido"}` 
            }]
          };
        } catch (error) {
          result = {
            content: [{ 
              type: "text", 
              text: `Erro ao verificar status da instância: ${(error as Error).message}` 
            }]
          };
        }
      } else if (toolName === 'sendTextMessage') {
        try {
          await evolutionService.sendTextMessage(toolArgs);
          result = {
            content: [{ 
              type: "text", 
              text: `Mensagem enviada para ${toolArgs.number}: "${toolArgs.text}"` 
            }]
          };
        } catch (error) {
          result = {
            content: [{ 
              type: "text", 
              text: `Erro ao enviar mensagem: ${(error as Error).message}` 
            }]
          };
        }
      } else if (toolName === 'sendMedia') {
        try {
          await evolutionService.sendMedia({
            number: toolArgs.number,
            media: {
              url: toolArgs.url,
              mediaType: toolArgs.mediaType
            }
          });
          result = {
            content: [{ 
              type: "text", 
              text: `Mídia enviada com sucesso para ${toolArgs.number}` 
            }]
          };
        } catch (error) {
          result = {
            content: [{ 
              type: "text", 
              text: `Erro ao enviar mídia: ${(error as Error).message}` 
            }]
          };
        }
      } else {
        throw new Error(`Ferramenta '${toolName}' não implementada`);
      }
      
      responseMessage = {
        jsonrpc: "2.0",
        id: message.id,
        result: {
          result: result,
          isPartial: false
        }
      };
    } catch (err) {
      responseMessage = {
        jsonrpc: "2.0",
        id: message.id,
        error: {
          code: -32000,
          message: `Erro ao executar ferramenta: ${(err as Error).message}`
        }
      };
    }
  } else if (message.method === 'tools/list') {
    // Responde com a lista de ferramentas disponíveis
    responseMessage = {
      jsonrpc: "2.0",
      id: message.id,
      result: {
        tools: [
          {
            name: "getApiStatus",
            description: "Verifica o status da Evolution API",
            parameters: {}
          },
          {
            name: "getInstanceStatus",
            description: "Verifica o status da instância do WhatsApp",
            parameters: {}
          },
          {
            name: "sendTextMessage",
            description: "Envia uma mensagem de texto",
            parameters: {
              type: "object",
              properties: {
                number: {
                  type: "string",
                  description: "Número do destinatário no formato internacional"
                },
                text: {
                  type: "string",
                  description: "Texto da mensagem a ser enviada"
                }
              },
              required: ["number", "text"]
            }
          },
          {
            name: "sendMedia",
            description: "Envia uma mídia (imagem, documento, vídeo, áudio)",
            parameters: {
              type: "object",
              properties: {
                number: {
                  type: "string",
                  description: "Número do destinatário no formato internacional"
                },
                url: {
                  type: "string",
                  description: "URL da mídia a ser enviada"
                },
                mediaType: {
                  type: "string",
                  enum: ["image", "document", "video", "audio"],
                  description: "Tipo de mídia"
                }
              },
              required: ["number", "url", "mediaType"]
            }
          }
        ]
      }
    };
  } else {
    // Método não suportado
    responseMessage = {
      jsonrpc: "2.0",
      id: message.id,
      error: {
        code: -32601,
        message: "Método não encontrado"
      }
    };
  }
  
  // Retorna resposta para o cliente que fez a requisição
  res.status(200).json(responseMessage);
  
  // Opcionalmente, broadcast para todos os clientes SSE
  if (responseMessage) {
    // Determina o tipo de evento com base no método
    const eventType = message.method === 'tools/call' 
      ? 'tools/call' 
      : message.method === 'tools/list' 
        ? 'tools/list' 
        : 'response';
    
    for (const client of clients) {
      if (client !== res) { // Evita enviar de volta para o mesmo cliente
        client.write(`event: ${eventType}\n`);
        client.write(`data: ${JSON.stringify(responseMessage)}\n\n`);
      }
    }
  }
});

// Também adiciona a rota MCP na raiz para melhor compatibilidade
app.get('/sse', (req: Request, res: Response) => {
  // Simplesmente redireciona para o endpoint principal MCP
  res.redirect('/mcp/events');
});

// Inicia o servidor
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4899;
app.listen(PORT, () => {
  console.log(`🚀 MCP SSE server rodando na porta ${PORT}`);
  console.log(`📡 SSE endpoint: http://localhost:${PORT}/mcp/events`);
  console.log(`🛠️ API endpoint: http://localhost:${PORT}/mcp/send`);
}); 