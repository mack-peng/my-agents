/* 安全区几何探针：量一个影片工程各页面的家具/内容实际边界。
 * 用法：node openfilm-agent/scripts/probe-safe-area.mjs output/<film-dir>
 * 依赖：playwright-core（优先 openfilm fork 的 node_modules）
 * 输出：每页 mast / src / stamp / priceRow / contentBottom 的 top/bottom（1080×1920 坐标）
 * 安全区基线（2026-10 w4 复盘）：顶部留空 0–252；内容底 ≤1400；字幕带 ~1465–1553；平台描述区 1620+
 */
import { chromium } from '/Users/mack/Open-projects/openfilm/packages/openfilm/node_modules/playwright-core/index.mjs';
import { readdirSync } from 'fs';
import { join, resolve } from 'path';

const dir = resolve(process.argv[2] ?? '.');
const pages = readdirSync(dir).filter((f) => /^scene.*\.html$|^still.*\.html$/.test(f)).sort();
if (!pages.length) {
  console.error(`no scene/still html found in ${dir}`);
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });

for (const f of pages) {
  await page.goto('file://' + join(dir, f));
  await page.waitForTimeout(300);
  const data = await page.evaluate(() => {
    const pick = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { top: Math.round(r.top), bottom: Math.round(r.bottom) };
    };
    let contentMax = 0;
    document.querySelectorAll('#stage > div:not(.rail):not(.mast):not(.src)').forEach((d) => {
      const r = d.getBoundingClientRect();
      if (r.bottom > contentMax) contentMax = Math.round(r.bottom);
    });
    return {
      mast: pick('.mast'),
      src: pick('.src'),
      stamp: pick('.stamp'),
      priceRow: pick('#priceRow'),
      contentBottom: contentMax,
    };
  });
  console.log(f.replace('.html', ''), JSON.stringify(data));
}
await browser.close();
