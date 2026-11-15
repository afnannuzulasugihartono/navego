// @last-edited: 2026-11-16 UTC+7.
// @title: site-headers - the site's header policy, read from the file Cloudflare Pages serves it with.
// @state: one shape for every test that asks what policy a path carries; reads the deployed build output when present, the build-time template otherwise.
// @dependencies: node:fs.

import fs from 'node:fs';

const root = new URL('../../', import.meta.url);

const deployed = 'site/build/client/_headers';
const template = 'site/public/_headers';
const headersPathOf = () => (fs.existsSync(new URL(deployed, root)) ? deployed : template);

export function siteRules() {
  const rules = [];
  let current = null;
  for (const line of fs.readFileSync(new URL(headersPathOf(), root), 'utf8').split('\n')) {
    if (!line.trim() || line.startsWith('#')) continue;
    if (!/^\s/.test(line)) {
      current = { paths: line.split(',').map((part) => part.trim()), headers: {} };
      rules.push(current);
      continue;
    }
    const at = line.indexOf(':');
    current.headers[line.slice(0, at).trim()] = line.slice(at + 1).trim();
  }
  return rules;
}
