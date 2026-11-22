// @last-edited: 2026-11-22 UTC+7.
// @title: build-changelog - the site's release list is generated, and the generation is proven.
// @state: reads the committed release notes and the committed site data, then proves they agree.
// @dependencies: node:test, node:assert/strict, node:fs, scripts/release/build-changelog.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildReleases, compareVersions } from '../../scripts/release/build-changelog.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dataPath = path.join(root, 'site/app/data/releases.json');

test('the committed site data is exactly what the generator produces', () => {
  const committed = fs.readFileSync(dataPath, 'utf8');
  const entries = buildReleases(root);
  assert.equal(committed, `${JSON.stringify({ entries }, null, 2)}\n`, 'run npm run changelog and commit the result');
});

test('every release note becomes one row, newest first by semver', () => {
  const entries = buildReleases(root);
  const notes = fs.readdirSync(path.join(root, 'docs/releases'))
    .filter((file) => /^\d+\.\d+\.\d+\.md$/.test(file))
    .map((file) => file.replace(/\.md$/, ''));
  assert.equal(entries.length, notes.length, 'one row per release note');
  assert.equal(entries[0]?.version, '1.8.1');
  assert.equal(entries.at(-1)?.version, '1.6.22');
  for (let index = 1; index < entries.length; index += 1) {
    const previous = entries[index - 1]?.version;
    const current = entries[index]?.version;
    assert.ok(previous && current);
    assert.ok(compareVersions(previous, current) > 0, `${previous} must sort above ${current}`);
  }
});

test('the newest row carries the release note title and date as plain text', () => {
  const newest = buildReleases(root)[0];
  assert.ok(newest);
  assert.equal(newest.date, '2026-11-21');
  assert.equal(newest.title, 'the boundaries validate their input, the caps are enforced, and a paired device leaves the deployment it was stranded on.');
  assert.equal(newest.points.length, 3);
  for (const point of newest.points) {
    assert.equal(point.includes('`'), false, 'release points carry no Markdown backticks');
  }
});
