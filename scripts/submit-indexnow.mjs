#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

const DEFAULT_SITE_URL = 'https://www.wuliang142857.me/';
const INDEXNOW_REGISTRY = 'https://www.indexnow.org/searchengines.json';
const FALLBACK_ENDPOINTS = ['https://www.bing.com/indexnow', 'https://yandex.com/indexnow'];
const dryRun = process.argv.includes('--dry-run');

const siteUrl = new URL(process.env.SITE_URL || DEFAULT_SITE_URL);
const sitemapFile = process.env.SITEMAP_FILE || 'dist/sitemap-index.xml';
const key = process.env.INDEXNOW_KEY || readIndexNowKey();
const keyLocation = new URL(`${key}.txt`, siteUrl).href;
const urls = [...new Set(readSitemapUrls(sitemapFile))].filter((url) => new URL(url).host === siteUrl.host);
const endpoints = await getIndexNowEndpoints();

if (urls.length === 0) {
  throw new Error(`No URLs found in ${sitemapFile}. Run npm run build first.`);
}

console.log(`IndexNow host: ${siteUrl.host}`);
console.log(`IndexNow key location: ${keyLocation}`);
console.log(`URLs discovered: ${urls.length}`);
console.log(`Endpoints discovered: ${endpoints.length}`);

if (dryRun) {
  console.log('Dry run only; no URLs submitted.');
  for (const endpoint of endpoints) console.log(`- ${endpoint}`);
  process.exit(0);
}

const payload = {
  host: siteUrl.host,
  key,
  keyLocation,
  urlList: urls,
};

let accepted = 0;

for (const endpoint of endpoints) {
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });

    if (response.status === 200 || response.status === 202) {
      accepted++;
      console.log(`${endpoint}: ${response.status}`);
      continue;
    }

    const body = await response.text();
    console.warn(`${endpoint}: ${response.status} ${body.slice(0, 200)}`);
  } catch (error) {
    console.warn(`${endpoint}: ${error.message}`);
  }
}

if (accepted === 0) {
  throw new Error('No IndexNow endpoint accepted the submission.');
}

console.log(`IndexNow accepted by ${accepted}/${endpoints.length} endpoint(s).`);

function readIndexNowKey() {
  const publicDir = 'public';
  const keyFile = join(publicDir, '55fc09c95960efa836b09c545ae7c78d.txt');
  const keyFromFile = readFileSync(keyFile, 'utf8').trim();
  const keyFromName = basename(keyFile, '.txt');

  if (keyFromFile !== keyFromName) {
    throw new Error(`IndexNow key file name and content differ: ${keyFile}`);
  }

  return keyFromFile;
}

function readSitemapUrls(file) {
  const xml = readFileSync(file, 'utf8');
  const locs = extractLocs(xml);

  if (/<sitemapindex[\s>]/.test(xml)) {
    return locs.flatMap((loc) => {
      const url = new URL(loc);
      const localFile = join('dist', url.pathname.replace(/^\//, ''));
      return existsSync(localFile) ? readSitemapUrls(localFile) : [];
    });
  }

  return locs;
}

function extractLocs(xml) {
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => decodeXml(match[1].trim()));
}

function decodeXml(value) {
  return value
    .replaceAll('&amp;', '&')
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'");
}

async function getIndexNowEndpoints() {
  if (process.env.INDEXNOW_ENDPOINTS) {
    return process.env.INDEXNOW_ENDPOINTS.split(',').map((endpoint) => endpoint.trim()).filter(Boolean);
  }

  try {
    const registryResponse = await fetch(INDEXNOW_REGISTRY);
    if (!registryResponse.ok) throw new Error(`Registry returned ${registryResponse.status}`);

    const registry = await registryResponse.json();
    const metaUrls = Object.values(registry);
    const endpoints = [];

    for (const metaUrl of metaUrls) {
      try {
        const metaResponse = await fetch(metaUrl);
        if (!metaResponse.ok) continue;

        const meta = await metaResponse.json();
        if (typeof meta.api === 'string' && meta.api.startsWith('https://')) endpoints.push(meta.api);
      } catch {
        // Skip endpoints whose metadata is temporarily unavailable.
      }
    }

    return [...new Set(endpoints.length > 0 ? endpoints : FALLBACK_ENDPOINTS)];
  } catch {
    return FALLBACK_ENDPOINTS;
  }
}
