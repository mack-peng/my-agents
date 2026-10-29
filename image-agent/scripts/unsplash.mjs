#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join } from 'node:path';
import { platform } from 'node:os';

const fail = (error) => {
  console.error(`Error: ${error?.message || error}`);
  process.exit(1);
};
process.on('uncaughtException', fail);
process.on('unhandledRejection', fail);

const API = process.env.UNSPLASH_API_BASE || 'https://api.unsplash.com';
const KEYCHAIN_SERVICE = 'unsplash-cli';
const KEYCHAIN_ACCOUNT = 'default';
const SIZES = new Set(['raw', 'full', 'regular', 'small', 'thumb']);
const HELP = `Usage:
  node image-agent/scripts/unsplash.mjs search "<query>" [options]
  node image-agent/scripts/unsplash.mjs download <id|url> [options]

Search options:
  --per-page N        Results per page (default 6, max 30)
  --page N            Page number (default 1)
  --orientation X     landscape | portrait | squarish
  --color X           black_and_white, black, white, yellow, orange,
                      red, purple, magenta, green, teal, blue
  --order-by X        relevant | latest (default relevant)
  --download N        Download the first N results (requires --out-dir)
  --out-dir DIR       Download directory (default assets/refs/unsplash)

Download options:
  --out FILE          Exact output file path
  --out-dir DIR       Directory; file is named <photo-id>.<ext>
  --size X            raw | full | regular | small | thumb (default full)

Common:
  --json              Machine-readable JSON on stdout
  --help              Show this help

Key: macOS Keychain (service "unsplash-cli") or UNSPLASH_ACCESS_KEY env
`;

function loadKey() {
  const env = process.env.UNSPLASH_ACCESS_KEY?.trim();
  if (env) return env;
  if (platform() === 'darwin') {
    try {
      const key = execFileSync(
        'security',
        ['find-generic-password', '-s', KEYCHAIN_SERVICE, '-a', KEYCHAIN_ACCOUNT, '-w'],
        { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      ).trim();
      if (key) return key;
    } catch {}
  }
  throw new Error(
    'Unsplash Access Key is not configured. Install `@orangemust/unsplash-cli` and run `unsplash auth set`, or set UNSPLASH_ACCESS_KEY.',
  );
}

let key = '';
const getKey = () => {
  if (!key) key = loadKey();
  return key;
};

const argv = process.argv.slice(2);
const command = argv[0];
if (!command || argv.includes('--help') || argv.includes('-h')) {
  console.log(HELP.trim());
  process.exit(0);
}
if (!['search', 'download'].includes(command)) throw new Error(`Unknown command: ${command}\n\n${HELP}`);

const opts = {
  perPage: 6,
  page: 1,
  orientation: '',
  color: '',
  orderBy: 'relevant',
  download: 0,
  out: '',
  outDir: '',
  size: 'full',
  json: false,
};
let target = '';
for (let i = 1; i < argv.length; i += 1) {
  const arg = argv[i];
  if (!arg.startsWith('--')) {
    if (target) throw new Error(`Unexpected argument: ${arg}`);
    target = arg;
    continue;
  }
  if (arg === '--json') {
    opts.json = true;
    continue;
  }
  const [name, inline] = arg.slice(2).split('=', 2);
  const value = inline !== undefined ? inline : argv[++i];
  if (value === undefined) throw new Error(`Missing value for --${name}`);
  if (name === 'per-page') opts.perPage = Number(value);
  else if (name === 'page') opts.page = Number(value);
  else if (name === 'orientation') opts.orientation = value;
  else if (name === 'color') opts.color = value;
  else if (name === 'order-by') opts.orderBy = value;
  else if (name === 'download') opts.download = Number(value);
  else if (name === 'out') opts.out = value;
  else if (name === 'out-dir') opts.outDir = value;
  else if (name === 'size') opts.size = value;
  else throw new Error(`Unknown option --${name}`);
}
if (!target) throw new Error(`${command} requires a ${command === 'search' ? 'query' : 'photo id or URL'}`);
if (!Number.isInteger(opts.perPage) || opts.perPage < 1 || opts.perPage > 30) throw new Error('--per-page must be 1-30');
if (!Number.isInteger(opts.page) || opts.page < 1) throw new Error('--page must be >= 1');
if (!Number.isInteger(opts.download) || opts.download < 0) throw new Error('--download must be >= 0');
if (!SIZES.has(opts.size)) throw new Error('--size must be raw, full, regular, small or thumb');
if (opts.download > 0 && !opts.outDir) throw new Error('--out-dir is required with --download');
if (command === 'download' && !opts.out && !opts.outDir) throw new Error('download requires --out or --out-dir');

async function api(path, params = {}) {
  const url = new URL(API + path);
  for (const [name, value] of Object.entries(params)) {
    if (value !== '' && value != null) url.searchParams.set(name, value);
  }
  const response = await fetch(url, {
    headers: { Authorization: `Client-ID ${getKey()}`, 'Accept-Version': 'v1' },
  });
  const rate = {
    limit: response.headers.get('x-ratelimit-limit'),
    remaining: response.headers.get('x-ratelimit-remaining'),
  };
  if (!response.ok) {
    let detail = '';
    try {
      const body = await response.json();
      detail = body.errors?.join('; ') || body.error || '';
    } catch {}
    if (response.status === 401) throw new Error('Unsplash auth failed (401): check UNSPLASH_ACCESS_KEY');
    if (response.status === 403 || response.status === 429) {
      throw new Error(`Unsplash rate limit (${response.status}): ${detail || 'hourly limit reached'}`);
    }
    throw new Error(`Unsplash API ${response.status}: ${detail || response.statusText}`);
  }
  if (rate.remaining != null && Number(rate.remaining) <= 10) {
    console.error(`warning: Unsplash rate limit low (${rate.remaining}/${rate.limit} remaining)`);
  }
  return { data: await response.json(), rate };
}

function withUtm(url) {
  if (!url) return '';
  return `${url}${url.includes('?') ? '&' : '?'}utm_source=image-agent&utm_medium=referral`;
}

function compact(photo, query = '') {
  const user = photo.user || {};
  const profile = user.links?.html || (user.username ? `https://unsplash.com/@${user.username}` : '');
  const name = user.name || user.username || 'Unknown';
  return {
    id: photo.id,
    description: photo.description || photo.alt_description || '',
    width: photo.width,
    height: photo.height,
    color: photo.color || '',
    urls: photo.urls,
    photographer: {
      name,
      username: user.username || '',
      profile_url: withUtm(profile),
    },
    photo_page: withUtm(photo.links?.html || ''),
    download_location: photo.links?.download_location || '',
    attribution: `Photo by ${name} on Unsplash (${withUtm(profile)})`,
    ...(query ? { query } : {}),
  };
}

function parseId(ref) {
  if (/^[A-Za-z0-9_-]{6,}$/.test(ref)) return ref;
  try {
    const parts = new URL(ref).pathname.split('/').filter(Boolean);
    let last = parts.pop() || '';
    if (last === 'download') last = parts.pop() || '';
    return last.includes('-') ? last.slice(last.lastIndexOf('-') + 1) : last;
  } catch {
    return ref;
  }
}

async function downloadOne(ref, { out = '', outDir = '', size = 'full' } = {}) {
  const id = parseId(ref);
  const { data: photo } = await api(`/photos/${id}`);
  const meta = compact(photo);
  const source = photo.urls?.[size] || photo.urls?.full || photo.urls?.regular;
  if (!source) throw new Error(`No image URL for size ${size}`);

  const response = await fetch(source);
  if (!response.ok) throw new Error(`Image download failed HTTP ${response.status}`);
  const contentType = response.headers.get('content-type') || '';
  const ext = contentType.includes('png') ? '.png' : contentType.includes('webp') ? '.webp' : '.jpg';
  const file = out || join(outDir || '.', `${id}${ext}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buffer);

  let tracked = false;
  if (meta.download_location) {
    try {
      const tracking = await fetch(meta.download_location, {
        headers: { Authorization: `Client-ID ${getKey()}` },
      });
      tracked = tracking.ok;
      if (!tracking.ok) console.error(`warning: download tracking failed HTTP ${tracking.status}`);
    } catch (error) {
      console.error(`warning: download tracking failed: ${error.message}`);
    }
  }

  const record = {
    provider: 'unsplash',
    ...meta,
    size,
    file,
    bytes: buffer.length,
    download_tracked: tracked,
    downloaded_at: new Date().toISOString(),
    license: 'https://unsplash.com/license',
  };
  const sidecar = join(dirname(file), `${basename(file, extname(file))}.json`);
  writeFileSync(sidecar, `${JSON.stringify(record, null, 2)}\n`);
  return { ...record, sidecar };
}

if (command === 'search') {
  const { data, rate } = await api('/search/photos', {
    query: target,
    per_page: opts.perPage,
    page: opts.page,
    orientation: opts.orientation,
    color: opts.color,
    order_by: opts.orderBy,
  });
  const results = data.results.map((photo) => compact(photo, target));
  let downloads = [];
  if (opts.download > 0) {
    for (const result of results.slice(0, opts.download)) {
      downloads.push(await downloadOne(result.id, { outDir: opts.outDir, size: opts.size }));
    }
  }
  if (opts.json) {
    console.log(JSON.stringify({
      query: target,
      total: data.total,
      total_pages: data.total_pages,
      rate,
      results,
      ...(downloads.length ? { downloads } : {}),
    }, null, 2));
  } else {
    console.log(`${data.total} results for "${target}" (page ${opts.page}/${data.total_pages})`);
    results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.id}  ${result.width}x${result.height}`);
      console.log(`   ${result.description || '(no description)'}`);
      console.log(`   ${result.attribution}`);
      console.log(`   ${result.photo_page}`);
    });
    if (downloads.length) {
      console.log('\nDownloaded:');
      downloads.forEach((item) => console.log(`- ${item.file}  (${item.attribution})`));
    }
    console.log(`\nRate: ${rate.remaining ?? '?'}/${rate.limit ?? '?'} remaining`);
  }
} else {
  const result = await downloadOne(target, { out: opts.out, outDir: opts.outDir, size: opts.size });
  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(`File: ${result.file}`);
    console.log(`Sidecar: ${result.sidecar}`);
    console.log(`Size: ${result.width}x${result.height} (${result.size})`);
    console.log(`Credit: ${result.attribution}`);
    console.log(`Page: ${result.photo_page}`);
  }
}
