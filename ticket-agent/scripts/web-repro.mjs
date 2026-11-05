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
  console.error(`Usage: web-repro.mjs --url <url> [options]

  --url <url>            start page
  --click <text>         click the first link/button whose trimmed text matches (case-insensitive)
  --ua-profile <name>    ${Object.keys(UA_PROFILES).join(' | ')} (default: chrome-ios)
  --wait <ms>            settle time after load and after click (default: 4000)
  --outdir <dir>         report directory (default: ticket-agent/tmp/repro-<ts>)
  --save-html            also write before.html / after.html
  --cycle-visibility     fire pagehide/pageshow(persisted) + visibilitychange after load`);
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
  const out = { wait: 4000, saveHtml: false };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--url') out.url = argv[++i];
    else if (key === '--click') out.click = argv[++i];
    else if (key === '--ua-profile') out.uaProfile = argv[++i];
    else if (key === '--wait') out.wait = Number(argv[++i]);
    else if (key === '--outdir') out.outdir = argv[++i];
    else if (key === '--save-html') out.saveHtml = true;
    else if (key === '--cycle-visibility') out.cycleVisibility = true;
    else usage();
  }
  return out;
}

async function snapshot(page) {
  return page.evaluate(() => ({
    url: location.href,
    title: document.title,
    scripts: Array.from(document.scripts).map((script) => {
      if (script.src) return { src: script.src };
      const lines = script.textContent.split('\n');
      return {
        lines: lines.length,
        chars: script.textContent.length,
        maxLine: Math.max(...lines.map((line) => line.length)),
        head: script.textContent.trim().slice(0, 80),
      };
    }),
  }));
}

const args = parseArgs(process.argv.slice(2));
if (!args.url) usage();
if (!UA_PROFILES[args.uaProfile || 'chrome-ios']) usage();

const outdir = path.resolve(args.outdir || `ticket-agent/tmp/repro-${Date.now()}`);
await mkdir(outdir, { recursive: true });

const { webkit } = resolvePlaywright();
const browser = await webkit.launch();
const context = await browser.newContext({ userAgent: UA_PROFILES[args.uaProfile || 'chrome-ios'], viewport: { width: 820, height: 1180 } });
const page = await context.newPage();

await page.addInitScript(() => {
  const captured = (window.__capturedScripts = []);
  const addCode = (via, code) => {
    if (typeof code !== 'string' || code.length < 50) return;
    const lines = code.split('\n');
    captured.push({ via, chars: code.length, lines: lines.length, maxLine: Math.max(...lines.map((line) => line.length)), head: code.trim().slice(0, 200) });
  };
  const addMarkup = (via, markup) => {
    if (typeof markup !== 'string') return;
    addCode(via, markup);
    const re = /<script\b[^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = re.exec(markup))) addCode(`${via}:script`, match[1]);
  };
  try {
    const originalWrite = document.write.bind(document);
    document.write = function (...chunks) {
      try { chunks.forEach((chunk) => addMarkup('document.write', String(chunk))); } catch {}
      return originalWrite(...chunks);
    };
    document.writeln = function (...chunks) {
      try { chunks.forEach((chunk) => addMarkup('document.writeln', String(chunk))); } catch {}
      return originalWrite(chunks.join('') + '\n');
    };
  } catch {}
  for (const name of ['appendChild', 'insertBefore', 'replaceChild']) {
    try {
      const original = Element.prototype[name];
      Element.prototype[name] = function (node, ...rest) {
        try {
          if (node && node.tagName === 'SCRIPT' && !node.src && node.textContent) addCode(name, node.textContent);
        } catch {}
        return original.call(this, node, ...rest);
      };
    } catch {}
  }
  try {
    const descriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    if (descriptor && descriptor.set) {
      Object.defineProperty(Element.prototype, 'innerHTML', {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        get: descriptor.get,
        set(value) {
          try { addMarkup('innerHTML', String(value)); } catch {}
          return descriptor.set.call(this, value);
        },
      });
    }
  } catch {}
  try {
    const originalEval = window.eval;
    window.eval = function (code) {
      try { addCode('eval', String(code)); } catch {}
      return originalEval(code);
    };
  } catch {}
});

const pageErrors = [];
const consoleErrors = [];
page.on('pageerror', (error) => pageErrors.push({ message: error.message, stack: String(error.stack || '').slice(0, 4000) }));
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 1000));
});

async function cycleVisibility() {
  await page.evaluate(() => {
    const setState = (state) => Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
    setState('hidden');
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }));
    setState('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
  });
}

const response = await page.goto(args.url, { waitUntil: 'domcontentloaded', timeout: 60000 });
await page.waitForTimeout(args.wait);
const before = await snapshot(page);
if (args.saveHtml) await writeFile(path.join(outdir, 'before.html'), await page.content());

let clicked = null;
if (args.click) {
  clicked = await page.evaluate((text) => {
    const wanted = text.trim().toUpperCase();
    const candidates = Array.from(document.querySelectorAll('a, button, [role="button"], .s-nav-dropdown-item'));
    const target = candidates.find((element) => (element.textContent || '').trim().toUpperCase() === wanted);
    if (!target) return null;
    const info = { tag: target.tagName, className: target.className, href: target.getAttribute('href') };
    target.click();
    return info;
  }, args.click);
  await page.waitForTimeout(args.wait);
}

if (args.cycleVisibility) {
  await cycleVisibility();
  await page.waitForTimeout(1500);
}

const after = await snapshot(page);
const captured = await page.evaluate(() => window.__capturedScripts || []).catch(() => []);
if (args.saveHtml) await writeFile(path.join(outdir, 'after.html'), await page.content());
await writeFile(path.join(outdir, 'injected-scripts.json'), JSON.stringify(captured, null, 2));

const report = {
  input: { url: args.url, click: args.click ?? null, uaProfile: args.uaProfile || 'chrome-ios', cycleVisibility: !!args.cycleVisibility },
  status: response ? response.status() : null,
  clicked,
  before,
  after,
  capturedScripts: captured,
  pageErrors,
  consoleErrors,
};
await writeFile(path.join(outdir, 'report.json'), JSON.stringify(report, null, 2));
await browser.close();

console.log(JSON.stringify({
  outdir,
  status: report.status,
  clicked,
  urlBefore: before.url,
  urlAfter: after.url,
  pageErrors: pageErrors.length,
  consoleErrors: consoleErrors.length,
  capturedScripts: captured.length,
  firstError: pageErrors[0]?.message ?? null,
}, null, 2));
