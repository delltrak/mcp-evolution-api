#!/usr/bin/env node

/**
 * Este script gera um arquivo .env adequado para uso com o Dokploy
 * com base nas entradas do usuário.
 */

const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Template padrão do arquivo .env
const envTemplate = `# Configurações do servidor MCP
PORT=4899
NODE_ENV=production
ENABLE_WEBSOCKET=true

# Configurações da Evolution API
EVOLUTION_API_URL={EVOLUTION_API_URL}
EVOLUTION_API_KEY={EVOLUTION_API_KEY}
EVOLUTION_API_INSTANCE={EVOLUTION_API_INSTANCE}

# Opções extras
LOG_LEVEL=info
`;

console.log('🚀 Gerador de configuração .env para MCP Evolution API');
console.log('===================================================');
console.log('Este assistente irá ajudá-lo a criar um arquivo .env para uso com Dokploy.');
console.log('');

// Perguntas para o usuário
const questions = [
  {
    name: 'EVOLUTION_API_URL',
    question: 'URL da Evolution API (ex: https://sua-api-evolution.com): ',
    default: 'https://seu-servidor-evolution-api.com'
  },
  {
    name: 'EVOLUTION_API_KEY',
    question: 'Chave API da Evolution API: ',
    default: 'sua-chave-api'
  },
  {
    name: 'EVOLUTION_API_INSTANCE',
    question: 'ID da instância na Evolution API: ',
    default: 'instancia-padrao'
  }
];

const answers = {};

// Função para fazer perguntas sequencialmente
function askQuestion(index) {
  if (index >= questions.length) {
    generateEnvFile();
    return;
  }

  const current = questions[index];
  
  rl.question(`${current.question} (${current.default}): `, (answer) => {
    answers[current.name] = answer.trim() || current.default;
    askQuestion(index + 1);
  });
}

// Função para gerar o arquivo .env
function generateEnvFile() {
  let envContent = envTemplate;
  
  // Substituir valores no template
  for (const key in answers) {
    envContent = envContent.replace(`{${key}}`, answers[key]);
  }
  
  // Caminho do arquivo .env
  const envPath = path.join(process.cwd(), '.env');
  
  // Verificar se o arquivo já existe
  if (fs.existsSync(envPath)) {
    rl.question('❗ Arquivo .env já existe. Sobrescrever? (s/n): ', (answer) => {
      if (answer.toLowerCase() === 's') {
        writeFile(envPath, envContent);
      } else {
        console.log('❌ Operação cancelada. O arquivo .env não foi modificado.');
        rl.close();
      }
    });
  } else {
    writeFile(envPath, envContent);
  }
}

// Função para escrever o arquivo
function writeFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Arquivo .env criado com sucesso em: ${filePath}`);
    console.log('\nConfigurações para Dokploy:');
    console.log('=======================');
    console.log(`URL da Evolution API: ${answers.EVOLUTION_API_URL}`);
    console.log(`Instância: ${answers.EVOLUTION_API_INSTANCE}`);
    console.log('\nLembre-se de:');
    console.log('- Remover .env do .gitignore');
    console.log('- Fazer commit do arquivo .env para o repositório (necessário para o Dokploy)');
    rl.close();
  } catch (error) {
    console.error(`❌ Erro ao criar arquivo .env: ${error.message}`);
    rl.close();
  }
}

// Iniciar o processo de perguntas
askQuestion(0); 