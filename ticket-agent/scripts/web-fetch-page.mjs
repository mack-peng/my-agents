#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);

const UA_PROFILES = {
  'chrome-ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/156.0.8078.54 Mobile/15E148 Safari/604.1',
  'safari-ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.0 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 26_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/156.0.8078.54 Mobile/15E148 Safari/604.1',
  'gsa-ios': 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_6_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/445.5.1006576801 Mobile/15E148 Safari/604.1',
  desktop: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36',
};

function usage() {
  console.error(`Usage: web-fetch-page.mjs --url <url> --out <file.html> [options]

  --url <url>            page to fetch
  --out <file.html>      where to write the HTML
  --ua-profile <name>    ${Object.keys(UA_PROFILES).join(' | ')} (default: chrome-ios)
  --engine <name>        fetch | webkit (default: fetch)
  --wait <ms>            webkit only: settle time after load (default: 3000)
  --header <k:v>         extra request header, repeatable

Also writes <file.html>.headers.json next to the HTML.`);
  process.exit(2);
}

function resolvePlaywright() {
  const candidates = [];
  if (process.env.PLAYWRIGHT_CORE_PATH) candidates.push(process.env.PLAYWRIGHT_CORE_PATH);
  try {
    const root = execSync('npm root -g', { encoding: 'utf8' }).trim();
    candidates.push(path.join(root, 'cssprobe-cli/node_modules/playwright-core'));
  } catch {}
  candidates.push('/Users/mack/.nvm/versions/node/v24.1.0/lib/node_modules/cssprobe-cli/node_modules/playwright-core');
  for (const candidate of candidates) {
    try {
      return require(candidate);
    } catch {}
  }
  throw new Error('playwright-core not found; set PLAYWRIGHT_CORE_PATH');
}

function parseArgs(argv) {
  const out = { engine: 'fetch', wait: 3000, headers: {} };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--url') out.url = argv[++i];
    else if (key === '--out') out.out = argv[++i];
    else if (key === '--ua-profile') out.uaProfile = argv[++i];
    else if (key === '--engine') out.engine = argv[++i];
    else if (key === '--wait') out.wait = Number(argv[++i]);
    else if (key === '--header') {
      const raw = argv[++i];
      const idx = raw.indexOf(':');
      out.headers[raw.slice(0, idx).trim()] = raw.slice(idx + 1).trim();
    } else usage();
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.url || !args.out) usage();
if (!UA_PROFILES[args.uaProfile || 'chrome-ios']) usage();

const ua = UA_PROFILES[args.uaProfile || 'chrome-ios'];
const outFile = path.resolve(args.out);
await mkdir(path.dirname(outFile), { recursive: true });

let html;
let headers;

if (args.engine === 'webkit') {
  const { webkit } = resolvePlaywright();
  const browser = await webkit.launch();
  const context = await browser.newContext({ userAgent: ua, extraHTTPHeaders: args.headers });
  const page = await context.newPage();
  const response = await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(args.wait);
  html = await page.content();
  headers = response ? await response.allHeaders() : {};
  await browser.close();
} else {
  const response = await fetch(args.url, {
    redirect: 'follow',
    headers: { 'user-agent': ua, 'accept-language': 'en-US,en;q=0.9', ...args.headers },
  });
  html = await response.text();
  headers = Object.fromEntries(response.headers.entries());
}

await writeFile(outFile, html);
await writeFile(`${outFile}.headers.json`, JSON.stringify(headers, null, 2));
console.log(JSON.stringify({ url: args.url, engine: args.engine, uaProfile: args.uaProfile || 'chrome-ios', bytes: html.length, out: outFile }));
