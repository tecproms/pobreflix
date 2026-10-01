// ====================================================================
// POBREFLIX — CONFIGURAÇÃO PM2 (PROCESS MANAGER)
// Comando para iniciar na VPS: pm2 start ecosystem.config.js
// ====================================================================
module.exports = {
  apps: [
    {
      name: 'pobreflix',
      script: 'server.js',
      instances: 1, // Servidor HTTP leve com proxy de streaming
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3050
      }
    }
  ]
};
