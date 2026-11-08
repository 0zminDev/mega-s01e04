import type { DigestReadResult, DigestRow } from '../digest/types.js';

function isMarked(row: DigestRow): boolean {
  return row.retries >= 3 || row.lastStatus === 'fail';
}

export function DigestPage({ night, result }: { night: string; result: DigestReadResult }) {
  const rows = [...result.rows].sort((left, right) =>
    left.job < right.job ? -1 : left.job > right.job ? 1 : 0,
  );

  return (
    <>
      <h1>digest · {night}</h1>
      {result.malformedLines > 0 && (
        <p class="mute">
          {result.malformedLines} malformed {result.malformedLines === 1 ? 'line' : 'lines'} ignored
        </p>
      )}
      {rows.length === 0 ? (
        <p>nothing ran</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>job</th>
              <th>owner</th>
              <th>runs</th>
              <th>retries</th>
              <th>last status</th>
              <th>last error</th>
              <th>first</th>
              <th>last</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr class={isMarked(row) ? 'warn' : undefined} key={row.job}>
                <td>{row.job}</td>
                <td>{row.owner ?? '—'}</td>
                <td>{row.runs}</td>
                <td>{row.retries}</td>
                <td>{row.lastStatus}</td>
                <td>{row.lastError ?? '—'}</td>
                <td>{row.firstAt}</td>
                <td>{row.lastAt}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
