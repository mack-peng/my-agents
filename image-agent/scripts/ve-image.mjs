import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname } from 'node:path';

const RATIOS = {
  '1:1': [1024, 1024],
  '3:4': [1536, 2048],
  '4:3': [2048, 1536],
  '16:9': [2048, 1152],
  '9:16': [1152, 2048],
  '2.35:1': [2048, 872],
};

const argv = process.argv.slice(2);
const mode = argv[0];
const opts = {
  reqKey: '',
  size: '1536x2048',
  seed: undefined,
  scale: 7,
  timeout: 180,
  poll: 2,
  receipt: '',
  taskId: '',
  dryRun: false,
};
let prompt = '';
let image = '';
let out = '';

for (let i = 1; i < argv.length; i += 1) {
  const arg = argv[i];
  if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);
  if (arg === '--dry-run') {
    opts.dryRun = true;
    continue;
  }
  const [key, inline] = arg.slice(2).split('=', 2);
  const value = inline !== undefined ? inline : argv[++i];
  if (value === undefined) throw new Error(`Missing value for --${key}`);
  if (key === 'prompt') prompt = value;
  else if (key === 'image') image = value;
  else if (key === 'out') out = value;
  else if (key === 'req-key') opts.reqKey = value;
  else if (key === 'size') opts.size = value;
  else if (key === 'seed') opts.seed = Number(value);
  else if (key === 'scale') opts.scale = Number(value);
  else if (key === 'timeout') opts.timeout = Number(value);
  else if (key === 'poll') opts.poll = Number(value);
  else if (key === 'receipt') opts.receipt = value;
  else if (key === 'task-id') opts.taskId = value;
  else throw new Error(`Unknown option --${key}`);
}

if (!['t2i', 'i2i'].includes(mode)) {
  throw new Error('Usage: node image-agent/scripts/ve-image.mjs <t2i|i2i> --prompt "..." --out <file> [--image <file>] [--size 1536x2048|3:4] [--req-key ...] [--seed 42] [--task-id ...] [--dry-run]  (i2i: output size follows the input image)');
}
if (!prompt) throw new Error('--prompt is required');
if (!out) throw new Error('--out is required');
if (!Number.isFinite(opts.timeout) || opts.timeout <= 0) throw new Error('--timeout must be a positive number of seconds');
if (!Number.isFinite(opts.poll) || opts.poll <= 0) throw new Error('--poll must be a positive number of seconds');

function parseJson(text) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('ve returned nothing');
  try {
    return JSON.parse(trimmed);
  } catch {}
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) {
    try {
      return JSON.parse(trimmed.slice(start, end + 1));
    } catch {}
  }
  throw new Error(`ve did not return JSON:\n${trimmed.slice(0, 2000)}`);
}

function findValue(value, keys) {
  if (value == null || typeof value !== 'object') return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findValue(item, keys);
      if (found !== undefined) return found;
    }
    return undefined;
  }
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(value, key) && value[key] != null && value[key] !== '') return value[key];
  }
  for (const item of Object.values(value)) {
    const found = findValue(item, keys);
    if (found !== undefined) return found;
  }
  return undefined;
}

function errorOf(body) {
  const error = findValue(body, ['Error', 'error']);
  if (error && typeof error === 'object') {
    const code = findValue(error, ['Code', 'code']);
    const message = findValue(error, ['Message', 'message']);
    if (code || message) return `${code ?? 'error'}: ${message ?? ''}`.trim();
  }
  const code = findValue(body, ['code', 'Code']);
  if (code != null && Number(code) !== 10000 && Number(code) !== 0) {
    return `${code}: ${findValue(body, ['message', 'Message']) ?? ''}`.trim();
  }
  return '';
}

function runVe(args) {
  const result = spawnSync('ve', args, {
    encoding: 'utf8',
    timeout: 180000,
    maxBuffer: 32 * 1024 * 1024,
  });
  const text = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
  if (result.error) throw result.error;
  if (result.status !== 0 && !text.includes('{')) {
    throw new Error(`ve exited ${result.status}: ${text.slice(0, 2000)}`);
  }
  const body = parseJson(result.stdout?.trim() || text);
  const error = errorOf(body);
  if (error) throw new Error(`Volcengine: ${error}`);
  return body;
}

function parseSize(text) {
  if (RATIOS[text]) return { width: RATIOS[text][0], height: RATIOS[text][1] };
  const match = text.match(/^(\d+)\s*[x*×]\s*(\d+)$/i);
  if (!match) throw new Error('--size must be WxH (1536x2048) or one of 1:1, 3:4, 4:3, 16:9, 9:16, 2.35:1');
  const width = Number(match[1]);
  const height = Number(match[2]);
  if (width < 512 || height < 512 || width > 4096 || height > 4096) throw new Error('--size must be between 512 and 4096 on each side');
  return { width, height };
}

function imageInfo(file) {
  try {
    const info = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', file], { encoding: 'utf8' });
    return {
      width: Number(info.match(/pixelWidth:\s*(\d+)/)?.[1]) || null,
      height: Number(info.match(/pixelHeight:\s*(\d+)/)?.[1]) || null,
    };
  } catch {
    return { width: null, height: null };
  }
}

async function saveImage(body, target) {
  const urls = findValue(body, ['image_urls', 'ImageUrls', 'imageUrls']);
  const binary = findValue(body, ['binary_data_base64', 'BinaryDataBase64', 'binaryDataBase64']);
  let buffer;
  let contentType = '';
  let source = '';
  if (Array.isArray(urls) && urls.length) {
    source = String(urls[0]);
    if (!/^https?:\/\//i.test(source)) throw new Error(`Unexpected image URL: ${source}`);
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
    contentType = response.headers.get('content-type') ?? '';
    buffer = Buffer.from(await response.arrayBuffer());
  } else if (typeof urls === 'string' && urls) {
    source = urls;
    const response = await fetch(source);
    if (!response.ok) throw new Error(`Download failed: HTTP ${response.status}`);
    contentType = response.headers.get('content-type') ?? '';
    buffer = Buffer.from(await response.arrayBuffer());
  } else if (binary) {
    const value = Array.isArray(binary) ? binary[0] : binary;
    source = 'binary_data_base64';
    buffer = Buffer.from(String(value).replace(/^data:image\/[a-z0-9.+-]+;base64,/i, ''), 'base64');
    contentType = 'image/png';
  } else {
    throw new Error('Volcengine returned no image_urls or binary_data_base64');
  }
  let file = target;
  if (!extname(file)) {
    if (/jpe?g/i.test(contentType)) file += '.jpg';
    else if (/webp/i.test(contentType)) file += '.webp';
    else file += '.png';
  }
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, buffer);
  return { file, source, contentType, bytes: buffer.length, ...imageInfo(file) };
}

async function downloadIfNeeded(reqKey, taskId) {
  const started = Date.now();
  for (;;) {
    const body = runVe([
      'cv', 'CVSync2AsyncGetResult',
      '--force', '--version', '2022-08-31', '--method', 'POST',
      '--region', 'cn-north-1', '--endpoint', 'visual.volcengineapi.com',
      '--body', JSON.stringify({ req_key: reqKey, task_id: taskId, req_json: '{"return_url":true}' }),
    ]);
    const data = body && typeof body === 'object' && body.data && typeof body.data === 'object' ? body.data : body;
    const status = String(data?.status ?? data?.Status ?? findValue(body, ['status', 'Status']) ?? '').toLowerCase();
    if (['done', 'success', 'succeed', 'finished'].includes(status)) return body;
    if (['fail', 'failed', 'error'].includes(status)) {
      throw new Error(`Volcengine task failed: ${JSON.stringify(body).slice(0, 2000)}`);
    }
    if (Date.now() - started > opts.timeout * 1000) {
      throw new Error(`Volcengine task timed out after ${opts.timeout}s (status=${status || 'unknown'}, task=${taskId})`);
    }
    await new Promise((done) => setTimeout(done, opts.poll * 1000));
  }
}

const startedAt = Date.now();
let result;
let taskId = '';
let reqKey = opts.reqKey;

if (mode === 't2i') {
  reqKey ||= 'jimeng_t2i_v40';
  const { width, height } = parseSize(opts.size);
  const body = {
    req_key: reqKey,
    prompt,
    width,
    height,
    force_single: true,
  };
  if (Number.isFinite(opts.seed)) body.seed = Math.round(opts.seed);
  if (opts.dryRun) {
    process.stdout.write(`${JSON.stringify({ dryRun: true, provider: 'volcengine', mode, reqKey, body, out }, null, 2)}\n`);
    process.exit(0);
  }
  if (opts.taskId) {
    taskId = opts.taskId;
  } else {
    const submit = runVe([
      'cv', 'CVSync2AsyncSubmitTask',
      '--force', '--version', '2022-08-31', '--method', 'POST',
      '--region', 'cn-north-1', '--endpoint', 'visual.volcengineapi.com',
      '--body', JSON.stringify(body),
    ]);
    taskId = String(findValue(submit, ['task_id', 'TaskId', 'taskId', 'TaskID']) ?? '');
    if (!taskId) throw new Error(`Volcengine submit returned no task_id: ${JSON.stringify(submit).slice(0, 2000)}`);
  }
  const done = await downloadIfNeeded(reqKey, taskId);
  result = await saveImage(done, out);
} else {
  if (!image) throw new Error('i2i requires --image');
  if (!existsSync(image)) throw new Error(`Image not found: ${image}`);
  reqKey ||= 'i2i_xl_sft';
  const bytes = readFileSync(image);
  if (bytes.length > 500 * 1024) {
    throw new Error(`i2i input is ${Math.round(bytes.length / 1024)}KB; compress it to <=500KB or use bl image edit for large images.`);
  }
  const body = {
    req_key: reqKey,
    binary_data_base64: [bytes.toString('base64')],
    prompt,
    scale: Math.max(1, Math.min(30, Number(opts.scale) || 7)),
    return_url: true,
  };
  if (opts.dryRun) {
    process.stdout.write(`${JSON.stringify({
      dryRun: true,
      provider: 'volcengine',
      mode,
      reqKey,
      image,
      imageBytes: bytes.length,
      bodyBytes: JSON.stringify(body).length,
      prompt,
      scale: body.scale,
      out,
    }, null, 2)}\n`);
    process.exit(0);
  }
  const response = runVe(['cv20240606', 'Img2ImgXLSft', '--body', JSON.stringify(body)]);
  const done = response;
  result = await saveImage(done, out);
}

const receipt = {
  ok: true,
  provider: 'volcengine',
  mode,
  reqKey,
  prompt,
  seed: Number.isFinite(opts.seed) ? Math.round(opts.seed) : null,
  requestedSize: opts.size,
  taskId: taskId || null,
  out: result.file,
  width: result.width,
  height: result.height,
  bytes: result.bytes,
  contentType: result.contentType,
  source: result.source.startsWith('http') ? result.source.split('?')[0] : result.source,
  elapsedSeconds: Math.round((Date.now() - startedAt) / 100) / 10,
};

if (opts.receipt) {
  mkdirSync(dirname(opts.receipt), { recursive: true });
  writeFileSync(opts.receipt, `${JSON.stringify(receipt, null, 2)}\n`);
}

process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
process.stderr.write(`saved ${receipt.out} (${receipt.width ?? '?'}×${receipt.height ?? '?'}, ${receipt.bytes} bytes)\n`);
