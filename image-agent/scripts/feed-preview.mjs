#!/usr/bin/env node
/* Feed 预览：把 3:4 封面按信息流 1:1 顶部锚定裁切，并出 320px 缩略图。
 *
 * 用法：
 *   node image-agent/scripts/feed-preview.mjs <cover.png|jpg> [--out-dir <dir>] [--thumb 320]
 *
 * 输出：
 *   <out-dir>/feed-1x1.png        （宽 × 宽，从顶部裁）
 *   <out-dir>/feed-1x1-<thumb>.png
 * 退出码：0 成功；2 参数/依赖/读取失败。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const opts = { thumb: 320 };
const positional = [];
for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (!arg.startsWith('--')) { positional.push(arg); continue; }
  const [key, inline] = arg.slice(2).split('=', 2);
  const value = inline !== undefined ? inline : argv[++i];
  if (value === undefined) {
    console.error(`feed-preview: missing value for --${key}`);
    process.exit(2);
  }
  if (key === 'out-dir') opts.outDir = value;
  else if (key === 'thumb') opts.thumb = Number(value);
  else {
    console.error(`feed-preview: unknown option --${key}`);
    process.exit(2);
  }
}

const input = positional[0];
if (!input) {
  console.error('feed-preview: usage: feed-preview.mjs <cover.png|jpg> [--out-dir <dir>] [--thumb 320]');
  process.exit(2);
}
const src = resolve(input);
if (!existsSync(src)) {
  console.error(`feed-preview: not found: ${src}`);
  process.exit(2);
}

const probe = (file, entries) => {
  try {
    return execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', entries, '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8' })
      .trim().split('\n').map((line) => Number(line.trim()));
  } catch (error) {
    console.error(`feed-preview: ffprobe failed: ${error.message}`);
    process.exit(2);
  }
};
const [width, height] = probe(src, 'stream=width,height');
if (!width || !height) {
  console.error('feed-preview: cannot read image size');
  process.exit(2);
}

const outDir = opts.outDir ? resolve(opts.outDir) : dirname(src);
mkdirSync(outDir, { recursive: true });
const feed = join(outDir, 'feed-1x1.png');
const thumb = join(outDir, `feed-1x1-${opts.thumb}.png`);
const side = Math.min(width, height);

try {
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', src, '-vf', `crop=${side}:${side}:0:0`, feed]);
  execFileSync('ffmpeg', ['-y', '-v', 'error', '-i', feed, '-vf', `scale=${opts.thumb}:-1`, thumb]);
} catch (error) {
  console.error(`feed-preview: ffmpeg failed: ${error.message}`);
  process.exit(2);
}

console.log(JSON.stringify({
  source: src,
  width,
  height,
  feed: { path: feed, width: side, height: side },
  thumb: { path: thumb, width: opts.thumb },
}, null, 2));
