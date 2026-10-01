#!/usr/bin/env bash
# ====================================================================
# POBREFLIX — SCRIPT DE ATIVAÇÃO DE DOMÍNIO E SSL HTTPS (CERTBOT)
# Domínio: filmes.techproms.com.br
# ====================================================================
set -e

DOMAIN="filmes.techproms.com.br"

echo "===================================================="
echo "🔒 CONFIGURANDO NGINX E CERTIFICADO SSL PARA: $DOMAIN"
echo "===================================================="

# 1. Instalar Nginx e Certbot se não existirem
echo "📦 Instalando pacotes Nginx e Certbot..."
sudo apt-get update -y
sudo apt-get install -y nginx certbot python3-certbot-nginx

# 2. Copiar configuração do Nginx
echo "⚙️  Configurando Proxy Reverso..."
sudo cp nginx.conf.example /etc/nginx/sites-available/pobreflix
sudo ln -sf /etc/nginx/sites-available/pobreflix /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 3. Testar sintaxe do Nginx e recarregar
echo "🧪 Testando configuração do Nginx..."
sudo nginx -t
sudo systemctl reload nginx

# 4. Gerar e ativar certificado SSL automático
echo "📜 Solicitando certificado SSL gratuito (Let's Encrypt)..."
sudo certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m tecpro@gmail.com --redirect || sudo certbot --nginx -d "$DOMAIN"

echo "===================================================="
echo "🎉 PARABÉNS! SEU POBREFLIX ESTÁ 100% ONLINE E SEGURO!"
echo "🌐 Acesse: https://$DOMAIN"
echo "===================================================="
