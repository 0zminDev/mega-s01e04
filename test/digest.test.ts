import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { readNight } from '../src/digest/readNight.js';

const runsDir = fileURLToPath(new URL('../runs/', import.meta.url));
const fixturesDir = fileURLToPath(new URL('./fixtures/', import.meta.url));

describe('readNight', () => {
  it('aggregates the 2026-10-28 log and reports its malformed line', () => {
    const result = readNight(runsDir, '2026-10-28');

    expect(result.malformedLines).toBe(1);
    expect(result.counts).toEqual({ ok: 10, retry: 4, fail: 1 });
    expect(result.rows).toEqual([
      {
        job: 'rig/rotate-logs',
        owner: 'lane-07',
        runs: 1,
        retries: 0,
        lastStatus: 'ok',
        lastError: null,
        firstAt: '2026-10-28T23:00:02+01:00',
        lastAt: '2026-10-28T23:00:02+01:00',
      },
      {
        job: 'lane/sync',
        owner: 'rook',
        runs: 8,
        retries: 1,
        lastStatus: 'ok',
        lastError: null,
        firstAt: '2026-10-28T23:00:06+01:00',
        lastAt: '2026-10-29T05:00:04+01:00',
      },
      {
        job: 'fixtures/refresh',
        owner: 'rook',
        runs: 4,
        retries: 3,
        lastStatus: 'ok',
        lastError: null,
        firstAt: '2026-10-29T01:30:00+01:00',
        lastAt: '2026-10-29T01:37:00+01:00',
      },
      {
        job: 'notes/backup',
        owner: 'lane-07',
        runs: 1,
        retries: 0,
        lastStatus: 'fail',
        lastError: 'quota exceeded',
        firstAt: '2026-10-29T04:00:01+01:00',
        lastAt: '2026-10-29T04:00:01+01:00',
      },
      {
        job: 'digest/render',
        owner: null,
        runs: 1,
        retries: 0,
        lastStatus: 'ok',
        lastError: null,
        firstAt: '2026-10-29T05:41:09+01:00',
        lastAt: '2026-10-29T05:41:09+01:00',
      },
    ]);
  });

  it('continues after malformed lines and keeps the original timestamps', () => {
    const result = readNight(fixturesDir, 'malformed-middle');

    expect(result).toEqual({
      rows: [
        {
          job: 'example/job',
          owner: null,
          runs: 2,
          retries: 1,
          lastStatus: 'ok',
          lastError: null,
          firstAt: '2026-11-07T22:00:00+02:00',
          lastAt: '2026-11-07T23:00:00+02:00',
        },
      ],
      malformedLines: 1,
      counts: { ok: 1, retry: 1, fail: 0 },
    });
  });
});
