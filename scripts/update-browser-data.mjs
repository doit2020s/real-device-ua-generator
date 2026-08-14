import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { refreshBrowserData } from './browser-data-lib.mjs';

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const target = path.join(scriptsDir, '..', 'data', 'browser-versions.json');
const fallback = JSON.parse(await readFile(target, 'utf8'));
const live = await refreshBrowserData(fallback);
const updated = structuredClone(fallback);
for (const browser of ['chrome', 'edge']) {
  if (live.sources[browser].ok) updated.sources[browser] = live.sources[browser];
}
updated.mode = 'cached';
delete updated.sources.safari.cached;

const snapshot = (data) => JSON.stringify(Object.fromEntries(
  Object.entries(data.sources).map(([name, source]) => [name, source.versions])
));
if (snapshot(updated) !== snapshot(fallback)) {
  updated.verifiedAt = live.verifiedAt;
  await writeFile(target, `${JSON.stringify(updated, null, 2)}\n`, 'utf8');
  console.log(`Updated ${target}`);
} else {
  console.log('Browser version cache is already current.');
}
for (const [name, source] of Object.entries(live.sources)) {
  console.log(`${name}: ${source.ok ? 'ok' : `fallback (${source.error})`}`);
}
