# ====================================================================
# POBREFLIX — DOCKERFILE DE PRODUÇÃO ULTRA LEVE
# Baseado em Alpine Linux (~50MB) para máxima performance na VPS
# ====================================================================
FROM node:20-alpine

# Instalar curl para healthcheck
RUN apk add --no-cache curl

WORKDIR /app

# Como o projeto não possui dependências pesadas de terceiros (usa módulos nativos do Node.js),
# copiamos os arquivos essenciais direto
COPY package.json ./
COPY server.js auth_saas.js ./
COPY public ./public

# Criar diretórios persistentes para o banco de dados e upload de banners
RUN mkdir -p data public/uploads/banners

# Configurar variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Expor a porta do servidor
EXPOSE 3000

# Healthcheck a cada 30 segundos
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Iniciar servidor nativo
CMD ["node", "server.js"]
