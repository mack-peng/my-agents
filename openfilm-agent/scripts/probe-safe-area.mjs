#!/usr/bin/env node
/* 安全区几何探针（通用）：量一个影片工程各页面的内容实际边界，并按安全区阈值报越界。
 *
 * 用法：
 *   node openfilm-agent/scripts/probe-safe-area.mjs <dir> [options]
 *
 *   --glob "scene*.html,cover*.html"  页面匹配（默认 scene*.html,still*.html）
 *   --content-root <selector>         内容根（默认 document.body）
 *   --probe "<sel>,<sel>"             额外报边界的元素（可选，furniture 用）
 *   --times "0,1,2"                   采样时刻（默认按 film.duration 取 5 个点）
 *   --overlap                         同时检测信息元素两两重叠（容差 10px）
 *   --overlap-tolerance <px>          重叠容差（默认 10）
 *   --width <px> --height <px>        覆盖 viewport（默认读页面 <meta name="viewport">）
 *   --safe-top <px> --safe-bottom <px> --safe-left <px> --safe-right <px>
 *                                     安全区阈值；1080×1920 纵向默认套小红书 v3：220/1480/84/940
 *   --right-band-top <px> --right-band-bottom <px>
 *                                     右界生效的纵向区间（默认 620–1400，右侧互动列）
 *   --json                            输出 JSON
 *   --strict                          有越界时 exit 1
 *
 * 内容口径：每个采样时刻调用 window.film.frame(t) 后，量可见的「带直接文字的元素」+
 * 替换元素（img/svg/canvas/video/picture）+ 有 url() 背景图的圆角卡片；跳过
 * [data-bleed] 装饰层与隐藏/零尺寸元素。全屏背景 wrapper 不计入内容边界。
 * 右界只在该元素与右侧互动列纵向区间相交时检查（v3 口径）。
 *
 * 退出码：0 正常；1 --strict 下有越界；2 页面/依赖/结构不匹配（不再静默 null/0）。
 *
 * 安全区基线（与 references/visual-qa.md v3 同步）：顶部 0–220；内容 240–1480；
 * 右界 x≤940（右侧互动列 y≈620–1400）；字幕带 ~1502–1646（基线 0.82）；平台描述区 1620+
 */
import { createReadStream, existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { execFileSync } from 'node:child_process';
import { extname, join, resolve, sep } from 'node:path';
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

function fail(message) {
  console.error(`probe-safe-area: ${message}`);
  process.exit(2);
}

const opts = {
  glob: ['scene*.html', 'still*.html'],
  probes: [],
  strict: false,
  json: false,
  overlap: false,
  overlapTolerance: 10,
};
const positional = [];
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (!arg.startsWith('--')) {
    positional.push(arg);
    continue;
  }
  if (arg === '--json') { opts.json = true; continue; }
  if (arg === '--strict') { opts.strict = true; continue; }
  if (arg === '--overlap') { opts.overlap = true; continue; }
  const [key, inline] = arg.slice(2).split('=', 2);
  const value = inline !== undefined ? inline : argv[++i];
  if (value === undefined) fail(`missing value for --${key}`);
  if (key === 'glob') opts.glob = value.split(',').map((s) => s.trim()).filter(Boolean);
  else if (key === 'content-root') opts.contentRoot = value;
  else if (key === 'probe') opts.probes = value.split(',').map((s) => s.trim()).filter(Boolean);
  else if (key === 'times') opts.times = value.split(',').map(Number).filter(Number.isFinite);
  else if (key === 'width') opts.width = Number(value);
  else if (key === 'height') opts.height = Number(value);
  else if (key === 'safe-top') opts.safeTop = Number(value);
  else if (key === 'safe-bottom') opts.safeBottom = Number(value);
  else if (key === 'safe-left') opts.safeLeft = Number(value);
  else if (key === 'safe-right') opts.safeRight = Number(value);
  else if (key === 'right-band-top') opts.rightBandTop = Number(value);
  else if (key === 'right-band-bottom') opts.rightBandBottom = Number(value);
  else if (key === 'overlap-tolerance') opts.overlapTolerance = Number(value);
  else fail(`unknown option --${key}`);
}
for (const key of ['width', 'height', 'safeTop', 'safeBottom', 'safeLeft', 'safeRight', 'rightBandTop', 'rightBandBottom', 'overlapTolerance']) {
  if (opts[key] !== undefined && !Number.isFinite(opts[key])) fail(`invalid number for --${key}`);
}

const dir = resolve(positional[0] ?? '.');
const escapeRe = (s) => s.replace(/[.+^${}()|[\]\\]/g, '\\$&');
const globToRe = (g) => new RegExp(`^${g.split('*').map(escapeRe).join('.*')}$`);
const matchers = opts.glob.map(globToRe);

let entries;
try {
  entries = readdirSync(dir, { withFileTypes: true });
} catch (error) {
  fail(`cannot read ${dir}: ${error.message}`);
}
const pages = entries
  .filter((entry) => entry.isFile() && matchers.some((re) => re.test(entry.name)))
  .map((entry) => entry.name)
  .sort();
if (!pages.length) fail(`no pages matching ${opts.glob.join(',')} in ${dir}`);

function viewportFrom(html) {
  const meta = /<meta[^>]+name=["']viewport["'][^>]*>/i.exec(html);
  if (!meta) return null;
  const content = /content=["']([^"']+)["']/i.exec(meta[0])?.[1] ?? '';
  const width = /width\s*=\s*(\d+)/i.exec(content)?.[1];
  const height = /height\s*=\s*(\d+)/i.exec(content)?.[1];
  return width && height ? { width: Number(width), height: Number(height) } : null;
}

function normalizePlaywright(module) {
  return module.chromium ? module : (module.default ?? module);
}

async function loadPlaywright() {
  if (process.env.OPENFILM_PLAYWRIGHT) {
    return normalizePlaywright(await import(pathToFileURL(resolve(process.env.OPENFILM_PLAYWRIGHT)).href));
  }
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
    try {
      return normalizePlaywright(await import(pathToFileURL(candidate).href));
    } catch {}
  }
  throw new Error('playwright-core not found; install it or set OPENFILM_PLAYWRIGHT');
}

function startServer(root) {
  const server = createServer((req, res) => {
    try {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, '');
      const file = resolve(root, rel || 'index.html');
      if (file !== root && !file.startsWith(root + sep)) {
        res.writeHead(403).end('Forbidden');
        return;
      }
      if (!existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404).end('Not found');
        return;
      }
      const stat = statSync(file);
      res.writeHead(200, {
        'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
        'content-length': stat.size,
        'cache-control': 'no-store',
      });
      if (req.method === 'HEAD') { res.end(); return; }
      createReadStream(file).pipe(res);
    } catch {
      res.writeHead(500).end('Server error');
    }
  });
  return new Promise((resolveServer, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolveServer({ server, port: server.address().port }));
  });
}

const { chromium } = await loadPlaywright();
const browser = await chromium.launch({ headless: true });
const { server, port } = await startServer(dir);
const results = [];
let structuralError = false;
let hasViolation = false;
let hasOverlap = false;

for (const file of pages) {
  const html = readFileSync(join(dir, file), 'utf8');
  const fromMeta = viewportFrom(html);
  const viewport = {
    width: opts.width ?? fromMeta?.width ?? 1080,
    height: opts.height ?? fromMeta?.height ?? 1920,
  };
  const isXhsVertical = viewport.width === 1080 && viewport.height === 1920;
  const limits = {
    top: opts.safeTop ?? (isXhsVertical ? 220 : undefined),
    bottom: opts.safeBottom ?? (isXhsVertical ? 1480 : undefined),
    left: opts.safeLeft ?? (isXhsVertical ? 84 : undefined),
    right: opts.safeRight ?? (isXhsVertical ? 940 : undefined),
  };
  const rightBand = {
    top: opts.rightBandTop ?? 620,
    bottom: opts.rightBandBottom ?? 1400,
  };

  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const requireFilm = /^scene/i.test(file);
  try {
    await page.goto(`http://127.0.0.1:${port}/${encodeURIComponent(file)}`, { waitUntil: 'load' });
    await page.waitForTimeout(300);
    const data = await page.evaluate(async ({ contentRoot, probes, limits, times, rightBand, requireFilm, overlap, overlapTolerance }) => {
      const rootSelector = contentRoot || 'body';
      const root = document.querySelector(rootSelector);
      if (!root) return { error: `content root not found: ${rootSelector}` };

      if (requireFilm && typeof window.film?.frame !== 'function') {
        return { error: 'window.film not found (ES module failed to load?)' };
      }

      if (window.film?.ready) {
        try { await window.film.ready; } catch {}
      }
      const duration = Number(window.film?.duration) || 0;
      const sampleTimes = times?.length
        ? times
        : (duration > 0
          ? [0, duration * 0.25, duration * 0.5, duration * 0.75, Math.max(0, duration - 0.05)]
          : [0]);

      const isTextCarrier = (el) => {
        for (const node of el.childNodes) {
          if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) return true;
        }
        return false;
      };
      const isReplaced = (el) => ['IMG', 'SVG', 'CANVAS', 'VIDEO', 'PICTURE'].includes(el.tagName);
      const visible = (el) => {
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.05) return false;
        for (let node = el.parentElement; node; node = node.parentElement) {
          const pcs = getComputedStyle(node);
          if (pcs.display === 'none' || pcs.visibility === 'hidden' || Number(pcs.opacity) < 0.05) return false;
        }
        return true;
      };
      const textRect = (el) => {
        let box = null;
        for (const node of el.childNodes) {
          if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const r of range.getClientRects()) {
            if (r.width <= 0 || r.height <= 0) continue;
            box = box
              ? {
                left: Math.min(box.left, r.left), top: Math.min(box.top, r.top),
                right: Math.max(box.right, r.right), bottom: Math.max(box.bottom, r.bottom),
              }
              : { left: r.left, top: r.top, right: r.right, bottom: r.bottom };
          }
        }
        return box;
      };

      let left = Infinity, top = Infinity, right = -Infinity, bottom = -Infinity;
      let rightBandMax = -Infinity;
      let counted = 0;
      const offenders = new Map();
      const overlaps = new Map();
      let sampleRects = [];
      const elements = [...root.querySelectorAll('*')];

      // 重叠用元素布局盒（line-height 会扭曲 Range 文本盒，1040/1046 教训）
      const glyphRect = (entry) => entry.rect;
      const checkOverlaps = (rects) => {
        for (let i = 0; i < rects.length; i += 1) {
          for (let j = i + 1; j < rects.length; j += 1) {
            const a = rects[i];
            const b = rects[j];
            if (a.el.contains(b.el) || b.el.contains(a.el)) continue;
            const ar = glyphRect(a);
            const br = glyphRect(b);
            const ox = Math.min(ar.right, br.right) - Math.max(ar.left, br.left);
            const oy = Math.min(ar.bottom, br.bottom) - Math.max(ar.top, br.top);
            if (ox <= overlapTolerance || oy <= overlapTolerance) continue;
            const key = [a.selector, b.selector].sort().join(' × ');
            const entry = {
              a: a.selector, b: b.selector,
              w: Math.round(ox), h: Math.round(oy), area: Math.round(ox * oy),
            };
            const prev = overlaps.get(key);
            if (!prev || entry.area > prev.area) overlaps.set(key, entry);
          }
        }
      };

      const measure = () => {
        for (const el of elements) {
          if (el === root) continue;
          if (el.closest('[data-bleed]')) continue;
          if (!visible(el)) continue;

          const cs = getComputedStyle(el);
          const radius = parseFloat(cs.borderTopLeftRadius) || 0;
          const hasCardBg = typeof cs.backgroundImage === 'string'
            && cs.backgroundImage.includes('url(') && radius > 0;
          const textCarrier = isTextCarrier(el);
          if (!textCarrier && !isReplaced(el) && !hasCardBg) continue;

          if (textCarrier) {
            const alpha = /rgba?\(([^)]+)\)/.exec(cs.color)?.[1]?.split(',').map(Number);
            const colorAlpha = alpha && alpha.length === 4 ? alpha[3] : 1;
            if (colorAlpha < 0.15) continue;
          }

          const rect = (textCarrier && !isReplaced(el))
            ? (textRect(el) ?? el.getBoundingClientRect())
            : el.getBoundingClientRect();
          if (rect.width <= 0 || rect.height <= 0) continue;

          counted += 1;
          left = Math.min(left, rect.left);
          top = Math.min(top, rect.top);
          right = Math.max(right, rect.right);
          bottom = Math.max(bottom, rect.bottom);

          const rightApplies = limits.right !== undefined && !hasCardBg
            && rect.bottom > rightBand.top && rect.top < rightBand.bottom;
          if (rightApplies) rightBandMax = Math.max(rightBandMax, rect.right);
          const overflow = {
            left: limits.left !== undefined ? limits.left - rect.left : 0,
            top: limits.top !== undefined ? limits.top - rect.top : 0,
            right: rightApplies ? rect.right - limits.right : 0,
            bottom: limits.bottom !== undefined ? rect.bottom - limits.bottom : 0,
          };
          const worst = Math.max(...Object.values(overflow));
          const selector = el.tagName.toLowerCase()
            + (el.id ? `#${el.id}` : '')
            + (typeof el.className === 'string' && el.className.trim()
              ? `.${el.className.trim().split(/\s+/).join('.')}`
              : '');
          sampleRects.push({ el, selector, rect: el.getBoundingClientRect() });
          if (worst > 0) {
            const previous = offenders.get(selector);
            if (!previous || worst > previous.overflow) {
              offenders.set(selector, {
                selector,
                overflow: Number(worst.toFixed(1)),
                rect: { left: rect.left, top: rect.top, right: rect.right, bottom: rect.bottom },
              });
            }
          }
        }
      };

      for (const t of sampleTimes) {
        if (typeof window.film?.frame === 'function') {
          await window.film.frame(t);
          await new Promise((resolve) => requestAnimationFrame(() => resolve()));
        }
        sampleRects = [];
        measure();
        if (overlap) checkOverlaps(sampleRects);
      }

      const probeValues = {};
      for (const selector of probes) {
        const el = document.querySelector(selector);
        if (!el) { probeValues[selector] = null; continue; }
        const r = el.getBoundingClientRect();
        probeValues[selector] = {
          left: Math.round(r.left), top: Math.round(r.top),
          right: Math.round(r.right), bottom: Math.round(r.bottom),
        };
      }

      const violations = [];
      const check = (kind, value, limit) => {
        if (limit === undefined) return;
        const over = kind === 'left' || kind === 'top' ? limit - value : value - limit;
        if (over > 0) violations.push({ kind, value: Number(value.toFixed(1)), limit, over: Number(over.toFixed(1)) });
      };
      if (counted > 0) {
        check('left', left, limits.left);
        check('top', top, limits.top);
        if (rightBandMax > -Infinity) check('right', rightBandMax, limits.right);
        check('bottom', bottom, limits.bottom);
      }

      return {
        counted,
        sampledTimes: sampleTimes.map((t) => Number(t.toFixed(2))),
        content: counted > 0 ? {
          left: Math.round(left), top: Math.round(top),
          right: Math.round(right), bottom: Math.round(bottom),
        } : null,
        probes: probeValues,
        violations,
        overlaps: [...overlaps.values()].sort((a, b) => b.area - a.area).slice(0, 8),
        offenders: [...offenders.values()].sort((a, b) => b.overflow - a.overflow).slice(0, 5),
      };
    }, {
      contentRoot: opts.contentRoot,
      probes: opts.probes,
      limits,
      times: opts.times,
      rightBand,
      requireFilm,
      overlap: opts.overlap,
      overlapTolerance: opts.overlapTolerance,
    });

    if (data.error || data.counted === 0) {
      structuralError = true;
      results.push({ page: file, viewport, error: data.error || 'no measurable content (structure mismatch?)' });
      continue;
    }
    if (data.violations.length) hasViolation = true;
    if (data.overlaps?.length) hasOverlap = true;
    results.push({ page: file, viewport, ...data });
  } catch (error) {
    structuralError = true;
    results.push({ page: file, viewport, error: error.message });
  } finally {
    await context.close();
  }
}

await browser.close();
server.close();

if (opts.json) {
  console.log(JSON.stringify({ dir, results }, null, 2));
} else {
  for (const result of results) {
    if (result.error) {
      console.log(`${result.page}  ERROR  ${result.error}`);
      continue;
    }
    const c = result.content;
    const status = result.violations.length
      ? `OVER ${result.violations.map((v) => `${v.kind} ${v.value}>${v.limit}`).join(', ')}`
      : 'OK';
    console.log(`${result.page}  ${result.viewport.width}×${result.viewport.height}  content L${c.left} R${c.right} T${c.top} B${c.bottom}  ${status}`);
    for (const offender of result.offenders) {
      console.log(`  - ${offender.selector}  overflow ${offender.overflow}px  rect ${JSON.stringify(offender.rect)}`);
    }
    for (const o of result.overlaps || []) {
      console.log(`  - OVERLAP ${o.a} × ${o.b}  ${o.w}×${o.h}px`);
    }
    for (const [selector, rect] of Object.entries(result.probes)) {
      console.log(`  probe ${selector}: ${rect ? `L${rect.left} R${rect.right} T${rect.top} B${rect.bottom}` : 'not found'}`);
    }
  }
}

if (structuralError) process.exit(2);
if (opts.strict && (hasViolation || hasOverlap)) process.exit(1);
