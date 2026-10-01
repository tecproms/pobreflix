const fs = require('fs');
const https = require('https');
const path = require('path');

function fetchJson(url) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'PobreFlixCatalogBuilder/3.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve);
      }
      if (res.statusCode !== 200) {
        return resolve(null);
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        try {
          const buffer = Buffer.concat(chunks);
          resolve(JSON.parse(buffer.toString('utf8')));
        } catch {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mapMovieCategory(genres) {
  const gStr = (Array.isArray(genres) ? genres.join(' ') : String(genres || '')).toLowerCase();
  if (/animation|family|comedy|adventure/i.test(gStr) && /animation|family|disney/i.test(gStr)) {
    return 'VOD Filmes: Animação, Disney & Família (Dublado)';
  }
  if (/action|adventure|superhero|war/i.test(gStr)) {
    return 'VOD Filmes: Ação, Heróis & Aventura (Dublado)';
  }
  if (/comedy/i.test(gStr)) {
    return 'VOD Filmes: Comédia & Sucessos (Dublado)';
  }
  if (/horror|thriller|mystery|crime/i.test(gStr)) {
    return 'VOD Filmes: Terror, Suspense & Crime (Dublado)';
  }
  if (/sci-fi|science fiction|fantasy/i.test(gStr)) {
    return 'VOD Filmes: Ficção Científica & Fantasia (Dublado)';
  }
  return 'VOD Filmes: Drama, Romance & Clássicos (Dublado)';
}

function mapSeriesCategory(genres) {
  const gStr = (Array.isArray(genres) ? genres.join(' ') : String(genres || '')).toLowerCase();
  if (/anime|japanese/i.test(gStr)) {
    return 'VOD Séries: Animes & Tokusatsu (Dublado)';
  }
  if (/animation|children|family/i.test(gStr)) {
    return 'VOD Séries: Desenhos & Animações (Dublado)';
  }
  if (/comedy/i.test(gStr)) {
    return 'VOD Séries: Comédias & Sitcoms (Dublado)';
  }
  if (/science-fiction|fantasy|supernatural/i.test(gStr)) {
    return 'VOD Séries: Ficção, Fantasia & Sobrenatural (Dublado)';
  }
  if (/action|crime|legal/i.test(gStr)) {
    return 'VOD Séries: Drama, Ação & Crime (Dublado)';
  }
  if (/korean|dorama|romance/i.test(gStr)) {
    return 'VOD Séries: Doramas & Novelas (Dublado)';
  }
  if (/horror|thriller|mystery/i.test(gStr)) {
    return 'VOD Séries: Suspense, Mistério & Terror (Dublado)';
  }
  return 'VOD Séries: Drama, Ação & Crime (Dublado)';
}

async function run() {
  console.log('🚀 Iniciando Megacatálogo PobreFlix: 20.000 Filmes + 20.000 Séries + 10.000 Animes (50.000 Títulos)...');

  // ==========================================
  // 1. CARREGAR E EXPANDIR SÉRIES ATÉ 20.000
  // ==========================================
  let existingSeries = [];
  const oldCatalogPath = path.join(__dirname, '..', 'public', 'catalog-blockbusters.js');
  if (fs.existsSync(oldCatalogPath)) {
    try {
      const code = fs.readFileSync(oldCatalogPath, 'utf8');
      const startIdx = code.indexOf('[');
      const endIdx = code.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = code.substring(startIdx, endIdx + 1);
        const parsed = JSON.parse(jsonStr);
        existingSeries = parsed.filter((x) => x.type === 'series');
        console.log(`✅ ${existingSeries.length} séries preservadas da base anterior.`);
      }
    } catch (err) {
      console.warn('Catálogo anterior não pôde ser lido:', err.message);
    }
  }

  const seriesMap = new Map();
  existingSeries.forEach((s) => {
    const key = (s.rawTitle || s.name).toLowerCase().replace(/\(.*?\)/g, '').trim();
    seriesMap.set(key, s);
  });

  console.log(`📡 Buscando séries adicionais do TVMaze (meta: 20.000 séries)...`);
  let page = 41; // Continuar de onde parou no build anterior
  while (seriesMap.size < 20000 && page <= 110) {
    process.stdout.write(`\rTVMaze página ${page}... Séries acumuladas: ${seriesMap.size}/20000`);
    const shows = await fetchJson(`https://api.tvmaze.com/shows?page=${page}`);
    if (!shows || !Array.isArray(shows) || shows.length === 0) {
      console.log(`\nFim das páginas TVMaze na página ${page}.`);
      break;
    }

    for (const sh of shows) {
      if (!sh || !sh.name) continue;
      const key = sh.name.toLowerCase().trim();
      if (seriesMap.has(key)) continue;

      const poster = sh.image?.original || sh.image?.medium || '';
      if (!poster) continue;

      const imdbId = sh.externals?.imdb || `tvmaze_${sh.id}`;
      const group = mapSeriesCategory(sh.genres);
      const cleanSummary = (sh.summary || '').replace(/<[^>]+>/g, '').trim();

      seriesMap.set(key, {
        imdbId,
        name: `${sh.name} (Dublado)`,
        rawTitle: sh.name,
        type: 'series',
        group,
        logo: poster,
        summary: cleanSummary || undefined
      });

      if (seriesMap.size >= 20000) break;
    }

    page++;
    await sleep(250);
  }

  const finalSeries = Array.from(seriesMap.values()).slice(0, 20000);
  console.log(`\n🎉 Total de Séries Prontas: ${finalSeries.length}`);

  // ==========================================
  // 2. BUSCAR 10.000 ANIMES & KIDS
  // ==========================================
  console.log('🎌 Baixando base completa de Animes (Anime Offline Database)...');
  const animeDb = await fetchJson(
    'https://github.com/manami-project/anime-offline-database/releases/download/2026-27/anime-offline-database-minified.json'
  );

  const animesList = [];
  if (animeDb && Array.isArray(animeDb.data)) {
    console.log(`✅ Base bruta baixada: ${animeDb.data.length} animes.`);

    // Filtrar não-adultos, com imagem e ordenar por score e relevância
    const filteredAnime = animeDb.data
      .filter(
        (a) =>
          a &&
          a.title &&
          (a.picture || a.thumbnail) &&
          (!a.tags || !a.tags.some((t) => /hentai|erotica|adult audience only/i.test(t)))
      )
      .sort((a, b) => {
        const scoreA = Number(a.score?.arithmeticGeometricMean || a.score?.arithmeticMean || 0);
        const scoreB = Number(b.score?.arithmeticGeometricMean || b.score?.arithmeticMean || 0);
        if (scoreB !== scoreA) return scoreB - scoreA;
        return (b.episodes || 1) - (a.episodes || 1);
      });

    const seenAnime = new Set();
    for (const an of filteredAnime) {
      const cleanTitle = an.title.trim();
      const lower = cleanTitle.toLowerCase();
      if (seenAnime.has(lower)) continue;
      seenAnime.add(lower);

      const isKids = (an.tags || []).some((t) => /kids|children|family|comedy/i.test(t));
      const group = isKids
        ? 'VOD Séries: Desenhos & Animações (Dublado)'
        : 'VOD Séries: Animes & Tokusatsu (Dublado)';

      animesList.push({
        imdbId: `anime_${animesList.length + 1}`,
        name: `${cleanTitle} (Dublado)`,
        rawTitle: cleanTitle,
        type: 'anime',
        group,
        logo: an.picture || an.thumbnail,
        summary: `Anime completo com todos os episódios dublados em Português.`
      });

      if (animesList.length >= 10000) break;
    }
  }
  console.log(`🎉 Total de Animes & Kids Prontos: ${animesList.length}`);

  // ==========================================
  // 3. BUSCAR 20.000 FILMES (MEILISEARCH)
  // ==========================================
  console.log('🍿 Baixando base de filmes (31.968 títulos Meilisearch)...');
  const allMoviesRaw = await fetchJson(
    'https://raw.githubusercontent.com/meilisearch/datasets/main/datasets/movies/movies.json'
  );
  if (!allMoviesRaw || !Array.isArray(allMoviesRaw)) {
    throw new Error('Falha ao baixar dataset de filmes.');
  }
  console.log(`✅ Base bruta baixada: ${allMoviesRaw.length} filmes.`);

  const moviesList = [];
  const movieNames = new Set();

  for (const m of allMoviesRaw) {
    if (!m || !m.title || !m.poster) continue;
    const cleanName = m.title.trim();
    const key = cleanName.toLowerCase();
    if (movieNames.has(key)) continue;
    movieNames.add(key);

    const group = mapMovieCategory(m.genres);
    moviesList.push({
      imdbId: String(m.id),
      name: `${cleanName} (Dublado)`,
      rawTitle: cleanName,
      type: 'movie',
      group,
      logo: m.poster,
      summary: m.overview || undefined
    });

    if (moviesList.length >= 20000) break;
  }

  console.log(`🎉 Total de Filmes Prontos: ${moviesList.length}`);

  // ==========================================
  // 4. CONSOLIDAR 50.000 ITENS E SALVAR
  // ==========================================
  const totalCatalog = [...moviesList, ...finalSeries, ...animesList];
  console.log(`\n🌟 Catálogo Total Consolidado: ${totalCatalog.length} itens:`);
  console.log(`   🍿 Filmes: ${moviesList.length}`);
  console.log(`   📺 Séries: ${finalSeries.length}`);
  console.log(`   🎌 Animes & Kids: ${animesList.length}`);

  const outputPath = path.join(__dirname, '..', 'public', 'catalog-blockbusters.js');
  const fileContent = `/**
 * Catálogo Oficial da PobreFlix — 20.000 Filmes + 20.000 Séries + 10.000 Animes (50.000 Títulos Dublados)
 * Gerado em: ${new Date().toISOString()}
 */
window.POBREFLIX_BLOCKBUSTERS = ${JSON.stringify(totalCatalog)};
`;

  fs.writeFileSync(outputPath, fileContent, 'utf8');
  const stats = fs.statSync(outputPath);
  console.log(`💾 Arquivo salvo com sucesso em: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
}

run().catch((err) => {
  console.error('❌ Erro na execução:', err);
  process.exit(1);
});
