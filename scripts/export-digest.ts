import { createApp } from '../src/app.js';
import { loadConfig } from '../src/config.js';

const response = await createApp(loadConfig()).request('/digest/2026-10-28');

if (!response.ok) {
  const message = await response.text();
  console.error(`Could not render /digest/2026-10-28 (${response.status}): ${message}`);
  process.exitCode = 1;
} else {
  process.stdout.write(await response.text());
}
