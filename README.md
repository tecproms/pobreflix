# 🍿 PobreFlix — Plataforma Completa de Streaming & IPTV SaaS

<p align="center">
  <img src="https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1200&q=80" alt="PobreFlix Banner" width="100%" style="border-radius: 12px;" />
</p>

<p align="center">
  <strong>Plataforma moderna de streaming estilo Netflix com catálogo sob demanda (VOD), canais de TV ao vivo, franquias em sequência cronológica, gerenciador SaaS de telas simultâneas, perfis e painel administrativo master.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-20_LTS-green.svg" alt="Node.js" />
  <img src="https://img.shields.io/badge/React-18-blue.svg" alt="React" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED.svg" alt="Docker" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License" />
</p>

---

## ✨ Principais Funcionalidades

### 🎬 1. Catálogo Gigante & Franquias em Sequência
- **Mais de 50.000 Títulos**: Filmes blockbusters, séries completas com seleção de temporadas/episódios, sitcoms clássicas, doramas e animes lendários.
- **Franquias em Ordem Numérica (1, 2, 3...)**: Linhas exclusivas com numeração gigante neon na tela inicial (*Velozes & Furiosos 1 ao 10*, *Harry Potter 1 ao 8*, *Jogos Vorazes*, *Crepúsculo*, *Matrix*, *Homem-Aranha*, *O Senhor dos Anéis & O Hobbit*, *Star Wars*, *Jurassic Park*, *Vingadores*, *Shrek*, etc.).
- **100% Dublado PT-BR**: Áudio em português sincronizado e capas em alta definição.

### 👑 2. Sistema SaaS Completo (Assinaturas, Telas & Perfis)
- **Telas Simultâneas em Tempo Real**: Monitoramento por *heartbeat* de dispositivos conectados com desconexão remota e aviso de limite de telas.
- **Sistema de Perfis Estilo Netflix**: Criação de múltiplos perfis por conta, avatares personalizados, PIN de bloqueio parental e **Perfil Kids** com filtro de conteúdo infantil.
- **Minha Lista & Continuar Assistindo**: Sincronização em nuvem do histórico e favoritos para cada perfil.
- **Planos & Pagamento PIX**: Planos configuráveis (Teste Grátis 2h, Individual 1 Tela, Duplo 2 Telas, Família 4K) com geração de chave PIX e ativação automática por vouchers.

### 📢 3. Painel Master Admin & Carrossel de Anúncios
- **Área Administrativa VIP**: Acesso centralizado para o administrador gerenciar usuários, planos, vouchers e telas ativas.
- **Banners de Anúncio em Carrossel**: Suba anúncios e banners promocionais direto do seu computador com link de redirecionamento para aparecerem no fundo da tela de apresentação.

### ⚡ 4. Reprodutor de Cinema HTML5 Otimizado
- **Zero Anúncios Externos**: Player nativo HTML5 sem popups intrusivos.
- **Próximo Episódio nos Créditos**: Contagem regressiva automática nos últimos segundos estilo Netflix.
- **Pular Abertura**: Botão inteligente para pular intros de séries.
- **⬇️ Download Offline em MP4**: Baixe filmes e episódios diretamente no computador ou celular com o nome original do arquivo.
- **Proxy Anti-Bloqueio**: Contorno de restrições CORS, Mixed Content (HTTPS/HTTP) e reescrita dinâmica de playlists M3U para TV Box, Smart TV e VLC.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- [Node.js 18+](https://nodejs.org/) instalado no computador.

### Passo a Passo
1. Clone o repositório:
   ```bash
   git clone git@github.com:tecproms/pobreflix.git
   cd pobreflix
   ```

2. Inicie o servidor:
   ```bash
   npm start
   ```
   *(No Windows, você também pode dar dois cliques no arquivo `iniciar.bat`)*

3. Abra no navegador:
   ```
   http://localhost:3000
   ```

- **Conta Master Admin Padrão**:
  - **Email**: `tecpro@gmail.com`
  - **Senha**: `53915030`

---

## ☁️ Deploy em VPS (Ubuntu / Debian / Docker / PM2)

A plataforma foi arquitetada sem dependências pesadas e com módulos nativos, pesando menos de **50MB** em produção.

### Opção A: Deploy Automático com 1 Comando (Recomendado)
```bash
chmod +x deploy.sh
./deploy.sh
```

### Opção B: Deploy com Docker Compose
```bash
docker compose up -d --build
```

### Opção C: Deploy com PM2
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
```

👉 Para o guia completo com configuração de **Domínio Próprio** e **Certificado SSL (HTTPS) Grátis** via Nginx e Certbot, consulte o [VPS-DEPLOY.md](VPS-DEPLOY.md).

---

## 📁 Estrutura do Projeto

```
pobreflix/
├── auth_saas.js             # Motor SaaS: Contas, Perfis, Telas, Planos e Banners
├── server.js                # Servidor HTTP, Proxy CORS, HLS e API de Download
├── Dockerfile               # Imagem Docker Alpine ultra-leve
├── docker-compose.yml       # Orquestrador com volumes persistentes
├── ecosystem.config.js      # Configuração PM2 para VPS
├── deploy.sh                # Script de instalação automática na VPS
├── nginx.conf.example       # Modelo de Proxy Reverso com SSL
├── VPS-DEPLOY.md            # Guia passo a passo de hospedagem
├── data/
│   └── users.json           # Banco de dados de usuários e assinaturas
├── public/
│   ├── index.html           # Ponto de entrada SPA
│   ├── app.js               # Interface React do PobreFlix e Player
│   ├── saas-ui.js           # Telas de Login, Cadastro, Planos e Painel Master
│   ├── catalog-blockbusters.js # Metadados do catálogo de 50.000 títulos
│   ├── styles.css           # Estilização Netflix Dark Theme
│   └── lists/               # Listas M3U de filmes, séries e canais
```

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais detalhes.
