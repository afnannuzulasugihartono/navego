// @last-edited: 2026-11-18 UTC+7.
// @title: session-usage.test — one daily count across both surfaces, pinned to the numbers the module states.
// @state: the report table is sealed, both RPCs are service-role doors, the daily count adds the two surfaces, and the restated numbers match the module.
// @dependencies: node:test, strict, node:fs, ../../hosted/functions/_shared/plans.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { PLANS } from '../../hosted/functions/_shared/plans.ts';

const root = path.dirname(path.dirname(path.dirname(fileURLToPath(import.meta.url))));
const migration = fs.readFileSync(path.join(root, 'hosted', 'migrations', '20261109130000_opera_session_usage.sql'), 'utf8');
const readers = fs.readFileSync(path.join(root, 'hosted', 'migrations', '20261118090100_opera_usd_plan_readers.sql'), 'utf8');

const bodyFrom = (source: string, name: string) => {
  const match = source.match(new RegExp(`create or replace function public\\.${name}[\\s\\S]*?end \\$\\$;`));
  assert.ok(match, `${name} is not in the migration`);
  return match[0];
};

test('the report table holds its numbers and admits no reader but the service role', () => {
  assert.match(migration, /create table if not exists public\.opera_usage_reports/);
  assert.match(migration, /commands between 1 and 10000/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /revoke all on public\.opera_usage_reports from anon, authenticated/);
  assert.match(migration, /opera_usage_reports_user_day_idx/);
});

test('the session door counts the hosted rows and the reported rows as one day', () => {
  const body = bodyFrom(readers, 'opera_device_session_open');
  assert.match(body, /select count\(\*\)[\s\S]*opera_commands/, 'the hosted surface counts here too');
  assert.match(body, /coalesce\(sum\(commands\), 0\)[\s\S]*opera_usage_reports/, 'the reported rows land in the same arithmetic');
});

test('the two replaced readers still serve their old shape, now with the shared count', () => {
  for (const name of ['opera_device_plan', 'opera_my_plan']) {
    const body = bodyFrom(readers, name);
    assert.match(body, /opera_commands/, `${name} lost the hosted count`);
    assert.match(body, /opera_usage_reports/, `${name} does not see the local surface`);
  }
});

test('the day-spent refusal and the paused refusal are the bridge gate wording', () => {
  const body = bodyFrom(readers, 'opera_device_session_open');
  assert.match(body, /today''s quota of %s commands for %s is used; resets tomorrow/);
  assert.match(body, /is not active for this account/);
});

test('an unlimited report is refused, and a session door with nothing to verify is refused', () => {
  const report = bodyFrom(migration, 'opera_device_session_report');
  assert.match(report, /p_commands < 1 or p_commands > 10000/);
  const open = bodyFrom(readers, 'opera_device_session_open');
  assert.match(open, /Unauthorized device\./);
  assert.match(report, /Unauthorized device\./);
});

test('both session doors are service-role only, like the device plan door', () => {
  const open = bodyFrom(readers, 'opera_device_session_open');
  assert.ok(open, 'the session door is in the readers migration');
  assert.match(readers, /revoke all on function public\.opera_device_session_open\(text, text\) from public, anon, authenticated/);
  assert.match(readers, /grant execute on function public\.opera_device_session_open\(text, text\) to service_role/);
  assert.match(migration, /revoke all on function public\.opera_device_session_report\(text, text, integer\) from public, anon, authenticated/);
  assert.match(migration, /grant execute on function public\.opera_device_session_report\(text, text, integer\) to service_role/);
});

test('the restated numbers match the module, so the SQL and the JavaScript cannot drift apart', () => {
  assert.match(readers, /when 'plan\.usd-1' then 1000/);
  assert.match(readers, /when 'plan\.usd-17' then 17000/);
  assert.match(readers, /when 'plan\.usd-33' then null/);
  assert.match(readers, /when 'plan\.usd-1' then 500|then 500 else 50 end/);
  const firmShape = PLANS['plan.usd-17'];
  const enterprise = PLANS['plan.usd-33'];
  const starter = PLANS['plan.usd-1'];
  assert.ok(firmShape && enterprise && starter, 'the module holds the USD plans');
  assert.equal(String(firmShape.dailyQuota), '17000');
  assert.equal(enterprise.dailyQuota, null);
  assert.equal(String(starter.dailyQuota), '1000');
  assert.equal(String(firmShape.sessionAllowance), '500');
  assert.equal(String(enterprise.sessionAllowance), '500');
  assert.equal(String(starter.sessionAllowance), '50');
});
