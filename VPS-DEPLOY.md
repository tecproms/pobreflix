# 🚀 GUIA DEFINITIVO: DEPLOY DO POBREFLIX NA VPS

Este guia passo a passo explica como colocar a sua plataforma **PobreFlix** no ar em qualquer servidor VPS (Ubuntu, Debian, Contabo, DigitalOcean, Hetzner, AWS, Oracle Cloud, Hostinger, etc.).

---

## 📋 Pré-requisitos
- Uma VPS com **Ubuntu 22.04 LTS** (ou Debian 11/12).
- Mínimo de **1 GB de RAM** (2 GB recomendados).
- Acesso root via SSH (`ssh root@ip-da-sua-vps`).

---

## ⚡ OPÇÃO 1: Deploy com 1 Comando (Script Automático - Recomendado)

1. Envie os arquivos do projeto para a sua VPS (via Git, SCP ou FileZilla) para a pasta `/var/www/pobreflix`:
   ```bash
   mkdir -p /var/www/pobreflix
   cd /var/www/pobreflix
   ```

2. Dê permissão de execução ao script e execute:
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

3. Pronto! O script instala o Node.js 20 LTS, cria as pastas, instala o gerenciador de processos PM2 e inicia o servidor automaticamente.
   - Acesse no navegador: `http://IP_DA_SUA_VPS:3000`
   - Login Master: `tecpro@gmail.com` | Senha: `53915030`

---

## 🐳 OPÇÃO 2: Deploy com Docker & Docker Compose

Se você prefere containers isolados e portabilidade total:

1. Instale o Docker e Docker Compose na VPS (caso não tenha):
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```

2. Dentro da pasta do projeto, inicie:
   ```bash
   docker compose up -d --build
   ```

3. Para ver os logs em tempo real:
   ```bash
   docker compose logs -f
   ```

4. Para reiniciar o serviço:
   ```bash
   docker compose restart
   ```

---

## 🌐 OPÇÃO 3: Deploy Manual com PM2 (Sem Docker)

1. Instale o Node.js 20 LTS:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. Instale o PM2 globalmente:
   ```bash
   sudo npm install -g pm2
   ```

3. Inicie o PobreFlix:
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

4. Comandos úteis do PM2:
   - Ver status: `pm2 status`
   - Ver logs: `pm2 logs pobreflix`
   - Reiniciar: `pm2 restart pobreflix`
   - Parar: `pm2 stop pobreflix`

---

## 🔒 Como Configurar o Domínio `filmes.techproms.com.br` + HTTPS (SSL Grátis)

Para colocar seu domínio no ar com o cadeado verde (HTTPS/SSL):

1. **Aponte o Subdomínio no DNS (no Cloudflare, Registro.br ou cPanel)**:
   - Crie uma entrada de **Registro tipo A**:
     - **Tipo**: `A`
     - **Nome**: `filmes`
     - **Destino/IP**: `IP_DA_SUA_VPS`
     - **Proxy**: Somente DNS (DNS Only) caso use Cloudflare para permitir emissão de SSL direto no Certbot.

2. **Ativação Automática com 1 Comando na VPS**:
   Após clonar e rodar o `./deploy.sh`, basta rodar:
   ```bash
   chmod +x setup-ssl.sh
   ./setup-ssl.sh
   ```
   *Este script instala o Nginx, ativa o proxy reverso e gera o certificado SSL grátis para `filmes.techproms.com.br` automaticamente.*

3. **Ou Configuração Manual**:
   ```bash
   sudo apt update
   sudo apt install -y nginx certbot python3-certbot-nginx
   sudo cp nginx.conf.example /etc/nginx/sites-available/pobreflix
   sudo ln -sf /etc/nginx/sites-available/pobreflix /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl reload nginx
   sudo certbot --nginx -d filmes.techproms.com.br
   ```

Acesse: **https://filmes.techproms.com.br**!

Pronto! Agora o seu PobreFlix estará acessível em `https://seu-dominio.com.br` com alta performance, proteção contra quedas e streaming ultra-rápido!

---

## 💾 Onde ficam salvos os Usuários, Planos e Banners?

- **Usuários, Assinaturas e Telas Conectadas**: `data/users.json`
- **Banners de Anúncio enviados pelo Painel Master**: `public/uploads/banners/`

Para fazer backup a qualquer momento na VPS, basta copiar a pasta `data/`:
```bash
tar -czvf backup-pobreflix-$(date +%F).tar.gz data/ public/uploads/
```
