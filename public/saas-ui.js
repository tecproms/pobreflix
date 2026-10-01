const { useState, useEffect } = React;

const DEFAULT_AVATARS = [
  { id: 'red', emoji: '😎', bg: 'linear-gradient(135deg, #e50914 0%, #831010 100%)', label: 'Chefão VIP' },
  { id: 'blue', emoji: '🤠', bg: 'linear-gradient(135deg, #0072ff 0%, #00c6ff 100%)', label: 'Aventureiro' },
  { id: 'purple', emoji: '👾', bg: 'linear-gradient(135deg, #7f00ff 0%, #e100ff 100%)', label: 'Gamer Pro' },
  { id: 'green', emoji: '🦖', bg: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', label: 'Dino Rex' },
  { id: 'gold', emoji: '👑', bg: 'linear-gradient(135deg, #f7971e 0%, #ffd200 100%)', label: 'Realeza' },
  { id: 'pink', emoji: '🍿', bg: 'linear-gradient(135deg, #ff0844 0%, #ffb199 100%)', label: 'Pipoca Lover' },
  { id: 'cyber', emoji: '🤖', bg: 'linear-gradient(135deg, #0f2027 0%, #2c5364 100%)', label: 'Cyber Bot' },
  { id: 'anime', emoji: '🦊', bg: 'linear-gradient(135deg, #ff4e50 0%, #f9d423 100%)', label: 'Otaku Ninja' },
  { id: 'hero', emoji: '🦸', bg: 'linear-gradient(135deg, #1a2a6c 0%, #b21f1f 50%, #fdbb2d 100%)', label: 'Super-Herói' },
  { id: 'cat', emoji: '🐱', bg: 'linear-gradient(135deg, #4776e6 0%, #8e54e9 100%)', label: 'Gatinho' },
  { id: 'kids_1', emoji: '🧸', bg: 'linear-gradient(135deg, #ff6a88 0%, #ff99ac 100%)', label: 'Kids Ursinho' },
  { id: 'kids_2', emoji: '🚀', bg: 'linear-gradient(135deg, #00b4db 0%, #0083b0 100%)', label: 'Kids Astronauta' }
];


const LANDING_MOVIES = [
  { name: 'Velozes & Furiosos 10', poster: 'https://image.tmdb.org/t/p/w500/xNqt1Om0IlUhDOjZRCL5ewoazVV.jpg', tag: 'AÇÃO • 2023', badge: 'TOP 1', rating: '9.8' },
  { name: 'Vingadores: Ultimato', poster: 'https://image.tmdb.org/t/p/w500/q6725aR8Zs4IwGMXzZT8aC8lh41.jpg', tag: 'MARVEL • 4K', badge: 'TOP 2', rating: '9.9' },
  { name: 'Homem-Aranha: Sem Volta', poster: 'https://image.tmdb.org/t/p/w500/xaKydnMw6wR1MBAjS5seGPVusbs.jpg', tag: 'HERÓIS • 4K', badge: 'TOP 3', rating: '9.8' },
  { name: 'Duna: Parte Dois', poster: 'https://image.tmdb.org/t/p/w500/VMy4UGsI2u3f4fALGeCqCdsQBb.jpg', tag: 'FICÇÃO • 4K', badge: 'TOP 4', rating: '9.7' },
  { name: 'Oppenheimer', poster: 'https://image.tmdb.org/t/p/w500/dUPQszWoRSE9FucJTbVp2bwEi9G.jpg', tag: 'OSCAR • 4K', badge: 'TOP 5', rating: '9.6' },
  { name: 'Avatar: O Caminho da Água', poster: 'https://image.tmdb.org/t/p/w500/hm6nONQOgVpKmRK5YUX9EqfJ0NH.jpg', tag: 'AVENTURA • 4K', badge: 'TOP 6', rating: '9.5' },
  { name: 'Batman (2022)', poster: 'https://image.tmdb.org/t/p/w500/wd7b4Nv9QBHDTIjc2m7sr0IUMoh.jpg', tag: 'DC • 4K', badge: 'TOP 7', rating: '9.4' },
  { name: 'John Wick 4: Baba Yaga', poster: 'https://image.tmdb.org/t/p/w500/rXTqhpkpj6E0YilQ49PK1SSqLhm.jpg', tag: 'AÇÃO • 4K', badge: 'TOP 8', rating: '9.7' },
  { name: 'Super Mario Bros. O Filme', poster: 'https://image.tmdb.org/t/p/w500/ij8sapIEbLf2g8npOu6XgsQS2w0.jpg', tag: 'KIDS • 4K', badge: 'TOP 9', rating: '9.5' },
  { name: 'Top Gun: Maverick', poster: 'https://image.tmdb.org/t/p/w500/kPbuLGVSJHATkW9fX9L3h1wM0Pa.jpg', tag: 'AÇÃO • 4K', badge: 'TOP 10', rating: '9.7' },
  { name: 'Harry Potter Relíquias 2', poster: 'https://image.tmdb.org/t/p/w500/yD3VosOVW8WxPUzBDpEdzfv5pGx.jpg', tag: 'FANTASIA • FHD', badge: 'SAGA', rating: '9.8' },
  { name: 'Jogos Vorazes: A Cantiga', poster: 'https://image.tmdb.org/t/p/w500/a9z2cmIBfx99dtzj8TaSFU50AnW.jpg', tag: 'AÇÃO • 4K', badge: 'EM ALTA', rating: '9.4' }
];

const LANDING_SERIES = [
  { name: 'Stranger Things', poster: 'https://image.tmdb.org/t/p/w500/twfKp60THrcOIep9sjHODOOfO8d.jpg', tag: 'NETFLIX • 4K', badge: 'SÉRIE VIP', rating: '9.9' },
  { name: 'Wandinha (Wednesday)', poster: 'https://image.tmdb.org/t/p/w500/7rxiQrZjrer0RB9qNA8rHYFo53R.jpg', tag: 'NETFLIX • 4K', badge: 'SÉRIE VIP', rating: '9.7' },
  { name: 'The Last of Us', poster: 'https://image.tmdb.org/t/p/w500/qWo5TP7mBijoZrfxBJkUMctkBt0.jpg', tag: 'HBO MAX • 4K', badge: 'SÉRIE VIP', rating: '9.8' },
  { name: 'Breaking Bad', poster: 'https://image.tmdb.org/t/p/w500/hGwm9Cj3CdbJIqQWNExQqiYmCd4.jpg', tag: 'CLÁSSICO • 4K', badge: 'NOTA 10', rating: '10' },
  { name: 'A Casa do Dragão', poster: 'https://image.tmdb.org/t/p/w500/oKJDm4QCKbp6mR4FnxXrFlPJP8Y.jpg', tag: 'HBO MAX • 4K', badge: 'NOVA TEMP.', rating: '9.6' },
  { name: 'Game of Thrones', poster: 'https://image.tmdb.org/t/p/w500/aqomTRKjNZkmNEeOZnEmWrFTmKU.jpg', tag: 'HBO • 4K', badge: 'COMPLETA', rating: '9.7' },
  { name: 'Round 6', poster: 'https://image.tmdb.org/t/p/w500/sUolfAUop5JtKkO0fSq33r9KCKW.jpg', tag: 'NETFLIX • 4K', badge: 'FENÔMENO', rating: '9.5' },
  { name: 'The Boys', poster: 'https://image.tmdb.org/t/p/w500/in1R2dDc421JxsoRWaIIAqVI2KE.jpg', tag: 'PRIME • 4K', badge: 'NOVA TEMP.', rating: '9.7' },
  { name: 'Peaky Blinders', poster: 'https://image.tmdb.org/t/p/w500/i0uajcHH9yogXMfDHpOXexIukG9.jpg', tag: 'NETFLIX • 4K', badge: 'COMPLETA', rating: '9.8' },
  { name: 'One Piece (Dublado)', poster: 'https://image.tmdb.org/t/p/w500/aesLt9fsKSA6KCgGxA60VVxjtLk.jpg', tag: 'ANIME • DUBLADO', badge: 'TOP ANIME', rating: '9.9' },
  { name: 'Naruto Shippuden', poster: 'https://image.tmdb.org/t/p/w500/nRJmByfK9XdtOY73VArcN8KpKVs.jpg', tag: 'ANIME • DUBLADO', badge: 'LENDÁRIO', rating: '9.9' },
  { name: 'Demon Slayer (Kimetsu)', poster: 'https://image.tmdb.org/t/p/w500/7Uj6vqmznWQ3w3hpQ1eIY9mMyMw.jpg', tag: 'ANIME • DUBLADO', badge: '4K ANIME', rating: '9.8' },
  { name: 'Dragon Ball Super', poster: 'https://image.tmdb.org/t/p/w500/cQDCIp92rTzTnd8mjb1syLhrAqy.jpg', tag: 'ANIME • DUBLADO', badge: 'ANIME VIP', rating: '9.7' },
  { name: 'Jujutsu Kaisen', poster: 'https://image.tmdb.org/t/p/w500/8R1mMSC1gX1cg5ed7ns49JOEqw3.jpg', tag: 'ANIME • DUBLADO', badge: 'EM ALTA', rating: '9.8' }
];

const DEFAULT_PLANS = {
  teste_gratis: {
    id: 'teste_gratis',
    name: 'Teste Grátis (2 Horas)',
    price: 0.0,
    priceFormatted: 'Grátis (2 Horas)',
    maxScreens: 1,
    maxProfiles: 2,
    quality: 'HD 720p',
    durationDays: 2 / 24,
    durationHours: 2,
    badge: 'TESTE 2 HORAS',
    features: ['2 Horas Liberadas Mediante Cadastro', '1 Tela Simultânea', '20.000 Filmes + 20.000 Séries + 10.000 Animes']
  },
  basico_1: {
    id: 'basico_1',
    name: 'Plano Básico (1 Tela)',
    price: 14.9,
    priceFormatted: 'R$ 14,90/mês',
    maxScreens: 1,
    maxProfiles: 3,
    quality: 'Full HD 1080p',
    durationDays: 30,
    badge: 'INDIVIDUAL',
    features: ['1 Tela Simultânea', 'Até 3 Perfis', 'Full HD 1080p • 100% Dublado • 0% Anúncios']
  },
  padrao_2: {
    id: 'padrao_2',
    name: 'Plano Duplo (2 Telas)',
    price: 24.9,
    priceFormatted: 'R$ 24,90/mês',
    maxScreens: 2,
    maxProfiles: 4,
    quality: 'Full HD 1080p',
    durationDays: 30,
    badge: 'MAIS ASSINADO',
    features: ['2 Telas Simultâneas', 'Até 4 Perfis + PIN', 'Filmes, Séries e 109 Canais Ao Vivo']
  },
  familia_4k: {
    id: 'familia_4k',
    name: 'Plano Família 4K VIP (4 Telas)',
    price: 34.9,
    priceFormatted: 'R$ 34,90/mês',
    maxScreens: 4,
    maxProfiles: 5,
    quality: '4K Ultra HD + HDR',
    durationDays: 30,
    badge: 'VIP COMPLETO',
    features: ['4 Telas Simultâneas', 'Até 5 Perfis (Kids + PIN)', 'Gerenciador de Telas em Tempo Real']
  }
};

function getAvatarInfo(avatarId, customAvatars) {
  const list = Array.isArray(customAvatars) && customAvatars.length > 0 ? customAvatars : DEFAULT_AVATARS;
  return list.find((a) => a.id === avatarId) || list[0];
}

function getOrCreateDeviceIdentity() {
  try {
    let devId = sessionStorage.getItem('pobreflix_device_id');
    if (!devId) {
      devId = 'scr_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
      sessionStorage.setItem('pobreflix_device_id', devId);
    }
    const ua = navigator.userAgent || '';
    let browser = 'Navegador Web';
    if (/Edg\//i.test(ua)) browser = 'Microsoft Edge';
    else if (/Chrome\//i.test(ua)) browser = 'Google Chrome';
    else if (/Firefox\//i.test(ua)) browser = 'Mozilla Firefox';
    else if (/Safari\//i.test(ua)) browser = 'Apple Safari';

    let os = 'Dispositivo';
    if (/Windows/i.test(ua)) os = 'Windows PC';
    else if (/Android/i.test(ua)) os = 'Android TV / Celular';
    else if (/iPhone|iPad/i.test(ua)) os = 'iPhone / iPad';
    else if (/Mac OS/i.test(ua)) os = 'MacBook / iMac';
    else if (/SmartTV|Tizen|Web0S/i.test(ua)) os = 'Smart TV';

    const customName = localStorage.getItem('pobreflix_custom_device_name');
    return {
      deviceId: devId,
      deviceName: customName || `${os} • ${browser}`
    };
  } catch {
    return { deviceId: 'scr_default', deviceName: 'Navegador Web' };
  }
}

// ==========================================
// 1. TELA PÚBLICA DE APRESENTAÇÃO DA PLATAFORMA + LOGIN E CADASTRO OBRIGATÓRIO
// ==========================================
function AuthLandingScreen({ saasConfig, onAuthSuccess }) {
  // 'landing' = Tela Pública de Apresentação | 'login' = Entrar | 'register' = Criar Conta
  const [viewMode, setViewMode] = useState('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('teste_gratis');
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const plans = saasConfig?.plans || DEFAULT_PLANS;
  const planList = Object.values(plans);

  // Verificar e-mail na Tela Pública: se tiver conta vai p/ Login, se não tiver vai p/ Criar Conta!
  const handleStartWithEmail = async (e) => {
    if (e) e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      setViewMode('register');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');
    try {
      const res = await fetch('/api/saas/check-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail })
      });
      const data = await res.json();
      if (data && data.exists) {
        setInfoMsg('Conta encontrada! Digite sua senha abaixo para entrar.');
        setViewMode('login');
      } else {
        setInfoMsg(
          'Este e-mail ainda não possui conta! Complete seu cadastro abaixo para liberar seu acesso ou ativar o Teste Grátis de 2 Horas.'
        );
        setSelectedPlan('teste_gratis');
        setViewMode('register');
      }
    } catch {
      setViewMode('login');
    } finally {
      setLoading(false);
    }
  };

  // Login Inteligente:
  // - Se for tecpro@gmail.com / 53915030 -> redireciona direto para o Painel Master!
  // - Se não tiver conta -> redireciona automaticamente para a tela de Criar Conta!
  // - Se tiver conta -> redireciona direto para escolher as telas/perfis do Streaming!
  const handleLoginSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/saas/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          password
        })
      });
      const data = await res.json();

      // Se o usuário tentou entrar mas ainda NÃO tem conta, redireciona na hora para Criar Conta!
      if (data.code === 'ACCOUNT_NOT_FOUND') {
        setSelectedPlan('teste_gratis');
        setViewMode('register');
        setInfoMsg(
          data.error ||
            'Você ainda não possui conta com este e-mail! Preencha seu nome abaixo para criar sua conta e liberar o Teste Grátis de 2 Horas.'
        );
        return;
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Falha ao entrar na conta.');
      }

      onAuthSuccess(data.token, data.user, data.redirectTo);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setInfoMsg('');
    setLoading(true);
    try {
      const res = await fetch('/api/saas/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email: email.trim(),
          password,
          phone,
          planId: selectedPlan,
          voucherCode: voucherCode.trim()
        })
      });
      const data = await res.json();

      if (data.code === 'EMAIL_ALREADY_EXISTS') {
        setViewMode('login');
        setInfoMsg('Este e-mail já possui conta! Digite sua senha para entrar.');
        return;
      }

      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Não foi possível criar a conta.');
      }
      onAuthSuccess(data.token, data.user, 'streaming_profiles');
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="saas-fullscreen-overlay">
      {/* BARRA SUPERIOR PÚBLICA DA PLATAFORMA */}
      <div className="saas-top-header">
        <div
          className="pobreflix-logo"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            setViewMode('landing');
            setErrorMsg('');
            setInfoMsg('');
          }}
          title="Voltar para a Apresentação da Plataforma"
        >
          <span className="pobreflix-wordmark">POBREFLIX</span>
          <span className="pobreflix-badge">STREAMING VIP</span>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {viewMode !== 'landing' && (
            <button
              type="button"
              className="nf-btn nf-btn-dark"
              onClick={() => {
                setViewMode('landing');
                setErrorMsg('');
                setInfoMsg('');
              }}
            >
              ← Apresentação
            </button>
          )}
          <button
            type="button"
            className="nf-btn nf-btn-dark"
            onClick={() => {
              setSelectedPlan('teste_gratis');
              setViewMode('register');
              setErrorMsg('');
              setInfoMsg('');
            }}
          >
            ✨ Criar Conta (Teste 2h Grátis)
          </button>
          <button
            type="button"
            className="nf-btn nf-btn-red"
            style={{ padding: '10px 22px', fontSize: '14.5px', fontWeight: 900 }}
            onClick={() => {
              setViewMode('login');
              setErrorMsg('');
              setInfoMsg('');
            }}
          >
            🔑 Entrar
          </button>
        </div>
      </div>

      {/* ====================================================
          MODO 1: TELA PÚBLICA DE APRESENTAÇÃO DA PLATAFORMA
         ==================================================== */}
      {viewMode === 'landing' && (
        <div style={{ width: '100%', maxWidth: '1240px', display: 'flex', flexDirection: 'column', gap: '48px', position: 'relative', zIndex: 2 }}>
          
          {/* HERO CENTRAL DE APRESENTAÇÃO VIP */}
          <div
            style={{
              position: 'relative',
              background: 'radial-gradient(circle at 50% 20%, rgba(229, 9, 20, 0.42) 0%, rgba(18, 18, 24, 0.98) 65%, #0d0d12 100%)',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '24px',
              padding: 'clamp(36px, 6vw, 68px) 24px',
              textAlign: 'center',
              boxShadow: '0 32px 90px rgba(0, 0, 0, 0.9), 0 0 60px rgba(229, 9, 20, 0.18)',
              overflow: 'hidden'
            }}
          >
            {/* MOSAICO DE CAPAS SUAVE AO FUNDO DO HERO */}
            <div className="landing-hero-backdrop">
              <div className="landing-backdrop-grid">
                {[...LANDING_MOVIES, ...LANDING_SERIES].slice(0, 16).map((item, idx) => (
                  <img key={idx} src={item.poster} alt="" loading="lazy" />
                ))}
              </div>
              <div className="landing-backdrop-overlay" />
            </div>

            {/* CONTEÚDO PRINCIPAL DO HERO */}
            <div style={{ position: 'relative', zIndex: 2 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(229, 9, 20, 0.28)',
                  border: '1px solid #e50914',
                  color: '#fff',
                  fontSize: '12.5px',
                  fontWeight: 900,
                  padding: '6px 18px',
                  borderRadius: '99px',
                  marginBottom: '20px',
                  letterSpacing: '1px',
                  boxShadow: '0 0 20px rgba(229, 9, 20, 0.4)'
                }}
              >
                🔥 O MAIOR STREAMING VIP DO BRASIL • 100% DUBLADO • ZERO TRAVAMENTOS
              </div>

              <h1
                style={{
                  fontSize: 'clamp(32px, 5.5vw, 60px)',
                  fontWeight: 950,
                  lineHeight: 1.1,
                  maxWidth: '960px',
                  margin: '0 auto',
                  color: '#fff',
                  letterSpacing: '-0.5px',
                  textShadow: '0 4px 24px rgba(0,0,0,0.8)'
                }}
              >
                Filmes do Cinema, Séries Famosas, Animes e TV Ao Vivo.
              </h1>

              <p
                style={{
                  fontSize: 'clamp(16px, 2.2vw, 20px)',
                  color: '#ddd',
                  maxWidth: '780px',
                  margin: '20px auto 32px',
                  lineHeight: 1.55,
                  textShadow: '0 2px 10px rgba(0,0,0,0.8)'
                }}
              >
                Os maiores sucessos da <strong>Netflix, HBO Max, Disney+, Prime Video e Cinema</strong> em um único aplicativo.{' '}
                <strong style={{ color: '#46d369' }}>
                  Cadastre-se e ganhe 2 Horas de Teste Grátis imediato!
                </strong>
              </p>

              {/* Barra de Entrada Rápida por E-mail (estilo Netflix) */}
              <form
                onSubmit={handleStartWithEmail}
                style={{
                  maxWidth: '680px',
                  margin: '0 auto',
                  display: 'flex',
                  gap: '12px',
                  flexWrap: 'wrap',
                  justifyContent: 'center'
                }}
              >
                <input
                  type="email"
                  className="form-input"
                  style={{
                    flex: '1 1 320px',
                    padding: '16px 20px',
                    fontSize: '16px',
                    background: 'rgba(0,0,0,0.82)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    borderRadius: '8px',
                    boxShadow: 'inset 0 2px 6px rgba(0,0,0,0.6)'
                  }}
                  placeholder="Digite seu e-mail para Começar..."
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <button
                  type="submit"
                  className="nf-btn nf-btn-red"
                  style={{
                    padding: '16px 34px',
                    fontSize: '17px',
                    fontWeight: 900,
                    borderRadius: '8px',
                    boxShadow: '0 0 25px rgba(229, 9, 20, 0.7)'
                  }}
                  disabled={loading}
                >
                  {loading ? 'Verificando...' : 'COMEÇAR TESTE GRÁTIS ›'}
                </button>
              </form>

              {/* SELOS DE QUALIDADE / CONFIANÇA */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '12px',
                  marginTop: '28px',
                  flexWrap: 'wrap'
                }}
              >
                {[
                  '⚡ 4K Ultra HD & Full HD',
                  '🎧 Áudio Dolby 5.1',
                  '🇧🇷 100% Dublado PT-BR',
                  '🚫 Zero Anúncios & Sem Travamentos',
                  '📱 Até 4 Telas Simultâneas'
                ].map((badgeText, bIdx) => (
                  <span
                    key={bIdx}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(8px)',
                      border: '1px solid rgba(255,255,255,0.14)',
                      padding: '6px 14px',
                      borderRadius: '99px',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: '#eee'
                    }}
                  >
                    {badgeText}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ====================================================
              CARROSSEL INFINITO 1: FILMES BLOCKBUSTERS DO CINEMA
             ==================================================== */}
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🔥</span>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0 }}>
                  Filmes Mais Assistidos do Cinema & Blockbusters
                </h2>
              </div>
              <span style={{ fontSize: '13px', color: '#e50914', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                🎬 20.000 Filmes • 100% Dublado • 4K
              </span>
            </div>

            <div className="landing-marquee-container">
              <div className="landing-marquee-track scroll-left">
                {[...LANDING_MOVIES, ...LANDING_MOVIES].map((m, idx) => (
                  <div
                    key={`m_${idx}`}
                    className="landing-poster-card"
                    onClick={() => {
                      setSelectedPlan('teste_gratis');
                      setViewMode('register');
                    }}
                    title={`Assistir ${m.name} no Teste Grátis`}
                  >
                    <span className="landing-poster-badge">{m.badge}</span>
                    <span className="landing-poster-rating">★ {m.rating}</span>
                    <img src={m.poster} alt={m.name} className="landing-poster-img" loading="lazy" />
                    <div className="landing-poster-info">
                      <div className="landing-poster-title">{m.name}</div>
                      <div className="landing-poster-tag">{m.tag}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ====================================================
              CARROSSEL INFINITO 2: SÉRIES CONSAGRADAS & ANIMES
             ==================================================== */}
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 8px', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '24px' }}>🍿</span>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: '#fff', margin: 0 }}>
                  Séries Famosas do Momento & Animes Clássicos
                </h2>
              </div>
              <span style={{ fontSize: '13px', color: '#46d369', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                📺 20.000 Séries • Temporadas Completas
              </span>
            </div>

            <div className="landing-marquee-container">
              <div className="landing-marquee-track scroll-right">
                {[...LANDING_SERIES, ...LANDING_SERIES].map((s, idx) => (
                  <div
                    key={`s_${idx}`}
                    className="landing-poster-card"
                    onClick={() => {
                      setSelectedPlan('teste_gratis');
                      setViewMode('register');
                    }}
                    title={`Assistir ${s.name} no Teste Grátis`}
                  >
                    <span
                      className="landing-poster-badge"
                      style={{ background: s.badge.includes('ANIME') ? '#f97316' : '#e50914' }}
                    >
                      {s.badge}
                    </span>
                    <span className="landing-poster-rating">★ {s.rating}</span>
                    <img src={s.poster} alt={s.name} className="landing-poster-img" loading="lazy" />
                    <div className="landing-poster-info">
                      <div className="landing-poster-title">{s.name}</div>
                      <div className="landing-poster-tag">{s.tag}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ====================================================
              VITRINES VISUAIS DOS GRANDES CATÁLOGOS (COM 3D STACK)
             ==================================================== */}
          <div style={{ width: '100%' }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <h2 style={{ fontSize: '30px', fontWeight: 900, color: '#fff' }}>
                Tudo o que Você Ama em um Só Lugar
              </h2>
              <p style={{ fontSize: '15px', color: '#aaa', marginTop: '6px' }}>
                Chega de pagar 5 assinaturas diferentes todo mês. No PobreFlix você tem acesso unificado a tudo!
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '20px'
              }}
            >
              {/* Card 1: Filmes */}
              <div className="landing-cat-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '28px' }}>🎬</span>
                    <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#fff', margin: 0 }}>20.000 Filmes de Sucesso</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.5 }}>
                    Lançamentos recém-saídos do cinema, sagas completas (Velozes e Furiosos, Harry Potter, Matrix) e clássicos em Full HD e 4K.
                  </p>
                </div>
                <div className="landing-cat-stack">
                  <img src="https://image.tmdb.org/t/p/w500/xNqt1Om0IlUhDOjZRCL5ewoazVV.jpg" alt="Velozes 10" />
                  <img src="https://image.tmdb.org/t/p/w500/q6725aR8Zs4IwGMXzZT8aC8lh41.jpg" alt="Vingadores" />
                  <img src="https://image.tmdb.org/t/p/w500/dUPQszWoRSE9FucJTbVp2bwEi9G.jpg" alt="Oppenheimer" />
                </div>
              </div>

              {/* Card 2: Séries */}
              <div className="landing-cat-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '28px' }}>📺</span>
                    <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#fff', margin: 0 }}>20.000 Séries Famosas</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.5 }}>
                    Temporadas completas com seleção de episódios, player inteligente que avança para o próximo episódio automaticamente.
                  </p>
                </div>
                <div className="landing-cat-stack">
                  <img src="https://image.tmdb.org/t/p/w500/twfKp60THrcOIep9sjHODOOfO8d.jpg" alt="Stranger Things" />
                  <img src="https://image.tmdb.org/t/p/w500/qWo5TP7mBijoZrfxBJkUMctkBt0.jpg" alt="The Last of Us" />
                  <img src="https://image.tmdb.org/t/p/w500/7rxiQrZjrer0RB9qNA8rHYFo53R.jpg" alt="Wandinha" />
                </div>
              </div>

              {/* Card 3: Animes & Kids */}
              <div className="landing-cat-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '28px' }}>⚔️</span>
                    <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#fff', margin: 0 }}>10.000 Animes & Kids</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.5 }}>
                    One Piece, Naruto, Dragon Ball e Demon Slayer 100% dublados, além de perfil Kids com bloqueio seguro para crianças.
                  </p>
                </div>
                <div className="landing-cat-stack">
                  <img src="https://image.tmdb.org/t/p/w500/aesLt9fsKSA6KCgGxA60VVxjtLk.jpg" alt="One Piece" />
                  <img src="https://image.tmdb.org/t/p/w500/nRJmByfK9XdtOY73VArcN8KpKVs.jpg" alt="Naruto" />
                  <img src="https://image.tmdb.org/t/p/w500/7Uj6vqmznWQ3w3hpQ1eIY9mMyMw.jpg" alt="Demon Slayer" />
                </div>
              </div>

              {/* Card 4: TV Ao Vivo */}
              <div className="landing-cat-card">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                    <span style={{ fontSize: '28px' }}>📡</span>
                    <h3 style={{ fontSize: '19px', fontWeight: 900, color: '#fff', margin: 0 }}>109 Canais de TV Ao Vivo</h3>
                  </div>
                  <p style={{ fontSize: '13px', color: '#aaa', lineHeight: 1.5 }}>
                    Futebol nacional e internacional ao vivo, filmes 24h, notícias e entretenimento com canais abertos e fechados sem delay.
                  </p>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '20px' }}>
                  {['⚽ Premiere', '📺 SporTV', '🍿 Telecine', '🎬 HBO', '🥊 ESPN', '📰 Globo', '📡 Band', '⭐ Discovery'].map((ch, i) => (
                    <span
                      key={i}
                      style={{
                        background: 'rgba(255,255,255,0.07)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        padding: '6px 12px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        color: '#eee'
                      }}
                    >
                      {ch}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ====================================================
              ASSISTA EM QUALQUER DISPOSITIVO
             ==================================================== */}
          <div
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,26,0.85) 0%, rgba(14,14,18,0.95) 100%)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '20px',
              padding: '36px 24px',
              textAlign: 'center'
            }}
          >
            <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#fff' }}>
              Assista Onde Quiser, Quando Quiser
            </h2>
            <p style={{ fontSize: '14.5px', color: '#aaa', maxWidth: '640px', margin: '8px auto 0' }}>
              Transmita na sua TV da sala ou assista no celular enquanto viaja. Compatibilidade total com seus aparelhos favoritos:
            </p>

            <div className="landing-device-grid">
              <div className="landing-device-item">
                <div className="landing-device-icon">📺</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>Smart TVs</div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>Samsung, LG, Android TV, Fire TV, Roku & Apple TV</div>
              </div>
              <div className="landing-device-item">
                <div className="landing-device-icon">📱</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>Celulares & Tablets</div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>Android, iPhone e iPad com modo cinema e tela cheia</div>
              </div>
              <div className="landing-device-item">
                <div className="landing-device-icon">💻</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>Computadores</div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>Google Chrome, Microsoft Edge, Opera e Safari</div>
              </div>
              <div className="landing-device-item">
                <div className="landing-device-icon">🎮</div>
                <div style={{ fontSize: '16px', fontWeight: 800, color: '#fff' }}>TV Box & Consoles</div>
                <div style={{ fontSize: '12px', color: '#aaa', marginTop: '4px' }}>Chromecast, Mi Box, MXQ, Xbox e PlayStation</div>
              </div>
            </div>
          </div>

          {/* ====================================================
              VITRINE DE PLANOS E TESTE GRÁTIS DE 2 HORAS
             ==================================================== */}
          <div
            style={{
              background: '#121217',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '20px',
              padding: '36px 24px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.8)'
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(70, 211, 105, 0.16)',
                  border: '1px solid #46d369',
                  color: '#46d369',
                  fontSize: '12px',
                  fontWeight: 900,
                  padding: '4px 14px',
                  borderRadius: '99px',
                  marginBottom: '10px'
                }}
              >
                SEM FIDELIDADE • CANCELE QUANDO QUISER
              </div>
              <h2 style={{ fontSize: '28px', fontWeight: 900, color: '#fff' }}>
                Planos Transparentes ou Teste Grátis de 2 Horas
              </h2>
              <p style={{ fontSize: '14px', color: '#aaa', marginTop: '4px' }}>
                Crie sua conta agora para liberar o acesso imediato sem precisar de cartão de crédito.
              </p>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '16px'
              }}
            >
              {planList.map((pl) => (
                <div
                  key={pl.id}
                  className="saas-plan-card"
                  style={{
                    padding: '24px 20px',
                    justifyContent: 'space-between',
                    gap: '16px',
                    borderColor: pl.id === 'familia_4k' ? '#e50914' : 'rgba(255,255,255,0.12)',
                    boxShadow: pl.id === 'familia_4k' ? '0 0 30px rgba(229, 9, 20, 0.28)' : 'none'
                  }}
                >
                  {pl.badge && (
                    <span
                      className="saas-plan-badge"
                      style={{
                        background: pl.id === 'familia_4k' ? '#e50914' : pl.id === 'teste_gratis' ? '#46d369' : '#333',
                        color: '#fff'
                      }}
                    >
                      {pl.badge}
                    </span>
                  )}
                  <div>
                    <div style={{ fontWeight: 900, fontSize: '18px', color: '#fff' }}>{pl.name}</div>
                    <div style={{ fontSize: '26px', fontWeight: 950, color: '#46d369', marginTop: '8px' }}>
                      {pl.priceFormatted}
                    </div>
                    <div style={{ fontSize: '12.5px', color: '#ccc', marginTop: '6px' }}>
                      📱 <strong>{pl.maxScreens}</strong>{' '}
                      {pl.maxScreens === 1 ? 'Tela Simultânea' : 'Telas Simultâneas'} • Até {pl.maxProfiles} Perfis
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
                      {(pl.features || []).map((f, i) => (
                        <div key={i} style={{ fontSize: '12.5px', color: '#bbb', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#46d369', fontWeight: 900 }}>✓</span> {f}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    className={`nf-btn ${pl.id === 'familia_4k' ? 'nf-btn-red' : 'nf-btn-white'}`}
                    style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '15px', fontWeight: 900, borderRadius: '8px' }}
                    onClick={() => {
                      setSelectedPlan(pl.id);
                      setViewMode('register');
                      setErrorMsg('');
                      setInfoMsg('');
                    }}
                  >
                    {pl.id === 'teste_gratis' ? '⏳ Ativar Teste 2h Grátis' : '🚀 Assinar Este Plano'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* RODAPÉ ELEGANTE POBREFLIX */}
          <div style={{ textAlign: 'center', padding: '20px 0 40px', color: '#777', fontSize: '12.5px' }}>
            <p>© 2026 PobreFlix VIP — O Maior Catálogo de Filmes, Séries, Animes e TV Ao Vivo do Brasil.</p>
            <p style={{ marginTop: '4px' }}>Dúvidas ou suporte? Entre em contato com o administrador da sua conta.</p>
          </div>
        </div>
      )}

      {/* ====================================================
          MODO 2 E 3: CARD DE LOGIN OU CADASTRO OBRIGATÓRIO
         ==================================================== */}
      {viewMode !== 'landing' && (
        <div className="saas-auth-card">
          {/* Coluna Esquerda: Resumo da Plataforma */}
          <div className="saas-auth-promo">
            <div>
              <div
                style={{
                  display: 'inline-block',
                  background: 'rgba(229, 9, 20, 0.25)',
                  border: '1px solid #e50914',
                  color: '#fff',
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '4px 10px',
                  borderRadius: '99px',
                  marginBottom: '14px',
                  letterSpacing: '0.8px'
                }}
              >
                🔒 ACESSO EXCLUSIVO PARA CONTAS CADASTRADAS
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 900, lineHeight: 1.15 }}>
                {viewMode === 'login'
                  ? 'Entre na sua conta para escolher seu perfil e assistir.'
                  : 'Crie sua conta para liberar o Streaming ou o Teste Grátis de 2 Horas.'}
              </h1>
              <p style={{ fontSize: '13.5px', color: '#bbb', marginTop: '12px', lineHeight: 1.5 }}>
                Na PobreFlix todas as telas e perfis são vinculados à sua conta. O Teste Grátis tem duração de{' '}
                <strong>2 Horas</strong> e exige o preenchimento do cadastro.
              </p>

              <div className="saas-feature-list">
                <div className="saas-feature-item">
                  <span>🎬</span>
                  <span>
                    <strong>20.000 Filmes + 20.000 Séries + 10.000 Animes & Kids</strong> + 109 Emissoras de TV Ao Vivo.
                  </span>
                </div>
                <div className="saas-feature-item">
                  <span>👥</span>
                  <span>
                    <strong>Seleção de Telas & Perfis (&ldquo;Quem está assistindo?&rdquo;)</strong> logo após o login.
                  </span>
                </div>
                <div className="saas-feature-item">
                  <span>⏳</span>
                  <span>
                    <strong>Teste Grátis de 2 Horas:</strong> liberado automaticamente ao criar sua conta.
                  </span>
                </div>
              </div>
            </div>

            <div className="saas-quick-demo-box">
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#46d369' }}>
                💡 COMO FUNCIONA O REDIRECIONAMENTO AUTOMÁTICO:
              </div>
              <div style={{ fontSize: '12px', color: '#ccc', lineHeight: 1.45 }}>
                • Se você já possui conta, digite seu e-mail e senha para ir direto para a escolha de telas e perfis do streaming.
                <br />• Se o seu e-mail ainda não tiver cadastro, o sistema redireciona automaticamente para criar sua conta!
              </div>
            </div>
          </div>

          {/* Coluna Direita: Formulário de Login ou Cadastro */}
          <div className="saas-auth-form-pane">
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '14px' }}>
              <button
                type="button"
                className={`nf-btn ${viewMode === 'login' ? 'nf-btn-red' : 'nf-btn-dark'}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  setViewMode('login');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
              >
                🔑 Entrar na Conta
              </button>
              <button
                type="button"
                className={`nf-btn ${viewMode === 'register' ? 'nf-btn-red' : 'nf-btn-dark'}`}
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => {
                  setViewMode('register');
                  setErrorMsg('');
                  setInfoMsg('');
                }}
              >
                ✨ Criar Conta (Teste 2h / Planos)
              </button>
            </div>

            {infoMsg && (
              <div
                style={{
                  background: 'rgba(70, 211, 105, 0.16)',
                  border: '1px solid #46d369',
                  color: '#fff',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700
                }}
              >
                ℹ️ {infoMsg}
              </div>
            )}

            {errorMsg && (
              <div
                style={{
                  background: 'rgba(229, 9, 20, 0.2)',
                  border: '1px solid #e50914',
                  color: '#ff8a8f',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600
                }}
              >
                ⚠️ {errorMsg}
              </div>
            )}

            {viewMode === 'login' ? (
              <form onSubmit={handleLoginSubmit} className="form-group" style={{ gap: '14px' }}>
                <div>
                  <h2 style={{ fontSize: '22px', fontWeight: 900 }}>Entrar na PobreFlix</h2>
                  <p style={{ fontSize: '13px', color: '#999', marginTop: '2px' }}>
                    Digite seu e-mail e senha. Caso ainda não tenha conta, você será direcionado para o cadastro.
                  </p>
                </div>

                <div>
                  <label className="form-label">E-mail da Conta</label>
                  <input
                    type="email"
                    className="form-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Senha</label>
                  <input
                    type="password"
                    className="form-input"
                    style={{ width: '100%', marginTop: '4px' }}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="nf-btn nf-btn-red"
                  style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px', marginTop: '6px' }}
                  disabled={loading}
                >
                  {loading ? 'Verificando acesso...' : '▶ Entrar Agora'}
                </button>

                <div style={{ fontSize: '12.5px', color: '#999', textAlign: 'center', marginTop: '6px' }}>
                  Ainda não possui cadastro?{' '}
                  <span
                    style={{ color: '#fff', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
                    onClick={() => {
                      setSelectedPlan('teste_gratis');
                      setViewMode('register');
                      setErrorMsg('');
                    }}
                  >
                    Criar conta e liberar Teste Grátis de 2 Horas
                  </span>
                </div>
              </form>
            ) : (
              <form onSubmit={handleRegisterSubmit} className="form-group" style={{ gap: '11px' }}>
                <div>
                  <h2 style={{ fontSize: '20px', fontWeight: 900 }}>Cadastro Obrigatório de Conta</h2>
                  <p style={{ fontSize: '12.5px', color: '#999' }}>
                    Preencha seus dados para liberar o Teste Grátis de 2 Horas ou assinar um plano com múltiplas telas.
                  </p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">Seu Nome Completo</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '100%', marginTop: '4px' }}
                      placeholder="Ex: João Silva"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">WhatsApp / Telefone</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '100%', marginTop: '4px' }}
                      placeholder="(11) 99999-9999"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label className="form-label">E-mail de Acesso</label>
                    <input
                      type="email"
                      className="form-input"
                      style={{ width: '100%', marginTop: '4px' }}
                      placeholder="voce@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Crie uma Senha (mín. 4 dígitos)</label>
                    <input
                      type="password"
                      className="form-input"
                      style={{ width: '100%', marginTop: '4px' }}
                      placeholder="Sua senha de acesso"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="form-label">Escolha o Teste Grátis (2 Horas) ou Plano de Telas</label>
                  <div className="saas-plan-grid">
                    {planList.map((pl) => (
                      <div
                        key={pl.id}
                        className={`saas-plan-card ${selectedPlan === pl.id ? 'selected' : ''}`}
                        onClick={() => setSelectedPlan(pl.id)}
                      >
                        {pl.badge && <span className="saas-plan-badge">{pl.badge}</span>}
                        <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#fff' }}>{pl.name}</div>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#46d369' }}>
                          {pl.priceFormatted}
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#bbb' }}>
                          📱 <strong>{pl.maxScreens}</strong>{' '}
                          {pl.maxScreens === 1 ? 'Tela Simultânea' : 'Telas Simultâneas'} • {pl.quality}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label">
                    🎟️ Código Pré-Pago / Voucher (Opcional)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', marginTop: '4px', textTransform: 'uppercase' }}
                    placeholder="Se tiver um código pré-pago, digite aqui..."
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                  />
                </div>

                <button
                  type="submit"
                  className="nf-btn nf-btn-red"
                  style={{ width: '100%', justifyContent: 'center', padding: '13px', fontSize: '15px', marginTop: '4px' }}
                  disabled={loading}
                >
                  {loading
                    ? 'Criando sua conta...'
                    : selectedPlan === 'teste_gratis'
                    ? '⏳ Concluir Cadastro e Iniciar Teste Grátis (2 Horas)'
                    : '🚀 Concluir Cadastro e Escolher Telas/Perfis'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 2. "QUEM ESTÁ ASSISTINDO?" — SELETOR E GERENCIADOR DE PERFIS (ESTILO NETFLIX)
// ==========================================
function ProfilePickerOverlay({
  user,
  authToken,
  saasConfig,
  activeProfile,
  onSelectProfile,
  onUserUpdated,
  onOpenSubModal,
  onOpenAdminModal,
  onLogout
}) {
  const [manageMode, setManageMode] = useState(false);
  const [editingProfile, setEditingProfile] = useState(null); // null ou objeto { id, name, avatarId, isKids, pin }
  const [pinPromptProfile, setPinPromptProfile] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const avatars = saasConfig?.avatars || DEFAULT_AVATARS;
  const profiles = user?.profiles || [];
  const maxProfiles = user?.maxProfiles || 5;

  const handleProfileClick = (prof) => {
    if (manageMode) {
      setEditingProfile({
        id: prof.id,
        name: prof.name,
        avatarId: prof.avatarId || 'red',
        isKids: Boolean(prof.isKids),
        pin: prof.pin || ''
      });
      setErrorMsg('');
      return;
    }

    if (prof.pin && String(prof.pin).trim().length > 0) {
      setPinPromptProfile(prof);
      setPinInput('');
      setPinError('');
      return;
    }

    onSelectProfile(prof);
  };

  const handleConfirmPin = (e) => {
    e.preventDefault();
    if (!pinPromptProfile) return;
    if (pinInput.trim() === String(pinPromptProfile.pin).trim()) {
      const target = pinPromptProfile;
      setPinPromptProfile(null);
      setPinInput('');
      onSelectProfile(target);
    } else {
      setPinError('PIN incorreto! Tente novamente.');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editingProfile || !editingProfile.name.trim()) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/saas/profiles/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({
          profileId: editingProfile.id || null,
          name: editingProfile.name.trim(),
          avatarId: editingProfile.avatarId || 'red',
          isKids: Boolean(editingProfile.isKids),
          pin: editingProfile.pin ? String(editingProfile.pin).trim() : ''
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao salvar perfil.');
      }
      onUserUpdated(data.user);
      setEditingProfile(null);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProfile = async (profileId) => {
    if (!window.confirm('Tem certeza que deseja excluir este perfil?')) return;
    setSaving(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/saas/profiles/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({ profileId })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Erro ao excluir perfil.');
      }
      onUserUpdated(data.user);
      setEditingProfile(null);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="saas-fullscreen-overlay">
      {/* Barra Superior na Tela de Perfis */}
      <div className="saas-top-header">
        <div className="pobreflix-logo" style={{ cursor: 'default' }}>
          <span className="pobreflix-wordmark">POBREFLIX</span>
          <span className="pobreflix-badge">{user?.planName || 'VIP'}</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <button type="button" className="nf-btn nf-btn-dark" onClick={onOpenSubModal}>
            📱 Assinatura & Telas ({user?.activeScreensCount || 0}/{user?.maxScreens || 1})
          </button>
          {user?.role === 'admin' && (
            <button type="button" className="nf-btn nf-btn-red" onClick={onOpenAdminModal}>
              👑 Painel Admin SaaS
            </button>
          )}
          <button type="button" className="nf-btn nf-btn-dark" onClick={onLogout}>
            🚪 Sair da Conta
          </button>
        </div>
      </div>

      {/* Container Central "Quem está assistindo?" */}
      {!editingProfile && !pinPromptProfile && (
        <div className="saas-profiles-container">
          <h1 className="saas-profiles-title">
            {manageMode ? 'Gerenciar Perfis da Conta' : 'Quem está assistindo?'}
          </h1>
          <p className="saas-profiles-subtitle">
            Conta: <strong>{user?.name}</strong> ({user?.email}) • Plano{' '}
            <strong style={{ color: '#46d369' }}>{user?.planName}</strong> • Limite de{' '}
            <strong>
              {user?.maxScreens} {user?.maxScreens === 1 ? 'tela simultânea' : 'telas simultâneas'}
            </strong>
          </p>

          <div className="saas-profiles-grid">
            {profiles.map((prof) => {
              const av = getAvatarInfo(prof.avatarId, avatars);
              return (
                <div
                  key={prof.id}
                  className="saas-profile-card"
                  onClick={() => handleProfileClick(prof)}
                >
                  <div className="saas-profile-avatar-box" style={{ background: av.bg }}>
                    <span>{av.emoji}</span>
                    {prof.isKids && <span className="saas-profile-kids-ribbon">KIDS</span>}
                    {prof.pin && <span className="saas-profile-pin-badge" title="Protegido por PIN">🔒</span>}
                    {manageMode && (
                      <div className="saas-profile-edit-overlay" title="Editar Perfil">
                        ✏️
                      </div>
                    )}
                  </div>
                  <div className="saas-profile-name">{prof.name}</div>
                </div>
              );
            })}

            {profiles.length < maxProfiles && (
              <div
                className="saas-profile-card"
                onClick={() => {
                  setEditingProfile({
                    id: null,
                    name: '',
                    avatarId: avatars[profiles.length % avatars.length]?.id || 'blue',
                    isKids: false,
                    pin: ''
                  });
                  setErrorMsg('');
                }}
              >
                <div
                  className="saas-profile-avatar-box"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '2px dashed rgba(255,255,255,0.28)',
                    fontSize: '48px',
                    color: '#aaa'
                  }}
                >
                  ＋
                </div>
                <div className="saas-profile-name">Adicionar Perfil</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`nf-btn ${manageMode ? 'nf-btn-red' : 'nf-btn-dark'}`}
              style={{ padding: '11px 26px', fontSize: '14.5px', letterSpacing: '0.5px' }}
              onClick={() => setManageMode((m) => !m)}
            >
              {manageMode ? '✓ Concluir Edição' : '✏️ Gerenciar Perfis'}
            </button>

            {activeProfile && !manageMode && (
              <button
                type="button"
                className="nf-btn nf-btn-white"
                style={{ padding: '11px 24px', fontSize: '14.5px' }}
                onClick={() => onSelectProfile(activeProfile)}
              >
                ▶ Continuar como {activeProfile.name}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Modal de Digite o PIN do Perfil */}
      {pinPromptProfile && (
        <div className="modal-card" style={{ maxWidth: '420px', margin: 'auto', padding: '28px', textAlign: 'center' }}>
          <div style={{ fontSize: '42px', marginBottom: '8px' }}>🔒</div>
          <h2 style={{ fontSize: '22px', fontWeight: 900 }}>Perfil Protegido por PIN</h2>
          <p style={{ fontSize: '13px', color: '#aaa', marginTop: '6px', marginBottom: '18px' }}>
            Digite o PIN de 4 dígitos para entrar no perfil <strong>{pinPromptProfile.name}</strong>.
          </p>
          <form onSubmit={handleConfirmPin} className="form-group">
            <input
              type="password"
              maxLength={4}
              autoFocus
              className="form-input"
              style={{
                textAlign: 'center',
                fontSize: '26px',
                letterSpacing: '12px',
                fontWeight: 900,
                padding: '12px'
              }}
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
            />
            {pinError && (
              <div style={{ color: '#ff6b72', fontSize: '12.5px', fontWeight: 700, marginTop: '6px' }}>
                {pinError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button
                type="button"
                className="nf-btn nf-btn-dark"
                style={{ flex: 1, justifyContent: 'center' }}
                onClick={() => setPinPromptProfile(null)}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="nf-btn nf-btn-red"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                Desbloquear
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal de Criar / Editar Perfil */}
      {editingProfile && (
        <div className="modal-card" style={{ maxWidth: '540px', margin: 'auto' }}>
          <div className="modal-header">
            <h2 style={{ fontSize: '19px', fontWeight: 900 }}>
              {editingProfile.id ? `✏️ Editar Perfil: ${editingProfile.name}` : '✨ Novo Perfil PobreFlix'}
            </h2>
            <button
              type="button"
              className="nf-btn nf-btn-dark"
              onClick={() => setEditingProfile(null)}
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSaveProfile} className="modal-body">
            {errorMsg && (
              <div style={{ color: '#ff6b72', fontSize: '13px', fontWeight: 700 }}>⚠️ {errorMsg}</div>
            )}

            <div>
              <label className="form-label">Nome do Perfil</label>
              <input
                type="text"
                className="form-input"
                style={{ width: '100%', marginTop: '4px' }}
                placeholder="Ex: Pai, Mãe, Kids, Sala..."
                value={editingProfile.name}
                onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
                Escolha o Avatar
              </label>
              <div className="saas-avatar-picker-grid">
                {avatars.map((av) => (
                  <div
                    key={av.id}
                    className={`saas-avatar-option ${editingProfile.avatarId === av.id ? 'selected' : ''}`}
                    style={{ background: av.bg }}
                    onClick={() => setEditingProfile({ ...editingProfile, avatarId: av.id })}
                    title={av.label}
                  >
                    {av.emoji}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                background: 'rgba(255,255,255,0.05)',
                borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.1)'
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: '14px' }}>🧸 Perfil Infantil (Modo PobreFlix Kids)</div>
                <div style={{ fontSize: '11.5px', color: '#aaa' }}>
                  Filtra automaticamente o catálogo para exibir apenas Desenhos, Animes, Comédia e Família.
                </div>
              </div>
              <input
                type="checkbox"
                style={{ width: '20px', height: '20px', accentColor: '#e50914', cursor: 'pointer' }}
                checked={Boolean(editingProfile.isKids)}
                onChange={(e) => setEditingProfile({ ...editingProfile, isKids: e.target.checked })}
              />
            </div>

            <div>
              <label className="form-label">
                🔒 PIN de Bloqueio de 4 Dígitos (Deixe em branco para acesso livre)
              </label>
              <input
                type="text"
                maxLength={4}
                className="form-input"
                style={{ width: '100%', marginTop: '4px' }}
                placeholder="Ex: 1234 (Opcional)"
                value={editingProfile.pin}
                onChange={(e) =>
                  setEditingProfile({
                    ...editingProfile,
                    pin: e.target.value.replace(/\D/g, '').slice(0, 4)
                  })
                }
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', marginTop: '8px' }}>
              {editingProfile.id && profiles.length > 1 ? (
                <button
                  type="button"
                  className="nf-btn nf-btn-dark"
                  style={{ color: '#ff6b72', borderColor: 'rgba(255,107,114,0.35)' }}
                  onClick={() => handleDeleteProfile(editingProfile.id)}
                  disabled={saving}
                >
                  🗑️ Excluir Perfil
                </button>
              ) : (
                <div />
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="button"
                  className="nf-btn nf-btn-dark"
                  onClick={() => setEditingProfile(null)}
                >
                  Cancelar
                </button>
                <button type="submit" className="nf-btn nf-btn-red" disabled={saving}>
                  {saving ? 'Salvando...' : '💾 Salvar Perfil'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. OVERLAY DE BLOQUEIO DE LIMITE DE TELAS / ASSINATURA VENCIDA
// ==========================================
function ScreenLimitOverlay({
  blockState,
  user,
  authToken,
  currentDeviceId,
  onDisconnectDevice,
  onOpenSubModal,
  onRetryHeartbeat,
  onLogout
}) {
  if (!blockState) return null;

  const isScreenLimit = blockState.code === 'SCREEN_LIMIT_REACHED';
  const isKicked = blockState.code === 'DEVICE_KICKED';
  const isExpired = blockState.code === 'SUBSCRIPTION_EXPIRED';
  const activeScreens = blockState.activeScreens || user?.activeScreens || [];

  return (
    <div className="saas-fullscreen-overlay" style={{ zIndex: 980 }}>
      <div className="modal-card" style={{ maxWidth: '680px', margin: 'auto', background: '#141418' }}>
        <div
          style={{
            padding: '26px 28px 20px',
            background: 'linear-gradient(135deg, rgba(229,9,20,0.3) 0%, #141418 100%)',
            borderBottom: '1px solid rgba(255,255,255,0.1)'
          }}
        >
          <div style={{ fontSize: '38px', marginBottom: '8px' }}>
            {isScreenLimit ? '📱🚫' : isKicked ? '🔌' : '⏳'}
          </div>
          <h2 style={{ fontSize: '25px', fontWeight: 900 }}>
            {isScreenLimit
              ? `Limite de ${blockState.maxScreens || user?.maxScreens || 1} Tela(s) Simultânea(s) Atingido!`
              : isKicked
              ? 'Esta Tela Foi Desconectada Remotamente'
              : isExpired
              ? 'Sua Assinatura PobreFlix Expirou'
              : 'Acesso Temporariamente Bloqueado'}
          </h2>
          <p style={{ fontSize: '14px', color: '#ccc', marginTop: '6px', lineHeight: 1.5 }}>
            {blockState.error}
          </p>
        </div>

        <div className="modal-body">
          {isScreenLimit && activeScreens.length > 0 && (
            <div>
              <div className="form-label" style={{ marginBottom: '10px' }}>
                📡 Aparelhos Conectados Agora na Sua Conta (Desconecte um para liberar sua tela):
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeScreens.map((scr) => (
                  <div key={scr.deviceId} className="saas-screen-item">
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14px', color: '#fff' }}>
                        📺 {scr.deviceName}{' '}
                        <span style={{ color: '#e50914', fontSize: '12px' }}>
                          • Perfil: {scr.profileName}
                        </span>
                      </div>
                      <div style={{ fontSize: '12px', color: '#46d369', marginTop: '3px' }}>
                        ▶ Assistindo agora: <strong>{scr.watchingTitle || 'Navegando no Catálogo'}</strong>
                      </div>
                      <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                        IP: {scr.ip}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="nf-btn nf-btn-red"
                      onClick={() => onDisconnectDevice(scr.deviceId, true)}
                    >
                      🔌 Derrubar Esta Tela e Assistir Aqui
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '10px',
              marginTop: '10px',
              paddingTop: '14px',
              borderTop: '1px solid rgba(255,255,255,0.1)'
            }}
          >
            <button type="button" className="nf-btn nf-btn-dark" onClick={onLogout}>
              🚪 Trocar de Conta
            </button>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button type="button" className="nf-btn nf-btn-dark" onClick={onRetryHeartbeat}>
                🔄 Reconectar Agora
              </button>
              <button type="button" className="nf-btn nf-btn-red" onClick={onOpenSubModal}>
                🚀 Fazer Upgrade de Plano / Renovar (Até 4 Telas)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. MODAL DO CLIENTE: GERENCIADOR DE ASSINATURA, PLANOS, PIX & TELAS EM TEMPO REAL
// ==========================================
function SubscriptionAndScreensModal({
  isOpen,
  onClose,
  user,
  authToken,
  saasConfig,
  currentDeviceId,
  onUserUpdated,
  onDisconnectDevice
}) {
  const [activeTab, setActiveTab] = useState('screens'); // 'screens' | 'plan'
  const [selectedPlan, setSelectedPlan] = useState(user?.planId || 'familia_4k');
  const [voucherCode, setVoucherCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [customDevName, setCustomDevName] = useState(
    () => localStorage.getItem('pobreflix_custom_device_name') || ''
  );

  if (!isOpen || !user) return null;

  const plans = saasConfig?.plans || DEFAULT_PLANS;
  const planList = Object.values(plans);
  const activeScreens = user.activeScreens || [];

  const handleActivateOrUpgrade = async (method, chosenPlanId) => {
    setLoading(true);
    setFeedback('');
    try {
      const res = await fetch('/api/saas/subscription/activate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({
          method,
          planId: chosenPlanId || selectedPlan,
          voucherCode: voucherCode.trim()
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Falha ao processar assinatura.');
      }
      setFeedback(data.message || 'Assinatura atualizada com sucesso!');
      setVoucherCode('');
      onUserUpdated(data.user);
    } catch (err) {
      setFeedback(`⚠️ ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDeviceName = () => {
    if (customDevName.trim()) {
      localStorage.setItem('pobreflix_custom_device_name', customDevName.trim());
      setFeedback('✅ Nome deste aparelho atualizado! Será sincronizado no próximo pulso.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 990 }}>
      <div
        className="modal-card"
        style={{ maxWidth: '820px', background: '#141418' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 900 }}>
              📱 Gerenciador de Assinatura & Telas Simultâneas
            </h2>
            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
              Conta: <strong>{user.email}</strong> • Plano Atual:{' '}
              <strong style={{ color: '#46d369' }}>{user.planName}</strong> • Vencimento:{' '}
              <strong>
                {user.planId === 'teste_gratis' || (user.hoursRemaining && user.hoursRemaining <= 24)
                  ? `⏳ ${user.minutesRemaining || 0} min restantes (${new Date(user.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })})`
                  : `${new Date(user.expiresAt).toLocaleDateString('pt-BR')} (${user.daysRemaining} dias restantes)`}
              </strong>
            </div>
          </div>
          <button type="button" className="nf-btn nf-btn-dark" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className={`nf-btn ${activeTab === 'screens' ? 'nf-btn-red' : 'nf-btn-dark'}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => {
                setActiveTab('screens');
                setFeedback('');
              }}
            >
              📺 Telas Conectadas Agora ({activeScreens.length}/{user.maxScreens})
            </button>
            <button
              type="button"
              className={`nf-btn ${activeTab === 'plan' ? 'nf-btn-red' : 'nf-btn-dark'}`}
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => {
                setActiveTab('plan');
                setFeedback('');
              }}
            >
              💳 Mudar Plano, PIX & Cupom VIP
            </button>
          </div>

          {feedback && (
            <div
              style={{
                padding: '11px 14px',
                borderRadius: '8px',
                background: feedback.startsWith('⚠️')
                  ? 'rgba(229,9,20,0.2)'
                  : 'rgba(70,211,105,0.16)',
                border: `1px solid ${feedback.startsWith('⚠️') ? '#e50914' : '#46d369'}`,
                color: '#fff',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              {feedback}
            </div>
          )}

          {activeTab === 'screens' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Barra de Uso de Telas */}
              <div
                style={{
                  background: '#1b1b22',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 800, fontSize: '14px' }}>
                    Uso de Telas Simultâneas em Tempo Real
                  </span>
                  <span style={{ fontWeight: 900, color: '#46d369' }}>
                    {activeScreens.length} de {user.maxScreens} tela(s) em uso
                  </span>
                </div>
                <div
                  style={{
                    height: '10px',
                    background: '#0d0d11',
                    borderRadius: '99px',
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      width: `${Math.min(100, (activeScreens.length / Math.max(1, user.maxScreens)) * 100)}%`,
                      height: '100%',
                      background:
                        activeScreens.length >= user.maxScreens
                          ? 'linear-gradient(90deg, #f59e0b, #e50914)'
                          : 'linear-gradient(90deg, #46d369, #10b981)',
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
                <div style={{ fontSize: '12px', color: '#999', marginTop: '8px' }}>
                  💡 Dica: Abra uma nova aba ou outro aparelho em <code style={{ color: '#fff' }}>{typeof window !== 'undefined' ? window.location.origin : 'seu link da VPS'}</code> para ver outra tela aparecer aqui ao vivo!
                </div>
              </div>

              {/* Nome personalizado deste aparelho */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ flex: 1 }}
                  placeholder="Nomear este aparelho (ex: TV da Sala 4K, PC Gamer, Quarto)..."
                  value={customDevName}
                  onChange={(e) => setCustomDevName(e.target.value)}
                />
                <button type="button" className="nf-btn nf-btn-dark" onClick={handleSaveDeviceName}>
                  💾 Salvar Nome do Aparelho
                </button>
              </div>

              {/* Lista de Telas Conectadas */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeScreens.length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#888' }}>
                    Nenhuma tela transmitindo neste exato segundo.
                  </div>
                ) : (
                  activeScreens.map((scr) => {
                    const isThis = scr.deviceId === currentDeviceId;
                    return (
                      <div
                        key={scr.deviceId}
                        className={`saas-screen-item ${isThis ? 'is-current-device' : ''}`}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, fontSize: '14.5px' }}>
                              {isThis ? '🟢 Este Aparelho:' : '📺 Aparelho Remoto:'} {scr.deviceName}
                            </span>
                            <span
                              style={{
                                background: 'rgba(229,9,20,0.2)',
                                color: '#ff8a8f',
                                padding: '2px 8px',
                                borderRadius: '99px',
                                fontSize: '11px',
                                fontWeight: 800
                              }}
                            >
                              Perfil: {scr.profileName}
                            </span>
                          </div>
                          <div style={{ fontSize: '12.5px', color: '#46d369', marginTop: '4px' }}>
                            ▶ Assistindo agora: <strong>{scr.watchingTitle || 'Navegando no Catálogo'}</strong>
                          </div>
                          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>
                            IP: {scr.ip} • ID: {scr.deviceId.slice(0, 12)}
                          </div>
                        </div>

                        <button
                          type="button"
                          className="nf-btn nf-btn-red"
                          style={{ padding: '7px 14px', fontSize: '12px' }}
                          onClick={() => onDisconnectDevice(scr.deviceId, false)}
                        >
                          🔌 Desconectar Tela
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <div className="form-label" style={{ marginBottom: '8px' }}>
                  1. Escolha o Plano Desejado (Liberação Imediata de Telas Simultâneas):
                </div>
                <div className="saas-plan-grid">
                  {planList.map((pl) => (
                    <div
                      key={pl.id}
                      className={`saas-plan-card ${selectedPlan === pl.id ? 'selected' : ''}`}
                      onClick={() => setSelectedPlan(pl.id)}
                    >
                      {pl.badge && <span className="saas-plan-badge">{pl.badge}</span>}
                      <div style={{ fontWeight: 800, fontSize: '14px' }}>{pl.name}</div>
                      <div style={{ fontSize: '18px', fontWeight: 900, color: '#46d369' }}>
                        {pl.priceFormatted}
                      </div>
                      <div style={{ fontSize: '12px', color: '#ccc' }}>
                        📱 <strong>{pl.maxScreens}</strong>{' '}
                        {pl.maxScreens === 1 ? 'Tela Simultânea' : 'Telas Simultâneas'} • Até{' '}
                        {pl.maxProfiles} Perfis • {pl.quality}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pagamento Instantâneo via PIX */}
              <div className="saas-pix-box">
                <div className="saas-qr-placeholder">
                  <div style={{ fontSize: '34px', lineHeight: 1 }}>💠</div>
                  <div style={{ marginTop: '4px' }}>QR CODE PIX</div>
                  <div style={{ fontSize: '9px', color: '#555' }}>POBREFLIX VIP</div>
                </div>

                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ fontWeight: 900, fontSize: '15px', color: '#46d369' }}>
                    💠 Pagamento Instantâneo via PIX (Liberação na Hora)
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#ccc', marginTop: '4px' }}>
                    Chave PIX: <strong style={{ color: '#fff' }}>{saasConfig?.pixKey || 'pix@pobreflix.com.br'}</strong> • Favorecido:{' '}
                    <strong>{saasConfig?.pixBeneficiary || 'POBREFLIX STREAMING LTDA'}</strong>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '12px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="nf-btn nf-btn-dark"
                      onClick={() => {
                        navigator.clipboard?.writeText(saasConfig?.pixKey || 'pix@pobreflix.com.br');
                        setFeedback('📋 Chave PIX copiada para a área de transferência!');
                      }}
                    >
                      📋 Copiar Chave PIX
                    </button>
                    <button
                      type="button"
                      className="nf-btn nf-btn-red"
                      onClick={() => handleActivateOrUpgrade('pix_confirm', selectedPlan)}
                      disabled={loading}
                    >
                      {loading
                        ? 'Ativando...'
                        : `✅ Confirmar PIX e Ativar ${plans[selectedPlan]?.name || 'Plano'} (+30 Dias)`}
                    </button>
                  </div>
                </div>
              </div>

              {/* Resgate de Código Pré-Pago / Voucher */}
              <div
                style={{
                  background: '#1b1b22',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}
              >
                <div className="form-label" style={{ marginBottom: '6px' }}>
                  🎟️ Possui um Código Pré-Pago ou Voucher VIP? (Ex: POBREFLIX-VIP ou PF-4TELAS-30D)
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <input
                    type="text"
                    className="form-input"
                    style={{ flex: 1, textTransform: 'uppercase' }}
                    placeholder="Digite seu código aqui..."
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="nf-btn nf-btn-white"
                    onClick={() => handleActivateOrUpgrade('voucher')}
                    disabled={loading || !voucherCode.trim()}
                  >
                    🎟️ Resgatar Código
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. PAINEL ADMIN SAAS (CLIENTES, ASSINATURAS, TELAS GLOBAIS E VOUCHERS)
// ==========================================
function AdminDashboardModal({
  isOpen,
  onClose,
  authToken,
  onOpenProfilePicker,
  onLogout,
  onBannersUpdated,
  initialTab
}) {
  const [tab, setTab] = useState(initialTab || 'users'); // 'users' | 'screens' | 'vouchers' | 'banners'
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  // Form Novo Cliente
  const [showNewUserForm, setShowNewUserForm] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('123456');
  const [newUserPlan, setNewUserPlan] = useState('familia_4k');
  const [newUserScreens, setNewUserScreens] = useState(4);
  const [newUserDays, setNewUserDays] = useState(30);

  // Form Novo Voucher
  const [voucherPlan, setVoucherPlan] = useState('familia_4k');
  const [voucherDays, setVoucherDays] = useState(30);
  const [voucherUses, setVoucherUses] = useState(10);
  const [customVoucherCode, setCustomVoucherCode] = useState('');

  // Form Gerenciador de Banners de Anúncio em Carrossel (Fundo do Hero)
  const [editingBannerId, setEditingBannerId] = useState('');
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerSubtitle, setBannerSubtitle] = useState('');
  const [bannerBadge, setBannerBadge] = useState('ANÚNCIO PATROCINADO');
  const [bannerCtaText, setBannerCtaText] = useState('Saiba Mais');
  const [bannerLinkUrl, setBannerLinkUrl] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerImageData, setBannerImageData] = useState('');
  const [bannerSaving, setBannerSaving] = useState(false);

  useEffect(() => {
    if (initialTab) setTab(initialTab);
  }, [initialTab]);

  const fetchOverview = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch('/api/saas/admin/overview', {
        headers: { 'x-auth-token': authToken }
      });
      const data = await res.json();
      if (data && data.ok) {
        setOverview(data);
        if (onBannersUpdated && Array.isArray(data.adBanners)) {
          onBannersUpdated(data.adBanners, data.adBannerSettings);
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar painel admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOverview();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBannerFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result;
      if (typeof result === 'string') {
        setBannerImageData(result);
        setBannerImageUrl('');
        setFeedback(`🖼️ Imagem "${file.name}" carregada! Clique em "Salvar Banner no Carrossel" para publicar.`);
      }
    };
    reader.readAsDataURL(file);
  };

  const resetBannerForm = () => {
    setEditingBannerId('');
    setBannerTitle('');
    setBannerSubtitle('');
    setBannerBadge('ANÚNCIO PATROCINADO');
    setBannerCtaText('Saiba Mais');
    setBannerLinkUrl('');
    setBannerImageUrl('');
    setBannerImageData('');
  };

  const handleSaveBanner = async (e) => {
    e.preventDefault();
    if (!bannerImageData && !bannerImageUrl.trim()) {
      setFeedback('⚠️ Selecione uma imagem do seu computador ou cole o link da imagem do banner.');
      return;
    }
    setBannerSaving(true);
    try {
      const res = await fetch('/api/saas/admin/banner-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({
          bannerId: editingBannerId || undefined,
          title: bannerTitle,
          subtitle: bannerSubtitle,
          badge: bannerBadge,
          ctaText: bannerCtaText,
          linkUrl: bannerLinkUrl,
          imageData: bannerImageData || undefined,
          imageUrl: bannerImageUrl.trim() || undefined,
          active: true
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erro ao salvar banner');
      setFeedback(
        editingBannerId
          ? '✅ Banner atualizado no carrossel de fundo!'
          : '🎉 Novo banner publicado no carrossel de fundo da tela inicial!'
      );
      resetBannerForm();
      setOverview((prev) => ({
        ...prev,
        adBanners: data.adBanners,
        adBannerSettings: data.adBannerSettings
      }));
      if (onBannersUpdated) onBannersUpdated(data.adBanners, data.adBannerSettings);
    } catch (err) {
      setFeedback(`⚠️ ${err.message}`);
    } finally {
      setBannerSaving(false);
    }
  };

  const handleDeleteBanner = async (bannerId) => {
    if (!window.confirm('Remover este banner do carrossel de anúncios?')) return;
    try {
      const res = await fetch('/api/saas/admin/banner-delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({ bannerId })
      });
      const data = await res.json();
      if (data && data.ok) {
        setFeedback('🗑️ Banner removido do carrossel.');
        setOverview((prev) => ({
          ...prev,
          adBanners: data.adBanners,
          adBannerSettings: data.adBannerSettings
        }));
        if (onBannersUpdated) onBannersUpdated(data.adBanners, data.adBannerSettings);
      }
    } catch {}
  };

  const handleReorderOrToggleBanner = async (bannerId, direction) => {
    try {
      const res = await fetch('/api/saas/admin/banner-reorder', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({ bannerId, direction })
      });
      const data = await res.json();
      if (data && data.ok) {
        setOverview((prev) => ({
          ...prev,
          adBanners: data.adBanners,
          adBannerSettings: data.adBannerSettings
        }));
        if (onBannersUpdated) onBannersUpdated(data.adBanners, data.adBannerSettings);
      }
    } catch {}
  };

  const handleUpdateBannerSettings = async (patch) => {
    try {
      const res = await fetch('/api/saas/admin/banner-settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify(patch)
      });
      const data = await res.json();
      if (data && data.ok) {
        setFeedback('⚙️ Configurações do carrossel de fundo atualizadas!');
        setOverview((prev) => ({
          ...prev,
          adBanners: data.adBanners,
          adBannerSettings: data.adBannerSettings
        }));
        if (onBannersUpdated) onBannersUpdated(data.adBanners, data.adBannerSettings);
      }
    } catch {}
  };

  const handleAdminUserAction = async (payload, msg) => {
    try {
      const res = await fetch('/api/saas/admin/user-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erro ao atualizar cliente');
      setFeedback(msg || '✅ Cliente atualizado com sucesso!');
      fetchOverview();
    } catch (err) {
      setFeedback(`⚠️ ${err.message}`);
    }
  };

  const handleCreateClient = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/saas/admin/user-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({
          name: newUserName,
          email: newUserEmail,
          password: newUserPass,
          planId: newUserPlan,
          maxScreens: Number(newUserScreens),
          days: Number(newUserDays)
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erro ao criar conta');
      setFeedback(`✅ Conta criada para ${newUserEmail}!`);
      setNewUserName('');
      setNewUserEmail('');
      setShowNewUserForm(false);
      fetchOverview();
    } catch (err) {
      setFeedback(`⚠️ ${err.message}`);
    }
  };

  const handleCreateVoucher = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/saas/admin/voucher-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({
          code: customVoucherCode.trim(),
          planId: voucherPlan,
          days: Number(voucherDays),
          maxUses: Number(voucherUses)
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error || 'Erro ao gerar voucher');
      setFeedback(`🎟️ Código ${data.voucher.code} gerado com sucesso!`);
      setCustomVoucherCode('');
      fetchOverview();
    } catch (err) {
      setFeedback(`⚠️ ${err.message}`);
    }
  };

  const handleKickScreen = async (deviceId) => {
    try {
      await fetch('/api/saas/screens/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({ deviceId })
      });
      setFeedback('🔌 Tela desconectada remotamente pelo Admin!');
      fetchOverview();
    } catch {}
  };

  const metrics = overview?.metrics || {
    totalUsers: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    totalActiveScreens: 0,
    estimatedMonthlyRevenueFormatted: 'R$ 0,00'
  };

  const usersList = (overview?.users || []).filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
  });

  const allActiveScreens = [];
  (overview?.users || []).forEach((u) => {
    (u.activeScreens || []).forEach((scr) => {
      allActiveScreens.push({
        ...scr,
        userName: u.name,
        userEmail: u.email,
        userMaxScreens: u.maxScreens
      });
    });
  });

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 995 }}>
      <div
        className="modal-card"
        style={{ maxWidth: '1080px', width: '96%', background: '#121216' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
          <div>
            <h2 style={{ fontSize: '21px', fontWeight: 900, color: '#fbbf24' }}>
              👑 Painel Master PobreFlix — Gerenciador de Contas, Assinaturas e Telas
            </h2>
            <div style={{ fontSize: '12px', color: '#aaa' }}>
              Acesso exclusivo Master (tecpro@gmail.com) • Controle de clientes, limites de telas, renovação e vouchers.
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button type="button" className="nf-btn nf-btn-dark" onClick={fetchOverview}>
              🔄 Atualizar Dados
            </button>
            {onOpenProfilePicker && (
              <button
                type="button"
                className="nf-btn nf-btn-red"
                onClick={() => {
                  onClose();
                  onOpenProfilePicker();
                }}
              >
                🎬 Ir p/ Streaming (Escolher Telas)
              </button>
            )}
            <button type="button" className="nf-btn nf-btn-dark" onClick={onClose}>
              📺 Ver Catálogo
            </button>
            {onLogout && (
              <button
                type="button"
                className="nf-btn nf-btn-dark"
                style={{ color: '#ff8a8f', borderColor: 'rgba(229,9,20,0.4)' }}
                onClick={() => {
                  onClose();
                  onLogout();
                }}
              >
                🚪 Sair do Master
              </button>
            )}
          </div>
        </div>

        <div className="modal-body" style={{ maxHeight: '80vh', overflowY: 'auto' }}>
          {/* Cards de Métricas */}
          <div className="saas-metrics-grid">
            <div className="saas-metric-card">
              <div style={{ fontSize: '11.5px', color: '#aaa', fontWeight: 700 }}>TOTAL DE CONTAS</div>
              <div className="saas-metric-value">{metrics.totalUsers}</div>
            </div>
            <div className="saas-metric-card">
              <div style={{ fontSize: '11.5px', color: '#46d369', fontWeight: 700 }}>ASSINATURAS ATIVAS</div>
              <div className="saas-metric-value" style={{ color: '#46d369' }}>
                {metrics.activeSubscriptions}
              </div>
            </div>
            <div className="saas-metric-card">
              <div style={{ fontSize: '11.5px', color: '#e50914', fontWeight: 700 }}>TELAS ASSISTINDO AGORA</div>
              <div className="saas-metric-value" style={{ color: '#e50914' }}>
                📺 {metrics.totalActiveScreens}
              </div>
            </div>
            <div className="saas-metric-card">
              <div style={{ fontSize: '11.5px', color: '#fbbf24', fontWeight: 700 }}>RECEITA MENSAL (MRR)</div>
              <div className="saas-metric-value" style={{ color: '#fbbf24' }}>
                {metrics.estimatedMonthlyRevenueFormatted}
              </div>
            </div>
          </div>

          {/* Abas do Admin */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={`nf-btn ${tab === 'users' ? 'nf-btn-red' : 'nf-btn-dark'}`}
              onClick={() => setTab('users')}
            >
              👥 Clientes & Assinaturas ({overview?.users?.length || 0})
            </button>
            <button
              type="button"
              className={`nf-btn ${tab === 'banners' ? 'nf-btn-red' : 'nf-btn-dark'}`}
              style={
                tab !== 'banners'
                  ? { borderColor: 'rgba(251, 191, 36, 0.45)', color: '#fbbf24' }
                  : undefined
              }
              onClick={() => setTab('banners')}
            >
              🖼️ Banners de Anúncio / Carrossel ({overview?.adBanners?.length || 0})
            </button>
            <button
              type="button"
              className={`nf-btn ${tab === 'screens' ? 'nf-btn-red' : 'nf-btn-dark'}`}
              onClick={() => setTab('screens')}
            >
              📺 Monitor de Telas Ao Vivo ({allActiveScreens.length})
            </button>
            <button
              type="button"
              className={`nf-btn ${tab === 'vouchers' ? 'nf-btn-red' : 'nf-btn-dark'}`}
              onClick={() => setTab('vouchers')}
            >
              🎟️ Vouchers / Códigos Pré-Pagos ({overview?.vouchers?.length || 0})
            </button>
          </div>

          {feedback && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.2)',
                fontSize: '13px',
                fontWeight: 700
              }}
            >
              {feedback}
            </div>
          )}

          {/* ABA 1: CLIENTES & ASSINATURAS */}
          {tab === 'users' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap' }}>
                <input
                  type="text"
                  className="form-input"
                  style={{ width: '320px' }}
                  placeholder="🔍 Buscar cliente por nome ou e-mail..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <button
                  type="button"
                  className="nf-btn nf-btn-red"
                  onClick={() => setShowNewUserForm((s) => !s)}
                >
                  {showNewUserForm ? '✕ Fechar Formulário' : '➕ Cadastrar Novo Cliente'}
                </button>
              </div>

              {showNewUserForm && (
                <form
                  onSubmit={handleCreateClient}
                  style={{
                    background: '#1b1b22',
                    padding: '16px',
                    borderRadius: '10px',
                    border: '1px solid rgba(229,9,20,0.4)',
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                    gap: '10px',
                    alignItems: 'end'
                  }}
                >
                  <div>
                    <label className="form-label">Nome</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '100%' }}
                      placeholder="Nome do cliente"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">E-mail</label>
                    <input
                      type="email"
                      className="form-input"
                      style={{ width: '100%' }}
                      placeholder="cliente@email.com"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Senha Inicial</label>
                    <input
                      type="text"
                      className="form-input"
                      style={{ width: '100%' }}
                      value={newUserPass}
                      onChange={(e) => setNewUserPass(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Plano</label>
                    <select
                      className="nf-select"
                      style={{ width: '100%', padding: '9px' }}
                      value={newUserPlan}
                      onChange={(e) => {
                        setNewUserPlan(e.target.value);
                        const p = DEFAULT_PLANS[e.target.value];
                        if (p) setNewUserScreens(p.maxScreens);
                      }}
                    >
                      {Object.values(DEFAULT_PLANS).map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.maxScreens}T)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Telas Simultâneas</label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      className="form-input"
                      style={{ width: '100%' }}
                      value={newUserScreens}
                      onChange={(e) => setNewUserScreens(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="form-label">Dias de Validade</label>
                    <input
                      type="number"
                      min={1}
                      max={365}
                      className="form-input"
                      style={{ width: '100%' }}
                      value={newUserDays}
                      onChange={(e) => setNewUserDays(e.target.value)}
                    />
                  </div>
                  <button type="submit" className="nf-btn nf-btn-red" style={{ height: '38px', justifyContent: 'center' }}>
                    💾 Criar Conta
                  </button>
                </form>
              )}

              <div className="saas-admin-table-wrap">
                <table className="saas-admin-table">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Plano & Telas</th>
                      <th>Status & Validade</th>
                      <th>Perfis</th>
                      <th>Ações Rápidas & Exclusão</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ fontWeight: 800, color: '#fff' }}>
                            {u.name} {u.role === 'admin' && <span style={{ color: '#fbbf24' }}>👑</span>}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#888' }}>{u.email}</div>
                        </td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <select
                              className="nf-select"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={u.planId}
                              onChange={(e) =>
                                handleAdminUserAction(
                                  { userId: u.id, planId: e.target.value },
                                  `Plano de ${u.name} alterado!`
                                )
                              }
                            >
                              {Object.values(DEFAULT_PLANS).map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>

                            <select
                              className="nf-select"
                              style={{ padding: '4px 8px', fontSize: '12px' }}
                              value={u.maxScreens}
                              onChange={(e) =>
                                handleAdminUserAction(
                                  { userId: u.id, maxScreens: Number(e.target.value) },
                                  `Limite de telas de ${u.name} alterado para ${e.target.value}!`
                                )
                              }
                              title="Limite de Telas Simultâneas"
                            >
                              {[1, 2, 3, 4, 5, 6, 8, 10].map((n) => (
                                <option key={n} value={n}>
                                  📱 {n} {n === 1 ? 'Tela' : 'Telas'} (Ativas: {u.activeScreensCount})
                                </option>
                              ))}
                            </select>
                          </div>
                        </td>
                        <td>
                          <span className={`saas-status-pill ${u.status}`}>
                            {u.status === 'active'
                              ? '● Ativo'
                              : u.status === 'expired'
                              ? '● Vencido'
                              : '● Bloqueado'}
                          </span>
                          <div style={{ fontSize: '11px', color: '#aaa', marginTop: '4px' }}>
                            {u.planId === 'teste_gratis' || (u.hoursRemaining && u.hoursRemaining <= 24)
                              ? `⏳ Teste 2h: ${u.minutesRemaining || 0} min restantes`
                              : `Vence: ${new Date(u.expiresAt).toLocaleDateString('pt-BR')} (${u.daysRemaining}d)`}
                          </div>
                        </td>
                        <td>
                          <span style={{ fontWeight: 700 }}>{u.profiles?.length || 1}</span>/{u.maxProfiles}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <button
                              type="button"
                              className="nf-btn nf-btn-dark"
                              style={{ padding: '5px 9px', fontSize: '11.5px', color: '#46d369' }}
                              onClick={() =>
                                handleAdminUserAction(
                                  { userId: u.id, addDays: 30 },
                                  `+30 dias adicionados para ${u.name}!`
                                )
                              }
                            >
                              +30 Dias
                            </button>
                            <button
                              type="button"
                              className="nf-btn nf-btn-dark"
                              style={{ padding: '5px 9px', fontSize: '11.5px' }}
                              onClick={() =>
                                handleAdminUserAction(
                                  { userId: u.id, addDays: 7 },
                                  `+7 dias adicionados para ${u.name}!`
                                )
                              }
                            >
                              +7 Dias
                            </button>
                            <button
                              type="button"
                              className="nf-btn nf-btn-dark"
                              style={{
                                padding: '5px 9px',
                                fontSize: '11.5px',
                                color: u.status === 'blocked' ? '#46d369' : '#fbbf24'
                              }}
                              onClick={() =>
                                handleAdminUserAction(
                                  {
                                    userId: u.id,
                                    status: u.status === 'blocked' ? 'active' : 'blocked'
                                  },
                                  u.status === 'blocked'
                                    ? `Conta de ${u.name} desbloqueada!`
                                    : `Conta de ${u.name} bloqueada e telas desconectadas!`
                                )
                              }
                            >
                              {u.status === 'blocked' ? '🔓 Desbloquear' : '🚫 Bloquear'}
                            </button>
                            {u.role !== 'admin' && u.id !== 'usr_admin_master' ? (
                              <button
                                type="button"
                                className="nf-btn"
                                style={{
                                  padding: '5px 12px',
                                  fontSize: '11.5px',
                                  fontWeight: 800,
                                  background: 'linear-gradient(180deg, #e50914, #b20710)',
                                  color: '#fff',
                                  border: '1px solid rgba(255,255,255,0.2)',
                                  borderRadius: '4px',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  boxShadow: '0 2px 6px rgba(229,9,20,0.3)'
                                }}
                                title="Excluir permanentemente este cliente"
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      `⚠️ EXCLUIR CLIENTE?\n\nTem certeza que deseja excluir permanentemente o cliente:\n"${u.name}" (${u.email})?\n\n• O acesso será revogado imediatamente.\n• Todas as telas ativas serão desconectadas.\n• O histórico de perfis será apagado.`
                                    )
                                  ) {
                                    handleAdminUserAction(
                                      { userId: u.id, action: 'delete' },
                                      `🗑️ Cliente ${u.name} (${u.email}) foi excluído com sucesso.`
                                    );
                                  }
                                }}
                              >
                                🗑️ Excluir Cliente
                              </button>
                            ) : (
                              <span
                                style={{
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  color: '#aaa',
                                  padding: '5px 10px',
                                  background: 'rgba(255,255,255,0.06)',
                                  border: '1px solid rgba(255,255,255,0.15)',
                                  borderRadius: '4px',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                  userSelect: 'none'
                                }}
                                title="A conta Master Admin é protegida contra exclusão acidental"
                              >
                                🛡️ Master (Protegido)
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABA 2: MONITOR DE TELAS AO VIVO */}
          {tab === 'screens' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {allActiveScreens.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>
                  Nenhuma tela ativa no servidor neste momento.
                </div>
              ) : (
                allActiveScreens.map((scr) => (
                  <div key={scr.deviceId} className="saas-screen-item">
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '14px' }}>
                        👤 Cliente: <span style={{ color: '#fbbf24' }}>{scr.userName}</span> ({scr.userEmail}) •{' '}
                        <span style={{ color: '#e50914' }}>Perfil: {scr.profileName}</span>
                      </div>
                      <div style={{ fontSize: '13px', color: '#46d369', marginTop: '3px' }}>
                        ▶ Assistindo agora: <strong>{scr.watchingTitle}</strong>
                      </div>
                      <div style={{ fontSize: '11.5px', color: '#999', marginTop: '2px' }}>
                        Aparelho: {scr.deviceName} • IP: {scr.ip}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="nf-btn nf-btn-red"
                      onClick={() => handleKickScreen(scr.deviceId)}
                    >
                      🔌 Derrubar Tela
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ABA 3: GERADOR DE VOUCHERS / CUPONS */}
          {tab === 'vouchers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <form
                onSubmit={handleCreateVoucher}
                style={{
                  background: '#1b1b22',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.1)',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '10px',
                  alignItems: 'end'
                }}
              >
                <div>
                  <label className="form-label">Código (Opcional)</label>
                  <input
                    type="text"
                    className="form-input"
                    style={{ width: '100%', textTransform: 'uppercase' }}
                    placeholder="Ex: PROMO-4TELAS"
                    value={customVoucherCode}
                    onChange={(e) => setCustomVoucherCode(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Plano do Voucher</label>
                  <select
                    className="nf-select"
                    style={{ width: '100%', padding: '9px' }}
                    value={voucherPlan}
                    onChange={(e) => setVoucherPlan(e.target.value)}
                  >
                    {Object.values(DEFAULT_PLANS).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.maxScreens} Telas)
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="form-label">Dias Liberados</label>
                  <input
                    type="number"
                    min={1}
                    max={365}
                    className="form-input"
                    style={{ width: '100%' }}
                    value={voucherDays}
                    onChange={(e) => setVoucherDays(e.target.value)}
                  />
                </div>
                <div>
                  <label className="form-label">Limite de Usos</label>
                  <input
                    type="number"
                    min={1}
                    max={9999}
                    className="form-input"
                    style={{ width: '100%' }}
                    value={voucherUses}
                    onChange={(e) => setVoucherUses(e.target.value)}
                  />
                </div>
                <button type="submit" className="nf-btn nf-btn-red" style={{ height: '38px', justifyContent: 'center' }}>
                  🎟️ Gerar Código
                </button>
              </form>

              <div className="saas-admin-table-wrap">
                <table className="saas-admin-table">
                  <thead>
                    <tr>
                      <th>Código do Voucher</th>
                      <th>Plano Liberado</th>
                      <th>Duração</th>
                      <th>Usos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(overview?.vouchers || []).map((v) => (
                      <tr key={v.code}>
                        <td style={{ fontWeight: 900, color: '#46d369', fontFamily: 'monospace', fontSize: '14px' }}>
                          {v.code}
                        </td>
                        <td>{DEFAULT_PLANS[v.planId]?.name || v.planId}</td>
                        <td>+{v.days} dias</td>
                        <td>
                          {v.usedCount} / {v.maxUses}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ABA 4: GERENCIADOR DE BANNERS DE ANÚNCIO EM CARROSSEL (FUNDO DO HERO) */}
          {tab === 'banners' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Barra de Configurações Globais do Carrossel */}
              <div
                style={{
                  background: '#1b1b22',
                  padding: '16px 18px',
                  borderRadius: '10px',
                  border: '1px solid rgba(251, 191, 36, 0.35)',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: 900, fontSize: '14.5px', color: '#fbbf24' }}>
                    ⚙️ Configurações do Carrossel de Anúncios de Fundo (Tela de Destaque)
                  </div>
                  <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                    Os banners abaixo aparecem em carrossel automático como imagem de fundo atrás do destaque do catálogo.
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Tempo p/ Slide:
                    </label>
                    <select
                      className="nf-select"
                      style={{ padding: '6px 10px' }}
                      value={overview?.adBannerSettings?.intervalSeconds || 6}
                      onChange={(e) =>
                        handleUpdateBannerSettings({ intervalSeconds: Number(e.target.value) })
                      }
                    >
                      <option value={3}>3 segundos</option>
                      <option value={5}>5 segundos</option>
                      <option value={6}>6 segundos</option>
                      <option value={8}>8 segundos</option>
                      <option value={10}>10 segundos</option>
                      <option value={15}>15 segundos</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label className="form-label" style={{ margin: 0 }}>
                      Brilho do Fundo:
                    </label>
                    <select
                      className="nf-select"
                      style={{ padding: '6px 10px' }}
                      value={overview?.adBannerSettings?.backgroundOpacity ?? 0.62}
                      onChange={(e) =>
                        handleUpdateBannerSettings({ backgroundOpacity: Number(e.target.value) })
                      }
                    >
                      <option value={0.4}>40% (Suave)</option>
                      <option value={0.55}>55% (Médio)</option>
                      <option value={0.62}>62% (Ideal Recomendado)</option>
                      <option value={0.78}>78% (Forte / Vibrante)</option>
                      <option value={0.92}>92% (Destaque Total)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    className={`nf-btn ${
                      overview?.adBannerSettings?.enabled !== false ? 'nf-btn-red' : 'nf-btn-dark'
                    }`}
                    onClick={() =>
                      handleUpdateBannerSettings({
                        enabled: overview?.adBannerSettings?.enabled === false
                      })
                    }
                  >
                    {overview?.adBannerSettings?.enabled !== false
                      ? '🟢 Carrossel Ativo no Fundo'
                      : '⏸️ Carrossel Desativado'}
                  </button>
                </div>
              </div>

              {/* Formulário de Upload / Cadastro de Banner */}
              <form
                onSubmit={handleSaveBanner}
                style={{
                  background: '#181820',
                  padding: '18px',
                  borderRadius: '12px',
                  border: '1px solid rgba(229, 9, 20, 0.45)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 900, fontSize: '15.5px', color: '#fff' }}>
                    {editingBannerId
                      ? '✏️ Editando Banner do Carrossel'
                      : '📤 Subir Novo Banner de Anúncio para o Carrossel de Fundo'}
                  </div>
                  {editingBannerId && (
                    <button
                      type="button"
                      className="nf-btn nf-btn-dark"
                      onClick={resetBannerForm}
                    >
                      ✕ Cancelar Edição
                    </button>
                  )}
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                    gap: '14px'
                  }}
                >
                  {/* Coluna 1: Upload do Computador ou URL */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label className="form-label">
                        📁 1. Enviar Imagem do Computador (.JPG, .PNG, .WEBP, .GIF)
                      </label>
                      <label
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          marginTop: '6px',
                          padding: '14px',
                          background: 'rgba(229, 9, 20, 0.14)',
                          border: '2px dashed rgba(229, 9, 20, 0.65)',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          fontWeight: 800,
                          fontSize: '13.5px',
                          color: '#fff'
                        }}
                      >
                        <span>📤 Escolher Imagem do Computador</span>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={handleBannerFileUpload}
                        />
                      </label>
                    </div>

                    <div>
                      <label className="form-label">
                        🔗 Ou Cole o Link Direto da Imagem (URL)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: '100%', marginTop: '4px' }}
                        placeholder="https://exemplo.com/meu-banner-1920x1080.jpg"
                        value={bannerImageUrl}
                        onChange={(e) => {
                          setBannerImageUrl(e.target.value);
                          if (e.target.value.trim()) setBannerImageData('');
                        }}
                      />
                    </div>

                    {/* Pré-visualização ao vivo do Banner */}
                    {(bannerImageData || bannerImageUrl) && (
                      <div
                        style={{
                          position: 'relative',
                          height: '128px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          border: '1px solid rgba(255,255,255,0.25)',
                          backgroundImage: `url(${bannerImageData || bannerImageUrl})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center'
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 100%)',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-end',
                            padding: '10px 12px'
                          }}
                        >
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 900,
                              color: '#fbbf24',
                              textTransform: 'uppercase'
                            }}
                          >
                            PRÉVIA DO FUNDO • {bannerBadge || 'ANÚNCIO'}
                          </span>
                          <div style={{ fontSize: '13px', fontWeight: 900, color: '#fff' }}>
                            {bannerTitle || 'Imagem de Fundo em Carrossel'}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Coluna 2: Textos Opcionais & Link de Ação */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label className="form-label">Etiqueta / Selo do Anúncio</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ width: '100%', marginTop: '4px' }}
                          placeholder="Ex: ANÚNCIO PATROCINADO"
                          value={bannerBadge}
                          onChange={(e) => setBannerBadge(e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="form-label">Texto do Botão (Opcional)</label>
                        <input
                          type="text"
                          className="form-input"
                          style={{ width: '100%', marginTop: '4px' }}
                          placeholder="Ex: Chamar no WhatsApp"
                          value={bannerCtaText}
                          onChange={(e) => setBannerCtaText(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="form-label">
                        Título da Chamada do Anúncio (Opcional)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: '100%', marginTop: '4px' }}
                        placeholder="Ex: Promoção 4 Telas 4K ou Nome do Anunciante"
                        value={bannerTitle}
                        onChange={(e) => setBannerTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Subtítulo / Descrição Curta (Opcional)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: '100%', marginTop: '4px' }}
                        placeholder="Ex: Clique aqui e fale direto no WhatsApp com desconto especial"
                        value={bannerSubtitle}
                        onChange={(e) => setBannerSubtitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="form-label">
                        Link ao Clicar no Anúncio (Ex: https://wa.me/5511999999999 ou #open_plans)
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        style={{ width: '100%', marginTop: '4px' }}
                        placeholder="https://wa.me/... (ou deixe #open_plans para abrir Planos)"
                        value={bannerLinkUrl}
                        onChange={(e) => setBannerLinkUrl(e.target.value)}
                      />
                    </div>

                    <button
                      type="submit"
                      className="nf-btn nf-btn-red"
                      style={{
                        width: '100%',
                        justifyContent: 'center',
                        padding: '12px',
                        fontSize: '14.5px',
                        marginTop: 'auto'
                      }}
                      disabled={bannerSaving}
                    >
                      {bannerSaving
                        ? 'Salvando Banner...'
                        : editingBannerId
                        ? '💾 Atualizar Banner no Carrossel'
                        : '🚀 Publicar Banner no Carrossel de Fundo'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Lista de Banners Atualmente no Carrossel */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontWeight: 900, fontSize: '14px', color: '#ddd' }}>
                  🎞️ Banners Cadastrados no Carrossel ({(overview?.adBanners || []).length}):
                </div>

                {(overview?.adBanners || []).length === 0 ? (
                  <div
                    style={{
                      padding: '32px',
                      textAlign: 'center',
                      background: '#16161c',
                      borderRadius: '10px',
                      color: '#999'
                    }}
                  >
                    Nenhum banner cadastrado. Envie uma imagem acima para ativar o carrossel de fundo!
                  </div>
                ) : (
                  (overview?.adBanners || []).map((bnr, index) => (
                    <div
                      key={bnr.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        flexWrap: 'wrap',
                        padding: '12px 14px',
                        borderRadius: '10px',
                        background: bnr.active !== false ? '#191922' : 'rgba(255,255,255,0.03)',
                        border:
                          bnr.active !== false
                            ? '1px solid rgba(255,255,255,0.14)'
                            : '1px dashed rgba(255,255,255,0.08)',
                        opacity: bnr.active !== false ? 1 : 0.6
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '260px' }}>
                        <div
                          style={{
                            width: '150px',
                            height: '84px',
                            borderRadius: '8px',
                            backgroundImage: `url(${bnr.imageUrl})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            border: '1px solid rgba(255,255,255,0.2)',
                            flexShrink: 0,
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <span
                            style={{
                              position: 'absolute',
                              top: '4px',
                              left: '4px',
                              background: 'rgba(0,0,0,0.8)',
                              color: '#fbbf24',
                              fontSize: '10px',
                              fontWeight: 900,
                              padding: '2px 6px',
                              borderRadius: '4px'
                            }}
                          >
                            #{index + 1}
                          </span>
                        </div>

                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 900,
                                background: 'rgba(229,9,20,0.25)',
                                color: '#ff8a8f',
                                padding: '2px 7px',
                                borderRadius: '4px'
                              }}
                            >
                              {bnr.badge || 'ANÚNCIO'}
                            </span>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: bnr.active !== false ? '#46d369' : '#fbbf24'
                              }}
                            >
                              {bnr.active !== false ? '● No Ar no Carrossel' : '⏸ Pausado'}
                            </span>
                          </div>

                          <div style={{ fontWeight: 900, fontSize: '14.5px', color: '#fff', marginTop: '4px' }}>
                            {bnr.title || '(Somente Imagem de Fundo — Sem Título)'}
                          </div>
                          {bnr.subtitle && (
                            <div style={{ fontSize: '12px', color: '#aaa', marginTop: '2px' }}>
                              {bnr.subtitle}
                            </div>
                          )}
                          {bnr.linkUrl && (
                            <div style={{ fontSize: '11px', color: '#60a5fa', marginTop: '3px' }}>
                              🔗 Destino: {bnr.linkUrl} ({bnr.ctaText || 'Saiba Mais'})
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="nf-btn nf-btn-dark"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          onClick={() => handleReorderOrToggleBanner(bnr.id, 'up')}
                          disabled={index === 0}
                          title="Subir posição no carrossel"
                        >
                          ⬆️
                        </button>
                        <button
                          type="button"
                          className="nf-btn nf-btn-dark"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          onClick={() => handleReorderOrToggleBanner(bnr.id, 'down')}
                          disabled={index === (overview?.adBanners || []).length - 1}
                          title="Descer posição no carrossel"
                        >
                          ⬇️
                        </button>
                        <button
                          type="button"
                          className="nf-btn nf-btn-dark"
                          style={{
                            padding: '6px 10px',
                            fontSize: '12px',
                            color: bnr.active !== false ? '#fbbf24' : '#46d369'
                          }}
                          onClick={() => handleReorderOrToggleBanner(bnr.id, 'toggle')}
                        >
                          {bnr.active !== false ? '⏸ Pausar' : '▶ Ativar'}
                        </button>
                        <button
                          type="button"
                          className="nf-btn nf-btn-dark"
                          style={{ padding: '6px 10px', fontSize: '12px' }}
                          onClick={() => {
                            setEditingBannerId(bnr.id);
                            setBannerTitle(bnr.title || '');
                            setBannerSubtitle(bnr.subtitle || '');
                            setBannerBadge(bnr.badge || 'ANÚNCIO PATROCINADO');
                            setBannerCtaText(bnr.ctaText || 'Saiba Mais');
                            setBannerLinkUrl(bnr.linkUrl || '');
                            setBannerImageUrl(bnr.imageUrl || '');
                            setBannerImageData('');
                          }}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          type="button"
                          className="nf-btn nf-btn-dark"
                          style={{ padding: '6px 10px', fontSize: '12px', color: '#ff6b72' }}
                          onClick={() => handleDeleteBanner(bnr.id)}
                        >
                          🗑️ Excluir
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

window.PobreFlixSaaS = {
  DEFAULT_AVATARS,
  DEFAULT_PLANS,
  getAvatarInfo,
  getOrCreateDeviceIdentity,
  AuthLandingScreen,
  ProfilePickerOverlay,
  ScreenLimitOverlay,
  SubscriptionAndScreensModal,
  AdminDashboardModal
};
