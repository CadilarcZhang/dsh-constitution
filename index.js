/**
 * Host half of the dsh-constitution bundle: the global constitution.
 *
 * Two responsibilities:
 *   1. Own the file `~/.dsh/constitution.md`: two exact Fetch routes let the panel
 *      read and save it.
 *   2. Inject its text into every model step through `systemPrompt`, so rules
 *      written once travel with every session.
 */
import { mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const name = 'dsh-constitution';

const DSH_HOME = process.env.DSH_HOME || join(homedir(), '.dsh');
const CONSTITUTION_FILE = join(DSH_HOME, 'constitution.md');

let cache = { mtime: -1, text: '' };

/** Current constitution text; re-reads the file whenever its mtime changes. */
function readConstitution() {
  try {
    const { mtimeMs } = statSync(CONSTITUTION_FILE);
    if (mtimeMs !== cache.mtime) {
      cache = { mtime: mtimeMs, text: readFileSync(CONSTITUTION_FILE, 'utf8') };
    }
    return cache.text;
  } catch (error) {
    cache = { mtime: -1, text: '' };
    return '';
  }
}

function snapshot() {
  const text = readConstitution();
  let updatedAt = null;
  try {
    updatedAt = statSync(CONSTITUTION_FILE).mtimeMs;
  } catch (error) {
    updatedAt = null;
  }
  return { text, path: CONSTITUTION_FILE, chars: text.length, updatedAt };
}

/** Prompt context registered with `systemPrompt`; empty text contributes nothing. */
function renderConstitution() {
  const text = readConstitution().trim();
  if (text.length === 0) return '';
  return [
    'The user maintains a personal global constitution. It states standing preferences and constraints that apply to every session; honor it alongside the instructions above, and treat it as authoritative where a general guideline would suggest otherwise.',
    '',
    '<constitution>',
    text,
    '</constitution>',
  ].join('\n');
}

function json(data) {
  return Response.json(data, { headers: { 'cache-control': 'no-store' } });
}

function handleState() {
  return json({ ok: true, value: snapshot() });
}

async function handleSave(request) {
  let body = null;
  try {
    body = await request.json();
  } catch (error) {
    body = null;
  }
  const text = body && typeof body.text === 'string' ? body.text : null;
  if (text === null) {
    return json({ ok: false, error: { code: 'invalid-body', message: 'expected { "text": string }' } });
  }
  mkdirSync(dirname(CONSTITUTION_FILE), { recursive: true });
  writeFileSync(CONSTITUTION_FILE, text, 'utf8');
  cache = { mtime: statSync(CONSTITUTION_FILE).mtimeMs, text };
  return json({ ok: true, value: snapshot() });
}

export function apply(ctx) {
  const connection = ctx.get('connection');
  if (connection && typeof connection.fetch?.register === 'function') {
    ctx.effect(
      () =>
        connection.fetch.register({
          path: '/api/dsh-constitution/state',
          methods: ['POST'],
          requestBody: 'buffered',
          fetch: async () => handleState(),
        }),
      'dsh-constitution: state route',
    );
    ctx.effect(
      () =>
        connection.fetch.register({
          path: '/api/dsh-constitution/save',
          methods: ['POST'],
          requestBody: 'buffered',
          fetch: (request) => handleSave(request),
        }),
      'dsh-constitution: save route',
    );
  }

  const prompt = ctx.get('systemPrompt');
  if (prompt && typeof prompt.context === 'function') {
    ctx.effect(
      () =>
        prompt.context({
          name: 'constitution',
          order: -100,
          required: false,
          interpolate: false,
          text: () => renderConstitution(),
        }),
      'dsh-constitution: constitution prompt context',
    );
  }
}
