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

## 🔒 Como Configurar Domínio + HTTPS (SSL Grátis com Nginx)

Para seus clientes acessarem por um domínio bonito como `https://pobreflix.com.br` (com o cadeado verde):

1. **Aponte seu Domínio**:
   - Vá no seu provedor de domínio (ex: Registro.br, Cloudflare, GoDaddy) e crie um **Registro tipo A**:
     - Nome: `@` (ou subdomínio como `app`)
     - Destino: `IP_DA_SUA_VPS`

2. **Instale o Nginx e Certbot na VPS**:
   ```bash
   sudo apt update
   sudo apt install -y nginx certbot python3-certbot-nginx
   ```

3. **Copie a configuração do Nginx**:
   ```bash
   sudo cp nginx.conf.example /etc/nginx/sites-available/pobreflix
   ```

4. **Edite com o seu domínio real**:
   ```bash
   sudo nano /etc/nginx/sites-available/pobreflix
   ```
   *Substitua `seu-dominio.com.br` pelo seu domínio real.*

5. **Ative o site no Nginx e teste**:
   ```bash
   sudo ln -s /etc/nginx/sites-available/pobreflix /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t
   sudo systemctl reload nginx
   ```

6. **Gere o Certificado SSL (HTTPS) Gratuito**:
   ```bash
   sudo certbot --nginx -d seu-dominio.com.br -d www.seu-dominio.com.br
   ```

Pronto! Agora o seu PobreFlix estará acessível em `https://seu-dominio.com.br` com alta performance, proteção contra quedas e streaming ultra-rápido!

---

## 💾 Onde ficam salvos os Usuários, Planos e Banners?

- **Usuários, Assinaturas e Telas Conectadas**: `data/users.json`
- **Banners de Anúncio enviados pelo Painel Master**: `public/uploads/banners/`

Para fazer backup a qualquer momento na VPS, basta copiar a pasta `data/`:
```bash
tar -czvf backup-pobreflix-$(date +%F).tar.gz data/ public/uploads/
```
