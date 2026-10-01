const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'users.json');
const BANNERS_UPLOAD_DIR = path.join(__dirname, 'public', 'uploads', 'banners');

const DEFAULT_AD_BANNER_SETTINGS = {
  enabled: true,
  intervalSeconds: 6,
  backgroundOpacity: 0.62,
  showAdOverlayCard: true
};

const DEFAULT_AD_BANNERS = [
  {
    id: 'bnr_default_1',
    title: '🔥 PLANO FAMÍLIA 4K — 4 TELAS SIMULTÂNEAS POR R$ 29,90',
    subtitle: 'Assista na TV da Sala, Quarto e Celular ao mesmo tempo sem travar! Ativação imediata via PIX.',
    ctaText: '🚀 Fazer Upgrade p/ 4 Telas',
    linkUrl: '#open_plans',
    badge: 'OFERTA VIP POBREFLIX',
    imageUrl: 'https://images.unsplash.com/photo-1574375927938-d5a98e8ffe85?auto=format&fit=crop&w=1600&q=85',
    active: true,
    createdAt: '2026-09-30T12:00:00.000Z'
  },
  {
    id: 'bnr_default_2',
    title: '🍿 +2.000 FILMES E SÉRIES DUBLADOS EM 4K ULTRA HD',
    subtitle: 'Lançamentos do cinema, séries completas com todas as temporadas e canais ao vivo 24h.',
    ctaText: '🎬 Explorar Lançamentos',
    linkUrl: '',
    badge: 'DESTAQUE DO MÊS',
    imageUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=1600&q=85',
    active: true,
    createdAt: '2026-09-30T12:01:00.000Z'
  },
  {
    id: 'bnr_default_3',
    title: '📢 ANUNCIE SUA MARCA OU PARCERIA AQUI NA POBREFLIX',
    subtitle: 'Espaço publicitário gerenciado direto pelo Painel Master em carrossel de fundo.',
    ctaText: '👑 Configurar no Painel Master',
    linkUrl: '#open_plans',
    badge: 'ESPAÇO PUBLICITÁRIO',
    imageUrl: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=1600&q=85',
    active: true,
    createdAt: '2026-09-30T12:02:00.000Z'
  }
];

const PLANS = [
  {
    id: 'teste_gratis',
    name: 'Teste Grátis (2 Horas)',
    price: 0,
    priceFormatted: 'Grátis (2 Horas)',
    maxScreens: 1,
    maxProfiles: 2,
    quality: 'HD 720p',
    durationDays: 2 / 24,
    durationHours: 2,
    badge: 'TESTE 2 HORAS',
    features: [
      '2 Horas de acesso liberado mediante cadastro',
      '1 Tela simultânea liberada',
      'Acesso aos Filmes, Séries e Canais Ao Vivo',
      'Até 2 Perfis na conta'
    ]
  },
  {
    id: 'basico_1',
    name: 'Plano Básico (1 Tela)',
    price: 14.9,
    priceFormatted: 'R$ 14,90/mês',
    maxScreens: 1,
    maxProfiles: 3,
    quality: 'Full HD 1080p',
    durationDays: 30,
    badge: 'INDIVIDUAL',
    features: [
      '1 Tela assistindo ao mesmo tempo',
      'Catálogo completo: 10.000 Filmes + 10.000 Séries Dubladas',
      'Todos os 109 Canais de TV Ao Vivo',
      'Até 3 Perfis personalizados (com PIN)',
      'Qualidade Full HD 1080p sem travar'
    ]
  },
  {
    id: 'padrao_2',
    name: 'Plano Duplo (2 Telas)',
    price: 24.9,
    priceFormatted: 'R$ 24,90/mês',
    maxScreens: 2,
    maxProfiles: 4,
    quality: 'Full HD 1080p + Esportes',
    durationDays: 30,
    badge: 'MAIS ASSINADO',
    features: [
      '2 Telas assistindo simultaneamente',
      'Catálogo completo: 10.000 Filmes + 10.000 Séries Dubladas',
      'Canais de Esportes (SporTV, Premiere, ESPN) inclusos',
      'Até 4 Perfis (inclui Perfil Kids Infantil)',
      'Gerenciador de telas conectadas em tempo real'
    ]
  },
  {
    id: 'familia_4k',
    name: 'Plano Família VIP (4 Telas)',
    price: 34.9,
    priceFormatted: 'R$ 34,90/mês',
    maxScreens: 4,
    maxProfiles: 5,
    quality: '4K Ultra HD + Premiere & HBO',
    durationDays: 30,
    badge: 'VIP COMPLETO',
    features: [
      '4 Telas assistindo ao mesmo tempo em qualquer aparelho',
      '10.000 Melhores Filmes + 10.000 Séries 100% Dublados',
      'Todos os Canais Abertos, Premiere, SporTV, ESPN, HBO e Telecine',
      'Até 5 Perfis individuais com Lista, Histórico e PIN de bloqueio',
      'Prioridade máxima de servidor e controle remoto de telas'
    ]
  }
];

const AVATARS = [
  { id: 'red_boss', emoji: '😎', bg: 'linear-gradient(135deg, #e50914 0%, #83050b 100%)', label: 'Chefe VIP' },
  { id: 'blue_cinema', emoji: '🍿', bg: 'linear-gradient(135deg, #2563eb 0%, #1e3a8a 100%)', label: 'Pipoca' },
  { id: 'purple_gamer', emoji: '🎮', bg: 'linear-gradient(135deg, #9333ea 0%, #4c1d95 100%)', label: 'Gamer' },
  { id: 'green_soccer', emoji: '⚽', bg: 'linear-gradient(135deg, #16a34a 0%, #064e3b 100%)', label: 'Futebol' },
  { id: 'amber_hero', emoji: '🦸', bg: 'linear-gradient(135deg, #d97706 0%, #78350f 100%)', label: 'Herói' },
  { id: 'pink_queen', emoji: '👑', bg: 'linear-gradient(135deg, #db2777 0%, #831843 100%)', label: 'Rainha' },
  { id: 'cyan_ninja', emoji: '🥷', bg: 'linear-gradient(135deg, #0891b2 0%, #164e63 100%)', label: 'Ninja' },
  { id: 'orange_anime', emoji: '🐉', bg: 'linear-gradient(135deg, #ea580c 0%, #7c2d12 100%)', label: 'Otaku' },
  { id: 'kids_bear', emoji: '🧸', bg: 'linear-gradient(135deg, #f59e0b 0%, #10b981 100%)', label: 'Kids Ursinho' },
  { id: 'kids_rocket', emoji: '🚀', bg: 'linear-gradient(135deg, #3b82f6 0%, #ec4899 100%)', label: 'Kids Espaço' },
  { id: 'dark_wolf', emoji: '🐺', bg: 'linear-gradient(135deg, #4b5563 0%, #111827 100%)', label: 'Lobo' },
  { id: 'Alien_scifi', emoji: '👽', bg: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', label: 'Sci-Fi' }
];

// Sessões de telas ativas em memória: key = `${userId}_${deviceId}`
const activeScreensMap = new Map();
// Dispositivos que foram desconectados remotamente para exibir aviso imediato
const kickedDevicesMap = new Map();

function ensureDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  const now = Date.now();
  if (!fs.existsSync(DB_FILE)) {
    const initialDb = {
      pixSettings: {
        pixKey: 'pix@pobreflix.com.br',
        pixReceiver: 'POBREFLIX STREAMING VIP',
        whatsappSupport: '5511999999999'
      },
      vouchers: [
        {
          code: 'POBREFLIX-VIP',
          planId: 'familia_4k',
          durationDays: 30,
          maxUses: 999,
          usedCount: 0,
          createdAt: new Date(now).toISOString()
        },
        {
          code: 'PF-4TELAS-30D',
          planId: 'familia_4k',
          durationDays: 30,
          maxUses: 10,
          usedCount: 0,
          createdAt: new Date(now).toISOString()
        },
        {
          code: 'PF-2TELAS-30D',
          planId: 'padrao_2',
          durationDays: 30,
          maxUses: 10,
          usedCount: 0,
          createdAt: new Date(now).toISOString()
        },
        {
          code: 'PF-1TELA-30D',
          planId: 'basico_1',
          durationDays: 30,
          maxUses: 10,
          usedCount: 0,
          createdAt: new Date(now).toISOString()
        }
      ],
      users: [
        {
          id: 'usr_admin_master',
          name: 'Master Admin (TecPro)',
          email: 'tecpro@gmail.com',
          password: '53915030',
          role: 'admin',
          isMaster: true,
          planId: 'familia_4k',
          maxScreens: 4,
          status: 'active',
          createdAt: new Date(now - 30 * 86400000).toISOString(),
          expiresAt: new Date(now + 3650 * 86400000).toISOString(),
          profiles: [
            {
              id: 'prof_admin_1',
              name: 'TecPro Master',
              avatar: 'red_boss',
              avatarId: 'red_boss',
              isKids: false,
              pin: '',
              favorites: [],
              history: []
            },
            {
              id: 'prof_admin_2',
              name: 'Sala TV 4K',
              avatar: 'blue_cinema',
              avatarId: 'blue_cinema',
              isKids: false,
              pin: '',
              favorites: [],
              history: []
            },
            {
              id: 'prof_admin_3',
              name: 'PobreFlix Kids',
              avatar: 'kids_bear',
              avatarId: 'kids_bear',
              isKids: true,
              pin: '',
              favorites: [],
              history: []
            }
          ]
        }
      ]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDb, null, 2), 'utf8');
    return;
  }

  // Garantir que o login Master tecpro@gmail.com / 53915030 exista sempre e sem contas demo soltas
  try {
    const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    if (!Array.isArray(db.users)) db.users = [];
    let changed = false;

    // Remover contas demo antigas se existirem
    const beforeLen = db.users.length;
    db.users = db.users.filter(
      (u) =>
        u.email !== 'admin@pobreflix.com' &&
        u.email !== 'cliente@pobreflix.com' &&
        u.email !== 'teste@pobreflix.com'
    );
    if (db.users.length !== beforeLen) changed = true;

    let master = db.users.find(
      (u) => u.email && u.email.toLowerCase() === 'tecpro@gmail.com'
    );
    if (!master) {
      master = {
        id: 'usr_admin_master',
        name: 'Master Admin (TecPro)',
        email: 'tecpro@gmail.com',
        password: '53915030',
        role: 'admin',
        isMaster: true,
        planId: 'familia_4k',
        maxScreens: 4,
        status: 'active',
        createdAt: new Date(now - 30 * 86400000).toISOString(),
        expiresAt: new Date(now + 3650 * 86400000).toISOString(),
        profiles: [
          {
            id: 'prof_admin_1',
            name: 'TecPro Master',
            avatar: 'red_boss',
            avatarId: 'red_boss',
            isKids: false,
            pin: '',
            favorites: [],
            history: []
          },
          {
            id: 'prof_admin_2',
            name: 'Sala TV 4K',
            avatar: 'blue_cinema',
            avatarId: 'blue_cinema',
            isKids: false,
            pin: '',
            favorites: [],
            history: []
          },
          {
            id: 'prof_admin_3',
            name: 'PobreFlix Kids',
            avatar: 'kids_bear',
            avatarId: 'kids_bear',
            isKids: true,
            pin: '',
            favorites: [],
            history: []
          }
        ]
      };
      db.users.unshift(master);
      changed = true;
    } else if (master.password !== '53915030' || master.role !== 'admin') {
      master.password = '53915030';
      master.role = 'admin';
      master.isMaster = true;
      changed = true;
    }

    if (!Array.isArray(db.adBanners)) {
      db.adBanners = DEFAULT_AD_BANNERS;
      changed = true;
    }
    if (!db.adBannerSettings || typeof db.adBannerSettings !== 'object') {
      db.adBannerSettings = { ...DEFAULT_AD_BANNER_SETTINGS };
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
    }
  } catch {}
}

function saveBannerImageData(imageDataUrl) {
  if (!imageDataUrl || typeof imageDataUrl !== 'string') return '';
  const trimmed = imageDataUrl.trim();
  if (!trimmed.startsWith('data:image/')) {
    return trimmed;
  }
  try {
    if (!fs.existsSync(BANNERS_UPLOAD_DIR)) {
      fs.mkdirSync(BANNERS_UPLOAD_DIR, { recursive: true });
    }
    const match = trimmed.match(/^data:image\/([a-zA-Z0-9+.-]+);base64,(.+)$/);
    if (!match) return trimmed;
    let ext = match[1].toLowerCase();
    if (ext === 'jpeg') ext = 'jpg';
    if (ext === 'svg+xml') ext = 'svg';
    if (!['png', 'jpg', 'webp', 'gif', 'svg'].includes(ext)) ext = 'jpg';
    const base64Data = match[2];
    const fileName = `banner_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(BANNERS_UPLOAD_DIR, fileName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    return `/uploads/banners/${fileName}`;
  } catch {
    return trimmed;
  }
}

function loadDb() {
  ensureDb();
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch {
    return { pixSettings: {}, vouchers: [], users: [] };
  }
}

function saveDb(db) {
  ensureDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function pruneStaleScreens() {
  const now = Date.now();
  for (const [key, session] of activeScreensMap.entries()) {
    if (now - session.lastSeenAt > 45000) {
      activeScreensMap.delete(key);
    }
  }
}

function getUserActiveScreens(userId) {
  pruneStaleScreens();
  const list = [];
  for (const session of activeScreensMap.values()) {
    if (session.userId === userId) {
      list.push(session);
    }
  }
  return list.sort((a, b) => b.connectedAt - a.connectedAt);
}

function getAllActiveScreens() {
  pruneStaleScreens();
  return Array.from(activeScreensMap.values()).sort((a, b) => b.lastSeenAt - a.lastSeenAt);
}

function sanitizeProfile(p) {
  const av = p.avatarId || p.avatar || 'red_boss';
  return {
    ...p,
    avatar: av,
    avatarId: av,
    favorites: Array.isArray(p.favorites) ? p.favorites : [],
    history: Array.isArray(p.history) ? p.history : []
  };
}

function sanitizeUser(u) {
  const now = Date.now();
  const expMs = new Date(u.expiresAt || 0).getTime();
  const isExpired = expMs <= now;
  const daysLeft = Math.max(0, Math.ceil((expMs - now) / 86400000));
  const hoursLeft = Math.max(0, Math.ceil((expMs - now) / 3600000));
  const minutesLeft = Math.max(0, Math.ceil((expMs - now) / 60000));
  const planObj = PLANS.find((p) => p.id === u.planId) || PLANS[1];
  const activeScreens = getUserActiveScreens(u.id);

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role || 'user',
    isMaster: Boolean(u.isMaster || u.role === 'admin'),
    planId: u.planId,
    planName: planObj.name,
    planQuality: planObj.quality,
    maxScreens: u.maxScreens || planObj.maxScreens || 1,
    maxProfiles: planObj.maxProfiles || 5,
    status: u.status === 'blocked' ? 'blocked' : isExpired ? 'expired' : 'active',
    isExpired,
    daysLeft,
    daysRemaining: daysLeft,
    hoursLeft,
    minutesLeft,
    createdAt: u.createdAt,
    expiresAt: u.expiresAt,
    profiles: (u.profiles || []).map(sanitizeProfile),
    activeScreensCount: activeScreens.length,
    activeScreens
  };
}

function parseJsonBody(req) {
  return new Promise((resolve) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
    req.on('error', () => resolve({}));
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(obj));
}

function getClientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (xff) return String(xff).split(',')[0].trim();
  return req.socket?.remoteAddress?.replace('::ffff:', '') || '127.0.0.1';
}

function extractToken(req, parsedReqUrl, body = {}) {
  return String(
    req.headers['x-auth-token'] ||
      body.token ||
      parsedReqUrl.searchParams.get('token') ||
      ''
  ).trim();
}

function getPlansDictionary() {
  const dict = {};
  PLANS.forEach((p) => {
    dict[p.id] = p;
  });
  return dict;
}

async function handleSaasRequest(req, res, pathname, parsedReqUrl) {
  ensureDb();

  // 1. Configuração pública (Planos, Avatares, PIX e Banners de Anúncio em Carrossel)
  if (pathname === '/api/saas/config' && req.method === 'GET') {
    const db = loadDb();
    const allBanners = Array.isArray(db.adBanners) ? db.adBanners : DEFAULT_AD_BANNERS;
    const activeBanners = allBanners.filter((b) => b && b.active !== false && b.imageUrl);
    return sendJson(res, 200, {
      ok: true,
      plans: getPlansDictionary(),
      plansList: PLANS,
      avatars: AVATARS,
      pixKey: db.pixSettings?.pixKey || 'pix@pobreflix.com.br',
      pixBeneficiary: db.pixSettings?.pixReceiver || 'POBREFLIX STREAMING VIP',
      pixSettings: db.pixSettings,
      adBanners: activeBanners,
      adBannerSettings: db.adBannerSettings || DEFAULT_AD_BANNER_SETTINGS
    });
  }

  // 1B. Verificar se um e-mail já tem conta (para redirecionar para Login ou Criar Conta)
  if (pathname === '/api/saas/check-email' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const db = loadDb();
    const found = db.users.find((u) => u.email.toLowerCase() === email);
    return sendJson(res, 200, {
      ok: true,
      exists: Boolean(found),
      isMaster: Boolean(found && (found.role === 'admin' || found.email.toLowerCase() === 'tecpro@gmail.com'))
    });
  }

  // 2. Login (Redireciona Master p/ Painel Master, Conta Existente p/ Streaming/Telas, Sem Conta p/ Cadastro!)
  if (pathname === '/api/saas/login' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();

    const db = loadDb();
    const userByEmail = db.users.find((u) => u.email.toLowerCase() === email);

    // Se o e-mail NÃO tiver conta cadastrada, avisa o frontend para redirecionar direto para a tela de Criar Conta!
    if (!userByEmail) {
      return sendJson(res, 404, {
        ok: false,
        code: 'ACCOUNT_NOT_FOUND',
        email,
        error: 'Este e-mail ainda não possui conta! Crie seu cadastro abaixo para liberar seu acesso ou iniciar o Teste Grátis de 2 Horas.'
      });
    }

    if (userByEmail.password !== password) {
      return sendJson(res, 401, {
        ok: false,
        code: 'WRONG_PASSWORD',
        error: 'Senha incorreta para esta conta. Verifique e tente novamente.'
      });
    }

    const sanitized = sanitizeUser(userByEmail);
    const isMasterAccount =
      userByEmail.role === 'admin' || userByEmail.email.toLowerCase() === 'tecpro@gmail.com';

    return sendJson(res, 200, {
      ok: true,
      token: userByEmail.id,
      user: sanitized,
      redirectTo: isMasterAccount ? 'master_panel' : 'streaming_profiles',
      plans: getPlansDictionary(),
      avatars: AVATARS,
      pixSettings: db.pixSettings
    });
  }

  // 3. Criar Conta (Cadastro obrigatório mesmo para o Teste Grátis de 2 Horas!)
  if (pathname === '/api/saas/register' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const name = String(body.name || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '').trim();
    let planId = String(body.planId || 'teste_gratis').trim();
    const voucherCode = String(body.voucherCode || '').trim().toUpperCase();

    if (!name || !email || !password) {
      return sendJson(res, 400, {
        ok: false,
        error: 'O cadastro completo (Nome, E-mail e Senha) é obrigatório para criar a conta ou ativar o Teste Grátis de 2 Horas.'
      });
    }
    if (password.length < 4) {
      return sendJson(res, 400, { ok: false, error: 'A senha deve ter pelo menos 4 caracteres.' });
    }

    const db = loadDb();
    if (db.users.some((u) => u.email.toLowerCase() === email)) {
      return sendJson(res, 400, {
        ok: false,
        code: 'EMAIL_ALREADY_EXISTS',
        error: 'Este e-mail já possui cadastro! Faça login com sua senha.'
      });
    }

    let planObj = PLANS.find((p) => p.id === planId) || PLANS[0];
    // Se for teste_gratis, dura exatamente 2 horas (2 * 3600 * 1000 ms)
    let durationMs =
      planObj.id === 'teste_gratis'
        ? 2 * 3600 * 1000
        : planObj.durationDays * 86400000;

    if (voucherCode) {
      const v = db.vouchers.find((x) => x.code.toUpperCase() === voucherCode);
      if (!v || v.usedCount >= v.maxUses) {
        return sendJson(res, 400, { ok: false, error: 'Código de ativação inválido ou já utilizado.' });
      }
      v.usedCount += 1;
      planObj = PLANS.find((p) => p.id === v.planId) || planObj;
      planId = planObj.id;
      durationMs = (v.durationDays || v.days || 30) * 86400000;
    }

    const now = Date.now();
    const newUser = {
      id: `usr_${crypto.randomBytes(5).toString('hex')}`,
      name,
      email,
      password,
      phone: String(body.phone || '').trim(),
      role: 'user',
      planId: planObj.id,
      maxScreens: planObj.maxScreens,
      status: 'active',
      createdAt: new Date(now).toISOString(),
      expiresAt: new Date(now + durationMs).toISOString(),
      profiles: [
        {
          id: `prof_${crypto.randomBytes(4).toString('hex')}`,
          name: name.split(' ')[0] || 'Principal',
          avatar: 'red_boss',
          avatarId: 'red_boss',
          isKids: false,
          pin: '',
          favorites: [],
          history: []
        },
        {
          id: `prof_${crypto.randomBytes(4).toString('hex')}`,
          name: 'Kids',
          avatar: 'kids_bear',
          avatarId: 'kids_bear',
          isKids: true,
          pin: '',
          favorites: [],
          history: []
        }
      ]
    };

    db.users.unshift(newUser);
    saveDb(db);

    return sendJson(res, 200, {
      ok: true,
      token: newUser.id,
      user: sanitizeUser(newUser),
      redirectTo: 'streaming_profiles',
      plans: getPlansDictionary(),
      avatars: AVATARS,
      pixSettings: db.pixSettings
    });
  }

  // 4. Dados da Conta Atual (/api/saas/me)
  if (pathname === '/api/saas/me' && req.method === 'GET') {
    const token = extractToken(req, parsedReqUrl);
    const db = loadDb();
    const user = db.users.find((u) => u.id === token);
    if (!user) {
      return sendJson(res, 401, { ok: false, error: 'Sessão inválida ou expirada.' });
    }
    return sendJson(res, 200, {
      ok: true,
      user: sanitizeUser(user),
      plans: getPlansDictionary(),
      avatars: AVATARS,
      pixSettings: db.pixSettings
    });
  }

  // 5. Heartbeat de Tela Ativa & Controle de Limite de Telas Simultâneas
  if (pathname === '/api/saas/heartbeat' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const token = extractToken(req, parsedReqUrl, body);
    const deviceId = String(body.deviceId || '').trim();
    const deviceName = String(body.deviceName || 'Navegador Web').trim();
    const profileId = String(body.profileId || '').trim();
    const profileName = String(body.profileName || 'Principal').trim();
    const profileAvatar = String(body.profileAvatar || 'red_boss').trim();
    const watchingTitle = String(body.watchingTitle || 'Navegando no Catálogo').trim();

    if (!token || !deviceId) {
      return sendJson(res, 400, { ok: false, error: 'Token e deviceId obrigatórios.' });
    }

    const db = loadDb();
    const user = db.users.find((u) => u.id === token);
    if (!user) {
      return sendJson(res, 401, { ok: false, error: 'Conta não encontrada.' });
    }

    const sessionKey = `${user.id}_${deviceId}`;
    if (kickedDevicesMap.has(sessionKey)) {
      const reason = kickedDevicesMap.get(sessionKey);
      kickedDevicesMap.delete(sessionKey);
      return sendJson(res, 403, {
        ok: false,
        code: 'DEVICE_KICKED',
        error: reason || 'Esta tela foi desconectada remotamente pelo titular ou administrador.'
      });
    }

    const sanitized = sanitizeUser(user);
    if (sanitized.status === 'blocked') {
      activeScreensMap.delete(sessionKey);
      return sendJson(res, 403, {
        ok: false,
        code: 'ACCOUNT_BLOCKED',
        error: 'Sua conta está suspensa pelo administrador. Entre em contato com o suporte.',
        user: sanitized
      });
    }

    if (sanitized.status === 'expired') {
      activeScreensMap.delete(sessionKey);
      return sendJson(res, 403, {
        ok: false,
        code: 'SUBSCRIPTION_EXPIRED',
        error: 'Sua assinatura venceu! Renove seu plano via PIX ou Código de Ativação para continuar assistindo.',
        user: sanitized
      });
    }

    pruneStaleScreens();
    const currentScreens = getUserActiveScreens(user.id);
    const otherScreens = currentScreens.filter((s) => s.deviceId !== deviceId);

    // Verificar se o limite de telas simultâneas do plano foi atingido!
    if (otherScreens.length >= sanitized.maxScreens) {
      return sendJson(res, 429, {
        ok: false,
        code: 'SCREEN_LIMIT_REACHED',
        error: `Limite de ${sanitized.maxScreens} tela(s) simultânea(s) do seu plano (${sanitized.planName}) atingido! Desconecte um aparelho abaixo ou faça upgrade para mais telas.`,
        maxScreens: sanitized.maxScreens,
        activeScreens: otherScreens,
        user: sanitized
      });
    }

    const existing = activeScreensMap.get(sessionKey);
    const now = Date.now();
    activeScreensMap.set(sessionKey, {
      id: sessionKey,
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      deviceId,
      deviceName,
      profileId,
      profileName,
      profileAvatar,
      watchingTitle,
      ip: getClientIp(req),
      connectedAt: existing ? existing.connectedAt : now,
      lastSeenAt: now
    });

    const updatedScreens = getUserActiveScreens(user.id);
    return sendJson(res, 200, {
      ok: true,
      user: sanitizeUser(user),
      activeScreens: updatedScreens,
      activeScreensCount: updatedScreens.length,
      maxScreens: sanitized.maxScreens
    });
  }

  // 6. Desconectar / Derrubar Tela Conectada
  if (pathname === '/api/saas/screens/disconnect' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const token = extractToken(req, parsedReqUrl, body);
    const targetDeviceId = String(body.targetDeviceId || body.deviceId || '').trim();
    const targetUserId = String(body.targetUserId || '').trim();
    const disconnectAllOthers = Boolean(body.disconnectAllOthers);
    const currentDeviceId = String(body.currentDeviceId || '').trim();

    const db = loadDb();
    const caller = db.users.find((u) => u.id === token);
    if (!caller) {
      return sendJson(res, 401, { ok: false, error: 'Não autorizado.' });
    }

    const ownerId = caller.role === 'admin' && targetUserId ? targetUserId : caller.id;

    if (disconnectAllOthers) {
      for (const [key, sess] of activeScreensMap.entries()) {
        if (sess.userId === ownerId && sess.deviceId !== currentDeviceId) {
          activeScreensMap.delete(key);
          kickedDevicesMap.set(key, 'Você desconectou todos os outros aparelhos da conta.');
        }
      }
    } else if (targetDeviceId) {
      // Procurar a sessão pelo deviceId (do próprio usuário ou de qualquer usuário se for admin)
      for (const [key, sess] of activeScreensMap.entries()) {
        if (
          sess.deviceId === targetDeviceId &&
          (sess.userId === ownerId || caller.role === 'admin')
        ) {
          activeScreensMap.delete(key);
          // Só marcar como kicked se for derrubado por outro dispositivo
          if (targetDeviceId !== currentDeviceId) {
            kickedDevicesMap.set(
              key,
              caller.role === 'admin' && sess.userId !== caller.id
                ? 'Sua tela foi desconectada pelo Administrador da PobreFlix.'
                : 'Esta tela foi desconectada remotamente no Gerenciador de Telas da conta.'
            );
          }
        }
      }
    }

    return sendJson(res, 200, {
      ok: true,
      activeScreens: getUserActiveScreens(ownerId),
      allActiveScreens: caller.role === 'admin' ? getAllActiveScreens() : undefined
    });
  }

  // 7. Criar ou Editar Perfil ("Quem está assistindo?")
  if (pathname === '/api/saas/profiles/save' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const token = extractToken(req, parsedReqUrl, body);
    const profileId = String(body.profileId || '').trim();
    const name = String(body.name || '').trim();
    const avatar = String(body.avatarId || body.avatar || 'red_boss').trim();
    const isKids = Boolean(body.isKids);
    const pin = String(body.pin || '').replace(/\D/g, '').slice(0, 4);

    if (!name) {
      return sendJson(res, 400, { ok: false, error: 'Digite o nome do perfil.' });
    }

    const db = loadDb();
    const user = db.users.find((u) => u.id === token);
    if (!user) return sendJson(res, 401, { ok: false, error: 'Sessão inválida.' });

    if (!Array.isArray(user.profiles)) user.profiles = [];

    if (profileId) {
      const existing = user.profiles.find((p) => p.id === profileId);
      if (!existing) return sendJson(res, 404, { ok: false, error: 'Perfil não encontrado.' });
      existing.name = name;
      existing.avatar = avatar;
      existing.avatarId = avatar;
      existing.isKids = isKids;
      existing.pin = pin;
    } else {
      if (user.profiles.length >= 5) {
        return sendJson(res, 400, { ok: false, error: 'Limite máximo de 5 perfis por conta atingido.' });
      }
      user.profiles.push({
        id: `prof_${crypto.randomBytes(4).toString('hex')}`,
        name,
        avatar,
        avatarId: avatar,
        isKids,
        pin,
        favorites: [],
        history: []
      });
    }

    saveDb(db);
    return sendJson(res, 200, { ok: true, user: sanitizeUser(user) });
  }

  // 8. Excluir Perfil
  if (pathname === '/api/saas/profiles/delete' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const token = extractToken(req, parsedReqUrl, body);
    const profileId = String(body.profileId || '').trim();

    const db = loadDb();
    const user = db.users.find((u) => u.id === token);
    if (!user) return sendJson(res, 401, { ok: false, error: 'Sessão inválida.' });

    if ((user.profiles || []).length <= 1) {
      return sendJson(res, 400, { ok: false, error: 'A conta precisa ter pelo menos 1 perfil ativo.' });
    }

    user.profiles = user.profiles.filter((p) => p.id !== profileId);
    saveDb(db);
    return sendJson(res, 200, { ok: true, user: sanitizeUser(user) });
  }

  // 9. Sincronizar Favoritos e Histórico por Perfil
  if (pathname === '/api/saas/profiles/sync-data' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const token = extractToken(req, parsedReqUrl, body);
    const profileId = String(body.profileId || '').trim();

    const db = loadDb();
    const user = db.users.find((u) => u.id === token);
    if (!user) return sendJson(res, 401, { ok: false, error: 'Sessão inválida.' });

    const prof = (user.profiles || []).find((p) => p.id === profileId);
    if (prof) {
      if (Array.isArray(body.favorites)) prof.favorites = body.favorites.slice(0, 200);
      if (Array.isArray(body.history)) prof.history = body.history.slice(0, 50);
      saveDb(db);
    }

    return sendJson(res, 200, { ok: true });
  }

  // 10. Ativar / Renovar Assinatura ou Fazer Upgrade de Plano (via Código Voucher ou Confirmação PIX)
  if (pathname === '/api/saas/subscription/activate' && req.method === 'POST') {
    const body = await parseJsonBody(req);
    const token = extractToken(req, parsedReqUrl, body);
    const voucherCode = String(body.voucherCode || '').trim().toUpperCase();
    const planId = String(body.planId || '').trim();
    const method = String(body.method || '').trim();

    const db = loadDb();
    const user = db.users.find((u) => u.id === token);
    if (!user) return sendJson(res, 401, { ok: false, error: 'Sessão inválida.' });

    const now = Date.now();
    const currentExp = Math.max(now, new Date(user.expiresAt || 0).getTime());

    if (method === 'voucher' || (voucherCode && method !== 'pix_confirm')) {
      const v = db.vouchers.find((x) => x.code.toUpperCase() === voucherCode);
      if (!v || v.usedCount >= v.maxUses) {
        return sendJson(res, 400, { ok: false, error: 'Código de ativação inválido ou esgotado.' });
      }
      v.usedCount += 1;
      const planObj = PLANS.find((p) => p.id === v.planId) || PLANS[3];
      user.planId = planObj.id;
      user.maxScreens = planObj.maxScreens;
      user.status = 'active';
      const daysToAdd = v.durationDays || v.days || 30;
      user.expiresAt = new Date(currentExp + daysToAdd * 86400000).toISOString();
      saveDb(db);
      return sendJson(res, 200, {
        ok: true,
        message: `🎉 Código ${voucherCode} ativado! Plano ${planObj.name} liberado com ${planObj.maxScreens} tela(s) simultânea(s).`,
        user: sanitizeUser(user)
      });
    }

    if (planId) {
      const planObj = PLANS.find((p) => p.id === planId);
      if (!planObj) return sendJson(res, 400, { ok: false, error: 'Plano inválido.' });
      user.planId = planObj.id;
      user.maxScreens = planObj.maxScreens;
      user.status = 'active';
      user.expiresAt = new Date(currentExp + planObj.durationDays * 86400000).toISOString();
      saveDb(db);
      return sendJson(res, 200, {
        ok: true,
        message: `✅ Plano ${planObj.name} (${planObj.maxScreens} tela(s) simultânea(s)) ativado com sucesso!`,
        user: sanitizeUser(user)
      });
    }

    return sendJson(res, 400, { ok: false, error: 'Informe um código de ativação ou selecione um plano.' });
  }

  // ==============================================================
  // ROTAS DO PAINEL ADMIN (GERENCIADOR DE CLIENTES, ASSINATURAS E TELAS)
  // ==============================================================
  if (pathname.startsWith('/api/saas/admin/')) {
    const db = loadDb();

    if (pathname === '/api/saas/admin/overview' && req.method === 'GET') {
      const token = extractToken(req, parsedReqUrl);
      const caller = db.users.find((u) => u.id === token);
      if (!caller || caller.role !== 'admin') {
        return sendJson(res, 403, { ok: false, error: 'Acesso restrito ao Administrador.' });
      }
      const usersList = db.users.map(sanitizeUser);
      const allScreens = getAllActiveScreens();
      const activeUsers = usersList.filter((u) => u.status === 'active');
      const monthlyRevenue = activeUsers.reduce((acc, u) => {
        const p = PLANS.find((pl) => pl.id === u.planId);
        return acc + (p ? p.price : 0);
      }, 0);

      const metrics = {
        totalUsers: usersList.length,
        activeSubscriptions: activeUsers.length,
        expiredSubscriptions: usersList.length - activeUsers.length,
        expiredOrBlocked: usersList.length - activeUsers.length,
        totalActiveScreens: allScreens.length,
        onlineScreensNow: allScreens.length,
        monthlyRevenue,
        estimatedMonthlyRevenueFormatted: `R$ ${monthlyRevenue.toFixed(2).replace('.', ',')}`
      };

      return sendJson(res, 200, {
        ok: true,
        metrics,
        stats: metrics,
        users: usersList,
        activeScreens: allScreens,
        vouchers: (db.vouchers || []).map((v) => ({
          ...v,
          days: v.days || v.durationDays || 30
        })),
        pixSettings: db.pixSettings || {},
        adBanners: Array.isArray(db.adBanners) ? db.adBanners : DEFAULT_AD_BANNERS,
        adBannerSettings: db.adBannerSettings || DEFAULT_AD_BANNER_SETTINGS,
        plans: PLANS
      });
    }

    const body = await parseJsonBody(req);
    const token = extractToken(req, parsedReqUrl, body);
    const adminUser = db.users.find((u) => u.id === token);
    if (!adminUser || adminUser.role !== 'admin') {
      return sendJson(res, 403, { ok: false, error: 'Acesso restrito ao Administrador.' });
    }

    // Criar Novo Cliente no Admin (/api/saas/admin/user-create ou action === 'create')
    if (
      (pathname === '/api/saas/admin/user-create' ||
        (pathname === '/api/saas/admin/user-update' && body.action === 'create')) &&
      req.method === 'POST'
    ) {
      const name = String(body.name || '').trim();
      const email = String(body.email || '').trim().toLowerCase();
      const password = String(body.password || '123456').trim();
      const planId = String(body.planId || 'padrao_2').trim();
      const planObj = PLANS.find((p) => p.id === planId) || PLANS[2];
      const maxScreens = Number(body.maxScreens) || planObj.maxScreens;
      const days = Number(body.days) || 30;

      if (!name || !email) {
        return sendJson(res, 400, { ok: false, error: 'Nome e e-mail são obrigatórios.' });
      }
      if (db.users.some((u) => u.email.toLowerCase() === email)) {
        return sendJson(res, 400, { ok: false, error: 'Já existe um cliente com este e-mail.' });
      }

      const now = Date.now();
      const newClient = {
        id: `usr_${crypto.randomBytes(5).toString('hex')}`,
        name,
        email,
        password,
        role: body.role === 'admin' ? 'admin' : 'user',
        planId: planObj.id,
        maxScreens,
        status: 'active',
        createdAt: new Date(now).toISOString(),
        expiresAt: new Date(now + days * 86400000).toISOString(),
        profiles: [
          {
            id: `prof_${crypto.randomBytes(4).toString('hex')}`,
            name: name.split(' ')[0] || 'Principal',
            avatar: 'red_boss',
            avatarId: 'red_boss',
            isKids: false,
            pin: '',
            favorites: [],
            history: []
          },
          {
            id: `prof_${crypto.randomBytes(4).toString('hex')}`,
            name: 'Kids',
            avatar: 'kids_bear',
            avatarId: 'kids_bear',
            isKids: true,
            pin: '',
            favorites: [],
            history: []
          }
        ]
      };
      db.users.unshift(newClient);
      saveDb(db);
      return sendJson(res, 200, { ok: true, user: sanitizeUser(newClient), users: db.users.map(sanitizeUser) });
    }

    // Editar Cliente / Assinatura / Telas no Admin
    if (pathname === '/api/saas/admin/user-update' && req.method === 'POST') {
      const action = body.action || 'update';
      const target = db.users.find((u) => u.id === body.userId);
      if (!target) return sendJson(res, 404, { ok: false, error: 'Cliente não encontrado.' });

      if (action === 'delete') {
        if (target.id === 'usr_admin_master') {
          return sendJson(res, 400, { ok: false, error: 'Não é permitido excluir o Admin Master.' });
        }
        db.users = db.users.filter((u) => u.id !== target.id);
        saveDb(db);
        return sendJson(res, 200, { ok: true, users: db.users.map(sanitizeUser) });
      }

      if (action === 'add_days' || body.addDays) {
        const addDays = Number(body.addDays || body.days) || 30;
        const baseMs = Math.max(Date.now(), new Date(target.expiresAt || 0).getTime());
        target.expiresAt = new Date(baseMs + addDays * 86400000).toISOString();
        target.status = 'active';
      } else {
        if (body.planId) {
          target.planId = body.planId;
          const pObj = PLANS.find((p) => p.id === body.planId);
          if (pObj && body.maxScreens === undefined) target.maxScreens = pObj.maxScreens;
        }
        if (body.maxScreens !== undefined) {
          target.maxScreens = Math.max(1, Math.min(20, Number(body.maxScreens) || 1));
        }
        if (body.status) {
          target.status = body.status;
          if (body.status === 'blocked') {
            for (const [key, sess] of activeScreensMap.entries()) {
              if (sess.userId === target.id) {
                activeScreensMap.delete(key);
                kickedDevicesMap.set(key, 'Sua conta foi bloqueada pelo Administrador.');
              }
            }
          }
        }
        if (body.password) {
          target.password = String(body.password).trim();
        }
        if (body.name) {
          target.name = String(body.name).trim();
        }
      }

      saveDb(db);
      return sendJson(res, 200, { ok: true, users: db.users.map(sanitizeUser) });
    }

    // Criar Código Voucher de Ativação
    if (pathname === '/api/saas/admin/voucher-create' && req.method === 'POST') {
      const planId = String(body.planId || 'familia_4k').trim();
      const durationDays = Number(body.days || body.durationDays) || 30;
      const maxUses = Number(body.maxUses) || 1;
      const customCode = String(body.code || '').trim().toUpperCase();
      const code =
        customCode ||
        `PF-${crypto.randomBytes(2).toString('hex').toUpperCase()}-${crypto
          .randomBytes(2)
          .toString('hex')
          .toUpperCase()}`;

      const newVoucher = {
        code,
        planId,
        durationDays,
        days: durationDays,
        maxUses,
        usedCount: 0,
        createdAt: new Date().toISOString()
      };
      db.vouchers.unshift(newVoucher);
      saveDb(db);
      return sendJson(res, 200, { ok: true, voucher: newVoucher, vouchers: db.vouchers });
    }

    if (pathname === '/api/saas/admin/voucher-delete' && req.method === 'POST') {
      db.vouchers = (db.vouchers || []).filter((v) => v.code !== body.code);
      saveDb(db);
      return sendJson(res, 200, { ok: true, vouchers: db.vouchers });
    }

    if (pathname === '/api/saas/admin/pix-settings' && req.method === 'POST') {
      db.pixSettings = {
        pixKey: String(body.pixKey || db.pixSettings?.pixKey || '').trim(),
        pixReceiver: String(body.pixReceiver || db.pixSettings?.pixReceiver || '').trim(),
        whatsappSupport: String(body.whatsappSupport || db.pixSettings?.whatsappSupport || '').trim()
      };
      saveDb(db);
      return sendJson(res, 200, { ok: true, pixSettings: db.pixSettings });
    }

    // ==============================================================
    // GERENCIAMENTO DE BANNERS DE ANÚNCIO EM CARROSSEL (PAINEL MASTER)
    // ==============================================================
    if (pathname === '/api/saas/admin/banner-save' && req.method === 'POST') {
      if (!Array.isArray(db.adBanners)) db.adBanners = [];
      const bannerId = String(body.bannerId || '').trim();
      const title = String(body.title || '').trim();
      const subtitle = String(body.subtitle || '').trim();
      const ctaText = String(body.ctaText || '').trim();
      const linkUrl = String(body.linkUrl || '').trim();
      const badge = String(body.badge || 'ANÚNCIO PATROCINADO').trim();
      const rawImage = String(body.imageData || body.imageUrl || '').trim();

      if (!rawImage) {
        return sendJson(res, 400, { ok: false, error: 'Envie uma imagem do seu computador ou informe a URL do banner.' });
      }

      const finalImageUrl = saveBannerImageData(rawImage);

      if (bannerId) {
        const existing = db.adBanners.find((b) => b.id === bannerId);
        if (!existing) {
          return sendJson(res, 404, { ok: false, error: 'Banner não encontrado.' });
        }
        existing.title = title;
        existing.subtitle = subtitle;
        existing.ctaText = ctaText;
        existing.linkUrl = linkUrl;
        existing.badge = badge;
        existing.imageUrl = finalImageUrl;
        if (body.active !== undefined) existing.active = Boolean(body.active);
      } else {
        const newBanner = {
          id: `bnr_${crypto.randomBytes(4).toString('hex')}`,
          title,
          subtitle,
          ctaText,
          linkUrl,
          badge,
          imageUrl: finalImageUrl,
          active: body.active !== undefined ? Boolean(body.active) : true,
          createdAt: new Date().toISOString()
        };
        db.adBanners.unshift(newBanner);
      }

      saveDb(db);
      return sendJson(res, 200, {
        ok: true,
        adBanners: db.adBanners,
        adBannerSettings: db.adBannerSettings || DEFAULT_AD_BANNER_SETTINGS
      });
    }

    if (pathname === '/api/saas/admin/banner-delete' && req.method === 'POST') {
      if (!Array.isArray(db.adBanners)) db.adBanners = [];
      const bannerId = String(body.bannerId || '').trim();
      const target = db.adBanners.find((b) => b.id === bannerId);
      if (target && typeof target.imageUrl === 'string' && target.imageUrl.startsWith('/uploads/banners/')) {
        try {
          const localPath = path.join(__dirname, 'public', target.imageUrl);
          if (fs.existsSync(localPath)) fs.unlinkSync(localPath);
        } catch {}
      }
      db.adBanners = db.adBanners.filter((b) => b.id !== bannerId);
      saveDb(db);
      return sendJson(res, 200, {
        ok: true,
        adBanners: db.adBanners,
        adBannerSettings: db.adBannerSettings || DEFAULT_AD_BANNER_SETTINGS
      });
    }

    if (pathname === '/api/saas/admin/banner-reorder' && req.method === 'POST') {
      if (!Array.isArray(db.adBanners)) db.adBanners = [];
      const bannerId = String(body.bannerId || '').trim();
      const direction = String(body.direction || '').trim(); // 'up' | 'down' | 'toggle'
      const idx = db.adBanners.findIndex((b) => b.id === bannerId);
      if (idx !== -1) {
        if (direction === 'toggle') {
          db.adBanners[idx].active = !db.adBanners[idx].active;
        } else if (direction === 'up' && idx > 0) {
          const temp = db.adBanners[idx - 1];
          db.adBanners[idx - 1] = db.adBanners[idx];
          db.adBanners[idx] = temp;
        } else if (direction === 'down' && idx < db.adBanners.length - 1) {
          const temp = db.adBanners[idx + 1];
          db.adBanners[idx + 1] = db.adBanners[idx];
          db.adBanners[idx] = temp;
        }
        saveDb(db);
      }
      return sendJson(res, 200, {
        ok: true,
        adBanners: db.adBanners,
        adBannerSettings: db.adBannerSettings || DEFAULT_AD_BANNER_SETTINGS
      });
    }

    if (pathname === '/api/saas/admin/banner-settings' && req.method === 'POST') {
      const current = db.adBannerSettings || DEFAULT_AD_BANNER_SETTINGS;
      db.adBannerSettings = {
        enabled: body.enabled !== undefined ? Boolean(body.enabled) : current.enabled,
        intervalSeconds: Math.max(2, Math.min(60, Number(body.intervalSeconds) || current.intervalSeconds || 6)),
        backgroundOpacity:
          body.backgroundOpacity !== undefined
            ? Math.max(0.15, Math.min(1, Number(body.backgroundOpacity)))
            : current.backgroundOpacity || 0.62,
        showAdOverlayCard:
          body.showAdOverlayCard !== undefined ? Boolean(body.showAdOverlayCard) : current.showAdOverlayCard
      };
      if (body.resetDefaults) {
        db.adBanners = [...DEFAULT_AD_BANNERS];
      }
      saveDb(db);
      return sendJson(res, 200, {
        ok: true,
        adBanners: db.adBanners,
        adBannerSettings: db.adBannerSettings
      });
    }
  }

  return sendJson(res, 404, { ok: false, error: 'Rota SaaS não encontrada.' });
}

module.exports = { handleSaasRequest };
