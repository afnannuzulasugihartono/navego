// @last-edited: 2026-11-28 UTC+7.
// decisions.json -> site-canonical-01 (a rel="canonical" signal must be a link element)
// @title: seo - the shared answer for link previews, social cards and the search engine.
// @state: every route asks through this helper; nothing here is hand-typed twice.
// @dependencies: none.

const SITE = 'https://navego.pages.dev';
const OG_IMAGE = `${SITE}/og-cover.png`;
const TWITTER = '@navego';

interface SeoInput {
  title: string;
  description: string;
  path: string;
  locale?: string;
}

export function seoMeta({ title, description, path, locale = 'id_ID' }: SeoInput) {
  const url = `${SITE}${path}`;
  return [
    { title },
    { name: 'description', content: description },
    { property: 'og:site_name', content: 'Navego' },
    { property: 'og:locale', content: locale },
    { property: 'og:type', content: 'website' },
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:url', content: url },
    { property: 'og:image', content: OG_IMAGE },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:image:alt', content: 'Navego — Asisten AI di browser Anda' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: OG_IMAGE },
    { name: 'twitter:site', content: TWITTER },
    { tagName: 'link', rel: 'canonical', href: url },
  ];
}
