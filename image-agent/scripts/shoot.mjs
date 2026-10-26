import { createReadStream, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { dirname, extname, join, relative, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.vtt': 'text/vtt; charset=utf-8',
};

const argv = process.argv.slice(2);
const opts = {
  scale: 1,
  format: 'png',
  quality: 90,
  timeout: 30000,
  allowAnimations: false,
  allowBleed: false,
  transparent: false,
  alsoJpg: false,
  json: false,
};
const positional = [];

for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (!arg.startsWith('--')) {
    positional.push(arg);
    continue;
  }
  if (arg === '--json') { opts.json = true; continue; }
  if (arg === '--transparent') { opts.transparent = true; continue; }
  if (arg === '--also-jpg') { opts.alsoJpg = true; continue; }
  if (arg === '--allow-animations') { opts.allowAnimations = true; continue; }
  if (arg === '--allow-bleed') { opts.allowBleed = true; continue; }
  const [key, inline] = arg.slice(2).split('=', 2);
  const value = inline !== undefined ? inline : argv[++i];
  if (value === undefined) throw new Error(`Missing value for --${key}`);
  if (key === 'out') opts.out = value;
  else if (key === 'root') opts.root = value;
  else if (key === 'width') opts.width = Number(value);
  else if (key === 'height') opts.height = Number(value);
  else if (key === 'scale') opts.scale = Number(value);
  else if (key === 'format') opts.format = String(value).toLowerCase();
  else if (key === 'quality') opts.quality = Number(value);
  else if (key === 'selector') opts.selector = value;
  else if (key === 'timeout') opts.timeout = Number(value);
  else throw new Error(`Unknown option --${key}`);
}

if (!positional.length) {
  throw new Error('Usage: node image-agent/scripts/shoot.mjs <still.html> --out <file.png> [--width 1440 --height 1920] [--scale 1] [--format png|jpg] [--also-jpg] [--timeout 30000ms] [--json]');
}

const htmlPath = resolve(positional[0]);
if (!existsSync(htmlPath)) throw new Error(`HTML not found: ${htmlPath}`);

if (!Number.isFinite(opts.scale) || opts.scale <= 0) throw new Error('--scale must be a positive number');
if (opts.format === 'jpg') opts.format = 'jpeg';
if (!['png', 'jpeg'].includes(opts.format)) throw new Error('--format must be png or jpg');
if (opts.transparent && opts.format === 'jpeg') throw new Error('--transparent requires --format png');
if (!Number.isFinite(opts.quality) || opts.quality < 0 || opts.quality > 100) throw new Error('--quality must be 0-100');

const html = readFileSync(htmlPath, 'utf8');
const meta = html.match(/<meta[^>]+name=["']viewport["'][^>]*>/i);
const content = meta?.[0].match(/content=["']([^"']+)["']/i)?.[1] ?? '';
const metaWidth = Number(content.match(/width\s*=\s*(\d+)/i)?.[1]);
const metaHeight = Number(content.match(/height\s*=\s*(\d+)/i)?.[1]);

const width = Number.isInteger(opts.width) ? opts.width : metaWidth;
const height = Number.isInteger(opts.height) ? opts.height : metaHeight;
if (!Number.isInteger(width) || width <= 0 || !Number.isInteger(height) || height <= 0) {
  throw new Error('Set the canvas size with <meta name="viewport" content="width=..., height=..."> or --width/--height.');
}

function findRoot(start) {
  let dir = resolve(start);
  for (;;) {
    if (existsSync(join(dir, 'input')) && existsSync(join(dir, 'output')) && existsSync(join(dir, 'AGENTS.md'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) return process.cwd();
    dir = parent;
  }
}

const root = resolve(opts.root ?? findRoot(htmlPath));
if (htmlPath !== root && !htmlPath.startsWith(root + sep)) {
  throw new Error(`HTML must be inside the server root. html=${htmlPath} root=${root}`);
}

const defaultExt = opts.format === 'jpeg' ? 'jpg' : 'png';
const outPath = resolve(opts.out ?? htmlPath.replace(/\.[^.]+$/, `.${defaultExt}`));
mkdirSync(dirname(outPath), { recursive: true });

function contentType(file) {
  return MIME[extname(file).toLowerCase()] ?? 'application/octet-stream';
}

function startServer(serverRoot) {
  const server = createServer((req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      let rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      if (!rel) rel = 'index.html';
      let file = resolve(serverRoot, rel);
      if (file !== serverRoot && !file.startsWith(serverRoot + sep)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
      if (!existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404).end('Not found');
        return;
      }
      const stat = statSync(file);
      res.writeHead(200, {
        'content-type': contentType(file),
        'content-length': stat.size,
        'cache-control': 'no-store',
      });
      if (req.method === 'HEAD') {
        res.end();
        return;
      }
      createReadStream(file).pipe(res);
    } catch {
      res.writeHead(500).end('Server error');
    }
  });
  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();
      resolveServer({ server, port: address.port });
    });
  });
}

function normalizePlaywright(module) {
  return module.chromium ? module : (module.default ?? module);
}

async function loadPlaywright() {
  try {
    return normalizePlaywright(await import('playwright-core'));
  } catch {}
  let globalRoot = '';
  try {
    globalRoot = execFileSync('npm', ['root', '-g'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch {}
  const candidates = [
    globalRoot && join(globalRoot, 'openfilm/node_modules/playwright-core/index.js'),
    globalRoot && join(globalRoot, '@playwright/cli/node_modules/playwright-core/index.js'),
    globalRoot && join(globalRoot, 'playwright-core/index.js'),
    join(process.cwd(), 'node_modules/playwright-core/index.js'),
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (existsSync(candidate)) return normalizePlaywright(await import(pathToFileURL(candidate).href));
  }
  throw new Error('playwright-core not found. Install it or use browser-agent/playwright-cli.');
}

const { chromium } = await loadPlaywright();
const { server, port } = await startServer(root);
const browser = await chromium.launch({ headless: true });

const pageErrors = [];
const consoleErrors = [];
const failedRequests = [];
const externalRequests = [];

try {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: opts.scale,
    locale: 'zh-CN',
    colorScheme: 'light',
    reducedMotion: 'reduce',
  });
  const page = await context.newPage();
  const base = `http://127.0.0.1:${port}`;

  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('requestfailed', (request) => {
    failedRequests.push({ url: request.url(), failure: request.failure()?.errorText ?? 'failed' });
  });
  page.on('request', (request) => {
    const url = request.url();
    if (!url.startsWith(base) && !url.startsWith('data:') && !url.startsWith('blob:')) externalRequests.push(url);
  });

  const rel = relative(root, htmlPath).split(sep).join('/');
  await page.goto(`${base}/${encodeURI(rel)}`, { waitUntil: 'networkidle', timeout: opts.timeout });

  if (!opts.allowAnimations) {
    await page.addStyleTag({
      content: '*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }',
    });
  }

  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(
    () => Array.from(document.images).every((image) => image.complete),
    null,
    { timeout: opts.timeout },
  );
  await page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));

  const report = await page.evaluate(({ canvasWidth, canvasHeight }) => {
    const W = window.innerWidth;
    const H = window.innerHeight;
    const label = (element) => {
      if (!element) return '';
      if (element.id) return `#${element.id}`;
      const tag = element.tagName.toLowerCase();
      const classes = [...element.classList].slice(0, 2).map((name) => `.${name}`).join('');
      const parent = element.parentElement && element.parentElement !== document.body
        ? `${label(element.parentElement)} > `
        : '';
      return `${parent}${tag}${classes}`;
    };
    const visible = (element) => {
      if (typeof element.checkVisibility === 'function' && !element.checkVisibility({ opacityProperty: true, visibilityProperty: true })) return false;
      for (let node = element; node; node = node.parentElement) {
        if (Number(getComputedStyle(node).opacity) < 0.05) return false;
      }
      return true;
    };
    const partly = (rect, box) => {
      const inside = Math.max(0, Math.min(rect.right, box.right) - Math.max(rect.left, box.left))
        * Math.max(0, Math.min(rect.bottom, box.bottom) - Math.max(rect.top, box.top));
      const over = rect.left < box.left - 2 || rect.right > box.right + 2
        || rect.top < box.top - 2 || rect.bottom > box.bottom + 2;
      return over && inside > 0;
    };

    const clippedText = [];
    const seen = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node && clippedText.length < 50; node = walker.nextNode()) {
      const element = node.parentElement;
      if (!element || seen.has(element) || !node.textContent.trim()) continue;
      if (/^(SCRIPT|STYLE|NOSCRIPT|TITLE)$/.test(element.tagName)) continue;
      seen.add(element);
      const range = document.createRange();
      range.selectNodeContents(node);
      const rect = range.getBoundingClientRect();
      if (!(rect.width > 1 && rect.height > 1) || !visible(element)) continue;
      if (partly(rect, { left: 0, top: 0, right: W, bottom: H })) {
        clippedText.push({ selector: label(element), why: 'edge', text: node.textContent.trim().slice(0, 40) });
        continue;
      }
      for (let ancestor = element.parentElement; ancestor && ancestor !== document.body && ancestor !== document.documentElement; ancestor = ancestor.parentElement) {
        const style = getComputedStyle(ancestor);
        if (!/hidden|clip/.test(style.overflowX + style.overflowY)) continue;
        if (partly(rect, ancestor.getBoundingClientRect())) {
          clippedText.push({ selector: label(element), why: 'box', text: node.textContent.trim().slice(0, 40) });
        }
        break;
      }
    }

    const overflow = [];
    for (const element of document.querySelectorAll('body *')) {
      if (element.closest('[data-bleed]')) continue;
      if (element === document.body || element === document.documentElement) continue;
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) continue;
      const rect = element.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) continue;
      if (rect.left < -2 || rect.top < -2 || rect.right > W + 2 || rect.bottom > H + 2) {
        overflow.push({
          selector: label(element),
          rect: {
            left: Math.round(rect.left),
            top: Math.round(rect.top),
            right: Math.round(rect.right),
            bottom: Math.round(rect.bottom),
          },
        });
      }
    }

    const clippedBoxes = [];
    for (const element of document.querySelectorAll('body *')) {
      if (element === document.body || element === document.documentElement) continue;
      if (element.id === 'still' || element.classList.contains('still')) continue;
      if (element.closest('[data-bleed]') || element.hasAttribute('data-bleed')) continue;
      if (element.querySelector('[data-bleed]')) continue;
      if (!element.textContent.trim()) continue;
      const style = getComputedStyle(element);
      if (!/hidden|clip/.test(style.overflowX + style.overflowY)) continue;
      const overY = element.scrollHeight > element.clientHeight + 2;
      const overX = element.scrollWidth > element.clientWidth + 2;
      if (overX || overY) {
        clippedBoxes.push({
          selector: label(element),
          scrollHeight: element.scrollHeight,
          clientHeight: element.clientHeight,
          scrollWidth: element.scrollWidth,
          clientWidth: element.clientWidth,
        });
      }
    }

    const images = Array.from(document.images).map((image) => {
      const rect = image.getBoundingClientRect();
      return {
        src: image.getAttribute('src') ?? '',
        complete: image.complete,
        naturalWidth: image.naturalWidth,
        naturalHeight: image.naturalHeight,
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        broken: image.complete && image.naturalWidth === 0,
        upscaled: image.naturalWidth > 0 && rect.width > 0 && image.naturalWidth < rect.width * 0.95,
      };
    });

    const fontErrors = Array.from(document.fonts)
      .filter((font) => font.status === 'error')
      .map((font) => font.family);
    const fontChecks = {};
    for (const family of ['Maple Mono NF CN', 'PingFang SC', 'SF Mono']) {
      try {
        fontChecks[family] = document.fonts.check(`16px "${family}"`);
      } catch {
        fontChecks[family] = false;
      }
    }

    const scroll = {
      width: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
      overflowX: document.documentElement.scrollWidth > W + 1,
      overflowY: document.documentElement.scrollHeight > H + 1,
    };

    return {
      canvas: { width: canvasWidth, height: canvasHeight, viewportWidth: W, viewportHeight: H },
      clippedText,
      clippedBoxes,
      overflow,
      images,
      fontErrors,
      fontStatus: document.fonts.status,
      fontChecks,
      scroll,
    };
  }, { canvasWidth: width, canvasHeight: height });

  if (opts.selector) {
    const element = await page.$(opts.selector);
    if (!element) throw new Error(`Selector not found: ${opts.selector}`);
    const box = await element.boundingBox();
    if (!box) throw new Error(`Selector has no box: ${opts.selector}`);
    await page.screenshot({
      path: outPath,
      type: opts.format,
      ...(opts.format === 'jpeg' ? { quality: opts.quality } : {}),
      omitBackground: opts.transparent,
      clip: { x: box.x, y: box.y, width: box.width, height: box.height },
    });
    report.element = {
      selector: opts.selector,
      width: Math.round(box.width),
      height: Math.round(box.height),
      matchesCanvas: Math.round(box.width) === width && Math.round(box.height) === height,
    };
  } else {
    await page.screenshot({
      path: outPath,
      type: opts.format,
      ...(opts.format === 'jpeg' ? { quality: opts.quality } : {}),
      omitBackground: opts.transparent,
      clip: { x: 0, y: 0, width, height },
    });
  }

  report.out = outPath;
  report.html = htmlPath;
  report.scale = opts.scale;
  report.output = {
    width: width * opts.scale,
    height: height * opts.scale,
    format: opts.format === 'jpeg' ? 'jpg' : 'png',
    bytes: statSync(outPath).size,
  };
  report.pageErrors = pageErrors;
  report.consoleErrors = consoleErrors.filter((text) => !/favicon/i.test(text));
  report.failedRequests = failedRequests.filter((item) => !/favicon/i.test(item.url));
  report.externalRequests = [...new Set(externalRequests)];
  report.warnings = [];
  report.errors = [];

  for (const image of report.images) {
    if (image.broken) report.errors.push(`image not found or unreadable: ${image.src}`);
    else if (image.upscaled) {
      report.warnings.push(`image is lower than its display size: ${image.src} (${image.naturalWidth}px → ${image.width}px)`);
    }
  }
  if (report.fontErrors.length) report.errors.push(`font failed to load: ${report.fontErrors.join(', ')}`);
  if (report.clippedText.length) {
    report.errors.push(`text is clipped: ${report.clippedText.map((item) => `"${item.text}" (${item.why}, ${item.selector})`).join('; ')}`);
  }
  if (report.clippedBoxes.length) {
    report.errors.push(`a box clips its content: ${report.clippedBoxes.map((item) => item.selector).join('; ')}`);
  }
  if (report.overflow.length) {
    const names = report.overflow.map((item) => item.selector);
    const shown = names.slice(0, 5).join('; ') + (names.length > 5 ? `; and ${names.length - 5} more` : '');
    const message = `elements outside the canvas: ${shown}`;
    if (opts.allowBleed) report.warnings.push(message);
    else report.errors.push(message);
  }
  if (report.scroll.overflowX || report.scroll.overflowY) {
    report.warnings.push(`page content is larger than the canvas: ${report.scroll.width}×${report.scroll.height}`);
  }
  if (report.externalRequests.length) {
    report.warnings.push(`external requests: ${report.externalRequests.join(', ')}`);
  }
  if (report.pageErrors.length) report.errors.push(`page errors: ${report.pageErrors.join('; ')}`);
  if (report.consoleErrors.length) report.errors.push(`console errors: ${report.consoleErrors.join('; ')}`);
  if (report.failedRequests.length) {
    report.errors.push(`failed requests: ${report.failedRequests.map((item) => item.url).join('; ')}`);
  }
  if (report.element && !report.element.matchesCanvas) {
    report.warnings.push(`selector is ${report.element.width}×${report.element.height}, not the canvas ${width}×${height}`);
  }
  const outExt = extname(outPath).toLowerCase().replace('.', '');
  if ((opts.format === 'jpeg' && outExt === 'png') || (opts.format === 'png' && outExt === 'jpg')) {
    report.warnings.push(`output extension .${outExt} does not match --format ${opts.format}`);
  }

  if (opts.alsoJpg && opts.format === 'png' && report.ok) {
    const jpgPath = outPath.replace(/\.png$/i, '.jpg');
    execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(Math.round(opts.quality)), outPath, '--out', jpgPath]);
    report.jpg = { path: jpgPath, bytes: statSync(jpgPath).size };
  }

  report.ok = report.errors.length === 0;

  if (opts.json) {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  } else {
    process.stdout.write(`out: ${report.out}\n`);
    process.stdout.write(`size: ${report.output.width}×${report.output.height} (${report.output.format}, ${report.output.bytes} bytes)\n`);
    process.stdout.write(`ok: ${report.ok}\n`);
    for (const error of report.errors) process.stdout.write(`error: ${error}\n`);
    for (const warning of report.warnings) process.stdout.write(`warning: ${warning}\n`);
  }

  if (!report.ok) process.exitCode = 1;
} finally {
  await browser.close();
  await new Promise((done) => server.close(done));
}
