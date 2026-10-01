const fs = require('fs');
const https = require('https');
const path = require('path');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'PobreFlixCatalog/2.0' } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJson(res.headers.location).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return resolve(null);
      }
      let raw = '';
      res.on('data', (c) => raw += c);
      res.on('end', () => {
        try {
          resolve(JSON.parse(raw));
        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function testFetch() {
  console.log('Testing movie dataset download...');
  const movies = await fetchJson('https://raw.githubusercontent.com/meilisearch/datasets/main/datasets/movies/movies.json');
  console.log('Movies fetched:', movies ? movies.length : 'failed');

  console.log('Testing TVMaze series page 0-2...');
  const p0 = await fetchJson('https://api.tvmaze.com/shows?page=0');
  console.log('TVMaze page 0:', p0 ? p0.length : 'failed');
}

testFetch();
