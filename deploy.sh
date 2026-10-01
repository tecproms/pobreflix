#!/usr/bin/env bash
# ====================================================================
# POBREFLIX — SCRIPT DE DEPLOY E ATUALIZAÇÃO AUTOMÁTICA EM VPS
# Compatível com Ubuntu 20.04+, 22.04+, 24.04+ e Debian 11+
# ====================================================================
set -e

echo "===================================================="
echo "🚀 INICIANDO DEPLOY DO POBREFLIX NA VPS"
echo "===================================================="

# 1. Verificar se Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "📦 Node.js não encontrado. Instalando Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js já instalado: $(node -v)"
fi

# 2. Criar pastas necessárias
mkdir -p data public/uploads/banners

# 3. Verificar permissões
chmod -R 755 data public/uploads

# 4. Perguntar método de inicialização ou usar PM2 como padrão se disponível
if command -v pm2 &> /dev/null; then
    echo "🔄 Reiniciando serviço com PM2..."
    pm2 restart ecosystem.config.js || pm2 start ecosystem.config.js
    pm2 save
    echo "✅ PobreFlix ativo com PM2!"
elif [ -f "docker-compose.yml" ] && command -v docker &> /dev/null; then
    echo "🐳 Iniciando com Docker Compose..."
    sudo docker compose up -d --build
    echo "✅ PobreFlix ativo com Docker Compose!"
else
    echo "📦 Instalando PM2 globalmente..."
    sudo npm install -g pm2
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup || true
    echo "✅ PobreFlix configurado e ativo com PM2!"
fi

echo "===================================================="
echo "🎉 DEPLOY CONCLUÍDO COM SUCESSO!"
echo "🌐 Acesse: http://$(curl -s ifconfig.me || echo 'IP-DA-SUA-VPS'):3050"
echo "🔑 Login Master: tecpro@gmail.com | Senha: 53915030"
echo "===================================================="
