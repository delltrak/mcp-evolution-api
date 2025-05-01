#!/usr/bin/env node
import { config } from './config.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Exibe informações sobre o MCP Server
console.log(`
╔════════════════════════════════════════════════════╗
║            MCP SERVER PARA EVOLUTION API           ║
╠════════════════════════════════════════════════════╣
║ Versão: ${config.mcp.version}                             ║
║ Instância: ${config.evolutionApi.instanceId}        ║
╚════════════════════════════════════════════════════╝
`);
// Executa o arquivo principal (index.js)
import './index.js';
//# sourceMappingURL=cli.js.map