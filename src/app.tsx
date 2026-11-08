import { relative, resolve } from 'node:path';
import { Hono } from 'hono';
import { loadConfig, type RigConfig } from './config.js';
import { readNight } from './digest/readNight.js';
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

export function createApp(config: RigConfig = loadConfig()) {
  const app = new Hono();

  app.get('/health', (c) => c.json({ ok: true, lane: lane().id }));

  app.get('/digest/:night', (c) => {
    const night = c.req.param('night');
    if (!isValidNight(config.runsDir, night)) return c.text('invalid night', 400);

    let result: DigestReadResult;
    try {
      result = readNight(config.runsDir, night);
    } catch (error) {
      if (isMissingFile(error)) return c.text('not found', 404);
      throw error;
    }

    return c.html(
      <Layout title={`digest · ${night}`} lane={lane()}>
        <DigestPage night={night} result={result} />
      </Layout>,
    );
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
