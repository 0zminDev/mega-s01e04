import { relative, resolve } from 'node:path';
import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { readNight } from './digest/readNight.js';
import { sortDigestRows } from './digest/sortRows.js';
import type { DigestReadResult } from './digest/types.js';
import { lane } from './lane.js';
import { readStatus } from './status.js';
import { DigestPage } from './views/digest.js';
import { Layout } from './views/layout.js';
import { StatusBoard } from './views/status.js';

function isValidNight(runsDir: string, night: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(night)) return false;

  const runsPath = resolve(runsDir);
  const nightPath = resolve(runsPath, `${night}.jsonl`);
  return relative(runsPath, nightPath) === `${night}.jsonl`;
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && 'code' in error && error.code === 'ENOENT';
}

function getNightResult(
  runsDir: string,
  night: string,
): { result: DigestReadResult } | { status: 400 | 404; message: string } {
  if (!isValidNight(runsDir, night)) return { status: 400, message: 'invalid night' };

  try {
    return { result: readNight(runsDir, night) };
  } catch (error) {
    if (isMissingFile(error)) return { status: 404, message: 'not found' };
    throw error;
  }
}

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/digest/:night', (c) => {
    const night = c.req.param('night');
    const outcome = getNightResult(config.runsDir, night);
    if ('status' in outcome) return c.text(outcome.message, outcome.status);

    return c.html(
      <Layout title={`digest · ${night}`} lane={lane()}>
        <DigestPage night={night} result={outcome.result} />
      </Layout>,
    );
  });

  app.get('/api/digest/:night', (c) => {
    const night = c.req.param('night');
    const outcome = getNightResult(config.runsDir, night);
    if ('status' in outcome) return c.text(outcome.message, outcome.status);

    return c.json({
      rows: sortDigestRows(outcome.result.rows),
      malformedLines: outcome.result.malformedLines,
    });
  });

  app.get('/', (c) =>
    c.html(
      <Layout title="status" lane={lane()}>
        <StatusBoard status={readStatus(config)} />
      </Layout>,
    ),
  );

  return app;
}
