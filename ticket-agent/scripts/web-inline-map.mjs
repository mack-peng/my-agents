#!/usr/bin/env node
import { readFile } from 'node:fs/promises';

function usage() {
  console.error(`Usage: web-inline-map.mjs --file <page.html> [options]

  --file <page.html>   saved HTML document
  --at <L:C,...>       map WebKit document-relative line:col positions to inline script source
  --min-lines <n>      only list blocks with at least n lines (default: 5)
  --min-chars <n>      only list blocks with at least n chars (default: 500)
  --json               machine-readable output`);
  process.exit(2);
}

function parseArgs(argv) {
  const out = { minLines: 5, minChars: 500 };
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--file') out.file = argv[++i];
    else if (key === '--at') out.at = argv[++i];
    else if (key === '--min-lines') out.minLines = Number(argv[++i]);
    else if (key === '--min-chars') out.minChars = Number(argv[++i]);
    else if (key === '--json') out.json = true;
    else usage();
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
if (!args.file) usage();

const html = await readFile(args.file, 'utf8');

function lineColOfIndex(index) {
  const before = html.slice(0, index);
  return {
    line: before.split('\n').length,
    col: index - before.lastIndexOf('\n'),
  };
}

const blocks = [];
const re = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
let match;
while ((match = re.exec(html))) {
  if (/\bsrc\s*=/i.test(match[1])) continue;
  const attrs = match[1].trim();
  const contentStart = match.index + match[0].indexOf('>') + 1;
  const { line: startLine, col: startCol } = lineColOfIndex(contentStart);
  const content = match[2];
  const lines = content.split('\n');
  const maxLine = Math.max(...lines.map((line) => line.length));
  blocks.push({
    index: blocks.length,
    startLine,
    startCol,
    lines: lines.length,
    chars: content.length,
    maxLine,
    attrs,
    head: content.trim().split('\n')[0].slice(0, 80),
    contentLines: lines,
  });
}

const filtered = blocks.filter((block) => block.lines >= args.minLines && block.chars >= args.minChars);

if (args.at) {
  const targets = args.at.split(',').map((raw) => {
    const [line, col] = raw.split(':').map(Number);
    return { raw, line, col };
  });
  const results = targets.map((target) => {
    const block = blocks.find((candidate) => target.line >= candidate.startLine && target.line < candidate.startLine + candidate.lines);
    if (!block) return { ...target, block: null, reason: 'no inline script block covers this document line' };
    const sourceLine = target.line - block.startLine + 1;
    const sourceCol = sourceLine === 1 ? target.col - (block.startCol - 1) : target.col;
    const text = block.contentLines[sourceLine - 1] ?? '';
    return {
      ...target,
      block: block.index,
      blockStartLine: block.startLine,
      sourceLine,
      sourceCol,
      lineLength: text.length,
      inRange: sourceCol >= 1 && sourceCol <= text.length + 1,
      text,
    };
  });
  if (args.json) {
    console.log(JSON.stringify({ file: args.file, blocks: filtered.map(({ contentLines, ...rest }) => rest), mappings: results }, null, 2));
  } else {
    console.log(`file: ${args.file}`);
    console.log(`inline blocks: ${blocks.length} (shown: ${filtered.length})`);
    for (const block of filtered) {
      console.log(`  #${block.index} doc-line ${block.startLine} col ${block.startCol} | ${block.lines} lines | ${block.chars} chars | maxLine ${block.maxLine} | ${block.head}`);
    }
    console.log('mappings:');
    for (const result of results) {
      if (!result.block && result.block !== 0) {
        console.log(`  ${result.raw} -> ${result.reason}`);
        continue;
      }
      const flag = result.inRange ? 'OK' : 'OUT-OF-RANGE';
      console.log(`  ${result.raw} -> block #${result.block} source-line ${result.sourceLine} source-col ${result.sourceCol} [${flag}] (line len ${result.lineLength})`);
      const from = Math.max(1, result.sourceLine - 2);
      const to = Math.min(result.block.lines, result.sourceLine + 2);
      for (let line = from; line <= to; line++) {
        const marker = line === result.sourceLine ? '>' : ' ';
        console.log(`    ${marker} ${String(line).padStart(4)} ${blocks[result.block].contentLines[line - 1].slice(0, 160)}`);
      }
    }
  }
} else {
  if (args.json) {
    console.log(JSON.stringify({ file: args.file, blocks: filtered.map(({ contentLines, ...rest }) => rest) }, null, 2));
  } else {
    console.log(`file: ${args.file}`);
    console.log(`inline blocks: ${blocks.length} (shown: ${filtered.length})`);
    for (const block of filtered) {
      console.log(`  #${block.index} doc-line ${block.startLine} col ${block.startCol} | ${block.lines} lines | ${block.chars} chars | maxLine ${block.maxLine} | ${block.head}`);
    }
  }
}
