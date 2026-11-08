import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';

const projectDir = fileURLToPath(new URL('../', import.meta.url));
const baseConfig = {
  adapter: 'shim',
  installed: '2026-10-29T14:06:00+01:00',
  beatEverySeconds: 60,
};

type DigestApiResponse = {
  rows: { job: string }[];
  malformedLines: number;
};

function jobsInPage(html: string): string[] {
  const tableBody = html.match(/<tbody>([\s\S]*?)<\/tbody>/)?.[1];
  if (!tableBody) return [];

  return Array.from(
    tableBody.matchAll(/<tr[^>]*>\s*<td>([^<]*)<\/td>/g),
    (row) => row[1],
  );
}

describe('digest routes', () => {
  let runsDir: string;

  beforeEach(async () => {
    runsDir = await mkdtemp(join(projectDir, '.test-runs-'));
  });

  afterEach(async () => {
    await rm(runsDir, { recursive: true, force: true });
  });

  it('returns 404 for a missing night on both routes', async () => {
    const app = createApp({ ...baseConfig, runsDir });

    const pageResponse = await app.request('/digest/2026-11-07');
    const jsonResponse = await app.request('/api/digest/2026-11-07');

    expect(pageResponse.status).toBe(404);
    expect(jsonResponse.status).toBe(404);
  });

  it('renders an empty night on both routes', async () => {
    await writeFile(join(runsDir, '2026-11-07.jsonl'), '');
    const app = createApp({ ...baseConfig, runsDir });

    const pageResponse = await app.request('/digest/2026-11-07');
    const page = await pageResponse.text();
    const jsonResponse = await app.request('/api/digest/2026-11-07');
    const digest = (await jsonResponse.json()) as DigestApiResponse;

    expect(pageResponse.status).toBe(200);
    expect(page).toContain('nothing ran');
    expect(jsonResponse.status).toBe(200);
    expect(digest).toEqual({ rows: [], malformedLines: 0 });
  });

  it('renders past malformed lines with matching sorted jobs on both routes', async () => {
    const lines = [
      JSON.stringify({
        at: '2026-11-07T22:00:00+01:00',
        job: 'zulu/job',
        status: 'ok',
        owner: 'lane-07',
      }),
      'not a JSON line',
      JSON.stringify({
        at: '2026-11-07T23:00:00+01:00',
        job: 'alpha/job',
        status: 'retry',
        owner: null,
      }),
    ];
    await writeFile(join(runsDir, '2026-11-07.jsonl'), `${lines.join('\n')}\n`);
    const app = createApp({ ...baseConfig, runsDir });

    const pageResponse = await app.request('/digest/2026-11-07');
    const page = await pageResponse.text();
    const jsonResponse = await app.request('/api/digest/2026-11-07');
    const digest = (await jsonResponse.json()) as DigestApiResponse;
    const pageJobs = jobsInPage(page);
    const jsonJobs = digest.rows.map((row) => row.job);

    expect(pageResponse.status).toBe(200);
    expect(jsonResponse.status).toBe(200);
    expect(page).toContain('1 malformed line ignored');
    expect(pageJobs).toEqual(['alpha/job', 'zulu/job']);
    expect(jsonJobs).toEqual(pageJobs);
    expect(digest.malformedLines).toBe(1);
  });
});
