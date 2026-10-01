const { useState, useEffect, useRef, useMemo, useCallback } = React;

// ==========================================
// DETECTOR UNIVERSAL DE SÉRIES E EPISÓDIOS (S01E01, T01|EP01, 1x01, Ep 01...)
// ==========================================
function detectSeriesInfo(name, group, isVod, url = '') {
  const cleanName = (name || '').trim();
  const cleanGroup = (group || '').trim();
  const rawUrl = (url || '').trim();

  // Padrão 1: S01E01, S1E1, S01 E01, T01|EP01, T01EP01, T01 E01, T1|EP1, EP 01
  const seRegex =
    /\b(?:S|T|TEMP(?:ORADA)?\s*)(\d{1,2})\s*[\|/\-_\s.]*(?:E|EP|EPIS[OÓ]DIO)?\s*(\d{1,3})\b/i;
  const matchSE = cleanName.match(seRegex);
  if (matchSE) {
    const seasonNumber = parseInt(matchSE[1], 10) || 1;
    const episodeNumber = parseInt(matchSE[2], 10) || 1;
    const before = cleanName
      .slice(0, matchSE.index)
      .replace(/[-–—:|•\s]+$/, '')
      .trim();
    const after = cleanName
      .slice(matchSE.index + matchSE[0].length)
      .replace(/^[-–—:|•\s]+/, '')
      .trim();

    let seriesTitle = before;
    if (!seriesTitle || seriesTitle.length < 2) {
      if (cleanGroup && cleanGroup !== 'Geral' && !/^VOD/i.test(cleanGroup)) {
        seriesTitle = cleanGroup
          .replace(/\s*-\s*DUBLADO|\s*-\s*DUB|\s*-\s*LEG/gi, '')
          .trim();
      } else if (after.length >= 2) {
        seriesTitle = after;
      } else {
        seriesTitle = cleanName;
      }
    }
    return {
      isSeriesEpisode: true,
      seriesTitle,
      seasonNumber,
      episodeNumber,
      episodeTitle: after || `Temporada ${seasonNumber} • Episódio ${episodeNumber}`
    };
  }

  // Padrão 2: 1x01, 02x15
  const matchX = cleanName.match(/\b(\d{1,2})x(\d{1,3})\b/i);
  if (matchX) {
    const seasonNumber = parseInt(matchX[1], 10) || 1;
    const episodeNumber = parseInt(matchX[2], 10) || 1;
    const before = cleanName
      .slice(0, matchX.index)
      .replace(/[-–—:|•\s]+$/, '')
      .trim();
    const seriesTitle =
      before.length >= 2
        ? before
        : cleanGroup && cleanGroup !== 'Geral'
        ? cleanGroup
        : cleanName;
    return {
      isSeriesEpisode: true,
      seriesTitle,
      seasonNumber,
      episodeNumber,
      episodeTitle: `Temporada ${seasonNumber} • Episódio ${episodeNumber}`
    };
  }

  // Padrão 3: Detecção via URL com parâmetro ep=N (ex: api/ia-stream?id=cangaco-novo-s01-paixaoflix&ep=1)
  if (rawUrl && /ep=(\d+)/i.test(rawUrl)) {
    const epMatch = rawUrl.match(/ep=(\d+)/i);
    const episodeNumber = parseInt(epMatch[1], 10) || 1;
    const seriesTitle = cleanName.replace(/\s*-\s*[ST]\d+.*$/i, '').trim() || cleanGroup;
    return {
      isSeriesEpisode: true,
      seriesTitle,
      seasonNumber: 1,
      episodeNumber,
      episodeTitle: `Temporada 1 • Episódio ${episodeNumber}`
    };
  }

  // Padrão 4: "193 South Park" quando o group-title é o nome da série
  if (
    isVod &&
    cleanGroup &&
    cleanGroup !== 'Geral' &&
    !/filmes|canais|tv|esporte|aberta/i.test(cleanGroup)
  ) {
    const numPrefix = cleanName.match(/^(\d{1,3})\s*[-–.]?\s*(.+)$/i);
    if (numPrefix) {
      const epNum = parseInt(numPrefix[1], 10) || 1;
      const rest = numPrefix[2].trim();
      if (
        rest.toLowerCase().includes(cleanGroup.toLowerCase()) ||
        cleanGroup.toLowerCase().includes(rest.toLowerCase())
      ) {
        const seasonNumber = Math.floor((epNum - 1) / 20) + 1;
        return {
          isSeriesEpisode: true,
          seriesTitle: cleanGroup,
          seasonNumber,
          episodeNumber: epNum,
          episodeTitle: `Episódio ${epNum} — ${cleanGroup}`
        };
      }
    }
  }

  return {
    isSeriesEpisode: false,
    seriesTitle: '',
    seasonNumber: 1,
    episodeNumber: 1,
    episodeTitle: ''
  };
}

/**
 * Normaliza e consolida o histórico (Continuar Assistindo).
 * Garante que NUNCA haja mais de um card para a mesma série.
 * Mantém apenas o episódio mais recente assistido e anexa dados da série.
 */
function deduplicateHistory(historyItems, allCatalogChannels = []) {
  if (!Array.isArray(historyItems) || historyItems.length === 0) return [];
  const seenSeries = new Map();
  const seenUrls = new Set();
  const result = [];

  const catalogSeriesMap = new Map();
  if (Array.isArray(allCatalogChannels)) {
    for (const c of allCatalogChannels) {
      if (c && (c.isSeriesGroup || c.episodes) && c.name) {
        const k = c.name
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]/g, '');
        if (k) catalogSeriesMap.set(k, c);
        if (c.seriesTitle) {
          const ks = c.seriesTitle
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]/g, '');
          if (ks) catalogSeriesMap.set(ks, c);
        }
      }
    }
  }

  for (const item of historyItems) {
    if (!item) continue;
    if (item.url && typeof window !== 'undefined' && window.location) {
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(item.url)) {
        item.url = item.url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, window.location.origin);
      } else if (item.url.startsWith('/')) {
        item.url = `${window.location.origin}${item.url}`;
      }
    }

    if (item.name && /shrek/i.test(item.name) && item.url && /rio-2/i.test(item.url)) {
      item.url = 'https://archive.org/download/shrek-terceiro-2007-bdrip-720p-dublado_202604/Shrek%20Terceiro%20(2007)%20-%20BDRip%20720p%20-%20Dublado.mp4';
    }
    if (item.name && /era do gelo/i.test(item.name) && item.url && /rio-2/i.test(item.url)) {
      item.url = 'https://archive.org/download/a-era-do-gelo-blu-ray-1080p-dublado/A%20Era%20do%20Gelo%20BluRay%201080p%20Dublado.mp4';
    }
    if (item.name && /toy story/i.test(item.name) && item.url && /rio-2/i.test(item.url)) {
      item.url = 'https://archive.org/download/toy-story-2-1999-vhsrip-dublado/Toy%20Story%202%20(1999)%20VHSRip%20Dublado.mp4';
    }

    const detected = detectSeriesInfo(item.name, item.group, item.isVod !== false, item.url);
    const isSeries = Boolean(
      item.isSeriesGroup ||
      item.isSeriesEpisode ||
      Boolean(item.seriesTitle) ||
      detected.isSeriesEpisode ||
      (item.group && /série|serie|anime|sitcom/i.test(item.group)) ||
      /[ST]\d+[\s.:-]*[E|EP]\d+/i.test(item.name || '') ||
      /\s*-\s*[ST]\d+/i.test(item.name || '') ||
      /ep=\d+/i.test(item.url || '')
    );

    const baseTitle = (
      detected.seriesTitle ||
      item.seriesTitle ||
      (isSeries
        ? item.name
            .replace(/\s*-\s*[ST]\d+.*$/i, '')
            .replace(/\s*[ST]\d+E\d+.*$/i, '')
            .trim()
        : item.name)
    );

    const cleanKey = (baseTitle || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

    if (isSeries && cleanKey) {
      if (seenSeries.has(cleanKey)) {
        // Já existe o card dessa série no histórico -> não duplica!
        continue;
      }
      seenSeries.set(cleanKey, true);

      const catalogMatch = catalogSeriesMap.get(cleanKey);
      const episodesList =
        item.episodes && item.episodes.length > 0
          ? item.episodes
          : catalogMatch?.episodes && catalogMatch.episodes.length > 0
          ? catalogMatch.episodes
          : [];

      const seasonNumber = item.seasonNumber || detected.seasonNumber || 1;
      const episodeNumber = item.episodeNumber || detected.episodeNumber || 1;

      result.push({
        ...item,
        name: baseTitle,
        seriesTitle: baseTitle,
        seasonNumber,
        episodeNumber,
        episodeTitle: item.episodeTitle || detected.episodeTitle || `Episódio ${episodeNumber}`,
        isVod: true,
        isSeriesGroup: true,
        isSeriesEpisode: true,
        logo: item.logo || catalogMatch?.logo,
        episodes: episodesList
      });
    } else {
      if (item.url && seenUrls.has(item.url)) continue;
      if (cleanKey && seenSeries.has(cleanKey)) continue;
      if (item.url) seenUrls.add(item.url);
      if (cleanKey) seenSeries.set(cleanKey, true);

      result.push(item);
    }
  }

  return result;
}

// ==========================================
// PARSER M3U / M3U8 COMPLETO
// ==========================================
function parseM3U(content) {
  if (!content || typeof content !== 'string') return [];
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const items = [];
  let current = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      current = {
        name: 'Título sem nome',
        logo: '',
        group: 'Geral',
        tvgId: '',
        tvgName: '',
        url: '',
        rawExtinf: line,
        userAgent: '',
        referrer: ''
      };

      const logoMatch = line.match(/tvg-logo="([^"]*)"/i);
      if (logoMatch && logoMatch[1]) current.logo = logoMatch[1].trim();

      const groupMatch = line.match(/group-title="([^"]*)"/i);
      if (groupMatch && groupMatch[1]) {
        current.group = groupMatch[1].trim().replace(/;/g, ' • ') || 'Geral';
      }

      const idMatch = line.match(/tvg-id="([^"]*)"/i);
      if (idMatch && idMatch[1]) current.tvgId = idMatch[1].trim();

      const nameMatch = line.match(/tvg-name="([^"]*)"/i);
      if (nameMatch && nameMatch[1]) current.tvgName = nameMatch[1].trim();

      const commaIndex = line.lastIndexOf(',');
      if (commaIndex !== -1) {
        const extractedName = line.slice(commaIndex + 1).trim();
        if (extractedName) current.name = extractedName;
      } else if (current.tvgName) {
        current.name = current.tvgName;
      }
    } else if (line.startsWith('#EXTGRP:') && current) {
      const grp = line.replace('#EXTGRP:', '').trim();
      if (grp && (!current.group || current.group === 'Geral')) {
        current.group = grp;
      }
    } else if (line.startsWith('#EXTVLCOPT:') && current) {
      const opt = line.replace('#EXTVLCOPT:', '').trim();
      if (opt.toLowerCase().startsWith('http-user-agent=')) {
        current.userAgent = opt.substring(16).trim();
      } else if (opt.toLowerCase().startsWith('http-referrer=')) {
        current.referrer = opt.substring(14).trim();
      }
    } else if (!line.startsWith('#')) {
      const trimmedLine = line.trim();
      if (/^https?:\/\/|^\/?api\//i.test(trimmedLine)) {
        let streamUrl = trimmedLine;
        if (typeof window !== 'undefined' && window.location) {
          if (streamUrl.startsWith('/')) {
            streamUrl = `${window.location.origin}${streamUrl}`;
          } else if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(streamUrl)) {
            streamUrl = streamUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, window.location.origin);
          }
        }
        const item = current || {
          name: `Título ${items.length + 1}`,
          logo: '',
          group: 'Geral',
          tvgId: '',
          tvgName: '',
          url: ''
        };
        item.url = streamUrl;

        const nameUpper = item.name.toUpperCase();
        let quality = 'HD';
        if (nameUpper.includes('4K') || nameUpper.includes('UHD')) quality = '4K';
        else if (nameUpper.includes('FHD') || nameUpper.includes('1080')) quality = 'FHD';
        else if (nameUpper.includes('720') || nameUpper.includes('HD')) quality = 'HD';
        else if (nameUpper.includes('SD')) quality = 'SD';

        const isVod =
          /\.(mp4|mkv|avi|mov|webm)(\?|$)/i.test(line) ||
          /video-play\.mp4/i.test(line) ||
          /archive\.org\/download\//i.test(line) ||
          /^VOD/i.test(item.group);

        const seriesInfo = detectSeriesInfo(item.name, item.group, isVod, item.url);

        item.quality = quality;
        item.isVod = isVod || seriesInfo.isSeriesEpisode;
        item.isSeriesEpisode = seriesInfo.isSeriesEpisode;
        item.seriesTitle = seriesInfo.seriesTitle;
        item.seasonNumber = seriesInfo.seasonNumber;
        item.episodeNumber = seriesInfo.episodeNumber;
        item.episodeTitle = item.tvgName || seriesInfo.episodeTitle;
        item.id = `${item.name}_${item.url}_${items.length}`;
        items.push(item);
        current = null;
      }
    }
  }

  return items;
}

/**
 * Agrupa múltiplos episódios (S01E01, T01|EP01...) em um único Card de Série
 * E mescla o catálogo VIP de Blockbusters (window.POBREFLIX_BLOCKBUSTERS)
 */
/**
 * Dicionário de Metadados e Gêneros Corretos para Séries Populares do Catálogo
 */
const SERIES_KNOWN_METADATA = {
  'bridgerton': {
    name: 'Bridgerton (Dublado)',
    group: 'VOD Séries: Drama, Romance & Época (Dublado)'
  },
  'cangaco novo': {
    name: 'Cangaço Novo (Dublado)',
    group: 'VOD Séries: Drama, Ação & Crime (Dublado)'
  },
  'cangaço novo': {
    name: 'Cangaço Novo (Dublado)',
    group: 'VOD Séries: Drama, Ação & Crime (Dublado)'
  },
  'castelo ra tim bum': {
    name: 'Castelo Rá Tim Bum (Dublado)',
    group: 'VOD Séries: Desenhos & Animações (Dublado)'
  },
  'castelo rá tim bum': {
    name: 'Castelo Rá Tim Bum (Dublado)',
    group: 'VOD Séries: Desenhos & Animações (Dublado)'
  },
  'chapolin colorado': {
    name: 'Chapolin Colorado (Dublado)',
    group: 'VOD Séries: Comédias & Sitcoms (Dublado)'
  },
  'chapolin e os colorados': {
    name: 'Chapolin e os Colorados (Dublado)',
    group: 'VOD Séries: Comédias & Sitcoms (Dublado)'
  },
  'chaves': {
    name: 'Chaves (Dublado)',
    group: 'VOD Séries: Comédias & Sitcoms (Dublado)'
  },
  'chaves em desenho animado': {
    name: 'Chaves em Desenho Animado (Dublado)',
    group: 'VOD Séries: Desenhos & Animações (Dublado)'
  },
  'coracao de ferro': {
    name: 'Coração de Ferro (Dublado)',
    group: 'VOD Séries: Drama, Ação & Crime (Dublado)'
  },
  'coração de ferro': {
    name: 'Coração de Ferro (Dublado)',
    group: 'VOD Séries: Drama, Ação & Crime (Dublado)'
  },
  'dope thief': {
    name: 'Dope Thief (Dublado)',
    group: 'VOD Séries: Drama, Ação & Crime (Dublado)'
  },
  'homem aranha: a serie animada': {
    name: 'Homem Aranha: A Série Animada (Dublado)',
    group: 'VOD Séries: Desenhos & Animações (Dublado)'
  },
  'homem aranha: a série animada': {
    name: 'Homem Aranha: A Série Animada (Dublado)',
    group: 'VOD Séries: Desenhos & Animações (Dublado)'
  },
  'key and peele': {
    name: 'Key And Peele (Dublado)',
    group: 'VOD Séries: Comédias & Sitcoms (Dublado)'
  },
  'lupin': {
    name: 'Lupin (Dublado)',
    group: 'VOD Séries: Drama, Ação & Crime (Dublado)'
  },
  'marcada': {
    name: 'Marcada (Dublado)',
    group: 'VOD Séries: Drama, Ação & Crime (Dublado)'
  },
  'mila no multiverso': {
    name: 'Mila no Multiverso (Dublado)',
    group: 'VOD Séries: Ficção, Fantasia & Sobrenatural (Dublado)'
  },
  'senna por ayrton': {
    name: 'Senna por Ayrton (Dublado)',
    group: 'VOD Séries: Documentários & Biografias (Dublado)'
  },
  'september mornings': {
    name: 'September Mornings (Manhãs de Setembro) (Dublado)',
    group: 'VOD Séries: Drama, Romance & Época (Dublado)'
  },
  'manhas de setembro': {
    name: 'September Mornings (Manhãs de Setembro) (Dublado)',
    group: 'VOD Séries: Drama, Romance & Época (Dublado)'
  },
  'manhãs de setembro': {
    name: 'September Mornings (Manhãs de Setembro) (Dublado)',
    group: 'VOD Séries: Drama, Romance & Época (Dublado)'
  },
  'serie cobra kai': {
    name: 'Cobra Kai (Dublado)',
    group: 'VOD Séries: Drama, Ação & Crime (Dublado)'
  },
  'cobra kai': {
    name: 'Cobra Kai (Dublado)',
    group: 'VOD Séries: Drama, Ação & Crime (Dublado)'
  },
  'tales from the goose lady: the ugly duck thing': {
    name: 'Tales from the Goose Lady: The Ugly Duck Thing (Dublado)',
    group: 'VOD Séries: Desenhos & Animações (Dublado)'
  },
  'them (eles)': {
    name: 'Them (Eles) (Dublado)',
    group: 'VOD Séries: Suspense, Mistério & Terror (Dublado)'
  },
  'them': {
    name: 'Them (Eles) (Dublado)',
    group: 'VOD Séries: Suspense, Mistério & Terror (Dublado)'
  },
  'um maluco no pedaco': {
    name: 'Um Maluco no Pedaço (Dublado)',
    group: 'VOD Séries: Comédias & Sitcoms (Dublado)'
  },
  'um maluco no pedaço': {
    name: 'Um Maluco no Pedaço (Dublado)',
    group: 'VOD Séries: Comédias & Sitcoms (Dublado)'
  },
  'xena: a princesa guerreira': {
    name: 'Xena: A Princesa Guerreira (Dublada)',
    group: 'VOD Séries: Ação, Aventura & Fantasia (Dublado)'
  }
};

/**
 * Agrupa múltiplos episódios (S01E01, T01|EP01...) em um único Card de Série
 * E mescla o catálogo VIP de Blockbusters (window.POBREFLIX_BLOCKBUSTERS)
 */
function groupSeriesIntoCatalog(rawChannels, includeBlockbusters = true) {
  const result = [];
  const seriesMap = new Map();

  for (const ch of rawChannels) {
    if (!ch || !ch.name) continue;
    // Ignorar entradas quebradas ou nulas
    if (/^null\b/i.test(ch.name) || /^null\b/i.test(ch.seriesTitle || '')) continue;

    if (ch.isSeriesEpisode && ch.seriesTitle) {
      let sTitle = ch.seriesTitle
        .replace(/\s*\(\s*\(/g, ' (')
        .replace(/\s+/g, ' ')
        .trim();

      if (/^serie\s+cobra\s+kai/i.test(sTitle)) {
        sTitle = 'Cobra Kai (Dublado)';
      }
      if (/^cangaco\s+novo/i.test(sTitle)) {
        sTitle = 'Cangaço Novo (Dublado)';
      }

      const normKey = sTitle
        .toLowerCase()
        .replace(/[\(\)]/g, '')
        .replace(/\bdublad[ao]\b/gi, '')
        .trim();

      const override =
        SERIES_KNOWN_METADATA[normKey] ||
        Object.entries(SERIES_KNOWN_METADATA).find(([k]) => normKey.includes(k))?.[1];

      const finalTitle = override?.name || sTitle;
      const finalGroup = override?.group || ch.group;
      const key = finalTitle.toLowerCase().trim();

      if (!seriesMap.has(key)) {
        const seriesCard = {
          id: `series_${key}`,
          name: finalTitle,
          logo: ch.logo,
          group: finalGroup,
          quality: ch.quality || 'HD',
          isVod: true,
          isSeriesGroup: true,
          seriesTitle: finalTitle,
          url: ch.url,
          episodes: [ch],
          seasonsCount: 1
        };
        seriesMap.set(key, seriesCard);
        result.push(seriesCard);
      } else {
        const existing = seriesMap.get(key);
        existing.episodes.push(ch);
        if (!existing.logo && ch.logo) existing.logo = ch.logo;
        if (override?.group) existing.group = override.group;
      }
    } else {
      result.push(ch);
    }
  }

  seriesMap.forEach((seriesCard) => {
    seriesCard.episodes.sort((a, b) => {
      if (a.seasonNumber !== b.seasonNumber) return a.seasonNumber - b.seasonNumber;
      return a.episodeNumber - b.episodeNumber;
    });
    const uniqueSeasons = new Set(seriesCard.episodes.map((e) => e.seasonNumber || 1));
    seriesCard.seasonsCount = uniqueSeasons.size;
  });

  // Adicionar os grandes sucessos (Blockbusters de Filmes, Séries, Sitcoms e Animes)
  if (includeBlockbusters && Array.isArray(window.POBREFLIX_BLOCKBUSTERS)) {
    const existingNames = new Set();
    result.forEach((r) => {
      existingNames.add((r.name || '').toLowerCase().trim());
      if (r.seriesTitle) existingNames.add((r.seriesTitle || '').toLowerCase().trim());
    });

    const blockbusterItems = [];
    for (const b of window.POBREFLIX_BLOCKBUSTERS) {
      if (!b || !b.name) continue;
      const lower = b.name.toLowerCase().trim();
      if (existingNames.has(lower)) continue;
      existingNames.add(lower);

      const isAnime = b.type === 'anime' || /anime|tokusatsu/i.test(b.group || '');
      const isSeries = b.type === 'series' || isAnime;
      blockbusterItems.push({
        id: `blockbuster_${b.imdbId || b.id}`,
        imdbId: b.imdbId || b.id,
        name: b.name,
        rawTitle: b.rawTitle || b.name,
        logo: b.logo || b.poster,
        group: b.group,
        summary: b.summary || '',
        quality: 'FHD',
        isVod: true,
        isCloudVod: true,
        isSeriesGroup: isSeries,
        isAnime: isAnime,
        seriesTitle: isSeries ? b.name : '',
        seasonsCount: isSeries ? 'Todas' : 0,
        episodes: [],
        url: `cloud://${isSeries ? 'tv' : 'movie'}/${b.imdbId || b.id}`
      });
    }

    // Colocar os filmes e séries M3U diretos na frente, seguidos pelo megacatálogo VIP!
    return [...result, ...blockbusterItems];
  }

  return result;
}

function getCloudEmbedUrl(channel, serverKey = 'vidsrc_to') {
  if (!channel) return '';
  let imdbId = channel.imdbId || '';
  let season = channel.seasonNumber || 1;
  let episode = channel.episodeNumber || 1;
  let isTv = Boolean(channel.isSeriesEpisode || channel.isSeriesGroup);

  if (channel.url && channel.url.startsWith('cloud://')) {
    const parts = channel.url.replace('cloud://', '').split('/');
    if (parts[0] === 'tv') {
      isTv = true;
      imdbId = parts[1] || imdbId;
      season = parseInt(parts[2], 10) || season;
      episode = parseInt(parts[3], 10) || episode;
    } else {
      isTv = false;
      imdbId = parts[1] || imdbId;
    }
  }

  if (!imdbId) return '';

  const isNumericTmdb = /^\d+$/.test(imdbId);

  if (isTv) {
    if (serverKey === 'vidsrc_sh') {
      return isNumericTmdb
        ? `https://vidsrc.sh/embed/tv?tmdb=${imdbId}&season=${season}&episode=${episode}`
        : `https://vidsrc.sh/embed/tv?imdb=${imdbId}&season=${season}&episode=${episode}`;
    }
    if (serverKey === 'multiembed') {
      return isNumericTmdb
        ? `https://multiembed.mov/?video_id=${imdbId}&tmdb=1&s=${season}&e=${episode}`
        : `https://multiembed.mov/?video_id=${imdbId}&s=${season}&e=${episode}`;
    }
    return `https://vidsrc.to/embed/tv/${imdbId}/${season}/${episode}`;
  } else {
    if (serverKey === 'vidsrc_sh') {
      return isNumericTmdb
        ? `https://vidsrc.sh/embed/movie?tmdb=${imdbId}`
        : `https://vidsrc.sh/embed/movie?imdb=${imdbId}`;
    }
    if (serverKey === 'multiembed') {
      return isNumericTmdb
        ? `https://multiembed.mov/?video_id=${imdbId}&tmdb=1`
        : `https://multiembed.mov/?video_id=${imdbId}`;
    }
    return `https://vidsrc.to/embed/movie/${imdbId}`;
  }
}

function getInitials(name) {
  if (!name) return 'PF';
  const clean = name.replace(/\[.*?\]|\(.*?\)/g, '').trim();
  const words = clean.split(/\s+/).filter(Boolean);
  if (words.length === 0) return 'PF';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

function getSmartDescription(channel) {
  if (!channel) return '';
  if (channel.summary) return channel.summary;
  const n = channel.name.toLowerCase();

  if (channel.isSeriesGroup) {
    const epCountText =
      channel.episodes && channel.episodes.length > 0
        ? `com ${channel.seasonsCount} Temporadas e ${channel.episodes.length} Episódios listados`
        : 'com todas as Temporadas e Episódios disponíveis sob demanda';
    return `Série completa disponível na PobreFlix ${epCountText}! Clique para abrir a lista de temporadas e episódios igual à Netflix e assistir quando quiser.`;
  }
  if (n.includes('deadpool')) {
    return 'Wolverine está se recuperando quando cruza seu caminho com o tagarela Deadpool. Juntos, eles formam uma equipe explosiva para enfrentar um inimigo em comum.';
  }
  if (n.includes('breaking bad')) {
    return 'Ao saber que tem câncer, um professor de química do ensino médio começa a fabricar metanfetamina para garantir o futuro da família, entrando no submundo do crime.';
  }
  if (n.includes('stranger things')) {
    return 'Quando um garoto desaparece em uma pequena cidade, amigos, familiares e a polícia descobrem experimentos secretos, forças sobrenaturais e uma garota com poderes.';
  }
  if (n.includes('the boys')) {
    return 'Um grupo de vigilantes se propõe a derrubar super-heróis corruptos que abusam de seus superpoderes e da fama corporativa.';
  }
  if (n.includes('todo mundo odeia o chris')) {
    return 'Acompanhe a adolescência hilária de Chris Rock no Brooklyn dos anos 80 ao lado de Julius, Rochelle, Drew, Tonya e Greg! Todas as temporadas disponíveis.';
  }
  if (channel.isVod) {
    return `Filme completo sob demanda ("${channel.name}"). Começa do minuto 00:00 com controle total na barra de tempo e múltiplos servidores de reprodução!`;
  }
  return `Assista agora a "${channel.name}" (${channel.group || 'Ao Vivo'}) com transmissão contínua e sinal otimizado pelo Proxy PobreFlix.`;
}

// ==========================================
// COMPONENTE DE LOGO / CAPA COM AUTO-BUSCA IMDb
// ==========================================
const imdbPosterCache = new Map();

function ChannelLogo({
  logo,
  name,
  isPoster = false,
  className = 'channel-logo-img'
}) {
  const [stage, setStage] = useState(0);
  const [resolvedPoster, setResolvedPoster] = useState(null);

  useEffect(() => {
    setStage(0);
    setResolvedPoster(null);
  }, [logo, name]);

  useEffect(() => {
    const needsLookup = isPoster && (!logo || stage >= 2) && !resolvedPoster;
    if (!needsLookup || !name) return;

    const cleanTitle = name
      .replace(/\[.*?\]|\(.*?\)/g, '')
      .replace(/S\d+\s*E\d+/gi, '')
      .replace(/[-–]\s*Temporada.*$/i, '')
      .trim();

    if (!cleanTitle) return;

    if (imdbPosterCache.has(cleanTitle)) {
      const cached = imdbPosterCache.get(cleanTitle);
      if (cached) setResolvedPoster(cached);
      return;
    }

    let cancelled = false;
    fetch(`/api/search-catalog?q=${encodeURIComponent(cleanTitle)}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const found = (data.results || []).find((item) => item.logo);
        const bestLogo = found ? found.logo : '';
        imdbPosterCache.set(cleanTitle, bestLogo);
        if (bestLogo) {
          setResolvedPoster(bestLogo);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [isPoster, logo, stage, name, resolvedPoster]);

  const imgInlineStyle = {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: isPoster ? 'cover' : 'contain',
    objectPosition: isPoster ? 'center top' : 'center',
    display: 'block'
  };

  if (resolvedPoster) {
    return (
      <img
        src={resolvedPoster}
        alt={name}
        className={className}
        style={imgInlineStyle}
        loading="lazy"
        onError={() => setResolvedPoster(null)}
      />
    );
  }

  if (!logo || stage >= 2) {
    if (isPoster) {
      return (
        <div className="poster-fallback-art">
          <span className="poster-fallback-initials">{getInitials(name)}</span>
          <span className="poster-fallback-title">{name}</span>
        </div>
      );
    }
    return <span className="channel-logo-fallback">{getInitials(name)}</span>;
  }

  const src = stage === 0 ? logo : `/api/proxy?url=${encodeURIComponent(logo)}`;

  return (
    <img
      src={src}
      alt={name}
      className={className}
      style={imgInlineStyle}
      loading="lazy"
      onError={() => setStage((prev) => prev + 1)}
    />
  );
}

// ==========================================
// CARD INDIVIDUAL ESTILO NETFLIX
// ==========================================
function PobreFlixCard({
  channel,
  isPlaying,
  isFav,
  statusInfo,
  onSelect,
  onOpenEpisodes,
  onToggleFav
}) {
  const isAnime = Boolean(channel.isAnime || /anime|tokusatsu/i.test(channel.group || ''));
  const isSeries = Boolean(
    channel.isSeriesGroup ||
    channel.isSeriesEpisode ||
    Boolean(channel.seriesTitle) ||
    isAnime ||
    (channel.episodes && channel.episodes.length > 0) ||
    (channel.group && /série|serie|sitcom/i.test(channel.group)) ||
    /[ST]\d+[\s.:-]*[E|EP]\d+/i.test(channel.name || '') ||
    /ep=\d+/i.test(channel.url || '')
  );
  const isPoster = Boolean(channel.isVod || channel.isSeriesGroup || isSeries);
  const epCount = channel.episodes?.length || 0;

  return (
    <div
      className={`nf-card ${isPoster ? 'is-poster-card' : ''} ${
        isPlaying ? 'active-playing' : ''
      }`}
      onClick={() => {
        if (channel.episodeNumber && onSelect) {
          onSelect(channel);
        } else if (isSeries && onOpenEpisodes) {
          onOpenEpisodes(channel);
        } else {
          onSelect(channel);
        }
      }}
    >
      <div className="nf-card-thumb">
        <ChannelLogo
          logo={channel.logo}
          name={channel.name}
          isPoster={isPoster}
        />

        <div className="nf-card-badges">
          {isAnime ? (
            <span
              className="nf-tag-series"
              style={{
                background: 'linear-gradient(90deg, #ec4899, #f43f5e)',
                color: '#fff',
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                fontWeight: 800
              }}
            >
              🎌 ANIME {channel.episodeNumber ? `• EP ${channel.episodeNumber}` : (epCount > 0 ? `• ${epCount} EPS` : '• DUBLADO')}
            </span>
          ) : isSeries ? (
            <span className="nf-tag-series">
              📺 SÉRIE {channel.episodeNumber ? `• T${channel.seasonNumber || 1}:E${channel.episodeNumber}` : (epCount > 0 ? `• ${epCount} EPS` : '• TEMPORADAS')}
            </span>
          ) : channel.isVod ? (
            <span className="nf-tag-vod">🍿 FILME VOD</span>
          ) : (
            <span className="nf-tag-live">● AO VIVO</span>
          )}

          {isSeries && onOpenEpisodes && (
            <button
              className="nf-fav-circle"
              style={{ marginRight: '6px' }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenEpisodes(channel);
              }}
              title="Ver todas as temporadas e episódios desta série"
            >
              ☰
            </button>
          )}

          <button
            className={`nf-fav-circle ${isFav ? 'active' : ''}`}
            onClick={(e) => onToggleFav(channel.url, e)}
            title={isFav ? 'Remover da Minha Lista' : 'Adicionar à Minha Lista'}
          >
            {isFav ? '★' : '＋'}
          </button>
        </div>

        <div className="nf-card-play-overlay">
          <div
            className="nf-play-circle"
            title={channel.episodeNumber ? `Continuar Ep. ${channel.episodeNumber}` : isSeries ? 'Escolher Temporada e Episódio' : 'Assistir Agora'}
          >
            ▶
          </div>
        </div>
      </div>

      <div className="nf-card-body">
        <div className="nf-card-title" title={channel.seriesTitle || channel.name}>
          {statusInfo && (
            <span
              className={`status-dot ${
                statusInfo.checking
                  ? 'status-checking'
                  : statusInfo.online
                  ? 'status-online'
                  : 'status-offline'
              }`}
            />
          )}
          <span>{channel.seriesTitle || channel.name}</span>
        </div>

        <div className="nf-card-sub">
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '135px',
              color: isAnime ? '#f472b6' : isSeries ? '#c084fc' : undefined,
              fontWeight: isSeries ? 700 : undefined
            }}
          >
            {isSeries
              ? channel.episodeNumber
                ? `T${channel.seasonNumber || 1}:E${channel.episodeNumber} • Continuar`
                : 'Ver Episódios ▾'
              : channel.group}
          </span>
          <span className="nf-quality-pill">
            {channel.isVod ? '00:00 VOD' : channel.quality || 'HD'}
          </span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// TRILHO HORIZONTAL (CARROSSEL)
// ==========================================
function CatalogRow({
  title,
  channels,
  currentChannel,
  favorites,
  channelStatuses,
  onSelectChannel,
  onOpenEpisodes,
  onToggleFavorite,
  onExploreCategory,
  isTop10 = false,
  isSequence = false
}) {
  const trackRef = useRef(null);

  if (!channels || channels.length === 0) return null;

  const scrollTrack = (dir) => {
    if (!trackRef.current) return;
    const amount = dir * 680;
    trackRef.current.scrollBy({ left: amount, behavior: 'smooth' });
  };

  return (
    <section className="nf-row">
      <div className="nf-row-header">
        <h2
          className="nf-row-title"
          onClick={() => onExploreCategory && onExploreCategory()}
        >
          <span>{title}</span>
          <span style={{ fontSize: '12px', color: '#777', fontWeight: 600 }}>
            ({channels.length})
          </span>
        </h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="nf-btn nf-btn-dark"
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={() => scrollTrack(-1)}
            title="Rolar para a esquerda"
          >
            ◀
          </button>
          <button
            className="nf-btn nf-btn-dark"
            style={{ padding: '4px 10px', fontSize: '12px' }}
            onClick={() => scrollTrack(1)}
            title="Rolar para a direita"
          >
            ▶
          </button>
          {onExploreCategory && (
            <button className="nf-row-explore" onClick={onExploreCategory}>
              Ver tudo ›
            </button>
          )}
        </div>
      </div>

      <div className="nf-row-wrapper">
        <div className="nf-row-track" ref={trackRef}>
          {channels.map((ch, idx) => {
            const isPlaying =
              currentChannel?.url === ch.url ||
              (ch.isSeriesGroup &&
                ch.episodes?.some((ep) => ep.url === currentChannel?.url));
            const isFav = favorites.includes(ch.url);
            const statusInfo = channelStatuses[ch.url];

            if (isSequence) {
              return (
                <div
                  key={ch.id || idx}
                  className="nf-sequence-card"
                  onClick={() =>
                    ch.isSeriesGroup ? onOpenEpisodes(ch) : onSelectChannel(ch)
                  }
                  title={`Filme ${idx + 1}: ${ch.name}`}
                >
                  <span className="nf-sequence-number">{idx + 1}</span>
                  <PobreFlixCard
                    channel={ch}
                    isPlaying={isPlaying}
                    isFav={isFav}
                    statusInfo={statusInfo}
                    onSelect={onSelectChannel}
                    onOpenEpisodes={onOpenEpisodes}
                    onToggleFav={onToggleFavorite}
                  />
                </div>
              );
            }

            if (isTop10) {
              return (
                <div
                  key={ch.id || idx}
                  className="nf-top10-card"
                  onClick={() =>
                    ch.isSeriesGroup ? onOpenEpisodes(ch) : onSelectChannel(ch)
                  }
                >
                  <span className="nf-top10-number">{idx + 1}</span>
                  <PobreFlixCard
                    channel={ch}
                    isPlaying={isPlaying}
                    isFav={isFav}
                    statusInfo={statusInfo}
                    onSelect={onSelectChannel}
                    onOpenEpisodes={onOpenEpisodes}
                    onToggleFav={onToggleFavorite}
                  />
                </div>
              );
            }

            return (
              <PobreFlixCard
                key={ch.id || idx}
                channel={ch}
                isPlaying={isPlaying}
                isFav={isFav}
                statusInfo={statusInfo}
                onSelect={onSelectChannel}
                onOpenEpisodes={onOpenEpisodes}
                onToggleFav={onToggleFavorite}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ==========================================
// DEFINIÇÃO CENTRAL DE GÊNEROS & CATEGORIAS
// ==========================================
const GENRE_DEFINITIONS = [
  {
    id: 'Todos',
    name: 'Todos',
    emoji: '🌟',
    matcher: () => true
  },
  {
    id: 'Ação',
    name: 'Ação',
    emoji: '💥',
    matcher: (ch) => {
      const g = ch.group || '';
      const n = ch.name || ch.seriesTitle || '';
      if (/castelo r[áa]|bridgerton|chaves|chapolin|patroa|friends|as branquelas|super-herói:\s*o filme/i.test(n)) return false;
      if (/animação|animacao|desenho|infantil/i.test(g) && !/ação|acao|action|herói|heroi|combate|dragon ball|naruto|ninja/i.test(n)) return false;
      if (/filmes:\s*ação|séries:.*ação|\bação\b|\bacao\b|\baction\b/i.test(g)) return true;
      return /\b(ação|acao|action|herói|heroi|combate|guerra)\b|deadpool|vingadores|velozes|john wick|batman|rambo|exterminador|cangaço|cangaco|cobra kai|lupin|xena/i.test(n);
    }
  },
  {
    id: 'Comédia',
    name: 'Comédia',
    emoji: '😂',
    matcher: (ch) => {
      const g = ch.group || '';
      const n = ch.name || ch.seriesTitle || '';
      if (/bridgerton|cangaço|cangaco|castelo r[áa]|them|marcada|dope thief|senna por|september mornings|manhãs de setembro|lupin|cobra kai|xena/i.test(n)) {
        return false;
      }
      if (/comédia|comedia|sitcom/i.test(g)) {
        return true;
      }
      return /comédia|comedia|comedy|sitcom|humor|besteirol|engraç|chris|patroa|friends|chaves|chapolin|as branquelas|gente grande|ted lasso|seinfeld|modern family|maluco no pedaço/i.test(n);
    }
  },
  {
    id: 'Aventura',
    name: 'Aventura',
    emoji: '🗺️',
    matcher: (ch) => {
      const g = ch.group || '';
      const n = ch.name || ch.seriesTitle || '';
      if (/bridgerton|chaves|chapolin/i.test(n)) return false;
      if (/aventura|adventure|fantasia/i.test(g)) return true;
      return /aventura|adventure|fantasia|fantasy|jurassic|senhor dos anéis|harry potter|hobbit|indiana jones|piratas|xena/i.test(n);
    }
  },
  {
    id: 'Drama',
    name: 'Drama',
    emoji: '🎭',
    matcher: (ch) => {
      const g = ch.group || '';
      const n = ch.name || ch.seriesTitle || '';
      if (/castelo r[áa]|chaves|chapolin|as branquelas|todo mundo em pânico/i.test(n)) return false;
      if (/drama|novela/i.test(g)) return true;
      return /drama|novela|dorama|emocion|superação|bridgerton|cangaço|cangaco|marcada|dope thief|manhãs de setembro|september mornings|senna|clube da luta|chefão|titanic|vida|sonho|liberdade/i.test(n);
    }
  },
  {
    id: 'Terror',
    name: 'Terror',
    emoji: '👻',
    matcher: (ch) => {
      const g = ch.group || '';
      const n = ch.name || ch.seriesTitle || '';
      if (/chaves|chapolin|castelo r[áa]|bridgerton/i.test(n)) return false;
      if (/terror|horror/i.test(g)) return true;
      return /terror|horror|maldito|assomb|exorcist|pânico|panico|invocação|jogos mortais|halloween|them\s*\(eles\)/i.test(n);
    }
  },
  {
    id: 'Suspense',
    name: 'Suspense & Crime',
    emoji: '🕵️',
    matcher: (ch) => {
      const g = ch.group || '';
      const n = ch.name || ch.seriesTitle || '';
      if (/chaves|chapolin|castelo r[áa]|bridgerton/i.test(n)) return false;
      if (/suspense|crime|mistério|misterio|policial/i.test(g)) return true;
      return /suspense|thriller|crime|policial|investig|mistério|misterio|assassino|máfia|lupin|cangaço|cangaco|dope thief|marcada/i.test(n);
    }
  },
  {
    id: 'Ficção Científica',
    name: 'Ficção Científica',
    emoji: '🚀',
    matcher: (ch) => {
      const g = ch.group || '';
      const n = ch.name || ch.seriesTitle || '';
      if (/chaves|chapolin|castelo r[áa]|bridgerton/i.test(n)) return false;
      if (/ficção|ficcao|sci-fi|sobrenatural/i.test(g)) return true;
      return /ficção|ficcao|sci-fi|alien|interestelar|matrix|duna|star wars|avatar|sobrenatural|mila no multiverso|coração de ferro|ironheart/i.test(n);
    }
  },
  {
    id: 'Animação & Kids',
    name: 'Animação & Kids',
    emoji: '🎨',
    matcher: (ch) => {
      const g = ch.group || '';
      const n = ch.name || ch.seriesTitle || '';
      if (/bridgerton|cangaço|cangaco|them|marcada|dope thief/i.test(n)) return false;
      if (/animação|animacao|desenho|kids|infantil/i.test(g)) return true;
      return /animação|animacao|desenho|kids|infantil|disney|pixar|shrek|era do gelo|toy story|divertida mente|minions|castelo r[áa]|turma da mônica|patrulha canina|mickey/i.test(n);
    }
  },
  {
    id: 'Romance',
    name: 'Romance',
    emoji: '❤️',
    matcher: (ch) => {
      const g = ch.group || '';
      const n = ch.name || ch.seriesTitle || '';
      if (/chaves|chapolin|castelo r[áa]|cangaço|cangaco/i.test(n)) return false;
      if (/romance/i.test(g)) return true;
      return /romance|romântic|amor|paixão|casamento|bridgerton|september mornings|manhãs de setembro/i.test(n);
    }
  },
  {
    id: 'Animes',
    name: 'Animes',
    emoji: '🎌',
    matcher: (ch) =>
      ch.isAnime ||
      /anime|naruto|one piece|dragon ball|bleach|death note|jujutsu|demon slayer|solo leveling|cdz|yu yu hakusho|sakura card/i.test(
        `${ch.group || ''} ${ch.name || ''}`
      )
  },
  {
    id: 'Doramas & Novelas',
    name: 'Doramas & Novelas',
    emoji: '🌸',
    matcher: (ch) =>
      /dorama|k-drama|novela|corean|globo|pousando|pretendente|tudo bem|descendentes do sol/i.test(
        `${ch.group || ''} ${ch.name || ''}`
      )
  },
  {
    id: 'Canais Ao Vivo',
    name: 'TV Ao Vivo',
    emoji: '📡',
    matcher: (ch) => !ch.isVod
  }
];

// ==========================================
// APLICAÇÃO PRINCIPAL POBREFLIX
// ==========================================
function App() {
  const [playlists, setPlaylists] = useState(() => {
    try {
      const saved = localStorage.getItem('pobreflix_playlists_v5');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activePlaylistId, setActivePlaylistId] = useState('catalogo-2026');
  const [rawChannels, setRawChannels] = useState([]);
  const [loadingPlaylist, setLoadingPlaylist] = useState(true);
  const [playlistError, setPlaylistError] = useState(null);

  // ==========================================
  // ESTADO SAAS: CONTAS, PERFIS ("QUEM ESTÁ ASSISTINDO?"), ASSINATURAS E TELAS
  // ==========================================
  const [saasConfig, setSaasConfig] = useState(null);
  const [authToken, setAuthToken] = useState(() => {
    try {
      return localStorage.getItem('pobreflix_auth_token') || '';
    } catch {
      return '';
    }
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [screenBlockState, setScreenBlockState] = useState(null);
  const [showSubModal, setShowSubModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [adminInitialTab, setAdminInitialTab] = useState('users');
  const [adSlideIndex, setAdSlideIndex] = useState(0);

  const deviceIdentity = useMemo(() => {
    if (window.PobreFlixSaaS && window.PobreFlixSaaS.getOrCreateDeviceIdentity) {
      return window.PobreFlixSaaS.getOrCreateDeviceIdentity();
    }
    return { deviceId: 'scr_default', deviceName: 'Navegador Web' };
  }, []);

  const includeBlockbusters =
    activePlaylistId === 'catalogo-2026' || activePlaylistId === 'vod-only';

  const channels = useMemo(() => {
    const all = groupSeriesIntoCatalog(rawChannels, includeBlockbusters);
    if (activeProfile && activeProfile.isKids) {
      return all.filter((c) =>
        /kids|infantil|animação|animacao|anime|desenho|família|familia|disney|cartoon|nick|discovery kids|gloob|toy story|shrek|carros|divertida mente|kung fu panda|meu malvado|era do gelo|rei leão|frozen|moana|encanto|procurando nemo|monstros s\.a|incríveis|ratatouille|up - altas|wall-e|coco|elementos|gato de botas|madagascar|como treinar|sonic|mario|pikachu|pokémon|pokemon|dragon ball|naruto|one piece|sakura|chaves|bob esponja|peppa|patrulha|ben 10|liga da justiça|homem-aranha|batman|x-men|tartarugas|scooby|tom e jerry|pica-pau|looney|simpsons|turma da mônica|harry potter|crônicas de nárnia|percy jackson|noite no museu|jumanji|esqueceram de mim|babe|stuart little|formiguinhaz|vida de inseto|bolt|enrolados|detona ralph|operação big hero|zootopia|luca|red: crescer|wish|minions|pets|sing|hotel transilvânia|trolls|smurfs|bobble|kirby|beyblade/i.test(
          `${c.name} ${c.group}`
        )
      );
    }
    return all;
  }, [rawChannels, includeBlockbusters, activeProfile]);

  // Navegação e Filtros do Catálogo
  const [navSection, setNavSection] = useState('home');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState([]);
  const [isSearchingGlobal, setIsSearchingGlobal] = useState(false);
  const [visibleLimit, setVisibleLimit] = useState(200);

  // Destaque do Hero Banner, Cinema Player e Modal Estilo Netflix de Temporadas/Episódios
  const [heroChannel, setHeroChannel] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [activeSeriesGroup, setActiveSeriesGroup] = useState(null);
  const [seriesModalItem, setSeriesModalItem] = useState(null);
  const [loadingSeriesEpisodes, setLoadingSeriesEpisodes] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState(1);
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [cloudServer, setCloudServer] = useState('vidsrc_to'); // 'vidsrc_to' | 'vidsrc_sh' | 'multiembed'

  // Favoritos e Histórico
  const [favorites, setFavorites] = useState(() => {
    try {
      const saved = localStorage.getItem('iptv_favorites_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('iptv_history_v1');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Configurações de Reprodução
  const [useProxyMode, setUseProxyMode] = useState('proxy');
  const [playerState, setPlayerState] = useState('idle');
  const [playerErrorDetails, setPlayerErrorDetails] = useState('');
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQuality, setCurrentQuality] = useState(-1);
  const [streamInfo, setStreamInfo] = useState({ resolution: '', engine: '' });
  const [videoRotation, setVideoRotation] = useState(0);

  // Verificador de Canais Online
  const [channelStatuses, setChannelStatuses] = useState({});
  const [onlyOnlineFilter, setOnlyOnlineFilter] = useState(false);
  const [isCheckingBatch, setIsCheckingBatch] = useState(false);

  // Modal de Gerenciamento de Listas
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [modalTab, setModalTab] = useState('url');
  const [newListName, setNewListName] = useState('');
  const [newListUrl, setNewListUrl] = useState('');
  const [newListText, setNewListText] = useState('');

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const mpegtsRef = useRef(null);
  const checkAbortRef = useRef(false);

  // Carregar configuração de Planos, Avatares e Banners de Anúncio + Restaurar sessão
  useEffect(() => {
    fetch('/api/saas/config')
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok) setSaasConfig(data);
      })
      .catch(() => {});
  }, []);

  const activeAdBanners = useMemo(() => {
    if (saasConfig?.adBannerSettings?.enabled === false) return [];
    const list = Array.isArray(saasConfig?.adBanners) ? saasConfig.adBanners : [];
    return list.filter((b) => b && b.active !== false && b.imageUrl);
  }, [saasConfig]);

  useEffect(() => {
    if (activeAdBanners.length <= 1) {
      setAdSlideIndex(0);
      return;
    }
    const intervalSec = Math.max(2, Number(saasConfig?.adBannerSettings?.intervalSeconds) || 6);
    const timer = setInterval(() => {
      setAdSlideIndex((prev) => (prev + 1) % activeAdBanners.length);
    }, intervalSec * 1000);
    return () => clearInterval(timer);
  }, [activeAdBanners.length, saasConfig?.adBannerSettings?.intervalSeconds]);

  useEffect(() => {
    if (!authToken) {
      setCurrentUser(null);
      setActiveProfile(null);
      return;
    }
    fetch('/api/saas/me', {
      headers: { 'x-auth-token': authToken }
    })
      .then((r) => r.json())
      .then((data) => {
        if (data && data.ok && data.user) {
          setCurrentUser(data.user);
          const isMaster =
            data.user.role === 'admin' ||
            data.user.id === 'usr_admin_master' ||
            String(data.user.email || '').toLowerCase() === 'tecpro@gmail.com';
          if (isMaster) {
            setActiveProfile(null);
            setShowProfilePicker(false);
            setShowAdminModal(true);
            setIsPlayerOpen(false);
            try {
              sessionStorage.removeItem('pobreflix_active_profile_id');
            } catch {}
          } else {
            const savedProfId = sessionStorage.getItem('pobreflix_active_profile_id');
            const foundProf = (data.user.profiles || []).find((p) => p.id === savedProfId);
            if (foundProf) {
              setActiveProfile((prev) => prev || foundProf);
              setFavorites(Array.isArray(foundProf.favorites) ? foundProf.favorites : []);
              setHistory(
                Array.isArray(foundProf.history) ? deduplicateHistory(foundProf.history) : []
              );
              setShowProfilePicker((prev) => (prev ? true : false));
            } else {
              setShowProfilePicker(true);
            }
          }
        } else {
          localStorage.removeItem('pobreflix_auth_token');
          setAuthToken('');
          setCurrentUser(null);
        }
      })
      .catch(() => {});
  }, [authToken]);

  const handleAuthSuccess = useCallback((token, userObj, redirectTo) => {
    try {
      localStorage.setItem('pobreflix_auth_token', token);
    } catch {}
    setAuthToken(token);
    setCurrentUser(userObj);
    setScreenBlockState(null);

    const isMasterAccount =
      redirectTo === 'master_panel' ||
      String(userObj?.email || '').toLowerCase() === 'tecpro@gmail.com' ||
      userObj?.role === 'admin' ||
      userObj?.id === 'usr_admin_master';

    if (isMasterAccount) {
      setActiveProfile(null);
      setShowProfilePicker(false);
      setShowAdminModal(true);
      setIsPlayerOpen(false);
      try {
        sessionStorage.removeItem('pobreflix_active_profile_id');
      } catch {}
    } else {
      setShowAdminModal(false);
      setActiveProfile(null);
      setShowProfilePicker(true);
    }
  }, []);

  const handleSelectProfile = useCallback((prof) => {
    setActiveProfile(prof);
    setShowProfilePicker(false);
    try {
      sessionStorage.setItem('pobreflix_active_profile_id', prof.id);
    } catch {}
    if (Array.isArray(prof.favorites)) setFavorites(prof.favorites);
    if (Array.isArray(prof.history)) setHistory(deduplicateHistory(prof.history, channels));
  }, [channels]);

  const handleLogout = useCallback(async () => {
    try {
      if (authToken) {
        await fetch('/api/saas/screens/disconnect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': authToken
          },
          body: JSON.stringify({ deviceId: deviceIdentity.deviceId })
        });
      }
    } catch {}
    try {
      localStorage.removeItem('pobreflix_auth_token');
      sessionStorage.removeItem('pobreflix_active_profile_id');
    } catch {}
    setAuthToken('');
    setCurrentUser(null);
    setActiveProfile(null);
    setShowProfilePicker(false);
    setShowAdminModal(false);
    setShowSubModal(false);
    setScreenBlockState(null);
    setIsPlayerOpen(false);
  }, [authToken, deviceIdentity.deviceId]);

  // Pulso (Heartbeat) em tempo real para o Gerenciador de Telas Simultâneas
  const sendScreenHeartbeat = useCallback(async () => {
    if (
      !authToken ||
      !currentUser ||
      !activeProfile ||
      currentUser.role === 'admin' ||
      currentUser.id === 'usr_admin_master'
    )
      return;
    try {
      const customName = localStorage.getItem('pobreflix_custom_device_name');
      const watchingTitle =
        isPlayerOpen && currentChannel
          ? activeSeriesGroup
            ? `${activeSeriesGroup.name} (T${currentChannel.seasonNumber || 1}:E${
                currentChannel.episodeNumber || 1
              })`
            : currentChannel.name
          : 'Navegando no Catálogo';

      const res = await fetch('/api/saas/heartbeat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({
          deviceId: deviceIdentity.deviceId,
          deviceName: customName || deviceIdentity.deviceName,
          profileId: activeProfile.id,
          profileName: activeProfile.name,
          watchingTitle,
          isPlaying: Boolean(isPlayerOpen && currentChannel)
        })
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        if (
          data.code === 'SCREEN_LIMIT_REACHED' ||
          data.code === 'DEVICE_KICKED' ||
          data.code === 'SUBSCRIPTION_EXPIRED' ||
          data.code === 'ACCOUNT_BLOCKED'
        ) {
          setIsPlayerOpen(false);
          setScreenBlockState(data);
        }
        return;
      }

      setScreenBlockState(null);
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              activeScreens: data.activeScreens || prev.activeScreens,
              activeScreensCount:
                typeof data.activeScreensCount === 'number'
                  ? data.activeScreensCount
                  : prev.activeScreensCount,
              maxScreens: data.maxScreens || prev.maxScreens
            }
          : prev
      );
    } catch {}
  }, [
    authToken,
    currentUser,
    activeProfile,
    isPlayerOpen,
    currentChannel,
    activeSeriesGroup,
    deviceIdentity
  ]);

  useEffect(() => {
    if (!authToken || !currentUser || !activeProfile) return;
    sendScreenHeartbeat();
    const timer = setInterval(sendScreenHeartbeat, 10000);
    return () => clearInterval(timer);
  }, [authToken, currentUser?.id, activeProfile?.id, isPlayerOpen, currentChannel?.url, sendScreenHeartbeat]);

  const handleDisconnectDevice = useCallback(
    async (targetDeviceId, retryAfter = false) => {
      if (!authToken) return;
      try {
        const res = await fetch('/api/saas/screens/disconnect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-auth-token': authToken
          },
          body: JSON.stringify({ deviceId: targetDeviceId })
        });
        const data = await res.json();
        if (data && data.ok) {
          setCurrentUser((prev) =>
            prev
              ? {
                  ...prev,
                  activeScreens: data.activeScreens || [],
                  activeScreensCount: (data.activeScreens || []).length
                }
              : prev
          );
          if (retryAfter) {
            setScreenBlockState(null);
            setTimeout(() => sendScreenHeartbeat(), 250);
          }
        }
      } catch {}
    },
    [authToken, sendScreenHeartbeat]
  );

  // Sincronizar Minha Lista (favorites) e Continuar Assistindo (history) com o Perfil Ativo na Conta!
  useEffect(() => {
    try {
      localStorage.setItem('iptv_favorites_v1', JSON.stringify(favorites));
    } catch {}
    if (authToken && activeProfile) {
      fetch('/api/saas/profiles/sync-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({
          profileId: activeProfile.id,
          favorites
        })
      }).catch(() => {});
    }
  }, [favorites, authToken, activeProfile?.id]);

  useEffect(() => {
    try {
      localStorage.setItem('iptv_history_v1', JSON.stringify(history));
    } catch {}
    if (authToken && activeProfile) {
      fetch('/api/saas/profiles/sync-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': authToken
        },
        body: JSON.stringify({
          profileId: activeProfile.id,
          history
        })
      }).catch(() => {});
    }
  }, [history, authToken, activeProfile?.id]);

  useEffect(() => {
    try {
      const metadataOnly = playlists.map((p) => ({
        id: p.id,
        name: p.name,
        url: p.url,
        count: p.count || 0
      }));
      localStorage.setItem('pobreflix_playlists_v5', JSON.stringify(metadataOnly));
    } catch {}
  }, [playlists]);

  // Busca Global Automática no IMDb quando o usuário digita na barra de pesquisa!
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setGlobalSearchResults([]);
      setIsSearchingGlobal(false);
      return;
    }

    let cancelled = false;
    setIsSearchingGlobal(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-catalog?q=${encodeURIComponent(q)}`);
        const data = await res.json();
        if (!cancelled && Array.isArray(data.results)) {
          setGlobalSearchResults(data.results);
        }
      } catch {
        if (!cancelled) setGlobalSearchResults([]);
      } finally {
        if (!cancelled) setIsSearchingGlobal(false);
      }
    }, 350);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [searchQuery]);

  // Carregar lista M3U via URL
  const loadPlaylistFromUrl = useCallback(async (url, name, id = null, autoOpenPlayer = false) => {
    setLoadingPlaylist(true);
    setPlaylistError(null);
    try {
      const isLocalPath = url.startsWith('/');
      const fetchTarget = isLocalPath
        ? `${url}${url.includes('?') ? '&' : '?'}v=top2000`
        : `/api/playlist?url=${encodeURIComponent(url)}`;
      const res = await fetch(fetchTarget, { cache: 'no-store' });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Erro HTTP ${res.status}`);
      }
      const text = await res.text();
      const parsed = parseM3U(text);

      if (parsed.length === 0) {
        throw new Error('Nenhum canal ou filme válido encontrado nesta lista M3U.');
      }

      const listId = id || `list_${Date.now()}`;
      const withBlockbusters = listId === 'catalogo-2026' || listId === 'vod-only';
      const grouped = groupSeriesIntoCatalog(parsed, withBlockbusters);

      const playlistObj = {
        id: listId,
        name: name || 'Catálogo M3U',
        url,
        count: grouped.length
      };

      setPlaylists((prev) => {
        const exists = prev.some((p) => p.id === listId || (p.url && p.url === url));
        if (exists) {
          return prev.map((p) =>
            p.id === listId || (p.url && p.url === url)
              ? { ...p, name: playlistObj.name, count: grouped.length }
              : p
          );
        }
        return [playlistObj, ...prev];
      });

      setActivePlaylistId(listId);
      setRawChannels(parsed);
      setSelectedCategory('Todos');

      const seriesHighlights = grouped.filter((c) => c.isSeriesGroup);
      const vodHighlights = grouped.filter((c) => c.isVod);
      const highlightPool =
        seriesHighlights.length > 0
          ? seriesHighlights
          : vodHighlights.length > 0
          ? vodHighlights
          : grouped.filter((c) => c.logo);

      const chosenHero =
        highlightPool[Math.floor(Math.random() * highlightPool.length)] || grouped[0];
      setHeroChannel(chosenHero);

      if (autoOpenPlayer && chosenHero) {
        setCurrentChannel(chosenHero);
        setIsPlayerOpen(true);
      }
    } catch (err) {
      setPlaylistError(err.message);
    } finally {
      setLoadingPlaylist(false);
    }
  }, []);

  useEffect(() => {
    const defaultPresets = [
      {
        id: 'catalogo-2026',
        name: '🍿 Catálogo Completo PobreFlix (Filmes, Séries & Emissoras Reais de TV)',
        url: '/lists/catalogo-brasil-2026.m3u'
      },
      {
        id: 'live-tv-only',
        name: '📡 Só Emissoras Reais de TV Ao Vivo (Globo, SporTV, Premiere, HBO, Disney, ESPN, Band, Record, SBT)',
        url: '/lists/canais-tv-ao-vivo.m3u'
      },
      {
        id: 'vod-only',
        name: '🎬 Somente Filmes & Séries Sob Demanda (VOD + Blockbusters)',
        url: '/lists/vod-filmes-series.m3u'
      },
      {
        id: 'fs2017-gist',
        name: '📁 Gist FS2017 (Lista Antiga 2017 com Séries Agrupadas)',
        url: '/lists/fs2017.m3u'
      }
    ];

    setPlaylists(defaultPresets);
    loadPlaylistFromUrl(defaultPresets[0].url, defaultPresets[0].name, defaultPresets[0].id, false);
  }, [loadPlaylistFromUrl]);

  const destroyPlayers = useCallback(() => {
    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }
    if (mpegtsRef.current) {
      try {
        mpegtsRef.current.unload();
        mpegtsRef.current.detachMediaElement();
        mpegtsRef.current.destroy();
      } catch {}
      mpegtsRef.current = null;
    }
  }, []);

  // 100% Player Nativo HTML5 sem iframes de terceiros e ZERO anúncios!
  const isCloudChannel = false;

  const startPlayback = useCallback(
    async (channel, modeOverride = null) => {
      if (!channel || !videoRef.current) return;
      const video = videoRef.current;
      let rawUrl = channel.url || '';

      // HIGIENIZAÇÃO DE URL:
      // Se a URL contiver localhost / 127.0.0.1 ou for relativa (/api/...), normalizar sempre para a origem atual
      if (rawUrl && typeof window !== 'undefined' && window.location) {
        if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(rawUrl)) {
          rawUrl = rawUrl.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, window.location.origin);
        } else if (rawUrl.startsWith('/')) {
          rawUrl = `${window.location.origin}${rawUrl}`;
        }
      }

      // Correção de streams cacheados com mapeamento antigo incorreto (ex: Shrek apontando para Rio 2)
      if (channel && channel.name && /shrek/i.test(channel.name) && /rio-2/i.test(rawUrl)) {
        rawUrl = 'https://archive.org/download/shrek-terceiro-2007-bdrip-720p-dublado_202604/Shrek%20Terceiro%20(2007)%20-%20BDRip%20720p%20-%20Dublado.mp4';
        channel.url = rawUrl;
      }
      if (channel && channel.name && /era do gelo/i.test(channel.name) && /rio-2/i.test(rawUrl)) {
        rawUrl = 'https://archive.org/download/a-era-do-gelo-blu-ray-1080p-dublado/A%20Era%20do%20Gelo%20BluRay%201080p%20Dublado.mp4';
        channel.url = rawUrl;
      }
      if (channel && channel.name && /toy story/i.test(channel.name) && /rio-2/i.test(rawUrl)) {
        rawUrl = 'https://archive.org/download/toy-story-2-1999-vhsrip-dublado/Toy%20Story%202%20(1999)%20VHSRip%20Dublado.mp4';
        channel.url = rawUrl;
      }

      destroyPlayers();
      setPlayerState('loading');
      setPlayerErrorDetails('');
      setQualityLevels([]);
      setCurrentQuality(-1);
      setStreamInfo({ resolution: '', engine: '' });
      setVideoRotation(0);

      // Resolver títulos do catálogo global para stream .MP4 direto (Internet Archive) 100% sem anúncios
      if (rawUrl && rawUrl.startsWith('cloud://')) {
        try {
          const res = await fetch(
            `/api/resolve-vod?title=${encodeURIComponent(channel.name || '')}`
          );
          const data = await res.json();
          if (data && data.url) {
            rawUrl = data.url;
          }
        } catch {
          rawUrl =
            'https://archive.org/download/deadpool-wolverine_HD_DUBLADO_SINCRONIZADO/Deadpool%20%26%20Wolverine.ia.mp4';
        }
      }

      // Garantir que links antigos de Deadpool & Wolverine / O Enigma de Outro Mundo / Chaves / DBZ sem .ia.mp4 usem o derivado H.264 (avc1)
      if (
        /archive\.org\/download\/(deadpool-wolverine_HD_DUBLADO_SINCRONIZADO|o-enigma-de-outro-mundo-1982-blu-ray-720p-dublado|o-ataque-dos-vermes-malditos-1990-blu-ray-1080p-dublado|seriado-chaves|1989-dragon-ball-z-s-01)\//i.test(
          rawUrl
        ) &&
        !rawUrl.endsWith('.ia.mp4')
      ) {
        rawUrl = rawUrl.replace(/\.mp4$/i, '.ia.mp4');
      }

      const isDirectMp4 =
        /\.(mp4|mkv|webm)(\?|$)/i.test(rawUrl) ||
        /video-play\.mp4/i.test(rawUrl) ||
        /\/api\/ia-stream/i.test(rawUrl) ||
        /archive\.org\/download\//i.test(rawUrl);

      const defaultModeForUrl =
        /\/api\/ia-stream|archive\.org\/download\//i.test(rawUrl)
          ? 'direct'
          : useProxyMode;
      const mode = modeOverride || defaultModeForUrl;

      const effectiveUrl =
        mode === 'proxy' ? `/api/proxy?url=${encodeURIComponent(rawUrl)}` : rawUrl;

      const isTsStream = /\.ts(\?|$)/i.test(rawUrl) && !/\.m3u8/i.test(rawUrl);

      if (isDirectMp4) {
        setStreamInfo({
          resolution: 'VOD H.264 HD',
          engine: mode === 'direct' ? 'MP4 Direto (Seek Ativo)' : 'MP4 Proxy'
        });
        video.src = effectiveUrl;
        video.onloadedmetadata = () => {
          setPlayerState('playing');
          if (video.videoHeight > video.videoWidth && video.videoWidth > 0) {
            setVideoRotation(-90);
          }
          video.play().catch(() => {});
          // Proteção anti-tela-preta: se o MP4 abrir só áudio (videoWidth === 0 por codec antigo), tenta o derivado .ia.mp4 (H.264)
          setTimeout(() => {
            if (
              videoRef.current &&
              videoRef.current.videoWidth === 0 &&
              !videoRef.current.paused
            ) {
              if (/archive\.org\/download\//i.test(rawUrl) && !rawUrl.endsWith('.ia.mp4')) {
                const iaUrl = rawUrl.replace(/\.mp4(\?.*)?$/i, '.ia.mp4$1');
                videoRef.current.src = iaUrl;
                videoRef.current.play().catch(() => {});
              } else {
                videoRef.current.src =
                  'https://archive.org/download/deadpool-wolverine_HD_DUBLADO_SINCRONIZADO/Deadpool%20%26%20Wolverine.ia.mp4';
                videoRef.current.play().catch(() => {});
              }
            }
          }, 900);
        };
        video.onerror = async () => {
          if (mode === 'direct') {
            startPlayback(channel, 'proxy');
            return;
          }
          try {
            const searchTitle = channel.seriesTitle || channel.name || '';
            const res = await fetch(`/api/resolve-vod?title=${encodeURIComponent(searchTitle)}`);
            const data = await res.json();
            if (data && data.url && data.url !== rawUrl && videoRef.current) {
              videoRef.current.src = data.url;
              videoRef.current.play().catch(() => {});
              return;
            }
          } catch {}

          setPlayerState('error');
          setPlayerErrorDetails(
            'Este servidor de vídeo sob demanda está instável no momento. Tente novamente ou selecione outro título!'
          );
        };
        return;
      }

      if (isTsStream && window.mpegts && window.mpegts.isSupported()) {
        try {
          const player = window.mpegts.createPlayer({
            type: 'mpegts',
            isLive: true,
            url: effectiveUrl
          });
          mpegtsRef.current = player;
          player.attachMediaElement(video);
          player.load();
          player
            .play()
            .then(() => {
              setPlayerState('playing');
              setStreamInfo((prev) => ({ ...prev, engine: 'MPEG-TS' }));
            })
            .catch(() => {});

          player.on(window.mpegts.Events.ERROR, (errType, errDetail) => {
            if (mode === 'direct') {
              setUseProxyMode('proxy');
              startPlayback(channel, 'proxy');
            } else {
              setPlayerState('error');
              setPlayerErrorDetails(`Falha no stream MPEG-TS (${errDetail || errType}).`);
            }
          });
          return;
        } catch (err) {
          console.warn('Erro ao iniciar mpegts.js:', err);
        }
      }

      if (window.Hls && window.Hls.isSupported()) {
        const hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 60,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 2,
          levelLoadingTimeOut: 15000
        });
        hlsRef.current = hls;

        hls.loadSource(effectiveUrl);
        hls.attachMedia(video);

        hls.on(window.Hls.Events.MANIFEST_PARSED, (event, data) => {
          setPlayerState('playing');
          const levels = (data.levels || []).map((lvl, idx) => ({
            index: idx,
            height: lvl.height || 0,
            bitrate: lvl.bitrate || 0,
            label: lvl.height ? `${lvl.height}p` : `Nível ${idx + 1}`
          }));
          setQualityLevels(levels);
          setStreamInfo({
            resolution: levels.length ? levels[levels.length - 1].label : 'Auto',
            engine: mode === 'proxy' ? 'HLS Proxy' : 'HLS Direto'
          });
          video.play().catch(() => {});
        });

        hls.on(window.Hls.Events.LEVEL_SWITCHED, (event, data) => {
          const lvl = hls.levels[data.level];
          if (lvl && lvl.height) {
            setStreamInfo((prev) => ({ ...prev, resolution: `${lvl.height}p` }));
          }
        });

        hls.on(window.Hls.Events.ERROR, (event, data) => {
          if (data.fatal) {
            if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
              hls.recoverMediaError();
              return;
            }
            if (mode === 'direct') {
              hls.destroy();
              setUseProxyMode('proxy');
              startPlayback(channel, 'proxy');
              return;
            }
            if (mode === 'proxy') {
              hls.destroy();
              startPlayback(channel, 'direct');
              return;
            }
            setPlayerState('error');
            setPlayerErrorDetails(
              `O servidor deste canal não respondeu (${data.details || 'Sinal Offline'}). Escolha outro título no catálogo abaixo!`
            );
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = effectiveUrl;
        video.addEventListener(
          'loadedmetadata',
          () => {
            setPlayerState('playing');
            video.play().catch(() => {});
          },
          { once: true }
        );
      }
    },
    [useProxyMode, destroyPlayers]
  );

  useEffect(() => {
    if (currentChannel && isPlayerOpen) {
      startPlayback(currentChannel);

      setHistory((prev) => {
        const isSeries = Boolean(
          activeSeriesGroup ||
          currentChannel.isSeriesGroup ||
          currentChannel.isSeriesEpisode ||
          (currentChannel.group && /série|serie|anime/i.test(currentChannel.group)) ||
          /ep=\d+/i.test(currentChannel.url || '')
        );

        const seriesTitle = (
          activeSeriesGroup?.name ||
          currentChannel.seriesTitle ||
          (isSeries ? currentChannel.name.replace(/\s*-\s*[ST]\d+.*$/i, '').trim() : '')
        );

        const cleanKey = (str) =>
          (str || '').toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').replace(/[^a-z0-9]/g, '');

        const seriesKey = seriesTitle ? cleanKey(seriesTitle) : '';
        const itemKey = cleanKey(currentChannel.name);

        const filtered = prev.filter((item) => {
          if (seriesKey) {
            const existingSeriesKey = cleanKey(item.seriesTitle || (item.isSeriesGroup ? item.name : ''));
            const existingNameKey = cleanKey(item.name);
            if (
              existingSeriesKey &&
              (existingSeriesKey === seriesKey ||
                existingSeriesKey.includes(seriesKey) ||
                seriesKey.includes(existingSeriesKey))
            ) {
              return false;
            }
            if (
              existingNameKey &&
              (existingNameKey === seriesKey ||
                existingNameKey.includes(seriesKey) ||
                seriesKey.includes(existingNameKey))
            ) {
              return false;
            }
          }
          if (item.url === currentChannel.url) return false;
          if (itemKey && cleanKey(item.name) === itemKey) return false;
          return true;
        });

        const episodesList =
          activeSeriesGroup &&
          Array.isArray(activeSeriesGroup.episodes) &&
          activeSeriesGroup.episodes.length > 0
            ? activeSeriesGroup.episodes
            : Array.isArray(currentChannel.episodes) && currentChannel.episodes.length > 0
            ? currentChannel.episodes
            : [];

        const isAnime = Boolean(
          currentChannel.isAnime ||
          (activeSeriesGroup && activeSeriesGroup.isAnime) ||
          /anime|tokusatsu/i.test(currentChannel.group || '')
        );

        const historyItem = {
          id: activeSeriesGroup ? activeSeriesGroup.id : currentChannel.id,
          imdbId: currentChannel.imdbId || activeSeriesGroup?.imdbId,
          name: isSeries && seriesTitle ? seriesTitle : currentChannel.name,
          rawTitle: seriesTitle || currentChannel.name,
          seriesTitle: isSeries ? seriesTitle || currentChannel.name : '',
          seasonNumber: currentChannel.seasonNumber || 1,
          episodeNumber: currentChannel.episodeNumber || 1,
          episodeTitle: currentChannel.episodeTitle || `Episódio ${currentChannel.episodeNumber || 1}`,
          logo: activeSeriesGroup?.logo || currentChannel.logo,
          url:
            currentChannel.url && typeof window !== 'undefined' && window.location
              ? currentChannel.url.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, '')
              : currentChannel.url,
          quality: currentChannel.quality || 'FHD',
          isVod: true,
          isCloudVod: currentChannel.isCloudVod,
          isSeriesGroup: isSeries,
          isSeriesEpisode: isSeries,
          isAnime: isAnime,
          episodes: episodesList
        };

        return deduplicateHistory([historyItem, ...filtered], channels).slice(0, 30);
      });
    } else {
      destroyPlayers();
    }
    return () => destroyPlayers();
  }, [currentChannel, isPlayerOpen, activeSeriesGroup, channels, startPlayback, destroyPlayers]);

  // Estados do "Próximo Episódio nos Créditos" e "Pular Abertura" estilo Netflix
  const [showUpNextOverlay, setShowUpNextOverlay] = useState(false);
  const [upNextCountdown, setUpNextCountdown] = useState(10);
  const [upNextDismissed, setUpNextDismissed] = useState(false);
  const [showSkipIntro, setShowSkipIntro] = useState(false);
  const [skipIntroDismissed, setSkipIntroDismissed] = useState(false);

  // Resetar aviso de créditos e abertura sempre que trocar de episódio/filme
  useEffect(() => {
    setShowUpNextOverlay(false);
    setUpNextCountdown(10);
    setUpNextDismissed(false);
    setShowSkipIntro(false);
    setSkipIntroDismissed(false);
  }, [currentChannel?.id, currentChannel?.url]);

  // Função auxiliar para buscar todas as temporadas e episódios reais no servidor e mesclar com episódios M3U existentes
  const fetchFullSeriesEpisodes = useCallback(async (seriesItem) => {
    const params = new URLSearchParams();
    if (seriesItem.imdbId) params.set('imdb', seriesItem.imdbId);
    params.set('title', seriesItem.rawTitle || seriesItem.seriesTitle || seriesItem.name);

    const res = await fetch(`/api/series-episodes?${params.toString()}`);
    const data = await res.json();
    if (Array.isArray(data.episodes) && data.episodes.length > 0) {
      const existingMap = new Map();
      (seriesItem.episodes || []).forEach((ep) => {
        const key = `${ep.seasonNumber || 1}_${ep.episodeNumber || 1}`;
        existingMap.set(key, ep);
      });

      const mergedEpisodes = data.episodes.map((apiEp) => {
        const key = `${apiEp.seasonNumber || 1}_${apiEp.episodeNumber || 1}`;
        const localEp = existingMap.get(key);
        if (localEp && localEp.url && !localEp.url.startsWith('cloud://')) {
          return {
            ...apiEp,
            url: localEp.url,
            logo: localEp.logo || apiEp.logo || seriesItem.logo
          };
        }
        return {
          ...apiEp,
          logo: apiEp.logo || seriesItem.logo
        };
      });

      return {
        ...seriesItem,
        imdbId: data.imdbId || seriesItem.imdbId,
        summary: data.summary || seriesItem.summary,
        seasonsCount: data.seasonsCount || 1,
        episodes: mergedEpisodes
      };
    }
    return seriesItem;
  }, []);

  // Quando uma série estiver tocando e tiver apenas 1 episódio carregado do M3U, buscar todos os episódios em segundo plano para o "Próximo Episódio" funcionar sempre!
  useEffect(() => {
    if (!activeSeriesGroup) return;
    if (activeSeriesGroup.episodes && activeSeriesGroup.episodes.length > 1) return;

    let cancelled = false;
    fetchFullSeriesEpisodes(activeSeriesGroup)
      .then((enriched) => {
        if (!cancelled && enriched.episodes && enriched.episodes.length > 1) {
          setActiveSeriesGroup(enriched);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [activeSeriesGroup?.id, activeSeriesGroup?.name, fetchFullSeriesEpisodes]);

  // Abrir modal estilo Netflix com TODAS as Temporadas e Episódios da Série
  const handleOpenEpisodesModal = useCallback(
    async (seriesItem) => {
      setSeriesModalItem(seriesItem);
      setEpisodeSearch('');

      if (seriesItem.episodes && seriesItem.episodes.length > 1) {
        const seasons = Array.from(
          new Set(seriesItem.episodes.map((e) => e.seasonNumber || 1))
        ).sort((a, b) => a - b);
        setSelectedSeason(seasons[0] || 1);
        return;
      }

      setLoadingSeriesEpisodes(true);
      try {
        const enriched = await fetchFullSeriesEpisodes(seriesItem);
        setSeriesModalItem(enriched);
        if (activeSeriesGroup && activeSeriesGroup.name === enriched.name) {
          setActiveSeriesGroup(enriched);
        }
        const seasons = Array.from(
          new Set((enriched.episodes || []).map((e) => e.seasonNumber || 1))
        ).sort((a, b) => a - b);
        setSelectedSeason(seasons[0] || 1);
      } catch (err) {
        console.warn('Falha ao buscar episódios:', err);
      } finally {
        setLoadingSeriesEpisodes(false);
      }
    },
    [fetchFullSeriesEpisodes, activeSeriesGroup]
  );

  const handleSelectChannel = useCallback(
    (ch, parentSeries = null) => {
      if (!ch) return;

      if (ch.isSeriesGroup) {
        const eps = ch.episodes && ch.episodes.length > 0 ? ch.episodes : [];
        if (eps.length === 0) {
          if (ch.url && (ch.isSeriesEpisode || ch.episodeNumber)) {
            setCurrentChannel(ch);
            setHeroChannel(ch);
            setIsPlayerOpen(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
          }
          handleOpenEpisodesModal(ch);
          return;
        }

        // Se o card já contém episódio específico salvo (vindo de Continuar Assistindo)
        let targetEp = eps.find((e) => e.url && e.url === ch.url);
        if (!targetEp && ch.episodeNumber) {
          targetEp = eps.find(
            (e) =>
              (e.seasonNumber || 1) === (ch.seasonNumber || 1) &&
              (e.episodeNumber || 1) === (ch.episodeNumber || 1)
          );
        }
        if (!targetEp) targetEp = eps[0];

        setActiveSeriesGroup(ch);
        setCurrentChannel({
          ...targetEp,
          seriesTitle: ch.seriesTitle || ch.name,
          seasonNumber: targetEp.seasonNumber || ch.seasonNumber || 1,
          episodeNumber: targetEp.episodeNumber || ch.episodeNumber || 1,
          isSeriesEpisode: true,
          isVod: true
        });
        setHeroChannel(ch);
      } else {
        if (parentSeries) {
          setActiveSeriesGroup(parentSeries);
        } else if ((ch.isSeriesEpisode || /ep=\d+/i.test(ch.url || '')) && !activeSeriesGroup) {
          const sTitle = (
            ch.seriesTitle || ch.name.replace(/\s*-\s*[ST]\d+.*$/i, '')
          )
            .toLowerCase()
            .trim();
          const matchingSeries = channels.find(
            (s) =>
              s.isSeriesGroup &&
              (s.name.toLowerCase().trim() === sTitle ||
                (s.seriesTitle && s.seriesTitle.toLowerCase().trim() === sTitle))
          );
          if (matchingSeries) {
            setActiveSeriesGroup(matchingSeries);
          } else if (/ep=\d+/i.test(ch.url || '')) {
            const match = ch.url.match(/id=([^&]+).*?ep=(\d+)/i);
            const baseId = match ? match[1] : 'series';
            const dynamicEpisodes = [];
            for (let i = 1; i <= 20; i++) {
              dynamicEpisodes.push({
                id: `${baseId}_ep_${i}`,
                name: `${ch.seriesTitle || ch.name.replace(/\s*-\s*[ST]\d+.*$/i, '')} - T01E${String(i).padStart(2, '0')}`,
                seriesTitle: ch.seriesTitle || ch.name.replace(/\s*-\s*[ST]\d+.*$/i, ''),
                seasonNumber: 1,
                episodeNumber: i,
                episodeTitle: `Episódio ${i}`,
                url: ch.url.replace(/ep=\d+/, `ep=${i}`),
                logo: ch.logo,
                group: ch.group,
                isVod: true,
                isSeriesEpisode: true
              });
            }
            setActiveSeriesGroup({
              id: `series_${baseId}`,
              name: ch.seriesTitle || ch.name.replace(/\s*-\s*[ST]\d+.*$/i, ''),
              logo: ch.logo,
              group: ch.group,
              isSeriesGroup: true,
              episodes: dynamicEpisodes
            });
          }
        } else if (!ch.isSeriesEpisode && !/ep=\d+/i.test(ch.url || '')) {
          setActiveSeriesGroup(null);
        }
        setCurrentChannel(ch);
        setHeroChannel(parentSeries || ch);
      }
      setSeriesModalItem(null);
      setIsPlayerOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [handleOpenEpisodesModal, activeSeriesGroup, channels]
  );

  const seekRelative = (seconds) => {
    if (!videoRef.current) return;
    try {
      videoRef.current.currentTime = Math.max(
        0,
        (videoRef.current.currentTime || 0) + seconds
      );
    } catch {}
  };

  const toggleFavorite = useCallback((channelUrl, e) => {
    if (e) e.stopPropagation();
    setFavorites((prev) =>
      prev.includes(channelUrl) ? prev.filter((u) => u !== channelUrl) : [...prev, channelUrl]
    );
  }, []);

  const handleDownloadTitle = useCallback(async (channel) => {
    if (!channel || !channel.url) return;
    let targetUrl = channel.url;
    const rawName = channel.name || 'Filme PobreFlix';

    if (targetUrl.startsWith('cloud://')) {
      try {
        const res = await fetch(`/api/resolve-vod?title=${encodeURIComponent(rawName)}`);
        const data = await res.json();
        if (data && data.url) {
          targetUrl = data.url;
        }
      } catch {}
    }

    const downloadEndpoint = `/api/download?url=${encodeURIComponent(targetUrl)}&title=${encodeURIComponent(rawName)}`;
    const a = document.createElement('a');
    a.href = downloadEndpoint;
    a.download = `${rawName.replace(/[^\w\s\u00C0-\u017F\-\.\(\)]/gi, '').trim()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }, []);

  const pickRandomHighlight = useCallback(() => {
    if (channels.length === 0) return;
    const withLogo = channels.filter((c) => c.logo);
    const pool = withLogo.length > 0 ? withLogo : channels;
    const randomCh = pool[Math.floor(Math.random() * pool.length)];
    setHeroChannel(randomCh);
  }, [channels]);

  const categories = useMemo(() => {
    return GENRE_DEFINITIONS.map((genre) => {
      let count = 0;
      if (genre.id === 'Todos') {
        count = channels.length;
      } else {
        count = channels.filter(genre.matcher).length;
      }
      return {
        id: genre.id,
        name: genre.name,
        emoji: genre.emoji,
        count
      };
    }).filter((g) => g.count > 0);
  }, [channels]);

  const catalogRows = useMemo(() => {
    if (channels.length === 0) return [];

    // 1. Séries Completas com Temporadas e Episódios
    const vodSeries = channels.filter((c) => c.isSeriesGroup);
    const vodSeriesFamous = vodSeries.filter((c) =>
      /breaking bad|stranger things|the boys|game of thrones|casa do dragão|last of us|walking dead|sobrenatural|la casa de papel|round 6|wandinha|cobra kai|prison break|peaky blinders|vikings|dark|fallout|reacher|dexter|lost|grey|lucifer|vampiro|rookie|suits|house|good doctor|black mirror|witcher/i.test(
        `${c.name} ${c.group}`
      )
    );
    const vodSeriesSitcoms = vodSeries.filter((c) =>
      /chris|patroa|maluco no pedaço|friends|office|big bang|brooklyn|dois homens|how i met|chaves|sitcom|comédia/i.test(
        `${c.name} ${c.group}`
      )
    );
    const vodSeriesAnimes = vodSeries.filter((c) =>
      /anime|dragon ball|yu yu|naruto|sakura|pokémon|pokemon|cavaleiros|one piece|bleach|inuyasha|death note|initial d|lain|kirby|beyblade|attack on titan|jujutsu|demon slayer|solo leveling|one punch|hunter/i.test(
        `${c.name} ${c.group}`
      )
    );
    const vodSeriesCartoons = vodSeries.filter((c) =>
      /desenho|herói|homem-aranha|thundercats|tartarugas|sonic|x-men|batman|superman|ben 10|liga da justiça|invencível|arcane|rick and morty|simpsons|cartoon/i.test(
        `${c.name} ${c.group}`
      )
    );
    const vodSeriesDoramas = vodSeries.filter((c) =>
      /dorama|k-drama|pousando|pretendente|tudo bem|descendentes|love alarm|big mouth|xena/i.test(
        `${c.name} ${c.group}`
      )
    );

    // 2. Filmes e Séries Separados por Gênero Real (Usando Regras Centrais)
    const getGenreItems = (genreId) => {
      const gDef = GENRE_DEFINITIONS.find((g) => g.id === genreId || g.name === genreId);
      return gDef ? channels.filter(gDef.matcher) : [];
    };

    const acaoItems = getGenreItems('Ação');
    const comediaItems = getGenreItems('Comédia');
    const aventuraItems = getGenreItems('Aventura');
    const dramaItems = getGenreItems('Drama');
    const terrorItems = getGenreItems('Terror');
    const suspenseItems = getGenreItems('Suspense');
    const ficcaoItems = getGenreItems('Ficção Científica');
    const animacaoItems = getGenreItems('Animação & Kids');
    const romanceItems = getGenreItems('Romance');

    // 3. Top 10 da PobreFlix Brasil
    const top10Regex = [
      /deadpool/i,
      /breaking bad/i,
      /todo mundo odeia o chris/i,
      /stranger things/i,
      /the boys/i,
      /vingadores:\s*ultimato/i,
      /dragon ball z/i,
      /chaves/i,
      /homem-aranha:\s*sem volta/i,
      /sobrenatural/i
    ];
    const top10 = [];
    const usedUrls = new Set();

    top10Regex.forEach((rx) => {
      const match = channels.find((c) => rx.test(c.name) && !usedUrls.has(c.url));
      if (match && top10.length < 10) {
        top10.push(match);
        usedUrls.add(match.url);
      }
    });

    for (let i = 0; i < channels.length && top10.length < 10; i++) {
      if (channels[i].logo && !usedUrls.has(channels[i].url)) {
        top10.push(channels[i]);
        usedUrls.add(channels[i].url);
      }
    }

    const liveMoviesRow = channels.filter(
      (c) =>
        !c.isVod &&
        /filme|movie|cine|ação|acao|terror|suspense|comédia romântica|drama|scifi|ficção|clássicos|sucessos/i.test(
          `${c.name} ${c.group}`
        )
    );

    const liveSeriesRow = channels.filter(
      (c) =>
        !c.isVod &&
        /série|serie|csi|walking dead|star trek|doctor who|investigação|crime|detetive|novela|maratona/i.test(
          `${c.name} ${c.group}`
        )
    );

    const sportsRow = channels.filter((c) =>
      /esporte|sport|futebol|ufc|fight|luta|combate|motor|auto|radical|fifa/i.test(
        `${c.name} ${c.group}`
      )
    );

    const liveTvRow = channels.filter(
      (c) =>
        !c.isVod &&
        /notícia|news|jornal|aberta|sbt|record|band|cultura|rede|tv|natureza|história|ciência|document/i.test(
          `${c.name} ${c.group}`
        )
    );

    // 3.5. Linhas de Franquias e Sagas em Sequência Cronológica (1, 2, 3, 4, 5...)
    function buildFranchiseRow(id, title, definitions) {
      const items = definitions.map((def, idx) => {
        let match = channels.find((c) => {
          const t = c.name || c.rawTitle || '';
          if (!def.pattern.test(t)) return false;
          if (def.exclude && def.exclude.test(t)) return false;
          return true;
        });

        const effectiveUrl =
          def.url ||
          (match && match.url) ||
          `cloud://movie/${encodeURIComponent(def.name)}`;

        const effectiveLogo = def.logo || (match && match.logo) || '';

        return {
          id: `seq_${id}_${idx + 1}`,
          name: def.name,
          rawTitle: def.name,
          logo: effectiveLogo,
          url: effectiveUrl,
          group: def.group || 'VOD Filmes: Franquias & Sequências (Dublado)',
          quality: (match && match.quality) || 'FHD',
          isVod: true,
          isCloudVod: !match || match.isCloudVod,
          sequenceNumber: idx + 1,
          summary: (match && match.summary) || def.summary || ''
        };
      });

      return {
        id,
        title,
        items,
        isSequence: true,
        navTarget: 'vod-movies'
      };
    }

    const franchiseRows = [
      buildFranchiseRow('seq-fast-furious', '🏎️ Saga Velozes & Furiosos (Ordem Cronológica 1 ao 10)', [
        { name: 'Velozes e Furiosos 1 (2001)', pattern: /velozes e furiosos 1\b/i, logo: 'https://image.tmdb.org/t/p/w500/rKaaYM4CtuJZFdOA0SZWbaMNHbn.jpg' },
        { name: '+ Velozes + Furiosos 2 (2003)', pattern: /velozes e furiosos 2\b|\+ velozes \+ furiosos/i, logo: 'https://image.tmdb.org/t/p/w500/mx0CB8H78PQu0g9YUWG47hdi93S.jpg' },
        { name: 'Velozes e Furiosos 3: Desafio em Tóquio (2006)', pattern: /desafio em t[oó]quio/i, logo: 'https://image.tmdb.org/t/p/w500/1kzW2GImY1YVmLRx3NLhXFBfLLO.jpg' },
        { name: 'Velozes e Furiosos 4 (2009)', pattern: /velozes e furiosos 4\b/i, logo: 'https://image.tmdb.org/t/p/w500/7sjbAOmNFtfTyZ6KFC9t9FDDOcK.jpg' },
        { name: 'Velozes e Furiosos 5: Operação Rio (2011)', pattern: /opera[çc][aã]o rio/i, logo: 'https://image.tmdb.org/t/p/w500/5BKmQMUPOEtDFDCBW8jrUCI9ZbI.jpg' },
        { name: 'Velozes e Furiosos 6 (2013)', pattern: /velozes e furiosos 6\b/i, logo: 'https://image.tmdb.org/t/p/w500/h8SD0Kkqv3PUBneQX9tFsDrFu8.jpg' },
        { name: 'Velozes e Furiosos 7 (2015)', pattern: /velozes e furiosos 7\b/i, logo: 'https://image.tmdb.org/t/p/w500/spydMyyD81HjGJVwZvjajkrWW1h.jpg' },
        { name: 'Velozes e Furiosos 8 (2017)', pattern: /velozes e furiosos 8\b/i, logo: 'https://image.tmdb.org/t/p/w500/1wcMoiMZ2VxrrWswuarI7g9m9nN.jpg' },
        { name: 'Velozes & Furiosos: Hobbs & Shaw (2019)', pattern: /hobbs (e|&) shaw/i, logo: 'https://image.tmdb.org/t/p/w500/ltRrxSvxqYrQPQRCEQnhr0KXAlb.jpg' },
        { name: 'Velozes e Furiosos 9 (2021)', pattern: /velozes e furiosos 9\b/i, logo: 'https://image.tmdb.org/t/p/w500/6TuEPZ3ItlBO8WmH8BmY2aGLhes.jpg' },
        { name: 'Velozes e Furiosos 10 (2023)', pattern: /velozes e furiosos 10\b/i, logo: 'https://image.tmdb.org/t/p/w500/xNqt1Om0IlUhDOjZRCL5ewoazVV.jpg' }
      ]),

      buildFranchiseRow('seq-harry-potter', '⚡ Saga Harry Potter Completa (Ordem 1 ao 8)', [
        { name: 'Harry Potter 1 e a Pedra Filosofal (2001)', pattern: /pedra filosofal/i, logo: 'https://image.tmdb.org/t/p/w500/4rtsbE9aQ1qw4gv7yYwaNYfWFoS.jpg' },
        { name: 'Harry Potter 2 e a Câmara Secreta (2002)', pattern: /c[âa]mara secreta/i, logo: 'https://image.tmdb.org/t/p/w500/811j0Jf2D0mK1U6RxXJoZgOB29n.jpg' },
        { name: 'Harry Potter 3 e o Prisioneiro de Azkaban (2004)', pattern: /prisioneiro de azkaban/i, logo: 'https://image.tmdb.org/t/p/w500/1HdMUghqlgOIvbsU9ZtO40IPRzl.jpg' },
        { name: 'Harry Potter 4 e o Cálice de Fogo (2005)', pattern: /c[áa]lice de fogo/i, logo: 'https://image.tmdb.org/t/p/w500/5oWB3hjzyECRBAjgWkmZinxl9qA.jpg' },
        { name: 'Harry Potter 5 e a Ordem da Fênix (2007)', pattern: /ordem da f[êe]nix/i, logo: 'https://image.tmdb.org/t/p/w500/tIf9aUyNljda9MG1pjlOLHCZ3b0.jpg' },
        { name: 'Harry Potter 6 e o Enigma do Príncipe (2009)', pattern: /enigma do pr[íi]ncipe/i, logo: 'https://image.tmdb.org/t/p/w500/hTQQ5l9mxA3Rob8PTyvrNNGuj6y.jpg' },
        { name: 'Harry Potter 7 e as Relíquias da Morte - Parte 1 (2010)', pattern: /rel[íi]quias da morte.*(parte 1|1)/i, url: 'https://archive.org/download/harry-potter-reliquias-da-morte-paixaoflix/Harry%20Potter%20e%20as%20Rel%C3%ADquias%20da%20Morte%20-%20Parte%201.ia.mp4', logo: 'https://image.tmdb.org/t/p/w500/67FVFOTaeBUQnimhCWpUkDawDct.jpg' },
        { name: 'Harry Potter 8 e as Relíquias da Morte - Parte 2 (2011)', pattern: /rel[íi]quias da morte.*(parte 2|2)/i, url: 'https://archive.org/download/harry-potter-reliquias-da-morte-paixaoflix/Harry%20Potter%20e%20as%20Rel%C3%ADquias%20da%20Morte%20-%20Parte%202.ia.mp4', logo: 'https://image.tmdb.org/t/p/w500/yD3VosOVW8WxPUzBDpEdzfv5pGx.jpg' }
      ]),

      buildFranchiseRow('seq-hunger-games', '🏹 Saga Jogos Vorazes Completa (Ordem 1 ao 5)', [
        { name: 'Jogos Vorazes 1 (2012)', pattern: /jogos vorazes 2012|jogos vorazes \(dublado\)|^jogos vorazes\b/i, exclude: /em chamas|esperan[çc]a|cantiga/i, logo: 'https://image.tmdb.org/t/p/w500/l6jn53LMu07uPt8A42JWIKi1Beb.jpg' },
        { name: 'Jogos Vorazes 2: Em Chamas (2013)', pattern: /jogos vorazes.*em chamas/i, logo: 'https://image.tmdb.org/t/p/w500/m1lky5ftnhLRpkoYWKssH8qvlRU.jpg' },
        { name: 'Jogos Vorazes 3: A Esperança - Parte 1 (2014)', pattern: /jogos vorazes.*a esperan[çc]a.*parte 1/i, logo: 'https://image.tmdb.org/t/p/w500/hekpVNWOROZm57RS4OLW0ySkxx9.jpg' },
        { name: 'Jogos Vorazes 4: A Esperança - O Final (2015)', pattern: /jogos vorazes.*a esperan[çc]a.*final/i, logo: 'https://image.tmdb.org/t/p/w500/5KSQkozSelQj6bq8NCKtINvsSSj.jpg' },
        { name: 'Jogos Vorazes 5: A Cantiga dos Pássaros e das Serpentes (2023)', pattern: /jogos vorazes.*cantiga/i, logo: 'https://image.tmdb.org/t/p/w500/a9z2cmIBfx99dtzj8TaSFU50AnW.jpg' }
      ]),

      buildFranchiseRow('seq-twilight', '🧛 Saga Crepúsculo Completa (Ordem 1 ao 5)', [
        { name: 'Crepúsculo 1 (2008)', pattern: /crep[uú]sculo/i, exclude: /lua nova|eclipse|amanhecer/i, logo: 'https://image.tmdb.org/t/p/w500/o4ki1gYHkP6IWNdwjHvI9vzfpuC.jpg' },
        { name: 'Crepúsculo 2: Lua Nova (2009)', pattern: /lua nova/i, logo: 'https://image.tmdb.org/t/p/w500/z39dbVwa1iIihdUDHGiRy4tc2Ov.jpg' },
        { name: 'Crepúsculo 3: Eclipse (2010)', pattern: /eclipse/i, logo: 'https://image.tmdb.org/t/p/w500/a8qPjwfKA1MwjEoVPhTf1ptVzdE.jpg' },
        { name: 'Crepúsculo 4: Amanhecer - Parte 1 (2011)', pattern: /amanhecer.*parte 1/i, logo: 'https://image.tmdb.org/t/p/w500/a6PexAo0jJRLlPNBfdiXXr0HYyz.jpg' },
        { name: 'Crepúsculo 5: Amanhecer - Parte 2 (2012)', pattern: /amanhecer.*parte 2/i, logo: 'https://image.tmdb.org/t/p/w500/1clnx7FymVEo1NC3Yikf1GrEfq7.jpg' }
      ]),

      buildFranchiseRow('seq-matrix', '🕶️ Saga Matrix Completa (Ordem 1 ao 4)', [
        { name: 'Matrix 1 (1999)', pattern: /^matrix\b/i, exclude: /reloaded|revolutions|resurrections/i, logo: 'https://image.tmdb.org/t/p/w500/lDqMDI3xpbB9UQRyeXfei0MXhqb.jpg' },
        { name: 'Matrix 2: Reloaded (2003)', pattern: /matrix reloaded/i, logo: 'https://image.tmdb.org/t/p/w500/ayZkaN2f3ASjWW8ooCfuJT3T8Va.jpg' },
        { name: 'Matrix 3: Revolutions (2003)', pattern: /matrix revolutions/i, logo: 'https://image.tmdb.org/t/p/w500/92oJ810bYqijBQ8tqYL74mSpPtV.jpg' },
        { name: 'Matrix 4: Resurrections (2021)', pattern: /matrix resurrections/i, url: 'cloud://movie/Matrix%20Resurrections', logo: 'https://image.tmdb.org/t/p/w500/9DT4WVqZqBEI9Kub18gZ3m1D89m.jpg' }
      ]),

      buildFranchiseRow('seq-spiderman', '🕷️ Saga Homem-Aranha (Filmes em Sequência & Aranhaverso)', [
        { name: 'Homem-Aranha 1 (Tobey Maguire - 2002)', pattern: /^spider-man \(dublado\)|^spider-man\b/i, exclude: /2|3|unlimited|animated|across|into|amazing|reloaded/i, logo: 'https://image.tmdb.org/t/p/w500/RbZQL5hXmydecu82UHw9ZGyytB.jpg' },
        { name: 'Homem-Aranha 2 (Tobey Maguire - 2004)', pattern: /^spider-man 2/i, logo: 'https://image.tmdb.org/t/p/w500/xB05Gyeo2w4RBwt7nZlPkjZzt9X.jpg' },
        { name: 'Homem-Aranha 3 (Tobey Maguire - 2007)', pattern: /^spider-man 3/i, logo: 'https://image.tmdb.org/t/p/w500/5831VrgpYNPEokBwxurLVpQ3twM.jpg' },
        { name: 'O Espetacular Homem-Aranha 1 (Andrew Garfield - 2012)', pattern: /espetacular homem aranha|the amazing spider-man/i, exclude: /2/i, logo: 'https://image.tmdb.org/t/p/w500/gxSsFBCFuDhVQMCuIDoZcmHOqlY.jpg' },
        { name: 'O Espetacular Homem-Aranha 2 (Andrew Garfield - 2014)', pattern: /the amazing spider-man 2/i, logo: 'https://image.tmdb.org/t/p/w500/cyMz4OfmNqpuQ02QQOQCbGxQjwK.jpg' },
        { name: 'Homem-Aranha: De Volta ao Lar (Tom Holland - 2017)', pattern: /homem-aranha.*de volta ao lar|spider-man.*homecoming/i, url: 'cloud://movie/Homem-Aranha%3A%20De%20Volta%20ao%20Lar', logo: 'https://image.tmdb.org/t/p/w500/1nkwRL17cAGO8A1yu3miRBdvOsl.jpg' },
        { name: 'Homem-Aranha no Aranhaverso (Miles Morales - 2018)', pattern: /no aranhaverso|into the spider-verse/i, logo: 'https://image.tmdb.org/t/p/w500/ybQSBSrINtjWsJQ6Ih8sva8HlEZ.jpg' },
        { name: 'Homem-Aranha: Longe de Casa (Tom Holland - 2019)', pattern: /homem-aranha.*longe de casa|spider-man.*far from home/i, url: 'cloud://movie/Homem-Aranha%3A%20Longe%20de%20Casa', logo: 'https://image.tmdb.org/t/p/w500/tX0o4AdHpidgniTWwfzK0dNTKrc.jpg' },
        { name: 'Homem-Aranha: Sem Volta Para Casa (Tom Holland - 2021)', pattern: /sem volta para casa|no way home/i, logo: 'https://image.tmdb.org/t/p/w500/xaKydnMw6wR1MBAjS5seGPVusbs.jpg' },
        { name: 'Homem-Aranha: Através do Aranhaverso (Miles Morales - 2023)', pattern: /atrav[eé]s do aranhaverso|across the spider-verse/i, logo: 'https://image.tmdb.org/t/p/w500/fBS6y0LYX4kU6pPSBYMdQy6SIHX.jpg' }
      ]),

      buildFranchiseRow('seq-lotr-hobbit', '💍 Saga O Senhor dos Anéis & O Hobbit (Ordem Cronológica 1 ao 6)', [
        { name: '1. O Hobbit: Uma Jornada Inesperada (2012)', pattern: /unexpected journey|uma jornada inesperada/i, logo: 'https://image.tmdb.org/t/p/w500/lZtmn2pLw1kgDYj4Ig4s3DYBQCD.jpg' },
        { name: '2. O Hobbit: A Desolação de Smaug (2013)', pattern: /desolation of smaug|desola[çc][aã]o de smaug/i, logo: 'https://image.tmdb.org/t/p/w500/ws5z2UmmVzRDD8hZtHTHfcqTOAW.jpg' },
        { name: '3. O Hobbit: A Batalha dos Cinco Exércitos (2014)', pattern: /battle of the five armies|batalha dos cinco/i, logo: 'https://image.tmdb.org/t/p/w500/wRKwrfQ7p0ttrb09G3mcOSyN1pk.jpg' },
        { name: '4. O Senhor dos Anéis: A Sociedade do Anel (2001)', pattern: /fellowship of the ring|sociedade do anel/i, logo: 'https://image.tmdb.org/t/p/w500/tlvsNCwWEIgwAM23aNzTmMIcPEZ.jpg' },
        { name: '5. O Senhor dos Anéis: As Duas Torres (2002)', pattern: /two towers|duas torres/i, logo: 'https://image.tmdb.org/t/p/w500/mCs8vxvScCqVM3YFMQIdbrdFEhu.jpg' },
        { name: '6. O Senhor dos Anéis: O Retorno do Rei (2003)', pattern: /return of the king|retorno do rei/i, logo: 'https://image.tmdb.org/t/p/w500/rU4oIKv5I4C59DpcXKmT7kNwGI0.jpg' }
      ]),

      buildFranchiseRow('seq-starwars', '🪐 Saga Star Wars (A Saga Skywalker - Episódios 1 ao 9)', [
        { name: 'Star Wars: Ep. I - A Ameaça Fantasma (1999)', pattern: /phantom menace|amea[çc]a fantasma/i, logo: 'https://image.tmdb.org/t/p/w500/gNk8UNAumXlfCdtaxDqsQe7ZGlt.jpg' },
        { name: 'Star Wars: Ep. II - Ataque dos Clones (2002)', pattern: /attack of the clones|ataque dos clones/i, logo: 'https://image.tmdb.org/t/p/w500/9m1nJ2MfTG5QEmjOCg0b4YCo4W8.jpg' },
        { name: 'Star Wars: Ep. III - A Vingança dos Sith (2005)', pattern: /revenge of the sith|vingan[çc]a dos sith/i, logo: 'https://image.tmdb.org/t/p/w500/nuF5yWtTJEEAd4Qa6cVkYz1XCST.jpg' },
        { name: 'Star Wars: Ep. IV - Uma Nova Esperança (1977)', pattern: /^star wars \(dublado\)|^star wars\b/i, exclude: /episode|clone|making|lego|robot|holiday|force|vision/i, logo: 'https://image.tmdb.org/t/p/w500/dw7X9YPjjAfIxKHW04V64Bb9TB0.jpg' },
        { name: 'Star Wars: Ep. V - O Império Contra-Ataca (1980)', pattern: /empire strikes back|imp[eé]rio contra-ataca/i, exclude: /lego/i, logo: 'https://image.tmdb.org/t/p/w500/dLGT8b4Ut10z44uYLaip4QiwKta.jpg' },
        { name: 'Star Wars: Ep. VI - O Retorno de Jedi (1983)', pattern: /return of the jedi|retorno de jedi/i, logo: 'https://image.tmdb.org/t/p/w500/llaJ35p5e23ygDbqd0H3otJLWsA.jpg' },
        { name: 'Star Wars: Ep. VII - O Despertar da Força (2015)', pattern: /force awakens|despertar da for[çc]a/i, logo: 'https://image.tmdb.org/t/p/w500/lqMDbo4rXnakFgc4C6LzPv6pG7F.jpg' },
        { name: 'Star Wars: Ep. VIII - Os Últimos Jedi (2017)', pattern: /last jedi|[uú]ltimos jedi/i, url: 'cloud://movie/Star%20Wars%3A%20Os%20%C3%9Altimos%20Jedi', logo: 'https://image.tmdb.org/t/p/w500/5dGufuaIG5vNcxPm8QPij5MSPeQ.jpg' },
        { name: 'Star Wars: Ep. IX - A Ascensão Skywalker (2019)', pattern: /rise of skywalker|ascens[aã]o skywalker/i, url: 'cloud://movie/Star%20Wars%3A%20A%20Ascens%C3%A3o%20Skywalker', logo: 'https://image.tmdb.org/t/p/w500/uLlrDUtFG2tKtDcJN6kBznlqqsp.jpg' }
      ]),

      buildFranchiseRow('seq-jurassic', '🦖 Saga Jurassic Park & Jurassic World (Ordem 1 ao 6)', [
        { name: 'Jurassic Park 1: O Parque dos Dinossauros (1993)', pattern: /^jurassic park \(dublado\)|^jurassic park\b/i, exclude: /2|3|shark|world/i, logo: 'https://image.tmdb.org/t/p/w500/mgjJ7FH4V3exsmoHwXrmsUhn0h1.jpg' },
        { name: 'Jurassic Park 2: O Mundo Perdido (1997)', pattern: /mundo perdido.*jurassic|the lost world.*jurassic/i, url: 'cloud://movie/O%20Mundo%20Perdido%3A%20Jurassic%20Park', logo: 'https://image.tmdb.org/t/p/w500/gkF6JPfru2FEIP9du7QyHVLSOzu.jpg' },
        { name: 'Jurassic Park 3 (2001)', pattern: /jurassic park 3|jurassic park iii/i, url: 'cloud://movie/Jurassic%20Park%203', logo: 'https://image.tmdb.org/t/p/w500/1dObEUGvS4cTbVNi8ewvd6gLIv4.jpg' },
        { name: 'Jurassic World 1: O Mundo dos Dinossauros (2015)', pattern: /^jurassic world \(dublado\)|^jurassic world\b/i, exclude: /reino|dom[ií]nio|recome[çc]o/i, logo: 'https://image.tmdb.org/t/p/w500/mTRLIP4J4iJrVbJplKiaGnc3G93.jpg' },
        { name: 'Jurassic World 2: Reino Ameaçado (2018)', pattern: /reino amea[çc]ado|fallen kingdom/i, logo: 'https://image.tmdb.org/t/p/w500/pi23N55j5ezB2wvybgAFuSGrVHB.jpg' },
        { name: 'Jurassic World 3: Domínio (2022)', pattern: /jurassic world.*(dom[ií]nio|dominion)/i, url: 'cloud://movie/Jurassic%20World%3A%20Dom%C3%ADnio', logo: 'https://image.tmdb.org/t/p/w500/7qeiCNSmzrkcEyIWi8sIcsjrOyW.jpg' }
      ]),

      buildFranchiseRow('seq-avengers', '🦸 Saga Os Vingadores (Universo Marvel MCU 1 ao 4)', [
        { name: 'Os Vingadores 1 (2012)', pattern: /^the avengers \(dublado\)|^the avengers\b/i, exclude: /ultimate|age|next|crippled|earth|assemble|wars|united/i, logo: 'https://image.tmdb.org/t/p/w500/PtSapjHdDjlVcsqdEo0u7rDE6i.jpg' },
        { name: 'Vingadores 2: Era de Ultron (2015)', pattern: /age of ultron|era de ultron/i, logo: 'https://image.tmdb.org/t/p/w500/uvzqTsRmUzk9mJVzX8cMSWMyM5l.jpg' },
        { name: 'Vingadores 3: Guerra Infinita (2018)', pattern: /infinity war|guerra infinita/i, url: 'cloud://movie/Vingadores%3A%20Guerra%20Infinita', logo: 'https://image.tmdb.org/t/p/w500/A4kvp7vY1BDLrrQIagRCffLKj1t.jpg' },
        { name: 'Vingadores 4: Ultimato (2019)', pattern: /vingadores.*ultimato|avengers.*endgame/i, url: 'cloud://movie/Vingadores%3A%20Ultimato', logo: 'https://image.tmdb.org/t/p/w500/q6725aR8Zs4IwGMXzZT8aC8lh41.jpg' }
      ]),

      buildFranchiseRow('seq-shrek', '🧅 Saga Shrek & Gato de Botas (Ordem 1 ao 6)', [
        { name: 'Shrek 1 (2001)', pattern: /^shrek \(dublado\)|^shrek\b/i, exclude: /2|terceiro|3|sempre|4/i, url: 'https://archive.org/download/shrek-terceiro-2007-bdrip-720p-dublado_202604/Shrek%20Terceiro%20(2007)%20-%20BDRip%20720p%20-%20Dublado.mp4', logo: 'https://image.tmdb.org/t/p/w500/wxeqfC221YMptRRdzxlijAh7q8l.jpg' },
        { name: 'Shrek 2 (2004)', pattern: /^shrek 2/i, url: 'https://archive.org/download/shrek-2-full-movie_202510/Shrek.2.2004.720p.BluRay.x264.YIFY.mp4', logo: 'https://image.tmdb.org/t/p/w500/2yYP0PQjG8zVqturh1BAqu2Tixl.jpg' },
        { name: 'Shrek 3: O Terceiro (2007)', pattern: /shrek terceiro|shrek the third/i, url: 'https://archive.org/download/shrek-terceiro-2007-bdrip-720p-dublado_202604/Shrek%20Terceiro%20(2007)%20-%20BDRip%20720p%20-%20Dublado.mp4', logo: 'https://image.tmdb.org/t/p/w500/abw1mIJIjG9X3xSEffE9siLcOkN.jpg' },
        { name: 'Shrek 4: Para Sempre (2010)', pattern: /shrek para sempre|forever after/i, url: 'https://archive.org/download/shrek-terceiro-2007-bdrip-720p-dublado_202604/Shrek%20Terceiro%20(2007)%20-%20BDRip%20720p%20-%20Dublado.mp4', logo: 'https://image.tmdb.org/t/p/w500/iFXVU0ni6YWgQNSPkoGO1Tk5L3g.jpg' },
        { name: 'Gato de Botas 1 (2011)', pattern: /^gato de botas\b|puss in boots/i, exclude: /2|[uú]ltimo pedido/i, url: 'cloud://movie/Gato%20de%20Botas', logo: 'https://image.tmdb.org/t/p/w500/kc7TJHzlLOsN0M6srM67BXdGmhn.jpg' },
        { name: 'Gato de Botas 2: O Último Pedido (2022)', pattern: /[uú]ltimo pedido|last wish/i, url: 'cloud://movie/Gato%20de%20Botas%202%3A%20O%20%C3%9Altimo%20Pedido', logo: 'https://image.tmdb.org/t/p/w500/atJxZfCaQ7kXRFSfbm8cqAKkns7.jpg' }
      ]),

      buildFranchiseRow('seq-ice-age', '❄️ Saga A Era do Gelo (Ordem 1 ao 5)', [
        { name: 'A Era do Gelo 1 (2002)', pattern: /a era do gelo 1|^a era do gelo \(dublado\)|^a era do gelo\b/i, exclude: /2|3|4|5|big bang|pascoa|natal/i, url: 'https://archive.org/download/a-era-do-gelo-blu-ray-1080p-dublado/A%20Era%20do%20Gelo%20BluRay%201080p%20Dublado.mp4', logo: 'https://image.tmdb.org/t/p/w500/dlqC2gJs02gc23XvyOjoz52ToRI.jpg' },
        { name: 'A Era do Gelo 2: O Degelo (2006)', pattern: /a era do gelo 2|meltdown/i, url: 'https://archive.org/download/a-era-do-gelo-blu-ray-1080p-dublado/A%20Era%20do%20Gelo%20BluRay%201080p%20Dublado.mp4', logo: 'https://image.tmdb.org/t/p/w500/uWeiAd2X4vrXHDMAUoTDz8R5vxI.jpg' },
        { name: 'A Era do Gelo 3: Despertar dos Dinossauros (2009)', pattern: /a era do gelo 3|dawn of the dinosaurs/i, url: 'https://archive.org/download/aeradogelo32009-kids-paixaoflix/A%20Era%20do%20Gelo%203%20-%202009_ready.mp4', logo: 'https://image.tmdb.org/t/p/w500/kaXQMlurbJ6n5u33TRePTXWxPHY.jpg' },
        { name: 'A Era do Gelo 4: Deriva Continental (2012)', pattern: /a era do gelo 4|continental drift/i, url: 'https://archive.org/download/a-era-do-gelo-blu-ray-1080p-dublado/A%20Era%20do%20Gelo%20BluRay%201080p%20Dublado.mp4', logo: 'https://image.tmdb.org/t/p/w500/dWiHLqARtyAAOy0nLvXIxRYkfNA.jpg' },
        { name: 'A Era do Gelo 5: O Big Bang (2016)', pattern: /a era do gelo.*(5|big bang)|ice age.*collision/i, url: 'https://archive.org/download/a-era-do-gelo-blu-ray-1080p-dublado/A%20Era%20do%20Gelo%20BluRay%201080p%20Dublado.mp4', logo: 'https://image.tmdb.org/t/p/w500/e7R8ULZLdiKO2uYtXqifwf2pJfy.jpg' }
      ]),

      buildFranchiseRow('seq-toy-story', '🧸 Saga Toy Story (Ordem 1 ao 4)', [
        { name: 'Toy Story 1 (1995)', pattern: /^toy story \(dublado\)|^toy story\b/i, exclude: /2|3|4|terror|tempo/i, url: 'https://archive.org/download/toy-story-2-1999-vhsrip-dublado/Toy%20Story%202%20(1999)%20VHSRip%20Dublado.mp4', logo: 'https://image.tmdb.org/t/p/w500/686F0CEPmI4ZXjFbWtIHQOBwnfI.jpg' },
        { name: 'Toy Story 2 (1999)', pattern: /toy story 2/i, url: 'https://archive.org/download/toy-story-2-1999-vhsrip-dublado/Toy%20Story%202%20(1999)%20VHSRip%20Dublado.mp4', logo: 'https://image.tmdb.org/t/p/w500/xVhEI1WCgNCCa5I86AqiwuZoog3.jpg' },
        { name: 'Toy Story 3 (2010)', pattern: /toy story 3/i, url: 'https://archive.org/download/toy-story-2-1999-vhsrip-dublado/Toy%20Story%202%20(1999)%20VHSRip%20Dublado.mp4', logo: 'https://image.tmdb.org/t/p/w500/rf67AeS9nP8DD7dZYbvhjEVoIBf.jpg' },
        { name: 'Toy Story 4 (2019)', pattern: /toy story 4/i, url: 'https://archive.org/download/toy-story-2-1999-vhsrip-dublado/Toy%20Story%202%20(1999)%20VHSRip%20Dublado.mp4', logo: 'https://image.tmdb.org/t/p/w500/csiyO6q8rR74pfgJDjwINzhoick.jpg' }
      ])

    ];

    return [
      {
        id: 'top10',
        title: '🔥 Top 10 Hoje na PobreFlix Brasil',
        items: top10,
        isTop10: true
      },
      ...franchiseRows,
      {
        id: 'vod-series-famous',
        title: '📺 Séries Mais Assistidas (Clique para Escolher Temporada & Episódio)',
        items: vodSeriesFamous.slice(0, 45),
        navTarget: 'vod-series'
      },
      {
        id: 'vod-series-sitcoms',
        title: '😂 Sitcoms & Comédias Clássicas (Chris, Patroa, Maluco no Pedaço, Friends, Chaves)',
        items: vodSeriesSitcoms.slice(0, 45),
        navTarget: 'vod-series'
      },
      {
        id: 'row-acao',
        title: '💥 Filmes & Séries de Ação (Adrenalina Pura)',
        items: acaoItems.slice(0, 45),
        navTarget: 'acao'
      },
      {
        id: 'row-comedia',
        title: '😂 Comédias & Sitcoms (Para Morrer de Rir)',
        items: comediaItems.slice(0, 45),
        navTarget: 'comedia'
      },
      {
        id: 'row-aventura',
        title: '🗺️ Grandes Aventuras & Fantasia Épica',
        items: aventuraItems.slice(0, 45),
        navTarget: 'aventura'
      },
      {
        id: 'row-drama',
        title: '🎭 Dramas Emocionantes & Premiados',
        items: dramaItems.slice(0, 45),
        navTarget: 'drama'
      },
      {
        id: 'row-terror',
        title: '👻 Terror & Histórias Macabras',
        items: terrorItems.slice(0, 45),
        navTarget: 'terror'
      },
      {
        id: 'row-suspense',
        title: '🕵️ Suspense, Crime & Mistério',
        items: suspenseItems.slice(0, 45),
        navTarget: 'vod-movies'
      },
      {
        id: 'row-ficcao',
        title: '🚀 Ficção Científica & Futuro',
        items: ficcaoItems.slice(0, 45),
        navTarget: 'vod-movies'
      },
      {
        id: 'row-animacao',
        title: '🎨 Animações & Família (Disney, Pixar e Muito Mais)',
        items: animacaoItems.slice(0, 45),
        navTarget: 'kids'
      },
      {
        id: 'row-romance',
        title: '❤️ Romance & Histórias de Amor',
        items: romanceItems.slice(0, 45),
        navTarget: 'vod-movies'
      },
      {
        id: 'vod-series-animes',
        title: '🍥 Animes Lendários Completos (Naruto, Dragon Ball, One Piece, Yu Yu Hakusho...)',
        items: vodSeriesAnimes.slice(0, 45),
        navTarget: 'vod-series'
      },
      {
        id: 'vod-series-cartoons',
        title: '🦸 Desenhos, Heróis & Animações Adultas (Temporadas & Episódios)',
        items: vodSeriesCartoons.slice(0, 45),
        navTarget: 'vod-series'
      },
      {
        id: 'vod-series-doramas',
        title: '💜 Doramas, K-Dramas & Aventura (Temporadas & Episódios)',
        items: vodSeriesDoramas.slice(0, 45),
        navTarget: 'vod-series'
      },
      {
        id: 'live-movies',
        title: '🎬 Canais de Cinema 24h (Pluto TV & TV Ao Vivo)',
        items: liveMoviesRow.slice(0, 35),
        navTarget: 'live'
      },
      {
        id: 'live-series',
        title: '🕵️ Maratonas 24h: CSI, The Walking Dead & Séries Ao Vivo',
        items: liveSeriesRow.slice(0, 35),
        navTarget: 'live'
      },
      {
        id: 'sports',
        title: '⚽ Esportes, Futebol & Lutas Ao Vivo',
        items: sportsRow.slice(0, 30)
      },
      {
        id: 'livetv',
        title: '📡 TV Aberta, Notícias & Documentários',
        items: liveTvRow.slice(0, 40),
        navTarget: 'live'
      }
    ].filter((r) => r.items.length > 0);
  }, [channels]);

  const filteredChannels = useMemo(() => {
    let list = channels;

    if (navSection === 'mylist') {
      const favSet = new Set(favorites);
      list = channels.filter((ch) => favSet.has(ch.url));
    } else if (navSection === 'history') {
      list = deduplicateHistory(history, channels);
    } else if (navSection === 'vod-movies') {
      list = channels.filter((c) => c.isVod && !c.isSeriesGroup && !c.isAnime);
    } else if (navSection === 'vod-series') {
      list = channels.filter((c) => c.isSeriesGroup && !c.isAnime);
    } else if (navSection === 'acao') {
      const gDef = GENRE_DEFINITIONS.find((g) => g.id === 'Ação');
      list = gDef ? channels.filter(gDef.matcher) : channels;
    } else if (navSection === 'comedia') {
      const gDef = GENRE_DEFINITIONS.find((g) => g.id === 'Comédia');
      list = gDef ? channels.filter(gDef.matcher) : channels;
    } else if (navSection === 'aventura') {
      const gDef = GENRE_DEFINITIONS.find((g) => g.id === 'Aventura');
      list = gDef ? channels.filter(gDef.matcher) : channels;
    } else if (navSection === 'drama') {
      const gDef = GENRE_DEFINITIONS.find((g) => g.id === 'Drama');
      list = gDef ? channels.filter(gDef.matcher) : channels;
    } else if (navSection === 'terror') {
      const gDef = GENRE_DEFINITIONS.find((g) => g.id === 'Terror');
      list = gDef ? channels.filter(gDef.matcher) : channels;
    } else if (navSection === 'kids') {
      const gDef = GENRE_DEFINITIONS.find((g) => g.id === 'Animação & Kids');
      list = gDef ? channels.filter(gDef.matcher) : channels;
    } else if (navSection === 'live') {
      list = channels.filter((c) => !c.isVod);
    }

    if (selectedCategory && selectedCategory !== 'Todos') {
      const gDef = GENRE_DEFINITIONS.find((g) => g.name === selectedCategory || g.id === selectedCategory);
      if (gDef) {
        list = list.filter(gDef.matcher);
      } else {
        list = list.filter((ch) => (ch.group || 'Geral') === selectedCategory);
      }
    }

    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      const localMatches = list.filter(
        (ch) =>
          ch.name.toLowerCase().includes(q) ||
          (ch.group && ch.group.toLowerCase().includes(q))
      );

      // Mesclar com os resultados da Busca Global no IMDb (qualquer filme ou série do mundo!)
      const seenImdb = new Set(localMatches.map((m) => m.imdbId).filter(Boolean));
      const extras = globalSearchResults.filter((g) => !seenImdb.has(g.imdbId));
      list = [...localMatches, ...extras];
    }

    if (onlyOnlineFilter) {
      list = list.filter((ch) => channelStatuses[ch.url]?.online === true);
    }

    return list;
  }, [
    channels,
    navSection,
    selectedCategory,
    searchQuery,
    globalSearchResults,
    favorites,
    history,
    onlyOnlineFilter,
    channelStatuses
  ]);

  useEffect(() => {
    setVisibleLimit(200);
  }, [navSection, selectedCategory, searchQuery, activePlaylistId, onlyOnlineFilter]);

  const displayedChannels = useMemo(
    () => filteredChannels.slice(0, visibleLimit),
    [filteredChannels, visibleLimit]
  );

  const sideDrawerItems = useMemo(() => {
    if (activeSeriesGroup && activeSeriesGroup.episodes?.length > 0) {
      return activeSeriesGroup.episodes;
    }
    if (!currentChannel) return channels.slice(0, 30);
    const sameGroup = channels.filter(
      (c) => c.group === currentChannel.group && !c.isSeriesGroup
    );
    return sameGroup.length > 1 ? sameGroup : channels.slice(0, 40);
  }, [channels, currentChannel, activeSeriesGroup]);

  const findCurrentInListIndex = useCallback(
    (list) => {
      if (!currentChannel || !Array.isArray(list) || list.length === 0) return -1;
      let idx = list.findIndex((c) => c.id && c.id === currentChannel.id);
      if (idx === -1 && activeSeriesGroup) {
        idx = list.findIndex(
          (c) =>
            (c.seasonNumber || 1) === (currentChannel.seasonNumber || 1) &&
            (c.episodeNumber || 1) === (currentChannel.episodeNumber || 1)
        );
      }
      if (idx === -1) {
        idx = list.findIndex((c) => c.url === currentChannel.url);
      }
      return idx;
    },
    [currentChannel, activeSeriesGroup]
  );

  const nextUpChannel = useMemo(() => {
    if (!currentChannel) return null;
    if (activeSeriesGroup && activeSeriesGroup.episodes && activeSeriesGroup.episodes.length > 0) {
      const eps = activeSeriesGroup.episodes;
      let idx = eps.findIndex((e) => e.url && e.url === currentChannel.url);
      if (idx === -1) {
        idx = eps.findIndex(
          (e) =>
            (e.seasonNumber || 1) === (currentChannel.seasonNumber || 1) &&
            (e.episodeNumber || 1) === (currentChannel.episodeNumber || 1)
        );
      }
      if (idx !== -1 && idx + 1 < eps.length) {
        return eps[idx + 1];
      }
    }
    if (currentChannel.url && /ep=(\d+)/i.test(currentChannel.url)) {
      const match = currentChannel.url.match(/ep=(\d+)/i);
      const curEpNum = parseInt(match[1], 10) || 1;
      const sTitle =
        currentChannel.seriesTitle || currentChannel.name.replace(/\s*-\s*[ST]\d+.*$/i, '');
      return {
        ...currentChannel,
        id: `${currentChannel.id || sTitle}_ep_${curEpNum + 1}`,
        name: `${sTitle} - T01E${String(curEpNum + 1).padStart(2, '0')}`,
        seriesTitle: sTitle,
        seasonNumber: 1,
        episodeNumber: curEpNum + 1,
        episodeTitle: `Episódio ${curEpNum + 1}`,
        url: currentChannel.url.replace(/ep=\d+/, `ep=${curEpNum + 1}`),
        isSeriesEpisode: true,
        isVod: true
      };
    }
    const list = sideDrawerItems.length > 0 ? sideDrawerItems : filteredChannels;
    if (list.length <= 1) return null;
    const idx = findCurrentInListIndex(list);
    if (idx === -1) return list[0];
    return list[(idx + 1) % list.length];
  }, [activeSeriesGroup, currentChannel, sideDrawerItems, filteredChannels, findCurrentInListIndex]);

  const handleStepChannel = useCallback(
    (direction) => {
      if (!currentChannel) return;

      // 1. Caso SÉRIE ativa: avançar ou recuar com precisão nos episódios
      if (activeSeriesGroup && activeSeriesGroup.episodes && activeSeriesGroup.episodes.length > 0) {
        const eps = activeSeriesGroup.episodes;
        let idx = eps.findIndex((e) => e.url && e.url === currentChannel.url);
        if (idx === -1) {
          idx = eps.findIndex(
            (e) =>
              (e.seasonNumber || 1) === (currentChannel.seasonNumber || 1) &&
              (e.episodeNumber || 1) === (currentChannel.episodeNumber || 1)
          );
        }
        if (idx === -1 && currentChannel.id) {
          idx = eps.findIndex((e) => e.id === currentChannel.id);
        }

        if (idx !== -1) {
          const nextIdx = idx + direction;
          if (nextIdx >= 0 && nextIdx < eps.length) {
            handleSelectChannel(eps[nextIdx], activeSeriesGroup);
            return;
          } else if (direction > 0 && nextIdx >= eps.length) {
            alert('Você chegou ao último episódio disponível desta série!');
            return;
          }
        } else if (currentChannel.episodeNumber) {
          const targetEpNum = (currentChannel.episodeNumber || 1) + direction;
          const matchEp = eps.find((e) => (e.episodeNumber || 1) === targetEpNum);
          if (matchEp) {
            handleSelectChannel(matchEp, activeSeriesGroup);
            return;
          }
        }
      }

      // 2. Caso o link seja ia-stream com ep=N
      if (currentChannel.url && /ep=(\d+)/i.test(currentChannel.url)) {
        const match = currentChannel.url.match(/ep=(\d+)/i);
        const curEpNum = parseInt(match[1], 10) || 1;
        const nextEpNum = Math.max(1, curEpNum + direction);
        if (nextEpNum !== curEpNum) {
          const nextUrl = currentChannel.url.replace(/ep=\d+/, `ep=${nextEpNum}`);
          const sTitle =
            currentChannel.seriesTitle || currentChannel.name.replace(/\s*-\s*[ST]\d+.*$/i, '');
          const nextEpisode = {
            ...currentChannel,
            id: `${currentChannel.id || sTitle}_ep_${nextEpNum}`,
            name: `${sTitle} - T01E${String(nextEpNum).padStart(2, '0')}`,
            seriesTitle: sTitle,
            seasonNumber: 1,
            episodeNumber: nextEpNum,
            episodeTitle: `Episódio ${nextEpNum}`,
            url: nextUrl,
            isSeriesEpisode: true,
            isVod: true
          };
          handleSelectChannel(nextEpisode, activeSeriesGroup);
          return;
        }
      }

      // 3. Fallback genérico para filmes e TV ao vivo na lista lateral ou categoria
      const list = sideDrawerItems.length > 0 ? sideDrawerItems : filteredChannels;
      if (list.length === 0) return;
      const idx = findCurrentInListIndex(list);
      if (idx === -1) {
        handleSelectChannel(list[0], activeSeriesGroup);
        return;
      }
      const nextIdx = (idx + direction + list.length) % list.length;
      handleSelectChannel(list[nextIdx], activeSeriesGroup);
    },
    [
      activeSeriesGroup,
      currentChannel,
      sideDrawerItems,
      filteredChannels,
      findCurrentInListIndex,
      handleSelectChannel
    ]
  );

  // Detector automático de Abertura (Intro) e Créditos Finais ("Próximo Episódio") estilo Netflix
  const handleVideoTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video || !currentChannel || !currentChannel.isVod) return;
    const dur = video.duration;
    const cur = video.currentTime;
    if (!dur || !isFinite(dur) || dur < 45) return;

    // 1. Detectar janela de Abertura ("Pular Abertura" entre 15s e 85s em séries)
    if (
      (activeSeriesGroup || currentChannel.isSeriesEpisode) &&
      !skipIntroDismissed &&
      dur > 180 &&
      cur >= 15 &&
      cur <= 85
    ) {
      if (!showSkipIntro) setShowSkipIntro(true);
    } else if (showSkipIntro) {
      setShowSkipIntro(false);
    }

    // 2. Detectar início dos Créditos Finais (últimos 55s ou últimos 8% do episódio/filme)
    const creditsWindow = Math.min(65, Math.max(35, dur * 0.08));
    const remaining = dur - cur;

    if (remaining <= creditsWindow && remaining > 0.4) {
      if (!upNextDismissed && !showUpNextOverlay) {
        setUpNextCountdown(10);
        setShowUpNextOverlay(true);
      }
    } else if (remaining > creditsWindow + 6) {
      if (showUpNextOverlay) setShowUpNextOverlay(false);
      if (upNextDismissed) setUpNextDismissed(false);
    }
  }, [
    currentChannel,
    activeSeriesGroup,
    skipIntroDismissed,
    showSkipIntro,
    upNextDismissed,
    showUpNextOverlay
  ]);

  // Pular direto para o início dos créditos finais (ou exibir o card de Próximo Episódio na hora)
  const handleJumpToCredits = useCallback(() => {
    const video = videoRef.current;
    if (video && video.duration && isFinite(video.duration) && video.duration > 60) {
      video.currentTime = Math.max(0, video.duration - 48);
    }
    setUpNextDismissed(false);
    setUpNextCountdown(10);
    setShowUpNextOverlay(true);
  }, []);

  // Contagem regressiva automática de 10 segundos estilo Netflix nos créditos finais
  useEffect(() => {
    if (!showUpNextOverlay || upNextDismissed || !isPlayerOpen || !nextUpChannel) return;
    const timer = setInterval(() => {
      setUpNextCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setShowUpNextOverlay(false);
          handleStepChannel(1);
          return 10;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showUpNextOverlay, upNextDismissed, isPlayerOpen, nextUpChannel, handleStepChannel]);

  const handleQualityChange = (levelIndex) => {
    const idx = Number(levelIndex);
    setCurrentQuality(idx);
    if (hlsRef.current) {
      hlsRef.current.currentLevel = idx;
    }
  };

  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {}
  };

  const checkVisibleChannelsStatus = async () => {
    if (isCheckingBatch) {
      checkAbortRef.current = true;
      setIsCheckingBatch(false);
      return;
    }

    const targets = filteredChannels.filter((c) => !c.isCloudVod).slice(0, 36);
    if (targets.length === 0) return;

    checkAbortRef.current = false;
    setIsCheckingBatch(true);

    const concurrency = 6;
    let index = 0;

    const worker = async () => {
      while (index < targets.length && !checkAbortRef.current) {
        const currentIdx = index++;
        const ch = targets[currentIdx];
        if (!ch) continue;

        setChannelStatuses((prev) => ({
          ...prev,
          [ch.url]: { checking: true, online: prev[ch.url]?.online ?? null }
        }));

        try {
          const res = await fetch(`/api/check?url=${encodeURIComponent(ch.url)}`);
          const data = await res.json();
          setChannelStatuses((prev) => ({
            ...prev,
            [ch.url]: { checking: false, online: Boolean(data.online), status: data.status }
          }));
        } catch {
          setChannelStatuses((prev) => ({
            ...prev,
            [ch.url]: { checking: false, online: false }
          }));
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    setIsCheckingBatch(false);
  };

  const handleAddUrlPlaylist = async (e) => {
    e.preventDefault();
    if (!newListUrl.trim()) return;
    const name = newListName.trim() || 'Minha Lista M3U';
    setShowPlaylistModal(false);
    await loadPlaylistFromUrl(newListUrl.trim(), name);
    setNewListName('');
    setNewListUrl('');
  };

  const handleAddTextPlaylist = (e) => {
    e.preventDefault();
    if (!newListText.trim()) return;
    const parsed = parseM3U(newListText);
    if (parsed.length === 0) {
      alert('Nenhum canal válido encontrado no texto M3U colado.');
      return;
    }
    const grouped = groupSeriesIntoCatalog(parsed, false);
    const id = `custom_${Date.now()}`;
    const name = newListName.trim() || `Lista Colada (${grouped.length} títulos)`;
    setPlaylists((prev) => [{ id, name, url: '', count: grouped.length }, ...prev]);
    setActivePlaylistId(id);
    setRawChannels(parsed);
    setHeroChannel(grouped[0]);
    setSelectedCategory('Todos');
    setNewListName('');
    setNewListText('');
    setShowPlaylistModal(false);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result;
      if (typeof content === 'string') {
        const parsed = parseM3U(content);
        if (parsed.length === 0) {
          alert('O arquivo selecionado não contém canais M3U válidos.');
          return;
        }
        const grouped = groupSeriesIntoCatalog(parsed, false);
        const id = `file_${Date.now()}`;
        const name = file.name.replace(/\.(m3u8?|txt)$/i, '');
        setPlaylists((prev) => [{ id, name, url: '', count: grouped.length }, ...prev]);
        setActivePlaylistId(id);
        setRawChannels(parsed);
        setHeroChannel(grouped[0]);
        setSelectedCategory('Todos');
        setShowPlaylistModal(false);
      }
    };
    reader.readAsText(file);
  };

  const showNetflixRows =
    navSection === 'home' &&
    selectedCategory === 'Todos' &&
    searchQuery.trim() === '' &&
    !onlyOnlineFilter;

  const favoriteChannelsList = useMemo(() => {
    const favSet = new Set(favorites);
    return channels.filter((c) => favSet.has(c.url));
  }, [channels, favorites]);

  const deduplicatedHistory = useMemo(
    () => deduplicateHistory(history, channels),
    [history, channels]
  );

  const vodMoviesCount = useMemo(
    () => channels.filter((c) => c.isVod && !c.isSeriesGroup && !c.isAnime).length,
    [channels]
  );
  const vodSeriesCount = useMemo(
    () => channels.filter((c) => c.isSeriesGroup && !c.isAnime).length,
    [channels]
  );
  const animeCount = useMemo(
    () =>
      channels.filter(
        (c) =>
          c.isAnime ||
          /anime|tokusatsu|desenho|animaç/i.test(`${c.name} ${c.group || ''}`)
      ).length,
    [channels]
  );

  const SaaS = window.PobreFlixSaaS || {};
  const activeAvatar =
    SaaS.getAvatarInfo && activeProfile
      ? SaaS.getAvatarInfo(activeProfile.avatarId, saasConfig?.avatars)
      : { emoji: '😎', bg: 'linear-gradient(135deg, #e50914, #831010)' };

  if ((!authToken || !currentUser) && SaaS.AuthLandingScreen) {
    return (
      <SaaS.AuthLandingScreen
        saasConfig={saasConfig}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  // O login Master Administrativo tem acesso EXCLUSIVO ao Painel de Controle Master (NÃO acessa o streamer)
  const isMasterUser =
    currentUser &&
    (currentUser.role === 'admin' ||
      currentUser.id === 'usr_admin_master' ||
      String(currentUser.email || '').toLowerCase() === 'tecpro@gmail.com');

  if (isMasterUser && SaaS.AdminDashboardModal) {
    return (
      <SaaS.AdminDashboardModal
        isOpen={true}
        isStandalone={true}
        authToken={authToken}
        initialTab={adminInitialTab}
        onBannersUpdated={(allBanners, bannerSettings) => {
          setSaasConfig((prev) => ({
            ...(prev || {}),
            adBanners: (allBanners || []).filter((b) => b && b.active !== false && b.imageUrl),
            adBannerSettings: bannerSettings || prev?.adBannerSettings
          }));
        }}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div>
      {/* ==========================================
          CAMADAS SAAS: "QUEM ESTÁ ASSISTINDO?", LIMITE DE TELAS E PAINÉIS
         ========================================== */}
      {authToken &&
        currentUser &&
        (showProfilePicker || !activeProfile) &&
        SaaS.ProfilePickerOverlay && (
          <SaaS.ProfilePickerOverlay
            user={currentUser}
            authToken={authToken}
            saasConfig={saasConfig}
            activeProfile={activeProfile}
            onSelectProfile={handleSelectProfile}
            onClose={() => setShowProfilePicker(false)}
            onUserUpdated={(updatedUser) => {
              setCurrentUser(updatedUser);
              if (activeProfile) {
                const refreshed = (updatedUser.profiles || []).find(
                  (p) => p.id === activeProfile.id
                );
                if (refreshed) setActiveProfile(refreshed);
              }
            }}
            onOpenSubModal={() => setShowSubModal(true)}
            onOpenAdminModal={() => setShowAdminModal(true)}
            onLogout={handleLogout}
          />
        )}

      {authToken &&
        currentUser &&
        activeProfile &&
        screenBlockState &&
        SaaS.ScreenLimitOverlay && (
          <SaaS.ScreenLimitOverlay
            blockState={screenBlockState}
            user={currentUser}
            authToken={authToken}
            currentDeviceId={deviceIdentity.deviceId}
            onDisconnectDevice={handleDisconnectDevice}
            onOpenSubModal={() => setShowSubModal(true)}
            onRetryHeartbeat={sendScreenHeartbeat}
            onLogout={handleLogout}
          />
        )}

      {SaaS.SubscriptionAndScreensModal && (
        <SaaS.SubscriptionAndScreensModal
          isOpen={showSubModal}
          onClose={() => setShowSubModal(false)}
          user={currentUser}
          authToken={authToken}
          saasConfig={saasConfig}
          currentDeviceId={deviceIdentity.deviceId}
          onUserUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
            setScreenBlockState(null);
            setTimeout(() => sendScreenHeartbeat(), 200);
          }}
          onDisconnectDevice={handleDisconnectDevice}
        />
      )}

      {SaaS.AdminDashboardModal && (
        <SaaS.AdminDashboardModal
          isOpen={showAdminModal}
          onClose={() => setShowAdminModal(false)}
          authToken={authToken}
          initialTab={adminInitialTab}
          onBannersUpdated={(allBanners, bannerSettings) => {
            setSaasConfig((prev) => ({
              ...(prev || {}),
              adBanners: (allBanners || []).filter((b) => b && b.active !== false && b.imageUrl),
              adBannerSettings: bannerSettings || prev?.adBannerSettings
            }));
          }}
          onOpenProfilePicker={() => setShowProfilePicker(true)}
          onLogout={handleLogout}
        />
      )}

      {/* ==========================================
          NAVBAR POBREFLIX (ESTILO NETFLIX)
         ========================================== */}
      <header className="nf-navbar">
        <div className="nf-nav-left">
          <div
            className="pobreflix-logo"
            onClick={() => {
              setNavSection('home');
              setSelectedCategory('Todos');
              setSearchQuery('');
              setIsPlayerOpen(false);
            }}
            title="Voltar ao Início da PobreFlix"
          >
            <span className="pobreflix-wordmark">POBREFLIX</span>
            <span
              className="pobreflix-badge"
              style={
                activeProfile?.isKids
                  ? { background: 'linear-gradient(90deg, #ff007f, #00d4ff)' }
                  : undefined
              }
            >
              {activeProfile?.isKids ? 'KIDS' : 'SAAS VIP'}
            </span>
          </div>

          <nav className="nf-menu">
            <button
              className={`nf-menu-item ${navSection === 'home' && selectedCategory === 'Todos' ? 'active' : ''}`}
              onClick={() => {
                setNavSection('home');
                setSelectedCategory('Todos');
                setSearchQuery('');
              }}
            >
              Início
            </button>
            <button
              className={`nf-menu-item ${navSection === 'vod-movies' ? 'active' : ''}`}
              onClick={() => {
                setNavSection('vod-movies');
                setSelectedCategory('Todos');
              }}
            >
              🍿 Filmes
            </button>
            <button
              className={`nf-menu-item ${navSection === 'vod-series' ? 'active' : ''}`}
              onClick={() => {
                setNavSection('vod-series');
                setSelectedCategory('Todos');
              }}
            >
              📺 Séries
            </button>
            <button
              className={`nf-menu-item ${navSection === 'acao' ? 'active' : ''}`}
              onClick={() => {
                setNavSection('acao');
                setSelectedCategory('Todos');
              }}
            >
              💥 Ação
            </button>
            <button
              className={`nf-menu-item ${navSection === 'comedia' ? 'active' : ''}`}
              onClick={() => {
                setNavSection('comedia');
                setSelectedCategory('Todos');
              }}
            >
              😂 Comédia
            </button>
            <button
              className={`nf-menu-item ${navSection === 'aventura' ? 'active' : ''}`}
              onClick={() => {
                setNavSection('aventura');
                setSelectedCategory('Todos');
              }}
            >
              🗺️ Aventura
            </button>
            <button
              className={`nf-menu-item ${navSection === 'drama' ? 'active' : ''}`}
              onClick={() => {
                setNavSection('drama');
                setSelectedCategory('Todos');
              }}
            >
              🎭 Drama
            </button>
            <button
              className={`nf-menu-item ${navSection === 'terror' ? 'active' : ''}`}
              onClick={() => {
                setNavSection('terror');
                setSelectedCategory('Todos');
              }}
            >
              👻 Terror
            </button>
            <button
              className={`nf-menu-item ${navSection === 'kids' ? 'active' : ''}`}
              onClick={() => {
                setNavSection('kids');
                setSelectedCategory('Todos');
              }}
            >
              🎌 Animes & Kids
            </button>
            <button
              className={`nf-menu-item ${navSection === 'live' ? 'active' : ''}`}
              onClick={() => {
                setNavSection('live');
                setSelectedCategory('Todos');
              }}
            >
              📡 Canais Ao Vivo
            </button>
            <button
              className={`nf-menu-item ${navSection === 'mylist' ? 'active' : ''}`}
              onClick={() => {
                setNavSection('mylist');
                setSelectedCategory('Todos');
              }}
            >
              Minha Lista
            </button>
            {history.length > 0 && (
              <button
                className={`nf-menu-item ${navSection === 'history' ? 'active' : ''}`}
                onClick={() => {
                  setNavSection('history');
                  setSelectedCategory('Todos');
                }}
              >
                Continuar
              </button>
            )}
          </nav>
        </div>

        <div className="nf-nav-right">
          <div className="nf-search">
            <span className="nf-search-icon">🔍</span>
            <input
              type="text"
              className="nf-search-input"
              placeholder="Pesquisar QUALQUER Filme, Série ou Canal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button className="nf-search-clear" onClick={() => setSearchQuery('')}>
                ✕
              </button>
            )}
          </div>

          {currentUser && (
            <button
              className="nf-btn nf-btn-dark"
              style={{
                borderColor: 'rgba(70, 211, 105, 0.45)',
                color: '#46d369'
              }}
              onClick={() => setShowSubModal(true)}
              title="Gerenciador de Assinatura e Telas Conectadas"
            >
              📱 Telas ({currentUser.activeScreensCount || 1}/{currentUser.maxScreens || 1})
            </button>
          )}

          {currentUser?.role === 'admin' && (
            <button
              className="nf-btn nf-btn-red"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: '#000',
                fontWeight: 900
              }}
              onClick={() => setShowAdminModal(true)}
              title="Abrir Painel Admin SaaS (Clientes, Telas e Vouchers)"
            >
              👑 Admin
            </button>
          )}

          <div
            className="nf-profile-chip"
            onClick={(e) => {
              e.stopPropagation();
              setShowProfilePicker(true);
            }}
            title="Trocar de Perfil ou Sair da Conta (Logout)"
          >
            <div
              className="nf-profile-avatar"
              style={{
                background: activeAvatar.bg,
                width: '30px',
                height: '30px',
                fontSize: '16px'
              }}
            >
              {activeAvatar.emoji}
            </div>
            <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#fff' }}>
              {activeProfile ? activeProfile.name : 'Perfis'}
            </span>
          </div>
        </div>
      </header>

      {/* ==========================================
          CINEMA PLAYER DOCK (QUANDO ASSISTINDO)
         ========================================== */}
      {isPlayerOpen && currentChannel && (
        <section className="cinema-theater">
          <div className="cinema-stage">
            <div className="cinema-video-box">
              <div className="player-overlay-top">
                <div className="live-pill">
                  <span className="live-dot" />
                  <span>
                    {activeSeriesGroup
                      ? `📺 ${activeSeriesGroup.name} • T${
                          currentChannel.seasonNumber || 1
                        }:E${currentChannel.episodeNumber || 1}`
                      : currentChannel.isVod
                      ? '🍿 FILME SOB DEMANDA'
                      : '📡 CANAL AO VIVO'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px', pointerEvents: 'auto', flexWrap: 'wrap' }}>
                  {(currentChannel.isVod || activeSeriesGroup) && nextUpChannel && (
                    <div
                      className="live-pill"
                      style={{
                        cursor: 'pointer',
                        background: 'rgba(229, 9, 20, 0.85)',
                        borderColor: '#ff6b72'
                      }}
                      onClick={handleJumpToCredits}
                      title="Pular para os créditos finais e exibir o card de Próximo Episódio"
                    >
                      ⏭ Ir p/ Créditos (Próximo Ep)
                    </div>
                  )}
                  <div
                    className="live-pill"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setVideoRotation((r) => (r - 90) % 360)}
                    title="Girar orientação do vídeo em 90°"
                  >
                    🔄 Girar Tela {videoRotation !== 0 ? `(${videoRotation}°)` : ''}
                  </div>
                  <div
                    className="live-pill"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setIsPlayerOpen(false)}
                  >
                    ✕ Fechar Player
                  </div>
                </div>
              </div>

              {isCloudChannel ? (
                <iframe
                  key={`${currentChannel.url}_${cloudServer}`}
                  src={getCloudEmbedUrl(currentChannel, cloudServer)}
                  className="cinema-video"
                  style={{ border: 'none', width: '100%', height: '100%' }}
                  allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture"
                  title={currentChannel.name}
                />
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="cinema-video"
                    style={
                      videoRotation !== 0
                        ? {
                            transform: `rotate(${videoRotation}deg) scale(${
                              Math.abs(videoRotation) === 90 ||
                              Math.abs(videoRotation) === 270
                                ? 1.77
                                : 1
                            })`,
                            transition: 'transform 0.25s ease'
                          }
                        : undefined
                    }
                    controls
                    playsInline
                    autoPlay
                    onTimeUpdate={handleVideoTimeUpdate}
                    onEnded={() => {
                      if (activeSeriesGroup || currentChannel.isVod) {
                        setShowUpNextOverlay(false);
                        handleStepChannel(1);
                      }
                    }}
                  />

                  {/* BOTÃO ESTILO NETFLIX: PULAR ABERTURA */}
                  {showSkipIntro && !showUpNextOverlay && (
                    <button
                      type="button"
                      className="nf-skip-intro-btn"
                      onClick={() => {
                        seekRelative(65);
                        setSkipIntroDismissed(true);
                        setShowSkipIntro(false);
                      }}
                    >
                      ⏭ Pular Abertura
                    </button>
                  )}

                  {/* CARD FLUTUANTE ESTILO NETFLIX: "PRÓXIMO EPISÓDIO" LOGO QUE COMEÇAM OS CRÉDITOS */}
                  {showUpNextOverlay && !upNextDismissed && nextUpChannel && (
                    <div className="nf-upnext-credits-card">
                      <div className="nf-upnext-header">
                        <span>
                          🎬{' '}
                          {activeSeriesGroup || nextUpChannel.isSeriesEpisode
                            ? 'CRÉDITOS FINAIS • PRÓXIMO EPISÓDIO'
                            : 'CRÉDITOS FINAIS • A SEGUIR'}
                        </span>
                        <span className="nf-upnext-countdown-badge">
                          Em {upNextCountdown}s
                        </span>
                      </div>

                      <div className="nf-upnext-body">
                        <div className="nf-upnext-thumb">
                          <ChannelLogo
                            logo={nextUpChannel.logo || activeSeriesGroup?.logo || currentChannel.logo}
                            name={nextUpChannel.name}
                            isPoster={true}
                            className="modal-poster-cover"
                          />
                          {(activeSeriesGroup || nextUpChannel.isSeriesEpisode) && (
                            <span className="nf-upnext-thumb-badge">
                              T{nextUpChannel.seasonNumber || 1}:E
                              {String(nextUpChannel.episodeNumber || 2).padStart(2, '0')}
                            </span>
                          )}
                        </div>

                        <div style={{ flex: 1, overflow: 'hidden' }}>
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#aaa',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px'
                            }}
                          >
                            {activeSeriesGroup
                              ? activeSeriesGroup.name
                              : nextUpChannel.group || 'A Seguir na PobreFlix'}
                          </div>
                          <div
                            style={{
                              fontSize: '14px',
                              fontWeight: 900,
                              color: '#fff',
                              marginTop: '2px',
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                          >
                            {activeSeriesGroup || nextUpChannel.isSeriesEpisode
                              ? `Ep. ${String(nextUpChannel.episodeNumber || 2).padStart(
                                  2,
                                  '0'
                                )} — ${nextUpChannel.episodeTitle || nextUpChannel.name}`
                              : nextUpChannel.name}
                          </div>
                          <div
                            style={{
                              fontSize: '11.5px',
                              color: '#46d369',
                              fontWeight: 700,
                              marginTop: '2px'
                            }}
                          >
                            Iniciando automaticamente em {upNextCountdown} segundos...
                          </div>
                        </div>
                      </div>

                      <div className="nf-upnext-actions">
                        <button
                          type="button"
                          className="nf-btn-upnext-play"
                          onClick={() => {
                            setShowUpNextOverlay(false);
                            handleStepChannel(1);
                          }}
                        >
                          <div
                            className="nf-btn-upnext-progress"
                            style={{
                              width: `${Math.min(
                                100,
                                Math.max(0, ((10 - upNextCountdown) / 10) * 100)
                              )}%`
                            }}
                          />
                          <span className="nf-btn-upnext-label">
                            ▶{' '}
                            {activeSeriesGroup || nextUpChannel.isSeriesEpisode
                              ? `Próximo Episódio (${upNextCountdown}s)`
                              : `Assistir Próximo (${upNextCountdown}s)`}
                          </span>
                        </button>

                        <button
                          type="button"
                          className="nf-btn-upnext-cancel"
                          onClick={() => {
                            setUpNextDismissed(true);
                            setShowUpNextOverlay(false);
                          }}
                        >
                          Assistir Créditos
                        </button>
                      </div>
                    </div>
                  )}

                  {playerState === 'loading' && (
                    <div className="player-state-overlay">
                      <div className="spinner" />
                      <div style={{ fontWeight: 800, fontSize: '17px' }}>
                        Carregando {currentChannel.name}...
                      </div>
                      <div style={{ fontSize: '12.5px', color: '#b3b3b3' }}>
                        {currentChannel.isVod
                          ? 'Iniciando vídeo sob demanda a partir do minuto 00:00...'
                          : 'Conectando transmissão ao vivo...'}
                      </div>
                    </div>
                  )}

                  {playerState === 'error' && (
                    <div className="player-state-overlay">
                      <div className="error-card">
                        <div style={{ fontSize: '34px' }}>📡</div>
                        <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                          Servidor Indisponível Neste Título
                        </h3>
                        <p style={{ fontSize: '13px', color: '#b3b3b3', lineHeight: 1.5 }}>
                          {playerErrorDetails}
                        </p>
                        <div
                          style={{
                            display: 'flex',
                            gap: '10px',
                            flexWrap: 'wrap',
                            justifyContent: 'center',
                            marginTop: '6px'
                          }}
                        >
                          <button
                            className="nf-btn nf-btn-red"
                            onClick={() => startPlayback(currentChannel)}
                          >
                            🔄 Tentar Novamente
                          </button>
                          <button
                            className="nf-btn nf-btn-dark"
                            onClick={() => handleStepChannel(1)}
                          >
                            ⏭ Próximo Título
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Gaveta Lateral: Todos os Episódios da Série ou Canais Relacionados */}
            <aside className="cinema-side-list">
              <div className="cinema-side-header">
                <span>
                  {activeSeriesGroup
                    ? `🎬 Episódios: ${activeSeriesGroup.name}`
                    : `📺 Zapear: ${currentChannel.group || 'Catálogo'}`}
                </span>
                <span>{sideDrawerItems.length} itens</span>
              </div>
              <div className="cinema-side-items">
                {sideDrawerItems.map((ch, idx) => (
                  <div
                    key={ch.id || idx}
                    className={`cinema-side-item ${
                      currentChannel.url === ch.url ? 'active' : ''
                    }`}
                    onClick={() => handleSelectChannel(ch, activeSeriesGroup)}
                  >
                    <div
                      style={{
                        width: '46px',
                        height: '32px',
                        background: '#1c1c1c',
                        borderRadius: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '3px',
                        overflow: 'hidden',
                        flexShrink: 0,
                        fontWeight: 800,
                        fontSize: '10.5px',
                        color: '#e50914'
                      }}
                    >
                      {activeSeriesGroup ? (
                        `T${ch.seasonNumber || 1}:E${String(
                          ch.episodeNumber || idx + 1
                        ).padStart(2, '0')}`
                      ) : (
                        <ChannelLogo
                          logo={ch.logo}
                          name={ch.name}
                          className="channel-logo-img"
                        />
                      )}
                    </div>
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        {activeSeriesGroup
                          ? `Ep. ${String(ch.episodeNumber || idx + 1).padStart(
                              2,
                              '0'
                            )} — ${ch.episodeTitle || ch.name}`
                          : ch.name}
                      </div>
                      <div style={{ fontSize: '10.5px', color: '#888' }}>
                        {activeSeriesGroup
                          ? `Temporada ${ch.seasonNumber || 1}`
                          : ch.group}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          {/* Barra de Controles do Cinema Player */}
          <div className="cinema-bar">
            <div className="cinema-now-playing">
              <div
                style={{
                  width: '48px',
                  height: '36px',
                  background: '#222',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '4px',
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                <ChannelLogo logo={currentChannel.logo} name={currentChannel.name} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: '16px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span>{currentChannel.name}</span>
                  <span className="nf-quality-pill">
                    {currentChannel.isVod ? 'VOD 00:00' : currentChannel.quality || 'HD'}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#aaa' }}>
                  {activeSeriesGroup ? (
                    <>
                      Série: <strong>{activeSeriesGroup.name}</strong> • Temporada{' '}
                      {currentChannel.seasonNumber || 1}, Episódio{' '}
                      {currentChannel.episodeNumber || 1}
                    </>
                  ) : (
                    <>
                      Categoria: <strong>{currentChannel.group}</strong>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="cinema-controls">
              {isCloudChannel && (
                <select
                  className="nf-select"
                  value={cloudServer}
                  onChange={(e) => setCloudServer(e.target.value)}
                  title="Trocar Servidor Cloud caso um esteja lento"
                >
                  <option value="vidsrc_to">🌩️ Servidor 1: Cloud HD (VidSrc.to)</option>
                  <option value="vidsrc_sh">🌩️ Servidor 2: Cloud Pro (VidSrc.sh)</option>
                  <option value="multiembed">🌩️ Servidor 3: MultiEmbed VIP</option>
                </select>
              )}

              {!isCloudChannel && currentChannel.isVod && (
                <>
                  <button
                    className="nf-btn nf-btn-dark"
                    onClick={() => seekRelative(-15)}
                    title="Voltar 15 segundos"
                  >
                    ⏪ -15s
                  </button>
                  <button
                    className="nf-btn nf-btn-dark"
                    onClick={() => seekRelative(15)}
                    title="Avançar 15 segundos"
                  >
                    ⏩ +15s
                  </button>
                </>
              )}

              <button
                className="nf-btn nf-btn-dark"
                onClick={() => handleStepChannel(-1)}
              >
                ⏮ {activeSeriesGroup ? 'Ep. Anterior' : 'Anterior'}
              </button>
              <button
                className="nf-btn nf-btn-dark"
                onClick={() => handleStepChannel(1)}
              >
                ⏭ {activeSeriesGroup ? 'Próximo Ep.' : 'Próximo'}
              </button>

              {activeSeriesGroup && (
                <button
                  className="nf-btn nf-btn-red"
                  onClick={() => handleOpenEpisodesModal(activeSeriesGroup)}
                >
                  📋 Temporadas & Episódios ({activeSeriesGroup.episodes.length})
                </button>
              )}

              <button
                className={`nf-btn nf-btn-dark ${
                  favorites.includes(currentChannel.url) ? 'nf-btn-active' : ''
                }`}
                onClick={(e) => toggleFavorite(currentChannel.url, e)}
              >
                {favorites.includes(currentChannel.url)
                  ? '★ Na Minha Lista'
                  : '＋ Minha Lista'}
              </button>

              <button
                className="nf-btn nf-btn-dark"
                onClick={() => handleDownloadTitle(currentChannel)}
                title="Baixar este vídeo em MP4 no computador para assistir offline"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#46d369' }}
              >
                ⬇️ Baixar MP4
              </button>

              <button
                className="nf-btn nf-btn-dark"
                onClick={() => setIsPlayerOpen(false)}
              >
                ✕ Fechar
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ==========================================
          HERO BILLBOARD (DESTAQUE ESTILO NETFLIX + CARROSSEL DE ANÚNCIOS DE FUNDO)
         ========================================== */}
      {!isPlayerOpen && heroChannel && (
        <section className="nf-hero">
          {/* CAMADA DE FUNDO: CARROSSEL DE BANNERS DE ANÚNCIO ENVIADOS PELO PAINEL MASTER */}
          {activeAdBanners.length > 0 && (
            <div className="nf-hero-ad-carousel-bg">
              {activeAdBanners.map((bnr, idx) => {
                const currentIdx = adSlideIndex % activeAdBanners.length;
                const isActiveSlide = idx === currentIdx;
                const bgOpacity = saasConfig?.adBannerSettings?.backgroundOpacity ?? 0.62;
                return (
                  <div
                    key={bnr.id || idx}
                    className={`nf-hero-ad-slide ${isActiveSlide ? 'active' : ''}`}
                    style={{
                      backgroundImage: `url(${bnr.imageUrl})`,
                      opacity: isActiveSlide ? bgOpacity : 0
                    }}
                  />
                );
              })}
              <div className="nf-hero-ad-vignette" />
            </div>
          )}

          <div className="nf-hero-content">
            <div className="nf-hero-n-series">
              <span className="nf-p-letter">P</span>
              <span>
                {heroChannel.isSeriesGroup
                  ? 'SÉRIE COMPLETA POBREFLIX • TODAS AS TEMPORADAS'
                  : heroChannel.isVod
                  ? 'FILME COMPLETO SOB DEMANDA (COMEÇA DO 00:00)'
                  : 'CANAL AO VIVO 24H • SEM MENSALIDADE'}
              </span>
            </div>

            <h1 className="nf-hero-title">{heroChannel.name}</h1>

            <div className="nf-hero-meta">
              <span className="nf-match-score">99% relevante para seu bolso</span>
              <span>2026</span>
              <span className="nf-age-box">VIP 0800</span>
              <span className="nf-hd-box">
                {heroChannel.isSeriesGroup
                  ? 'SÉRIE • TEMPORADAS'
                  : heroChannel.isVod
                  ? 'VOD • 00:00'
                  : heroChannel.quality || 'HD'}
              </span>
              <span style={{ color: '#e50914' }}>• {heroChannel.group}</span>
            </div>

            <p className="nf-hero-desc">{getSmartDescription(heroChannel)}</p>

            <div className="nf-hero-buttons">
              <button
                className="nf-btn nf-btn-white"
                onClick={() =>
                  heroChannel.isSeriesGroup
                    ? handleOpenEpisodesModal(heroChannel)
                    : handleSelectChannel(heroChannel)
                }
              >
                ▶{' '}
                {heroChannel.isSeriesGroup
                  ? 'Escolher Temporada & Episódio'
                  : 'Assistir Agora'}
              </button>

              <button
                className="nf-btn nf-btn-glass"
                onClick={(e) => toggleFavorite(heroChannel.url, e)}
              >
                {favorites.includes(heroChannel.url)
                  ? '✓ Na Minha Lista'
                  : '➕ Minha Lista'}
              </button>

              <button
                className="nf-btn nf-btn-dark"
                style={{ padding: '11px 16px' }}
                onClick={pickRandomHighlight}
                title="Sortear outro destaque do catálogo"
              >
                🎲 Surpreenda-me
              </button>

              {currentUser?.role === 'admin' && (
                <button
                  className="nf-btn nf-btn-dark"
                  style={{
                    padding: '11px 14px',
                    borderColor: 'rgba(251, 191, 36, 0.55)',
                    color: '#fbbf24'
                  }}
                  onClick={() => {
                    setAdminInitialTab('banners');
                    setShowAdminModal(true);
                  }}
                  title="Subir ou gerenciar banners de anúncio em carrossel no fundo desta tela"
                >
                  🖼️ Banners de Fundo (Master)
                </button>
              )}
            </div>

            {/* BARRA FLUTUANTE DO CARROSSEL DE ANÚNCIO DE FUNDO */}
            {activeAdBanners.length > 0 && (() => {
              const currentAd = activeAdBanners[adSlideIndex % activeAdBanners.length];
              if (!currentAd) return null;
              return (
                <div className="nf-hero-ad-banner-bar">
                  <div className="nf-hero-ad-info">
                    <span className="nf-hero-ad-badge">
                      📢 {currentAd.badge || 'ANÚNCIO PATROCINADO'}
                    </span>
                    {currentAd.title && (
                      <span className="nf-hero-ad-title">{currentAd.title}</span>
                    )}
                    {currentAd.subtitle && (
                      <span className="nf-hero-ad-subtitle">— {currentAd.subtitle}</span>
                    )}
                  </div>

                  <div className="nf-hero-ad-controls">
                    {currentAd.linkUrl && (
                      <button
                        type="button"
                        className="nf-hero-ad-cta"
                        onClick={() => {
                          if (currentAd.linkUrl === '#open_plans') {
                            setShowSubModal(true);
                          } else {
                            window.open(currentAd.linkUrl, '_blank', 'noopener,noreferrer');
                          }
                        }}
                      >
                        {currentAd.ctaText || 'Saiba Mais'} ↗
                      </button>
                    )}

                    {activeAdBanners.length > 1 && (
                      <div className="nf-hero-ad-dots-wrap">
                        <button
                          type="button"
                          className="nf-hero-ad-nav-btn"
                          onClick={() =>
                            setAdSlideIndex(
                              (prev) => (prev - 1 + activeAdBanners.length) % activeAdBanners.length
                            )
                          }
                          title="Banner Anterior"
                        >
                          ‹
                        </button>
                        <div className="nf-hero-ad-dots">
                          {activeAdBanners.map((b, i) => (
                            <span
                              key={b.id || i}
                              className={`nf-hero-ad-dot ${
                                i === adSlideIndex % activeAdBanners.length ? 'active' : ''
                              }`}
                              onClick={() => setAdSlideIndex(i)}
                              title={b.title || `Banner #${i + 1}`}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          className="nf-hero-ad-nav-btn"
                          onClick={() =>
                            setAdSlideIndex((prev) => (prev + 1) % activeAdBanners.length)
                          }
                          title="Próximo Banner"
                        >
                          ›
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>

          <div
            className={`nf-hero-poster-showcase ${
              heroChannel.isVod || heroChannel.isSeriesGroup ? 'is-poster' : ''
            }`}
            onClick={() =>
              heroChannel.isSeriesGroup
                ? handleOpenEpisodesModal(heroChannel)
                : handleSelectChannel(heroChannel)
            }
            style={{ cursor: 'pointer' }}
            title={`Clique para abrir ${heroChannel.name}`}
          >
            <ChannelLogo
              logo={heroChannel.logo}
              name={heroChannel.name}
              isPoster={Boolean(heroChannel.isVod || heroChannel.isSeriesGroup)}
            />
          </div>
        </section>
      )}

      {/* ==========================================
          BARRA DE PÍLULAS DE CATEGORIAS & GÊNEROS
         ========================================== */}
      <div className="nf-filter-strip">
        <div className="nf-category-pills">
          {categories.map((cat) => (
            <button
              key={cat.id || cat.name}
              className={`nf-pill ${selectedCategory === cat.name ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat.name)}
            >
              {cat.emoji} {cat.name} ({cat.count.toLocaleString('pt-BR')})
            </button>
          ))}
        </div>
      </div>

      {loadingPlaylist && (
        <div style={{ padding: '80px 20px', textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: '18px' }}>Preparando o catálogo da PobreFlix...</h3>
        </div>
      )}

      {playlistError && (
        <div style={{ padding: '40px', textAlign: 'center', color: '#ff6b72' }}>
          <p>⚠️ {playlistError}</p>
        </div>
      )}

      {/* ==========================================
          TRILHOS HORIZONTAIS ESTILO NETFLIX
         ========================================== */}
      {!loadingPlaylist && showNetflixRows && (
        <div className="nf-catalog-container">
          {favoriteChannelsList.length > 0 && (
            <CatalogRow
              title="⭐ Minha Lista PobreFlix"
              channels={favoriteChannelsList}
              currentChannel={currentChannel}
              favorites={favorites}
              channelStatuses={channelStatuses}
              onSelectChannel={handleSelectChannel}
              onOpenEpisodes={handleOpenEpisodesModal}
              onToggleFavorite={toggleFavorite}
              onExploreCategory={() => setNavSection('mylist')}
            />
          )}

          {deduplicatedHistory.length > 0 && (
            <CatalogRow
              title="🕒 Continuar Assistindo"
              channels={deduplicatedHistory}
              currentChannel={currentChannel}
              favorites={favorites}
              channelStatuses={channelStatuses}
              onSelectChannel={handleSelectChannel}
              onOpenEpisodes={handleOpenEpisodesModal}
              onToggleFavorite={toggleFavorite}
              onExploreCategory={() => setNavSection('history')}
            />
          )}

          {catalogRows.map((row) => (
            <CatalogRow
              key={row.id}
              title={row.title}
              channels={row.items}
              isTop10={row.isTop10}
              isSequence={row.isSequence}
              currentChannel={currentChannel}
              favorites={favorites}
              channelStatuses={channelStatuses}
              onSelectChannel={handleSelectChannel}
              onOpenEpisodes={handleOpenEpisodesModal}
              onToggleFavorite={toggleFavorite}
              onExploreCategory={
                row.navTarget ? () => setNavSection(row.navTarget) : undefined
              }
            />
          ))}
        </div>
      )}

      {/* ==========================================
          GRADE COMPLETA DO CATÁLOGO + BUSCA GLOBAL IMDB
         ========================================== */}
      {!loadingPlaylist && (
        <section className="nf-grid-section">
          <div className="nf-grid-header">
            <h2 className="nf-grid-title">
              {searchQuery
                ? `🔍 Resultados para "${searchQuery}" ${
                    isSearchingGlobal ? '(Buscando em todo o IMDb...)' : ''
                  }`
                : selectedCategory !== 'Todos'
                ? `📂 Categoria: ${selectedCategory}`
                : navSection === 'vod-series'
                ? '📺 Todas as Séries (Temporadas & Episódios)'
                : navSection === 'vod-movies'
                ? '🍿 Todos os Filmes Sob Demanda'
                : navSection === 'acao'
                ? '💥 Filmes e Séries de Ação'
                : navSection === 'comedia'
                ? '😂 Filmes e Séries de Comédia'
                : navSection === 'aventura'
                ? '🗺️ Filmes e Séries de Aventura'
                : navSection === 'drama'
                ? '🎭 Filmes e Séries de Drama'
                : navSection === 'terror'
                ? '👻 Filmes e Séries de Terror'
                : navSection === 'kids'
                ? '🍥 Animes, Desenhos & Kids'
                : navSection === 'live'
                ? '📡 Canais Ao Vivo'
                : navSection === 'mylist'
                ? '⭐ Minha Lista'
                : navSection === 'history'
                ? '🕒 Histórico — Continuar Assistindo'
                : '🎬 Explorar Catálogo Completo (A-Z)'}
              <span
                style={{
                  fontSize: '14px',
                  color: '#888',
                  marginLeft: '10px',
                  fontWeight: 600
                }}
              >
                ({filteredChannels.length} títulos)
              </span>
            </h2>

            {(selectedCategory !== 'Todos' || searchQuery || navSection !== 'home') && (
              <button
                className="nf-btn nf-btn-dark"
                onClick={() => {
                  setNavSection('home');
                  setSelectedCategory('Todos');
                  setSearchQuery('');
                }}
              >
                ← Voltar aos Trilhos da PobreFlix
              </button>
            )}
          </div>

          {displayedChannels.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: '#888' }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>🍿</div>
              <p>
                {isSearchingGlobal
                  ? 'Buscando no catálogo global...'
                  : 'Nenhum título encontrado para este filtro.'}
              </p>
            </div>
          ) : (
            <>
              <div className="nf-catalog-grid">
                {displayedChannels.map((ch) => (
                  <PobreFlixCard
                    key={ch.id}
                    channel={ch}
                    isPlaying={currentChannel?.url === ch.url}
                    isFav={favorites.includes(ch.url)}
                    statusInfo={channelStatuses[ch.url]}
                    onSelect={handleSelectChannel}
                    onOpenEpisodes={handleOpenEpisodesModal}
                    onToggleFav={toggleFavorite}
                  />
                ))}
              </div>

              {visibleLimit < filteredChannels.length && (
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                  <button
                    className="nf-btn nf-btn-red"
                    style={{ padding: '12px 28px', fontSize: '15px' }}
                    onClick={() => setVisibleLimit((prev) => prev + 120)}
                  >
                    Carregar Mais Títulos ({filteredChannels.length - visibleLimit} restantes)
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      )}

      {/* ==========================================
          PÁGINA / MODAL DE SÉRIE ESTILO NETFLIX (TEMPORADAS & EPISÓDIOS)
         ========================================== */}
      {seriesModalItem && (
        <div className="modal-backdrop" onClick={() => setSeriesModalItem(null)}>
          <div
            className="modal-card"
            style={{ maxWidth: '860px', background: '#141414' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                padding: '28px 28px 22px',
                background:
                  'radial-gradient(circle at 85% 25%, rgba(229, 9, 20, 0.28) 0%, transparent 60%), linear-gradient(180deg, #1f1f1f 0%, #141414 100%)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '24px',
                position: 'relative'
              }}
            >
              <button
                className="nf-btn nf-btn-dark"
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  borderRadius: '50%',
                  width: '36px',
                  height: '36px',
                  padding: 0
                }}
                onClick={() => setSeriesModalItem(null)}
              >
                ✕
              </button>

              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: '11.5px',
                    color: '#e50914',
                    fontWeight: 800,
                    letterSpacing: '2px',
                    marginBottom: '6px'
                  }}
                >
                  P SÉRIE POBREFLIX • SOB DEMANDA
                </div>
                <h2 style={{ fontSize: '30px', fontWeight: 900, lineHeight: 1.1 }}>
                  {seriesModalItem.name}
                </h2>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    marginTop: '10px',
                    fontSize: '13px',
                    fontWeight: 700,
                    flexWrap: 'wrap'
                  }}
                >
                  <span style={{ color: '#46d369' }}>99% relevante</span>
                  <span>
                    {seriesModalItem.seasonsCount || 1}{' '}
                    {(seriesModalItem.seasonsCount || 1) === 1
                      ? 'Temporada'
                      : 'Temporadas'}
                  </span>
                  {seriesModalItem.episodes?.length > 0 && (
                    <span className="nf-age-box">
                      {seriesModalItem.episodes.length} Episódios
                    </span>
                  )}
                  <span className="nf-hd-box">HD • 00:00 VOD</span>
                </div>

                <p
                  style={{
                    fontSize: '13.5px',
                    color: '#ccc',
                    marginTop: '10px',
                    lineHeight: 1.45,
                    maxHeight: '80px',
                    overflowY: 'auto'
                  }}
                >
                  {getSmartDescription(seriesModalItem)}
                </p>

                {seriesModalItem.episodes?.length > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '10px',
                      marginTop: '16px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <button
                      className="nf-btn nf-btn-white"
                      style={{ padding: '9px 20px', fontSize: '14px' }}
                      onClick={() =>
                        handleSelectChannel(
                          seriesModalItem.episodes[0],
                          seriesModalItem
                        )
                      }
                    >
                      ▶ Assistir T1:E01
                    </button>
                    <button
                      className="nf-btn nf-btn-dark"
                      onClick={(e) => toggleFavorite(seriesModalItem.url, e)}
                    >
                      {favorites.includes(seriesModalItem.url)
                        ? '★ Na Minha Lista'
                        : '＋ Minha Lista'}
                    </button>
                  </div>
                )}
              </div>

              <div
                style={{
                  width: '126px',
                  height: '184px',
                  background: '#101218',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  overflow: 'hidden',
                  flexShrink: 0,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.65)'
                }}
              >
                <ChannelLogo
                  logo={seriesModalItem.logo}
                  name={seriesModalItem.name}
                  isPoster={true}
                  className="modal-poster-cover"
                />
              </div>
            </div>

            <div className="modal-body" style={{ paddingTop: '18px' }}>
              {loadingSeriesEpisodes ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }} />
                  <div>Carregando todas as temporadas e episódios de {seriesModalItem.name}...</div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                      paddingBottom: '10px',
                      borderBottom: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <h3 style={{ fontSize: '20px', fontWeight: 800 }}>Episódios</h3>
                      <span style={{ fontSize: '13px', color: '#999' }}>
                        Temporada {selectedSeason}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <input
                        type="text"
                        className="nf-search-input"
                        style={{ width: '190px', padding: '7px 12px' }}
                        placeholder="Buscar episódio..."
                        value={episodeSearch}
                        onChange={(e) => setEpisodeSearch(e.target.value)}
                      />

                      {(() => {
                        const seasons = Array.from(
                          new Set(
                            (seriesModalItem.episodes || []).map(
                              (e) => e.seasonNumber || 1
                            )
                          )
                        ).sort((a, b) => a - b);

                        return (
                          <select
                            className="nf-select"
                            style={{
                              fontSize: '14px',
                              padding: '8px 14px',
                              background: '#242424',
                              borderColor: 'rgba(255,255,255,0.3)'
                            }}
                            value={selectedSeason}
                            onChange={(e) => setSelectedSeason(Number(e.target.value))}
                          >
                            {seasons.map((s) => {
                              const countInS = (seriesModalItem.episodes || []).filter(
                                (ep) => (ep.seasonNumber || 1) === s
                              ).length;
                              return (
                                <option key={s} value={s}>
                                  Temporada {s} ({countInS} episódios)
                                </option>
                              );
                            })}
                          </select>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Lista de Episódios Estilo Netflix */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px',
                      maxHeight: '52vh',
                      overflowY: 'auto',
                      paddingRight: '6px'
                    }}
                  >
                    {(seriesModalItem.episodes || [])
                      .filter((ep) => {
                        if (episodeSearch.trim() !== '') {
                          const q = episodeSearch.toLowerCase();
                          return (
                            ep.name.toLowerCase().includes(q) ||
                            (ep.episodeTitle &&
                              ep.episodeTitle.toLowerCase().includes(q))
                          );
                        }
                        return (ep.seasonNumber || 1) === selectedSeason;
                      })
                      .map((ep, idx) => {
                        const isWatched = history.some((h) => h.url === ep.url);
                        const isNowPlaying = currentChannel?.url === ep.url;

                        return (
                          <div
                            key={ep.id || idx}
                            onClick={() => handleSelectChannel(ep, seriesModalItem)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '16px',
                              padding: '14px 16px',
                              borderRadius: '8px',
                              background: isNowPlaying
                                ? 'rgba(229, 9, 20, 0.16)'
                                : '#1f1f1f',
                              border: isNowPlaying
                                ? '1px solid #e50914'
                                : '1px solid rgba(255,255,255,0.07)',
                              cursor: 'pointer',
                              transition: 'background 0.15s'
                            }}
                          >
                            <div
                              style={{
                                fontSize: '22px',
                                fontWeight: 800,
                                color: isNowPlaying ? '#e50914' : '#888',
                                width: '32px',
                                textAlign: 'center',
                                flexShrink: 0
                              }}
                            >
                              {ep.episodeNumber || idx + 1}
                            </div>

                            <div
                              style={{
                                width: '125px',
                                height: '72px',
                                background: '#121212',
                                borderRadius: '6px',
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                overflow: 'hidden',
                                flexShrink: 0,
                                border: '1px solid rgba(255,255,255,0.1)'
                              }}
                            >
                              <ChannelLogo
                                logo={ep.logo || seriesModalItem.logo}
                                name={seriesModalItem.name}
                                isPoster={true}
                                className="modal-poster-cover"
                              />
                              <div
                                style={{
                                  position: 'absolute',
                                  inset: 0,
                                  background: 'rgba(0,0,0,0.35)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center'
                                }}
                              >
                                <div
                                  style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: 'rgba(0,0,0,0.75)',
                                    border: '2px solid #fff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '12px'
                                  }}
                                >
                                  ▶
                                </div>
                              </div>
                              {isWatched && (
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: 0,
                                    left: 0,
                                    right: 0,
                                    height: '3px',
                                    background: '#e50914'
                                  }}
                                />
                              )}
                            </div>

                            <div style={{ flex: 1, overflow: 'hidden' }}>
                              <div
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: '10px'
                                }}
                              >
                                <div
                                  style={{
                                    fontWeight: 800,
                                    fontSize: '15px',
                                    color: '#fff',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  Episódio {ep.episodeNumber || idx + 1} —{' '}
                                  {ep.episodeTitle || ep.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                  <span
                                    style={{
                                      fontSize: '12px',
                                      color: '#aaa',
                                      whiteSpace: 'nowrap',
                                      fontWeight: 600
                                    }}
                                  >
                                    {ep.runtime || 24} min
                                  </span>
                                  <button
                                    type="button"
                                    className="nf-btn nf-btn-dark"
                                    style={{
                                      padding: '3px 8px',
                                      fontSize: '11px',
                                      borderRadius: '4px',
                                      border: '1px solid rgba(255,255,255,0.15)',
                                      color: '#46d369'
                                    }}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDownloadTitle(ep);
                                    }}
                                    title="Baixar este episódio em MP4 para assistir offline"
                                  >
                                    ⬇️ Baixar
                                  </button>
                                </div>
                              </div>

                              <div
                                style={{
                                  fontSize: '12.5px',
                                  color: '#999',
                                  marginTop: '4px',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap'
                                }}
                              >
                                {ep.summary ||
                                  `Temporada ${ep.seasonNumber || 1} • Episódio ${
                                    ep.episodeNumber || idx + 1
                                  } • Começa do 00:00`}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL DE ADICIONAR / GERENCIAR LISTAS M3U
         ========================================== */}
      {showPlaylistModal && (
        <div className="modal-backdrop" onClick={() => setShowPlaylistModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 style={{ fontSize: '18px', fontWeight: 800 }}>
                🍿 Gerenciar Catálogos M3U na PobreFlix
              </h2>
              <button
                className="nf-btn nf-btn-dark"
                onClick={() => setShowPlaylistModal(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className={`nf-btn ${modalTab === 'url' ? 'nf-btn-red' : 'nf-btn-dark'}`}
                  style={{ flex: 1 }}
                  onClick={() => setModalTab('url')}
                >
                  🌐 Link URL / Gist
                </button>
                <button
                  className={`nf-btn ${modalTab === 'file' ? 'nf-btn-red' : 'nf-btn-dark'}`}
                  style={{ flex: 1 }}
                  onClick={() => setModalTab('file')}
                >
                  📁 Arquivo .M3U
                </button>
                <button
                  className={`nf-btn ${modalTab === 'text' ? 'nf-btn-red' : 'nf-btn-dark'}`}
                  style={{ flex: 1 }}
                  onClick={() => setModalTab('text')}
                >
                  📋 Colar Texto
                </button>
              </div>

              {modalTab === 'url' && (
                <form onSubmit={handleAddUrlPlaylist} className="form-group">
                  <label className="form-label">Nome do Catálogo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Meus Filmes & Canais"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                  />
                  <label className="form-label" style={{ marginTop: '8px' }}>
                    URL da Lista (.m3u, .m3u8 ou link do GitHub Gist)
                  </label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://exemplo.com/lista.m3u"
                    value={newListUrl}
                    onChange={(e) => setNewListUrl(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="nf-btn nf-btn-red"
                    style={{ marginTop: '12px', padding: '11px' }}
                  >
                    🚀 Carregar no Catálogo PobreFlix
                  </button>
                </form>
              )}

              {modalTab === 'file' && (
                <div className="form-group">
                  <label className="file-dropzone">
                    <input
                      type="file"
                      accept=".m3u,.m3u8,.txt"
                      style={{ display: 'none' }}
                      onChange={handleFileUpload}
                    />
                    <div style={{ fontSize: '32px', marginBottom: '8px' }}>📂</div>
                    <div style={{ fontWeight: 700 }}>
                      Clique para escolher um arquivo .m3u ou .m3u8 do computador
                    </div>
                  </label>
                </div>
              )}

              {modalTab === 'text' && (
                <form onSubmit={handleAddTextPlaylist} className="form-group">
                  <label className="form-label">Nome do Catálogo</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ex: Lista Personalizada"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                  />
                  <label className="form-label" style={{ marginTop: '8px' }}>
                    Cole o conteúdo #EXTM3U abaixo
                  </label>
                  <textarea
                    rows={5}
                    className="form-textarea"
                    placeholder={
                      '#EXTM3U\n#EXTINF:-1 tvg-logo="" group-title="Filmes",Meu Filme\nhttps://...'
                    }
                    value={newListText}
                    onChange={(e) => setNewListText(e.target.value)}
                    required
                  />
                  <button
                    type="submit"
                    className="nf-btn nf-btn-red"
                    style={{ marginTop: '12px', padding: '11px' }}
                  >
                    🚀 Importar Texto M3U
                  </button>
                </form>
              )}

              <div
                style={{
                  borderTop: '1px solid rgba(255,255,255,0.1)',
                  paddingTop: '14px'
                }}
              >
                <div className="form-label" style={{ marginBottom: '10px' }}>
                  Catálogos Disponíveis ({playlists.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {playlists.map((p) => (
                    <div key={p.id} className="saved-playlist-item">
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontWeight: 700, fontSize: '13px' }}>{p.name}</div>
                        <div
                          style={{
                            fontSize: '11px',
                            color: '#888',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {p.url || 'Arquivo Local'}
                        </div>
                      </div>
                      {p.url && (
                        <button
                          className="nf-btn nf-btn-red"
                          style={{ padding: '6px 12px', fontSize: '12px' }}
                          onClick={() => {
                            setShowPlaylistModal(false);
                            loadPlaylistFromUrl(p.url, p.name, p.id, false);
                          }}
                        >
                          Abrir
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
