'use strict';

const fs = require('fs');
const path = require('path');
const { execFile } = require('node:child_process');
const EXEC_OPTS = { maxBuffer: 64 * 1024 * 1024 };
const { promisify } = require('node:util');

const execFileP = promisify(execFile);

const CATS = [
  { slug: 'long-silky-hair', name: 'Long Silky Hair', queries: ['long silky hair woman', 'silky long hair girl', 'long straight silky hair woman'] },
  { slug: 'bob', name: 'Bob', queries: ['bob haircut woman', 'blunt bob hairstyle', 'bob haircut tutorial women'] },
  { slug: 'short-bob', name: 'Short Bob', queries: ['short bob haircut woman', 'short bob hairstyle girl', 'short bob tutorial'] },
  { slug: 'half-headshave', name: 'Half Headshave', queries: ['half shaved head woman', 'half shaved hairstyle girl', 'undercut half shave woman'] },
  { slug: 'full-headshave', name: 'Full Headshave', queries: ['female head shave', 'shaved head woman hair', 'bald woman hair style'] },
  { slug: 'very-long-hair', name: 'Very Long Hair', queries: ['very long hair woman', 'super long hair model', 'longest hair women'] },
  { slug: 'asian-hair', name: 'Asian Hair', queries: ['asian long hair woman', 'asian hairstyle girl', 'asian hair girl tutorial'] },
  { slug: 'russian-hair', name: 'Russian Hair', queries: ['russian hair extensions', 'russian blonde hair', 'russian hair girl'] },
  { slug: 'black-hair', name: 'Black Hair', queries: ['black girl hair tutorial', 'natural black hair style', 'african american hair tutorial'] },
  { slug: 'brown-hair', name: 'Brown Hair', queries: ['brown hair woman', 'brown hair tutorial girl', 'brunette hair style'] },
  { slug: 'chinese-hair', name: 'Chinese Hair', queries: ['chinese long hair girl', 'chinese hairstyle woman', 'chinese hair style'] },
];

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36';
const MALE_HINTS = /\b(man|men|men's|guy|guys|male|beard|moustache|facial|eren|boys|bro|hairline)\b/i;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function scrapeQuery(q) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const { stdout } = await execFileP('curl', [
        '-sL', url, '-A', UA,
        '-H', 'Accept-Language: en',
        '-H', 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        '--max-time', '25',
      ], EXEC_OPTS);
      const ids = new Set();
      const re = /"videoId":"([A-Za-z0-9_-]{11})"/g;
      let m;
      while ((m = re.exec(stdout))) ids.add(m[1]);
      return [...ids];
    } catch (e) {
      lastErr = e;
      await sleep(2500 * (attempt + 1));
    }
  }
  throw lastErr;
}

async function validate(id) {
  const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const { stdout } = await execFileP('curl', ['-s', url, '--max-time', '12'], EXEC_OPTS);
      const data = JSON.parse(stdout);
      if (data.title) return { id, title: data.title, author: data.author_name || '' };
      return null;
    } catch {
      await sleep(1200 * (attempt + 1));
    }
  }
  return null;
}

async function run() {
  const out = {};
  for (const cat of CATS) {
    const ids = new Set();
    for (const q of cat.queries) {
      try {
        const found = await scrapeQuery(q);
        found.forEach((i) => ids.add(i));
        console.log(`  ${q}: ${found.length} ids`);
      } catch (e) {
        console.log(`  scrape fail ${q}`);
      }
      await sleep(1000 + Math.random() * 800);
    }
    const all = [...ids];
    console.log(`\n[${cat.name}] scraped ${all.length} raw ids`);

    const valid = [];
    const concurrency = 10;
    let i = 0;
    async function worker() {
      while (i < all.length) {
        const id = all[i++];
        const v = await validate(id);
        if (v && v.title && !MALE_HINTS.test(v.title)) valid.push(v);
        await sleep(150 + Math.random() * 200);
      }
    }
    await Promise.all(Array.from({ length: concurrency }, worker));
    valid.sort(() => Math.random() - 0.5);
    out[cat.slug] = { name: cat.name, videos: valid.slice(0, 62) };
    console.log(`  kept ${out[cat.slug].videos.length} women-friendly videos`);
  }
  const file = path.join(__dirname, '..', 'data', 'hair_photos.json');
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log(`\nWrote ${file}`);
  for (const [slug, c] of Object.entries(out)) console.log(`${slug}: ${c.videos.length}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
