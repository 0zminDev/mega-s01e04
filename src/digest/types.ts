export type DigestStatus = 'ok' | 'retry' | 'fail';

export type DigestRow = {
  job: string;
  owner: string | null;
  runs: number;
  retries: number;
  lastStatus: DigestStatus;
  lastError: string | null;
  firstAt: string;
  lastAt: string;
};

export type DigestStatusCounts = Record<DigestStatus, number>;

export type DigestReadResult = {
  rows: DigestRow[];
  malformedLines: number;
  counts: DigestStatusCounts;
};

export declare function readNight(runsDir: string, night: string): DigestReadResult;
