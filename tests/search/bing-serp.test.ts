// @last-edited: 2026-11-13 UTC+7.
// @title: bing-serp.test - the Bing SERP parser: the local driver's one parser, gated on the real page it was built from.
// @state: the parser lives in local/bing-serp.ts; these locks hold it to the real page and fail if it drifts.
// @dependencies: node:test, strict, node:fs, ../local/bing-serp.js.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { parseBingSerp, hostOf } from '../../local/bing-serp.js';

const fixture = JSON.parse(
  await readFile(new URL('../fixtures/bing-serp-page1.json', import.meta.url), 'utf8')
);

// THE EXPECTED TITLE CARRIES THE OLD BRAND: the fixture is a captured Bing SERP (2026-11-14) and the ranked card was titled 'Navego: ...' when the search engine served it; the fixture is evidence of what the parser read, not a claim about what the site calls itself today.

test('the parser reads the real page-1 SERP into the external results, in order, with snippets', () => {
  const { results, nextFirst } = parseBingSerp(fixture, { currentFirst: 1 });
  const first = results[0];
  const fifth = results[4];
  assert.equal(results.length, 10);
  assert.ok(first && fifth, 'the SERP yields at least five cards');
  assert.deepEqual(results.map((r) => r.site), [
    'mcpmarket.com',
    'docs.agentopera.ai',
    'operant.ai',
    'docs.agentopera.ai',
    'github.com',
    'docs.geopera.com',
    'blogs.opera.com',
    'forest.watch.impress.co.jp',
    'press.opera.com',
    'tejima.jp'
  ]);
  assert.equal(first.rank, 1);
  assert.equal(first.title, 'Navego: Private Local MCP Browser Automation Bridge');
  assert.equal(first.url, 'https://mcpmarket.com/server/navego');
  assert.ok(first.snippet.includes('Connect MCP clients'), 'snippet carries the card description');
  assert.equal(fifth.title, 'GitHub - operasoftware/opera-devtools-mcp');
  assert.ok(fifth.snippet.includes('opera-devtools-mcp'), 'the date prefix stays part of the snippet, verbatim');
  assert.ok(results.every((r) => r.snippet.length > 0), 'every card ships its snippet');
  assert.equal(nextFirst, 11, 'the pagination link names the next page, whatever the page size is today');
});

test('bing self-links, javascript: anchors and microsoft redirects never become results', () => {
  const { results } = parseBingSerp(fixture, { currentFirst: 1 });
  const hrefs = results.map((r) => r.url).join(' ');
  assert.doesNotMatch(hrefs, /bing\.com|javascript:|go\.microsoft\.com/);
});

test('an organic link with a first= parameter in its own URL is not a pagination candidate', () => {
  const { nextFirst } = parseBingSerp({
    text: '',
    links: [
      { href: 'https://example.com/article?first=41', text: 'An organic result whose URL carries a first= query' },
      { href: 'https://example.org/deep', text: 'example.org https://example.org â€º deep' }
    ]
  }, { currentFirst: 1 });
  assert.equal(nextFirst, null, 'pagination comes from bing.com links only');
});

test('no first= links means nothing more to fetch', () => {
  const { nextFirst } = parseBingSerp({ text: '', links: [] }, { currentFirst: 1 });
  assert.equal(nextFirst, null);
});

test('the next page is the smallest first= above the current one, not an assumed page size', () => {
  const links = [
    { href: 'https://www.bing.com/search?q=x&first=11&FORM=PERE', text: '2' },
    { href: 'https://www.bing.com/search?q=x&first=41&FORM=PERE4', text: '5' },
    { href: 'https://www.bing.com/search?q=x&first=1&FORM=PORE', text: '' }
  ];
  const { nextFirst } = parseBingSerp({ text: '', links }, { currentFirst: 11 });
  assert.equal(nextFirst, 41);
});

test('a card with only a display anchor falls back to the site as its title, never to silence', () => {
  const { results } = parseBingSerp({
    text: '',
    links: [{ href: 'https://example.com/page', text: 'example.com https://example.com â€º page' }]
  });
  assert.equal(results.length, 1);
  const first = results[0];
  assert.ok(first, 'the card comes back');
  assert.equal(first.title, 'example.com');
  assert.equal(first.url, 'https://example.com/page');
});

test('an empty SERP answers with zero results and no pagination claim', () => {
  const { results, nextFirst } = parseBingSerp({ text: 'There are no results', links: [] });
  assert.deepEqual(results, []);
  assert.equal(nextFirst, null);
});

test('hostOf survives the garbage a SERP hands out', () => {
  assert.equal(hostOf('not a url'), '');
  assert.equal(hostOf(''), '');
  assert.equal(hostOf('https://WWW.Example.COM/path'), 'www.example.com');
});
