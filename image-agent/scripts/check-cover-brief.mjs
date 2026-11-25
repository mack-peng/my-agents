#!/usr/bin/env node
/* Cover brief 校验：必填字段是否齐全、字数、事实来源、尺寸/比例、输出路径。
 *
 * 用法：
 *   node image-agent/scripts/check-cover-brief.mjs <cover-brief.md>
 * 退出码：0 通过（可有 warning）；1 有 error；2 参数/读取错误。
 *
 * 必填 frontmatter：identity、hook、platform、size
 * 校验：hook ≤ 20 字；identity ≤ 14 字；size 格式；facts ≥ 1 条且每条有 source
 */
import { readFileSync } from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('check-cover-brief: usage: check-cover-brief.mjs <cover-brief.md>');
  process.exit(2);
}

let md;
try {
  md = readFileSync(file, 'utf8');
} catch (error) {
  console.error(`check-cover-brief: cannot read ${file}: ${error.message}`);
  process.exit(2);
}

const errors = [];
const warnings = [];

// Parse YAML frontmatter
const fmMatch = /^---\r?\n([\s\S]*?)\r?\n---/.exec(md);
if (!fmMatch) {
  errors.push('缺少 YAML frontmatter（--- … ---）');
}
const fm = {};
if (fmMatch) {
  for (const line of fmMatch[1].split(/\r?\n/)) {
    const kv = /^(\w[\w_]*)\s*:\s*(.*)$/.exec(line.trim());
    if (kv && kv[1]) fm[kv[1]] = kv[2].trim().replace(/^["']|["']$/g, '');
  }
}

// Required fields
const requiredFields = ['identity', 'hook', 'platform', 'size'];
for (const field of requiredFields) {
  if (!fm[field]) errors.push(`frontmatter 缺少必填字段「${field}」`);
}

// Character limits
if (fm.hook) {
  const hookChars = [...fm.hook].length;
  if (hookChars > 20) errors.push(`hook 过长（${hookChars} 字，上限 20）："${fm.hook}"`);
  else if (hookChars > 15) warnings.push(`hook ${hookChars} 字，接近上限`);
}
if (fm.identity) {
  const idChars = [...fm.identity].length;
  if (idChars > 14) warnings.push(`identity ${idChars} 字（建议 ≤14）："${fm.identity}"`);
}

// Size format
if (fm.size && !/^\d+x\d+$/.test(fm.size)) {
  errors.push(`size 格式错误（应为 WxH）："${fm.size}"`);
}

// Platform
if (fm.platform && !['xiaohongshu', 'wechat', 'miniapp', 'video'].includes(fm.platform)) {
  warnings.push(`platform "${fm.platform}" 不在已知列表（xiaohongshu/wechat/miniapp/video），按自定义处理`);
}

// Facts table
const factsStart = md.indexOf('## 事实');
if (factsStart < 0) {
  errors.push('缺少「## 事实」表');
} else {
  const tableRows = [];
  for (const line of md.slice(factsStart).split(/\r?\n/)) {
    if (/^\|.*\|$/.test(line.trim()) && !/^\|[\s:|-]+\|$/.test(line.trim()) && !line.includes('事实') && !line.includes('数字') && !line.includes('来源')) {
      const cells = line.split('|').map((c) => c.trim()).filter(Boolean);
      if (cells.length >= 2) tableRows.push(cells);
    }
  }
  if (tableRows.length === 0) warnings.push('事实表为空——封面数字必须来自确认过的材料，空事实表需补');
  else {
    for (const [i, cells] of tableRows.entries()) {
      if (!cells[0]) errors.push(`事实表第 ${i + 1} 行「事实」为空`);
      if (!cells[cells.length - 1]) errors.push(`事实表第 ${i + 1} 行「来源」为空`);
    }
  }
}

// Output dir
if (!fm.output_dir) warnings.push('frontmatter 未指定 output_dir（将用调用方工作目录）');

for (const w of warnings) console.warn(`warn  ${w}`);
for (const e of errors) console.error(`error ${e}`);
if (errors.length) {
  console.error(`\n✗ ${errors.length} 个错误`);
  process.exit(1);
}
console.log(`✓ ${file} 通过${warnings.length ? `（${warnings.length} 条警告）` : ''}`);
