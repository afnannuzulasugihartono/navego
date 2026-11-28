// @last-edited: 2026-11-28 UTC+7.
// @title: canonical link test - Google needs a link element, not a meta element.
// @state: failing before the seoMeta fix, passing after it.
// @dependencies: node:test, node:assert, site/app/lib/seo.ts.

import test from 'node:test';
import assert from 'node:assert/strict';
import { seoMeta } from '../../site/app/lib/seo.ts';

test('the shared meta helper emits a real canonical link element', () => {
  const tags = seoMeta({ title: 'T', description: 'D', path: '/harga' });
  const canonicalLink = tags.find((tag) => (tag as { rel?: string }).rel === 'canonical'
    && (tag as { tagName?: string }).tagName === 'link');
  assert.ok(canonicalLink, 'canonical must be a link element');
  assert.equal((canonicalLink as { href?: string }).href, 'https://navego.pages.dev/harga');
  const fakeMeta = tags.find((tag) => (tag as { rel?: string }).rel === 'canonical'
    && (tag as { tagName?: string }).tagName !== 'link');
  assert.equal(fakeMeta, undefined, 'a meta element named canonical is not a canonical signal');
});
