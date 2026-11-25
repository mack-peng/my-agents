#!/usr/bin/env node
/* VTT 体检：空档 / 越界 / 重叠 / 无内嵌时间标签。
 *
 * 用法：
 *   node openfilm-agent/scripts/check-vtt.mjs <dir-or-file> [...]
 *
 * 规则：
 *   - cue 结束超过同名音频时长 +0.1s → error
 *   - cue 之间空档 >0.8s → error；>0.4s → warning
 *   - 相邻 cue 重叠 → error
 *   - cue 文本为空 → error
 *   - cue 无内嵌时间标签（<00:00:00.000>）→ warning（短语级，允许但需人工确认）
 * 没有同名音频时只做语法类检查。
 * 退出码：0 通过（可有 warning）；1 有 error；2 参数/读取错误。
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const inputs = process.argv.slice(2);
if (!inputs.length) {
  console.error('check-vtt: usage: check-vtt.mjs <dir-or-file> [...]');
  process.exit(2);
}

const vttFiles = [];
for (const input of inputs) {
  const p = resolve(input);
  let st;
  try { st = statSync(p); } catch (error) {
    console.error(`check-vtt: cannot read ${input}: ${error.message}`);
    process.exit(2);
  }
  if (st.isDirectory()) {
    for (const name of readdirSync(p)) {
      if (extname(name).toLowerCase() === '.vtt') vttFiles.push(join(p, name));
    }
  } else if (st.isFile() && extname(p).toLowerCase() === '.vtt') {
    vttFiles.push(p);
  }
}
if (!vttFiles.length) {
  console.error('check-vtt: no .vtt files found');
  process.exit(2);
}

const toSeconds = (stamp) => {
  const m = /^(\d{2}):(\d{2}):(\d{2})\.(\d{3})$/.exec(stamp);
  if (!m) return NaN;
  return Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3]) + Number(m[4]) / 1000;
};

const audioFor = (vtt) => {
  const base = basename(vtt, extname(vtt));
  for (const ext of ['.wav', '.mp3', '.m4a']) {
    const candidate = join(dirname(vtt), base + ext);
    if (existsSync(candidate)) return candidate;
  }
  return null;
};

const durationOf = (file) => {
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', file], { encoding: 'utf8' });
    return Number(out.trim()) || null;
  } catch {
    return null;
  }
};

let errors = 0;
let warnings = 0;

for (const vtt of vttFiles) {
  const label = basename(vtt);
  const text = readFileSync(vtt, 'utf8');
  const blocks = text.split(/\r?\n\r?\n+/).slice(1);
  const cues = [];
  for (const block of blocks) {
    const lines = block.split(/\r?\n/).filter((line) => line.trim() !== '');
    const timingIndex = lines.findIndex((line) => line.includes('-->'));
    if (timingIndex < 0) continue;
    const timing = lines[timingIndex];
    const m = /(\d{2}:\d{2}:\d{2}\.\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2}\.\d{3})/.exec(timing);
    if (!m) continue;
    const start = toSeconds(m[1]);
    const end = toSeconds(m[2]);
    const body = lines.slice(timingIndex + 1).join('\n').trim();
    cues.push({ start, end, body });
  }

  const audio = audioFor(vtt);
  const duration = audio ? durationOf(audio) : null;
  const fileErrors = [];
  const fileWarnings = [];
  if (!audio) fileWarnings.push('无同名音频，跳过时长校验');
  if (!cues.length) fileErrors.push('没有可解析的 cue');

  let cursor = null;
  for (const [i, cue] of cues.entries()) {
    if (!(cue.end > cue.start)) fileErrors.push(`cue ${i + 1} 时间轴无效 ${cue.start}→${cue.end}`);
    if (!cue.body) fileErrors.push(`cue ${i + 1} 文本为空`);
    if (!/<\d{2}:\d{2}:\d{2}\.\d{3}>/.test(cue.body)) fileWarnings.push(`cue ${i + 1} 无内嵌时间标签（短语级）`);
    if (duration !== null && cue.end > duration + 0.1) fileErrors.push(`cue ${i + 1} 超出音频（${cue.end.toFixed(2)}s > ${duration.toFixed(2)}s）`);
    if (cursor !== null) {
      const gap = cue.start - cursor;
      if (gap < -0.05) fileErrors.push(`cue ${i} 与 cue ${i + 1} 重叠 ${(-gap).toFixed(2)}s`);
      else if (gap > 0.8) fileErrors.push(`cue ${i}→${i + 1} 空档 ${gap.toFixed(2)}s`);
      else if (gap > 0.4) fileWarnings.push(`cue ${i}→${i + 1} 空档 ${gap.toFixed(2)}s`);
    }
    cursor = Math.max(cursor ?? 0, cue.end);
  }

  errors += fileErrors.length;
  warnings += fileWarnings.length;
  const status = fileErrors.length ? 'FAIL' : (fileWarnings.length ? 'warn' : 'OK');
  console.log(`${label}  ${status}  cues=${cues.length}${duration ? `  audio=${duration.toFixed(2)}s` : ''}`);
  for (const w of fileWarnings) console.log(`  warn  ${w}`);
  for (const e of fileErrors) console.log(`  error ${e}`);
}

console.log(`\n${vttFiles.length} 个 VTT：${errors} error / ${warnings} warning`);
process.exit(errors ? 1 : 0);
