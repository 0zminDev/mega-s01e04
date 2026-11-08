import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import type { DigestReadResult, DigestRow, DigestStatus } from './types.js';

type RunLogEntry = {
  at: string;
  job: string;
  status: DigestStatus;
  owner: string | null;
  error?: string;
};

function parseEntry(value: unknown): RunLogEntry | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return null;

  const record = value as Record<string, unknown>;
  if (typeof record.at !== 'string' || Number.isNaN(Date.parse(record.at))) return null;
  if (typeof record.job !== 'string' || record.job.length === 0) return null;
  if (record.status !== 'ok' && record.status !== 'retry' && record.status !== 'fail') return null;
  if (record.owner !== null && typeof record.owner !== 'string') return null;
  if ('error' in record && typeof record.error !== 'string') return null;

  return {
    at: record.at,
    job: record.job,
    status: record.status,
    owner: record.owner,
    ...(typeof record.error === 'string' ? { error: record.error } : {}),
  };
}

export function readNight(runsDir: string, night: string): DigestReadResult {
  const contents = readFileSync(join(runsDir, `${night}.jsonl`), 'utf8');
  const lines = contents.split(/\r?\n/);
  if (lines.at(-1) === '') lines.pop();

  const rowsByJob = new Map<string, DigestRow>();
  let malformedLines = 0;

  for (const line of lines) {
    let value: unknown;
    try {
      value = JSON.parse(line) as unknown;
    } catch {
      malformedLines++;
      continue;
    }

    const entry = parseEntry(value);
    if (!entry) {
      malformedLines++;
      continue;
    }

    const row = rowsByJob.get(entry.job);
    if (!row) {
      rowsByJob.set(entry.job, {
        job: entry.job,
        owner: entry.owner,
        runs: 1,
        retries: entry.status === 'retry' ? 1 : 0,
        lastStatus: entry.status,
        lastError: entry.error ?? null,
        firstAt: entry.at,
        lastAt: entry.at,
      });
      continue;
    }

    row.owner = entry.owner;
    row.runs++;
    if (entry.status === 'retry') row.retries++;
    row.lastStatus = entry.status;
    row.lastError = entry.error ?? null;
    row.lastAt = entry.at;
  }

  return { rows: [...rowsByJob.values()], malformedLines };
}
