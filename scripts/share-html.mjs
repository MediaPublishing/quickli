#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import crypto from 'node:crypto';
import path from 'node:path';

const [, , fileArg, titleArg] = process.argv;

if (!fileArg) {
  console.error('Usage: node scripts/share-html.mjs <file.html> [title]');
  process.exit(1);
}

const baseUrl = stripTrailingSlash(process.env.QUICKLI_BASE_URL || 'https://quickli.net');
const username = process.env.QUICKLI_USERNAME || '';
const appPassword = (process.env.QUICKLI_APP_PASSWORD || '').replace(/\s+/g, '');
const expiresIn = process.env.QUICKLI_EXPIRES_IN || '';
const password = process.env.QUICKLI_PASSWORD;
const filePath = path.resolve(fileArg);
const stateFile = process.env.QUICKLI_STATE_FILE
  ? path.resolve(process.env.QUICKLI_STATE_FILE)
  : path.join(path.dirname(filePath), '.quickli-shares.json');
const stateKey = process.env.QUICKLI_STATE_KEY || filePath;
const state = await readState(stateFile);
const existing = state[stateKey] || {};
const shareId = process.env.QUICKLI_SHARE_ID ? Number(process.env.QUICKLI_SHARE_ID) : Number(existing.share_id || 0);

if (!username || !appPassword) {
  console.error('Missing QUICKLI_USERNAME or QUICKLI_APP_PASSWORD.');
  process.exit(1);
}

const title = titleArg || path.basename(filePath, path.extname(filePath));
let html = await readFile(filePath, 'utf8');
html = await inlineLocalImages(html, path.dirname(filePath));
html = injectNoindex(html);

const payload = {
  title,
  content_html: html,
  note_path: filePath,
  share_type: 'html_document',
};

if (shareId) {
  payload.share_id = shareId;
}
if (expiresIn) {
  payload.expires_in = expiresIn;
}
if (typeof password === 'string') {
  payload.password = password;
}

let response;
try {
  response = await fetch(`${baseUrl}/wp-json/quickli-share/v1/share`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${username}:${appPassword}`).toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });
} catch (error) {
  console.error(`Request failed: ${error instanceof Error ? error.message : 'Unknown network error'}`);
  process.exit(1);
}

const text = await response.text();
if (!response.ok) {
  console.error(text || `HTTP ${response.status}`);
  process.exit(1);
}

const result = JSON.parse(text);
state[stateKey] = {
  share_id: result.share_id,
  url: result.url,
  title,
  source: filePath,
  sha256: crypto.createHash('sha256').update(html).digest('hex'),
  updated_at: new Date().toISOString(),
};
await writeState(stateFile, state);

console.log(JSON.stringify(result, null, 2));

function stripTrailingSlash(value) {
  return value.replace(/\/+$/, '');
}

function injectNoindex(html) {
  if (/<meta\s+name=["']robots["']/i.test(html)) {
    return html;
  }
  return html.replace(/<head([^>]*)>/i, '<head$1><meta name="robots" content="noindex, nofollow, noarchive">');
}

async function inlineLocalImages(html, baseDir) {
  const imgRegex = /<img\b([^>]*?)\bsrc=(["'])([^"']+)\2([^>]*)>/gi;
  const replacements = [];

  for (const match of html.matchAll(imgRegex)) {
    const [full, before, quote, src, after] = match;
    if (/^(https?:|data:|\/\/|#)/i.test(src)) {
      continue;
    }

    const imagePath = path.resolve(baseDir, decodeURI(src));
    const ext = path.extname(imagePath).toLowerCase().slice(1);
    const mime = mimeForExt(ext);
    if (!mime) {
      continue;
    }

    try {
      const data = await readFile(imagePath);
      const dataUri = `data:${mime};base64,${data.toString('base64')}`;
      replacements.push([full, `<img${before}src=${quote}${dataUri}${quote}${after}>`]);
    } catch {
      console.warn(`Could not inline image: ${src}`);
    }
  }

  let output = html;
  for (const [from, to] of replacements) {
    output = output.replace(from, to);
  }
  return output;
}

function mimeForExt(ext) {
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'gif':
      return 'image/gif';
    case 'webp':
      return 'image/webp';
    case 'svg':
      return 'image/svg+xml';
    default:
      return '';
  }
}

async function readState(file) {
  try {
    return JSON.parse(await readFile(file, 'utf8'));
  } catch {
    return {};
  }
}

async function writeState(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}
