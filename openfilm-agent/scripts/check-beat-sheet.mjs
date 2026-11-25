#!/usr/bin/env node
/* Beat sheet 校验：节拍表是否具备“可开拍”的最小结构。
 *
 * 用法：
 *   node openfilm-agent/scripts/check-beat-sheet.mjs <beat-sheet.md>
 *
 * 校验：
 *   1. 有「承诺」且非空、有「总时长」
 *   2. 节拍表存在且含列：t / act / 职责 / 新增信息 / 画面变化 / VO / re-hook / payoff
 *   3. ≥4 个数据行；每行 t / act / 职责 / 新增信息 / 画面变化 非空
 *   4. 至少一行标 re-hook，至少一行标 payoff
 *   5. 文件里出现 30% / 50% / 70% 检查点（缺失只警告）
 * 退出码：0 通过；1 有错误；2 参数/读取错误。
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('check-beat-sheet: usage: check-beat-sheet.mjs <beat-sheet.md>');
  process.exit(2);
}

let md;
try {
  md = readFileSync(file, 'utf8');
} catch (error) {
  console.error(`check-beat-sheet: cannot read ${file}: ${error.message}`);
  process.exit(2);
}

const errors = [];
const warnings = [];
const lines = md.split(/\r?\n/);

const sectionText = (title) => {
  const start = lines.findIndex((line) => line.trim() === `## ${title}`);
  if (start < 0) return '';
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((line) => /^##\s/.test(line));
  return (end < 0 ? rest : rest.slice(0, end)).join('\n').trim();
};

const promise = sectionText('承诺（promise）') || sectionText('承诺');
if (!promise || /^一句话：\s*<.*>\s*$/.test(promise) || promise.replace(/^一句话：/, '').trim() === '') {
  errors.push('「承诺（promise）」为空或仍是占位符');
}
if (!/总时长\s*[:：]\s*\S+/.test(md)) errors.push('缺少「总时长」');

const tableStart = lines.findIndex((line) => /^\|\s*t\s*\|/.test(line));
if (tableStart < 0) {
  errors.push('找不到节拍表（表头需以 `| t |` 开头）');
} else {
  const header = lines[tableStart].split('|').map((cell) => cell.trim()).filter(Boolean);
  const required = ['t', 'act', '职责', '新增信息', '画面变化', 'VO', 're-hook', 'payoff'];
  for (const col of required) {
    if (!header.includes(col)) errors.push(`节拍表缺列「${col}」`);
  }
  const rows = [];
  for (let i = tableStart + 1; i < lines.length; i += 1) {
    const line = lines[i].trim();
    if (!line.startsWith('|')) break;
    if (/^\|[\s:|-]+\|$/.test(line)) continue;
    rows.push(line.split('|').map((cell) => cell.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1));
  }
  if (rows.length < 4) errors.push(`节拍表只有 ${rows.length} 行（至少 4 行）`);
  const idx = Object.fromEntries(header.map((name, i) => [name, i]));
  let rehook = 0;
  let payoff = 0;
  rows.forEach((cells, r) => {
    const get = (name) => (idx[name] === undefined ? '' : (cells[idx[name]] ?? '').trim());
    for (const col of ['t', 'act', '职责', '新增信息', '画面变化']) {
      if (!get(col)) errors.push(`第 ${r + 1} 行「${col}」为空`);
    }
    if (/[✓✔是]|yes/i.test(get('re-hook'))) rehook += 1;
    if (/[✓✔是]|yes/i.test(get('payoff'))) payoff += 1;
  });
  if (!rehook) warnings.push('没有任何一行标 re-hook（50% 检查点）');
  if (!payoff) errors.push('没有任何一行标 payoff（结尾必须回答开头）');
}

for (const pct of ['30%', '50%', '70%']) {
  if (!md.includes(pct)) warnings.push(`未出现 ${pct} 检查点`);
}

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} 个错误`);
  process.exit(1);
}
console.log(`✓ ${file} 通过${warnings.length ? `（${warnings.length} 条警告）` : ''}`);
