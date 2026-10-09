const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const { URL } = require('url');
const { handleSaasRequest } = require('./auth_saas');

const PORT = process.env.PORT || 3050;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Agentes HTTP/HTTPS que aceitam certificados autoassinados comuns em servidores IPTV/Streamlock
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 64 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 64, rejectUnauthorized: false });

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.m3u': 'audio/x-mpegurl; charset=utf-8',
  '.m3u8': 'application/vnd.apple.mpegurl; charset=utf-8',
};

const DEFAULT_PRESETS = [
  {
    id: 'brazil-iptv',
    name: '🇧🇷 Brasil — Canais Abertos & Regionais (IPTV-org)',
    url: 'https://github.com/iptv-com/iptv/raw/refs/heads/main/lists/brazil.m3u',
    description: 'Lista oficial de canais brasileiros (TV aberta, regional, notícias, esportes e variedades)',
    isDefault: true,
  },
  {
    id: 'nevaldo-fs2017',
    name: '🎬 Filmes, Séries & Canais (FS2017 - Nevaldo)',
    url: 'https://gist.githubusercontent.com/Nevaldo/173a893b1a3e51fd45cce17197f8f4f8/raw',
    description: 'Lista completa com Séries (Friends, Chris, Patroa, Arrow, Flash, CSI, etc.) e Canais',
    isDefault: false,
  },
  {
    id: 'iptv-org-br-alt',
    name: '🇧🇷 Brasil — Mirror IPTV-org',
    url: 'https://iptv-org.github.io/iptv/countries/br.m3u',
    description: 'Espelho atualizado de canais do Brasil via IPTV-org',
    isDefault: false,
  },
  {
    id: 'iptv-org-sports',
    name: '⚽ Esportes Internacionais',
    url: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
    description: 'Canais de esportes do mundo todo',
    isDefault: false,
  },
  {
    id: 'iptv-org-news',
    name: '📰 Notícias Internacionais',
    url: 'https://iptv-org.github.io/iptv/categories/news.m3u',
    description: 'Canais de jornalismo e notícias ao vivo',
    isDefault: false,
  }
];

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range, User-Agent, Referer, x-auth-token');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Range, Content-Type, Accept-Ranges');
}

/**
 * Faz requisição upstream com suporte a redirecionamentos (301, 302, 303, 307, 308)
 */
function fetchUpstream(targetUrlStr, options = {}, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 6) {
      return reject(new Error('Muitos redirecionamentos (limite excedido)'));
    }

    let parsedUrl;
    try {
      if (typeof targetUrlStr === 'string') {
        if (targetUrlStr.startsWith('/')) {
          targetUrlStr = `http://127.0.0.1:${PORT}${targetUrlStr}`;
        } else if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(targetUrlStr)) {
          targetUrlStr = targetUrlStr.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, `http://127.0.0.1:${PORT}`);
        }
      }
      parsedUrl = new URL(targetUrlStr);
    } catch (err) {
      return reject(new Error(`URL inválida: ${targetUrlStr}`));
    }

    const isHttps = parsedUrl.protocol === 'https:';
    const client = isHttps ? https : http;
    const agent = isHttps ? httpsAgent : httpAgent;

    const userAgent =
      options.userAgent ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

    const headers = {
      'User-Agent': userAgent,
      'Accept': '*/*',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Connection': 'keep-alive',
    };

    if (options.referer) {
      headers['Referer'] = options.referer;
    } else {
      headers['Referer'] = `${parsedUrl.protocol}//${parsedUrl.host}/`;
    }

    if (options.range) {
      headers['Range'] = options.range;
    }

    if (options.acceptEncoding) {
      headers['Accept-Encoding'] = options.acceptEncoding;
    }

    const reqOptions = {
      protocol: parsedUrl.protocol,
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (isHttps ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || 'GET',
      headers,
      agent,
      timeout: options.timeout || 15000,
    };

    const upstreamReq = client.request(reqOptions, (upstreamRes) => {
      const statusCode = upstreamRes.statusCode || 500;

      // Seguir redirecionamentos
      if ([301, 302, 303, 307, 308].includes(statusCode) && upstreamRes.headers.location) {
        upstreamRes.resume(); // Descartar corpo do redirect
        let nextUrl;
        try {
          nextUrl = new URL(upstreamRes.headers.location, parsedUrl).toString();
        } catch (e) {
          return reject(new Error(`Location de redirecionamento inválido: ${upstreamRes.headers.location}`));
        }
        return fetchUpstream(nextUrl, options, redirectCount + 1)
          .then(resolve)
          .catch(reject);
      }

      resolve({
        req: upstreamReq,
        res: upstreamRes,
        finalUrl: parsedUrl.toString(),
      });
    });

    upstreamReq.on('timeout', () => {
      upstreamReq.destroy(new Error('Tempo limite de conexão esgotado (Timeout)'));
    });

    upstreamReq.on('error', (err) => {
      reject(err);
    });

    upstreamReq.end();
  });
}

/**
 * Lê todo o corpo de uma resposta HTTP (descomprimindo gzip/deflate se necessário)
 */
function readResponseBody(upstreamRes, maxBytes = 15 * 1024 * 1024) {
  return new Promise((resolve, reject) => {
    const encoding = (upstreamRes.headers['content-encoding'] || '').toLowerCase();
    let stream = upstreamRes;

    if (encoding === 'gzip') {
      stream = upstreamRes.pipe(zlib.createGunzip());
    } else if (encoding === 'deflate') {
      stream = upstreamRes.pipe(zlib.createInflate());
    }

    const chunks = [];
    let totalBytes = 0;

    stream.on('data', (chunk) => {
      totalBytes += chunk.length;
      if (totalBytes > maxBytes) {
        upstreamRes.destroy();
        return reject(new Error('Resposta excedeu o tamanho máximo permitido'));
      }
      chunks.push(chunk);
    });

    stream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf-8'));
    });

    stream.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Reescreve manifestos HLS (.m3u8) para que todos os sub-manifestos, chaves e segmentos (.ts/.m4s)
 * passem pelo proxy local, evitando bloqueios de CORS, Mixed Content (HTTP/HTTPS) e portas bloqueadas.
 */
function rewriteHlsManifest(manifestText, baseUrl, extraParams = '') {
  const lines = manifestText.split(/\r?\n/);

  const resolveAndWrap = (rawUri) => {
    const trimmed = rawUri.trim();
    if (!trimmed || trimmed.startsWith('data:')) return trimmed;
    try {
      const resolved = new URL(trimmed, baseUrl).toString();
      return `/api/proxy?url=${encodeURIComponent(resolved)}${extraParams}`;
    } catch {
      return trimmed;
    }
  };

  const rewrittenLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed) return line;

    if (trimmed.startsWith('#')) {
      // Reescrever atributos URI="..." em tags como #EXT-X-KEY, #EXT-X-MAP, #EXT-X-MEDIA, #EXT-X-I-FRAME-STREAM-INF
      if (trimmed.includes('URI="')) {
        return line.replace(/URI="([^"]+)"/g, (_, uriValue) => {
          return `URI="${resolveAndWrap(uriValue)}"`;
        });
      }
      return line;
    }

    // Linha de URL de segmento (.ts, .m4s, .aac) ou sub-playlist (.m3u8)
    return resolveAndWrap(trimmed);
  });

  return rewrittenLines.join('\n');
}

/**
 * Verifica se o conteúdo parece ser um manifesto HLS (.m3u8)
 */
function isLikelyHlsManifest(contentType, finalUrl, firstBytesStr) {
  const ct = (contentType || '').toLowerCase();
  const urlLower = (finalUrl || '').toLowerCase();

  if (
    ct.includes('mpegurl') ||
    ct.includes('vnd.apple.mpegurl') ||
    ct.includes('x-mpegurl') ||
    urlLower.includes('.m3u8') ||
    urlLower.includes('.m3u')
  ) {
    return true;
  }

  if (firstBytesStr && firstBytesStr.trimStart().startsWith('#EXTM3U')) {
    return true;
  }

  return false;
}

const server = http.createServer(async (req, res) => {
  setCorsHeaders(res);

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  const parsedReqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedReqUrl.pathname;

  // 0. Sistema SaaS PobreFlix: Contas, Perfis, Assinaturas, Telas Simultâneas e Painel Admin
  if (pathname.startsWith('/api/saas/')) {
    return handleSaasRequest(req, res, pathname, parsedReqUrl);
  }

  // 1. Endpoint de Presets de Listas
  if (pathname === '/api/presets') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ presets: DEFAULT_PRESETS }));
  }

  // 1B. Endpoint de Busca Global de Filmes e Séries (IMDb Suggestion API PT-BR)
  if (pathname === '/api/search-catalog') {
    const q = (parsedReqUrl.searchParams.get('q') || '').trim();
    if (!q) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ results: [] }));
    }
    try {
      const cleanQ = q.toLowerCase().replace(/[^a-z0-9\s]/gi, ' ').trim();
      const firstChar = cleanQ[0] || 'a';
      const imdbUrl = `https://v3.sg.media-imdb.com/suggestion/${firstChar}/${encodeURIComponent(cleanQ)}.json`;
      const { res: upRes } = await fetchUpstream(imdbUrl, { timeout: 8000 });
      const body = await readResponseBody(upRes);
      const data = JSON.parse(body);
      const items = (data.d || [])
        .filter((it) => it.id && it.id.startsWith('tt') && (it.qid === 'movie' || it.qid === 'tvSeries' || it.qid === 'tvMiniSeries' || /feature|series/i.test(it.q || '')))
        .map((it) => {
          const isSeries = it.qid === 'tvSeries' || it.qid === 'tvMiniSeries' || /series/i.test(it.q || '');
          const poster = it.i?.imageUrl
            ? it.i.imageUrl.replace(/\._V1_.*\.jpg$/i, '._V1_UX500_.jpg')
            : '';
          return {
            id: `imdb_${it.id}`,
            imdbId: it.id,
            name: `${it.l}${it.y ? ` (${it.y})` : ''}`,
            rawTitle: it.l,
            year: it.y || '',
            cast: it.s || '',
            logo: poster,
            group: isSeries ? 'VOD Séries: Catálogo Global' : 'VOD Filmes: Catálogo Global',
            quality: 'FHD',
            isVod: true,
            isCloudVod: true,
            isSeriesGroup: isSeries,
            seasonsCount: isSeries ? '?' : 0,
            episodes: [],
            url: `cloud://${isSeries ? 'tv' : 'movie'}/${it.id}`
          };
        });
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ results: items }));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ results: [], error: err.message }));
    }
  }

  // 1C. Endpoint para buscar TODAS as Temporadas e Episódios de qualquer Série (via TVMaze API)
  if (pathname === '/api/series-episodes') {
    const imdbId = (parsedReqUrl.searchParams.get('imdb') || '').trim();
    const title = (parsedReqUrl.searchParams.get('title') || '').trim();
    try {
      let showData = null;
      if (imdbId && imdbId.startsWith('tvmaze_')) {
        const tvId = imdbId.replace('tvmaze_', '');
        const { res: directRes } = await fetchUpstream(
          `https://api.tvmaze.com/shows/${encodeURIComponent(tvId)}`,
          { timeout: 8000 }
        );
        if (directRes.statusCode >= 200 && directRes.statusCode < 300) {
          const text = await readResponseBody(directRes);
          showData = JSON.parse(text);
        } else {
          directRes.resume();
        }
      } else if (imdbId) {
        const { res: lookupRes } = await fetchUpstream(
          `https://api.tvmaze.com/lookup/shows?imdb=${encodeURIComponent(imdbId)}`,
          { timeout: 8000 }
        );
        if (lookupRes.statusCode >= 200 && lookupRes.statusCode < 300) {
          const text = await readResponseBody(lookupRes);
          showData = JSON.parse(text);
        } else {
          lookupRes.resume();
        }
      }
      if (!showData && title) {
        const cleanTitle = title.replace(/\(.*?\)/g, '').trim();
        const { res: searchRes } = await fetchUpstream(
          `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(cleanTitle)}`,
          { timeout: 8000 }
        );
        if (searchRes.statusCode >= 200 && searchRes.statusCode < 300) {
          const text = await readResponseBody(searchRes);
          showData = JSON.parse(text);
        } else {
          searchRes.resume();
        }
      }

      if (showData && showData.id) {
        const resolvedImdb = imdbId || showData.externals?.imdb || '';
        const { res: epsRes } = await fetchUpstream(
          `https://api.tvmaze.com/shows/${showData.id}/episodes`,
          { timeout: 10000 }
        );
        const epsText = await readResponseBody(epsRes);
        const rawEps = JSON.parse(epsText);
        const cleanSummary = (showData.summary || '').replace(/<[^>]+>/g, '').trim();

        const episodes = (rawEps || []).map((ep) => ({
          id: `ep_${resolvedImdb}_S${ep.season}E${ep.number}`,
          imdbId: resolvedImdb,
          name: `${showData.name} - T${String(ep.season).padStart(2, '0')}E${String(ep.number).padStart(2, '0')}`,
          episodeTitle: ep.name || `Episódio ${ep.number}`,
          seasonNumber: ep.season || 1,
          episodeNumber: ep.number || 1,
          runtime: ep.runtime || 25,
          summary: (ep.summary || '').replace(/<[^>]+>/g, '').trim(),
          logo: ep.image?.medium || showData.image?.medium || '',
          group: 'VOD Séries',
          quality: 'FHD',
          isVod: true,
          isCloudVod: true,
          isSeriesEpisode: true,
          url: `cloud://tv/${resolvedImdb}/${ep.season || 1}/${ep.number || 1}`
        }));

        const seasonsCount = new Set(episodes.map((e) => e.seasonNumber)).size || 1;
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(
          JSON.stringify({
            imdbId: resolvedImdb,
            summary: cleanSummary,
            seasonsCount,
            episodes
          })
        );
      }

      // Fallback se a série não estiver no TVMaze: gerar seletor de 3 temporadas com 12 episódios
      const fallbackEps = [];
      for (let s = 1; s <= 3; s++) {
        for (let e = 1; e <= 12; e++) {
          fallbackEps.push({
            id: `ep_${imdbId}_S${s}E${e}`,
            imdbId,
            name: `${title || 'Série'} - T0${s}E${String(e).padStart(2, '0')}`,
            episodeTitle: `Episódio ${e}`,
            seasonNumber: s,
            episodeNumber: e,
            runtime: 42,
            summary: 'Episódio completo disponível nos servidores Cloud PobreFlix.',
            logo: '',
            group: 'VOD Séries',
            quality: 'FHD',
            isVod: true,
            isCloudVod: true,
            isSeriesEpisode: true,
            url: `cloud://tv/${imdbId}/${s}/${e}`
          });
        }
      }
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ imdbId, seasonsCount: 3, episodes: fallbackEps }));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ episodes: [], error: err.message }));
    }
  }

  // 1.7 Endpoint para resolver link direto .MP4 100% SEM ANÚNCIOS (Internet Archive) para qualquer Filme ou Série
  if (pathname === '/api/resolve-vod') {
    const titleRaw = (parsedReqUrl.searchParams.get('title') || parsedReqUrl.searchParams.get('query') || '').trim();
    const cleanTitle = titleRaw
      .replace(/\(.*?\)|\[.*?\]/g, '')
      .replace(/-\s*T\d+E\d+.*$/i, '')
      .replace(/S\d+E\d+.*$/i, '')
      .trim();

    const lower = cleanTitle.toLowerCase();

    // Mapa instantâneo de streams .MP4 H.264 (avc1) diretos, horizontais (16:9) e 100% DUBLADOS PT-BR (1 para 1 exato)
    const DIRECT_MP4_MAP = [
      {
        match: /^as branquelas\b/i,
        url: 'https://archive.org/download/as-branquelas-sem-cortes-paixaoflix/As%20Branquelas%20Sem%20Cortes.mp4'
      },
      {
        match: /^o auto da compadecida\b/i,
        url: 'https://archive.org/download/auto-da-compadecida/auto%20da%20compadecida.ia.mp4'
      },
      {
        match: /^superbad\b/i,
        url: 'https://archive.org/download/superbad-e-hoje-2007-versao-estendida-brrip-720p-dublado-andre-tpf/Superbad%20-%20%C3%89%20Hoje%20%282007%29%20Vers%C3%A3o%20Estendida%20BRrip%20720p%20Dublado%20-%20AndreTPF.mp4'
      },
      {
        match: /^deadpool\s*(&|e)\s*wolverine/i,
        url: 'https://archive.org/download/deadpool-wolverine_HD_DUBLADO_SINCRONIZADO/Deadpool%20%26%20Wolverine.ia.mp4'
      },
      {
        match: /^velozes e furiosos 9\b|^f9\b/i,
        url: 'https://archive.org/download/velozes-e-furiosos-9-2021-dublado/Velozes%20e%20Furiosos%209%202021%20Dublado.mp4'
      },
      {
        match: /^jurassic world.*reino ameaçado/i,
        url: 'https://archive.org/download/JurassicWorldGIOVANNI/Jurassic.World.Reino.Amea%C3%A7ado.2018.720p.BluRay.x264.DUBLADO-WWW.BLUDV.TV.mp4'
      },
      {
        match: /^shrek (3|terceiro)\b/i,
        url: 'https://archive.org/download/shrek-terceiro-2007-bdrip-720p-dublado_202604/Shrek%20Terceiro%20(2007)%20-%20BDRip%20720p%20-%20Dublado.mp4'
      },
      {
        match: /^a era do gelo (1|\b)/i,
        url: 'https://archive.org/download/a-era-do-gelo-blu-ray-1080p-dublado/A%20Era%20do%20Gelo%20BluRay%201080p%20Dublado.mp4'
      },
      {
        match: /^toy story 2\b/i,
        url: 'https://archive.org/download/toy-story-2-1999-vhsrip-dublado/Toy%20Story%202%20(1999)%20VHSRip%20Dublado.mp4'
      },
      {
        match: /^nem que a vaca tussa\b/i,
        url: 'https://archive.org/download/NQAVTDDL/Nem%20que%20a%20vaca%20tussa%20%282004%29%201080p.mp4'
      },
      {
        match: /^rio 2\b/i,
        url: 'https://archive.org/download/rio-2-2014-brrip-720p-dublado-andre-tpf/Rio%202%20(2014)%20BRrip%20720p%20Dublado%20-%20AndreTPF.mp4'
      },
      {
        match: /^chaves\s*#?1\b/i,
        url: 'https://archive.org/download/seriado-chaves/Chaves%20%231%20-%20Boas%20festas%20-%20Bal%C3%B5es%20(1973)%20%5B1080p%5D.ia.mp4'
      },
      {
        match: /^dragon ball z\s*(s01e01|e01|ep 1|1)\b/i,
        url: 'https://archive.org/download/1989-dragon-ball-z-s-01/%5B1989%5D%20Dragon%20Ball%20Z%20S01%20E01.ia.mp4'
      },
      {
        match: /^yu yu hakusho\s*(ep\.?0?1|a morte)\b/i,
        url: 'https://archive.org/download/yu-yu-hakusho-720p/Yuyu%20Hakusho%20Completo%20Bluray%20720p%20Dublado/Yuyu%20Hakusho%20Completo%20Bluray%20720p%20Dublado/Yu%20Yu%20Hakusho%20EP.01%20-%20A%20Morte.mp4'
      },
      {
        match: /^o enigma de outro mundo\b/i,
        url: 'https://archive.org/download/o-enigma-de-outro-mundo-1982-blu-ray-720p-dublado/O%20Enigma%20de%20Outro%20Mundo%20(1982)Blu%20Ray%20720p%20Dublado.ia.mp4'
      }
    ];

    // Se já houver um stream 1080p/720p curado, horizontal e 100% Dublado PT-BR para este título exato, retorna direto
    for (const entry of DIRECT_MP4_MAP) {
      if (entry.match.test(lower)) {
        res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ url: entry.url, source: 'curated-mp4' }));
      }
    }

    try {
      // Buscar EXCLUSIVAMENTE arquivos DUBLADOS EM PORTUGUÊS (e nunca Dual Audio ou Inglês) no Internet Archive
      const q = encodeURIComponent(`title:("${cleanTitle}") AND (dublado OR dublada OR paixaoflix) AND mediatype:(movies) AND format:(MPEG4) AND NOT (dual OR legendado)`);
      const searchUrl = `https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier,title&rows=8&page=1&output=json`;
      const { res: iaRes } = await fetchUpstream(searchUrl, { timeout: 4500 });
      const iaText = await readResponseBody(iaRes);
      const iaJson = JSON.parse(iaText);
      const docs = iaJson?.response?.docs || [];

      for (const doc of docs) {
        if (!doc.identifier || /celular|vertical|shorts|tiktok/i.test(doc.identifier)) continue;
        const metaUrl = `https://archive.org/metadata/${encodeURIComponent(doc.identifier)}`;
        const { res: mRes } = await fetchUpstream(metaUrl, { timeout: 4000 });
        const mText = await readResponseBody(mRes);
        const mJson = JSON.parse(mText);
        const files = mJson?.files || [];
        const isHorizontal = (f) => {
          const w = Number(f.width) || 0;
          const h = Number(f.height) || 0;
          return (w === 0 && h === 0) || w >= h;
        };
        // Preferir sempre o derivado .ia.mp4 horizontal (width >= height)
        const mp4File =
          files.find(
            (f) =>
              f.name &&
              (f.name.endsWith('.ia.mp4') || f.format === 'h.264 IA') &&
              isHorizontal(f) &&
              (parseInt(f.size, 10) || 0) > 15 * 1024 * 1024
          ) ||
          files.find(
            (f) =>
              f.name &&
              /\.mp4$/i.test(f.name) &&
              isHorizontal(f) &&
              (parseInt(f.size, 10) || 0) > 25 * 1024 * 1024
          );
        if (mp4File) {
          const directMp4 = `https://archive.org/download/${encodeURIComponent(doc.identifier)}/${encodeURIComponent(mp4File.name).replace(/%2F/g, '/')}`;
          res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ url: directMp4, source: 'archive.org-exact' }));
        }
      }
    } catch {
      // Fallback para o stream padrão abaixo
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(
      JSON.stringify({
        error: 'Título não encontrado no acervo MP4 direto.',
        url: null
      })
    );
  }

  // 1.75 Endpoint para download de filmes e episódios com Content-Disposition (Download Direto no Navegador)
  if (pathname === '/api/download') {
    let targetUrl = (parsedReqUrl.searchParams.get('url') || '').trim();
    let title = (parsedReqUrl.searchParams.get('title') || 'filme-pobreflix')
      .replace(/[^\w\s\u00C0-\u017F\-\.\(\)]/gi, '')
      .trim();

    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'URL do vídeo não informada' }));
    }

    // Se for link cloud://, resolver para o stream real primeiro
    if (targetUrl.startsWith('cloud://')) {
      try {
        const q = encodeURIComponent(`title:("${title}") AND (dublado OR dublada OR paixaoflix) AND mediatype:(movies) AND format:(MPEG4)`);
        const searchUrl = `https://archive.org/advancedsearch.php?q=${q}&fl[]=identifier,title&rows=1&page=1&output=json`;
        const { res: iaRes } = await fetchUpstream(searchUrl, { timeout: 4500 });
        const iaText = await readResponseBody(iaRes);
        const iaJson = JSON.parse(iaText);
        const docs = iaJson?.response?.docs || [];
        if (docs.length > 0 && docs[0].identifier) {
          targetUrl = `/api/ia-stream?id=${encodeURIComponent(docs[0].identifier)}&type=movie`;
        } else {
          res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
          return res.end(JSON.stringify({ error: 'Mídia não encontrada para download.' }));
        }
      } catch {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ error: 'Falha ao buscar mídia para download.' }));
      }
    }

    // Se for rota interna /api/ia-stream, resolver o redirect para obter o link final do archive.org
    if (targetUrl.startsWith('/api/ia-stream')) {
      try {
        const upstream = await fetchUpstream(`http://127.0.0.1:${PORT}${targetUrl}`, { timeout: 8000 });
        if (upstream.res.headers && upstream.res.headers.location) {
          targetUrl = upstream.res.headers.location;
        }
      } catch {}
    }

    const safeFilename = `${title.replace(/\.mp4$/i, '')}.mp4`;
    res.writeHead(302, {
      Location: targetUrl,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(safeFilename)}"`
    });
    return res.end();
  }

  // 1.8 Endpoint para resolver instantaneamente qualquer item Dublado PT-BR do Internet Archive (Filme ou Episódio de Série) para .ia.mp4 / .mp4
  if (pathname === '/api/ia-stream') {
    const id = (parsedReqUrl.searchParams.get('id') || '').trim();
    const epIdx = Math.max(0, (parseInt(parsedReqUrl.searchParams.get('ep'), 10) || 1) - 1);
    const isMovie = parsedReqUrl.searchParams.get('type') === 'movie';

    if (!id) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'Parâmetro "id" é obrigatório.' }));
    }

    if (!global.iaStreamCache) global.iaStreamCache = new Map();

    try {
      let cached = global.iaStreamCache.get(id);
      let chosenFiles = Array.isArray(cached) ? cached : cached?.files;
      let serverHost = (!Array.isArray(cached) && cached?.server) || 'archive.org';
      let serverDir = (!Array.isArray(cached) && cached?.dir) || `/download/${encodeURIComponent(id)}`;

      if (!chosenFiles) {
        const metaUrl = `https://archive.org/metadata/${encodeURIComponent(id)}`;
        const { res: mRes } = await fetchUpstream(metaUrl, { timeout: 15000 });
        const mText = await readResponseBody(mRes);
        const mJson = JSON.parse(mText);
        const files = mJson?.files || [];
        if (mJson?.server && mJson?.dir) {
          serverHost = mJson.server;
          serverDir = mJson.dir;
        }

        const isHoriz = (f) => {
          const w = Number(f.width) || 0;
          const h = Number(f.height) || 0;
          return (w === 0 && h === 0) || w >= h;
        };

        const iaMp4s = files
          .filter(
            (f) =>
              f.name &&
              (f.name.endsWith('.ia.mp4') || f.format === 'h.264 IA') &&
              isHoriz(f) &&
              (parseInt(f.size, 10) || 0) > 5 * 1024 * 1024
          )
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        const origMp4s = files
          .filter(
            (f) =>
              f.name &&
              /\.mp4$/i.test(f.name) &&
              !f.name.endsWith('.ia.mp4') &&
              isHoriz(f) &&
              (parseInt(f.size, 10) || 0) > 8 * 1024 * 1024
          )
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

        chosenFiles = iaMp4s.length > 0 ? iaMp4s : origMp4s;
        if (chosenFiles.length > 0) {
          global.iaStreamCache.set(id, { files: chosenFiles, server: serverHost, dir: serverDir });
        }
      }

      if (chosenFiles && chosenFiles.length > 0) {
        let targetFile;
        if (isMovie) {
          targetFile = chosenFiles
            .slice()
            .sort((a, b) => (parseInt(b.size, 10) || 0) - (parseInt(a.size, 10) || 0))[0];
        } else {
          const requestedEpNum = epIdx + 1;
          const epRegex = new RegExp(`(?:S\\d+)?(?:E|EP|EPIS[OÓ]DIO|\\bx)\\s*0*${requestedEpNum}\\b`, 'i');
          const matchedByNum = chosenFiles.find((f) => epRegex.test(f.name));
          targetFile = matchedByNum || chosenFiles[epIdx] || chosenFiles[0];
        }
        const directUrl = (serverHost && serverDir && serverHost !== 'archive.org')
          ? `https://${serverHost}${serverDir}/${encodeURIComponent(targetFile.name).replace(/%2F/g, '/')}`
          : `https://archive.org/download/${encodeURIComponent(id)}/${encodeURIComponent(targetFile.name).replace(/%2F/g, '/')}`;
        res.writeHead(302, {
          Location: directUrl,
          'Cache-Control': 'public, max-age=3600'
        });
        return res.end();
      }
    } catch {
      // Fallback abaixo
    }

    res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: 'Mídia não encontrada ou indisponível.' }));
  }

  // 2. Endpoint para baixar Lista M3U remota (sem reescrever como HLS)
  if (pathname === '/api/playlist') {
    let targetUrl = parsedReqUrl.searchParams.get('url');
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'Parâmetro "url" é obrigatório.' }));
    }

    // Converter links de página do GitHub Gist ou GitHub Blob automaticamente para link RAW
    const gistMatch = targetUrl.match(/^https?:\/\/gist\.github\.com\/([^/]+)\/([a-f0-9]+)(?:\/|$)/i);
    if (gistMatch) {
      targetUrl = `https://gist.githubusercontent.com/${gistMatch[1]}/${gistMatch[2]}/raw`;
    } else if (/^https?:\/\/github\.com\/[^/]+\/[^/]+\/blob\//i.test(targetUrl)) {
      targetUrl = targetUrl.replace('/blob/', '/raw/');
    }

    try {
      const { res: upstreamRes, finalUrl } = await fetchUpstream(targetUrl, {
        acceptEncoding: 'gzip, deflate',
        timeout: 20000,
      });

      if (upstreamRes.statusCode >= 400) {
        upstreamRes.resume();
        res.writeHead(upstreamRes.statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(
          JSON.stringify({
            error: `Servidor remoto retornou HTTP ${upstreamRes.statusCode}`,
            finalUrl,
          })
        );
      }

      const bodyText = await readResponseBody(upstreamRes);
      res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
      });
      return res.end(bodyText);
    } catch (err) {
      res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(
        JSON.stringify({
          error: `Falha ao carregar lista M3U: ${err.message}`,
        })
      );
    }
  }

  // 3. Endpoint para testar disponibilidade rápida de um canal
  if (pathname === '/api/check') {
    const targetUrl = parsedReqUrl.searchParams.get('url');
    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ online: false, error: 'URL ausente' }));
    }

    try {
      const start = Date.now();
      const { req: upstreamReq, res: upstreamRes, finalUrl } = await fetchUpstream(targetUrl, {
        timeout: 6500,
      });
      const latencyMs = Date.now() - start;
      const statusCode = upstreamRes.statusCode || 0;
      upstreamRes.destroy();
      upstreamReq.destroy();

      const online = statusCode >= 200 && statusCode < 400;
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ online, statusCode, latencyMs, finalUrl }));
    } catch (err) {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ online: false, error: err.message }));
    }
  }

  // 4. Endpoint de Proxy de Streams (HLS .m3u8, segmentos .ts, MPEG-TS contínua, logos, etc.)
  if (pathname === '/api/proxy') {
    let targetUrl = parsedReqUrl.searchParams.get('url');
    const customReferer = parsedReqUrl.searchParams.get('referer') || '';
    const customUa = parsedReqUrl.searchParams.get('ua') || '';

    if (!targetUrl) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ error: 'Parâmetro "url" é obrigatório.' }));
    }

    if (targetUrl.startsWith('/')) {
      targetUrl = `http://127.0.0.1:${PORT}${targetUrl}`;
    } else if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(targetUrl)) {
      targetUrl = targetUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, `http://127.0.0.1:${PORT}`);
    }

    let upstreamHandle = null;

    try {
      upstreamHandle = await fetchUpstream(targetUrl, {
        referer: customReferer || undefined,
        userAgent: customUa || undefined,
        range: req.headers['range'],
        timeout: 15000,
      });

      const { req: upstreamReq, res: upstreamRes, finalUrl } = upstreamHandle;
      const statusCode = upstreamRes.statusCode || 200;
      const contentType = upstreamRes.headers['content-type'] || '';

      // Se o cliente desconectar, encerrar conexão com o servidor de stream
      req.on('close', () => {
        if (!upstreamRes.complete) {
          upstreamRes.destroy();
          upstreamReq.destroy();
        }
      });

      if (statusCode >= 400) {
        upstreamRes.resume();
        res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ error: `Erro HTTP ${statusCode} no stream remoto`, finalUrl }));
      }

      const isDirectBinary =
        req.method === 'HEAD' ||
        /\.(mp4|mkv|webm|avi|jpg|jpeg|png|webp)(\?|$)/i.test(finalUrl) ||
        /^(video\/(mp4|webm|x-matroska)|image\/)/i.test(contentType);

      if (isDirectBinary) {
        let resolvedContentType = contentType;
        if ((!resolvedContentType || resolvedContentType === 'application/octet-stream') && /\.mp4(\?|$)/i.test(finalUrl)) {
          resolvedContentType = 'video/mp4';
        }
        const responseHeaders = {
          'Content-Type': resolvedContentType || 'video/mp4',
          'Accept-Ranges': 'bytes',
          'Connection': 'keep-alive',
          'Cache-Control': 'public, max-age=3600',
        };
        if (upstreamRes.headers['content-length']) {
          responseHeaders['Content-Length'] = upstreamRes.headers['content-length'];
        }
        if (upstreamRes.headers['content-range']) {
          responseHeaders['Content-Range'] = upstreamRes.headers['content-range'];
        }
        if (upstreamRes.headers['accept-ranges']) {
          responseHeaders['Accept-Ranges'] = upstreamRes.headers['accept-ranges'];
        }
        res.writeHead(statusCode, responseHeaders);
        if (req.method === 'HEAD') {
          upstreamRes.resume();
          return res.end();
        }
        return upstreamRes.pipe(res);
      }

      let streamEnded = false;
      upstreamRes.once('end', () => {
        streamEnded = true;
      });

      // Ler o primeiro pacote pausando o stream em seguida para não perder o evento 'end' nem pacotes subsequentes
      const firstChunk = await new Promise((resolve, reject) => {
        const onData = (chunk) => {
          upstreamRes.pause();
          cleanup();
          resolve(chunk);
        };
        const onEnd = () => {
          streamEnded = true;
          cleanup();
          resolve(null);
        };
        const onError = (err) => {
          cleanup();
          reject(err);
        };
        const cleanup = () => {
          upstreamRes.removeListener('data', onData);
          upstreamRes.removeListener('end', onEnd);
          upstreamRes.removeListener('error', onError);
        };
        upstreamRes.once('data', onData);
        upstreamRes.once('end', onEnd);
        upstreamRes.once('error', onError);
      });

      if (!firstChunk) {
        res.writeHead(statusCode);
        return res.end();
      }

      const previewStr = firstChunk.slice(0, 256).toString('utf-8');
      const isM3u8 = isLikelyHlsManifest(contentType, finalUrl, previewStr) && previewStr.trimStart().startsWith('#EXTM3U');

      if (isM3u8) {
        // Coletar restante do manifesto .m3u8 se ainda não terminou
        const remainingChunks = [firstChunk];
        let totalLen = firstChunk.length;

        if (!streamEnded && !upstreamRes.readableEnded && !upstreamRes.complete) {
          await new Promise((resolve, reject) => {
            upstreamRes.on('data', (chunk) => {
              totalLen += chunk.length;
              if (totalLen <= 5 * 1024 * 1024) {
                remainingChunks.push(chunk);
              }
            });
            upstreamRes.once('end', resolve);
            upstreamRes.once('error', reject);
            upstreamRes.resume();
          });
        }

        const fullManifest = Buffer.concat(remainingChunks).toString('utf-8');
        let extraParams = '';
        if (customReferer) extraParams += `&referer=${encodeURIComponent(customReferer)}`;
        if (customUa) extraParams += `&ua=${encodeURIComponent(customUa)}`;

        const rewritten = rewriteHlsManifest(fullManifest, finalUrl, extraParams);

        res.writeHead(200, {
          'Content-Type': 'application/vnd.apple.mpegurl; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        });
        return res.end(rewritten);
      }

      // Caso contrário, é segmento de vídeo (.ts, .m4s, .mp4, stream contínuo ou imagem): fazer pipe direto!
      let resolvedContentType = contentType;
      if ((!resolvedContentType || resolvedContentType === 'application/octet-stream') && /\.mp4(\?|$)/i.test(finalUrl)) {
        resolvedContentType = 'video/mp4';
      }
      const responseHeaders = {
        'Content-Type': resolvedContentType || 'video/mp2t',
        'Cache-Control': 'no-cache',
      };

      if (upstreamRes.headers['content-length']) {
        responseHeaders['Content-Length'] = upstreamRes.headers['content-length'];
      }
      if (upstreamRes.headers['content-range']) {
        responseHeaders['Content-Range'] = upstreamRes.headers['content-range'];
      }
      if (upstreamRes.headers['accept-ranges']) {
        responseHeaders['Accept-Ranges'] = upstreamRes.headers['accept-ranges'];
      }

      res.writeHead(statusCode, responseHeaders);
      res.write(firstChunk);
      if (streamEnded || upstreamRes.readableEnded) {
        res.end();
      } else {
        upstreamRes.pipe(res);
        upstreamRes.resume();
      }
    } catch (err) {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
        res.end(JSON.stringify({ error: `Erro no proxy de stream: ${err.message}` }));
      } else {
        res.end();
      }
    }
    return;
  }

  // 5. Servir arquivos estáticos da pasta public/
  let safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  // Garantir que o arquivo está dentro de PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end('Acesso negado');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback SPA para index.html
      const indexFile = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(indexFile, (readErr, content) => {
        if (readErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
          return res.end('Arquivo não encontrado');
        }
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(content);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';

    // Se for lista M3U, reescrever URLs dinamicamente com o host/domínio real da requisição na VPS
    if (ext === '.m3u' || ext === '.m3u8') {
      fs.readFile(filePath, 'utf8', (readErr, content) => {
        if (readErr) {
          res.writeHead(500);
          return res.end('Erro ao ler lista');
        }
        const host = req.headers.host || `localhost:${PORT}`;
        const proto = (req.headers['x-forwarded-proto'] || 'http').split(',')[0].trim();
        const origin = `${proto}://${host}`;
        let rewritten = content
          .replace(/https?:\/\/(localhost|127\.0\.0\.1):3000/gi, origin)
          .replace(/(\n|\r\n)\/api\//g, `$1${origin}/api/`);
        res.writeHead(200, {
          'Content-Type': mimeType,
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache'
        });
        res.end(rewritten);
      });
      return;
    }

    res.writeHead(200, {
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*',
      'X-Content-Type-Options': 'nosniff'
    });
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log(`📺 Canais IPTV / M3U Player (PobreFlix) ativo!`);
  console.log(`🌐 Servidor rodando em: http://0.0.0.0:${PORT}`);
  console.log(`🛡️  Proxy CORS & HLS ativo em: /api/proxy`);
  console.log(`🚀 Pronto para VPS (Ubuntu, Debian, Docker, PM2)`);
  console.log('====================================================');
});

// Encerramento seguro (Graceful Shutdown) para Docker, PM2 e systemd
const handleShutdown = (signal) => {
  console.log(`\nRecebido sinal ${signal}. Encerrando servidor de forma segura...`);
  server.close(() => {
    console.log('Servidor finalizado com sucesso.');
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000);
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));
