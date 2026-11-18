// decisions.json -> D32 (one mark everywhere)
// Renders site/scripts/og-cover.svg into site/public/og-cover.png.
// Run: node scripts/generate-og-cover.mjs — after any change to the mark or the wordmark.
import { Resvg } from '@resvg/resvg-js';
import { readFileSync, writeFileSync } from 'node:fs';

const source = new URL('./og-cover.svg', import.meta.url);
const target = new URL('../public/og-cover.png', import.meta.url);
const svg = readFileSync(source, 'utf8');
const resvg = new Resvg(svg, {
  fitTo: { mode: 'width', value: 1200 },
  font: { loadSystemFonts: true }
});
const png = resvg.render().asPng();
writeFileSync(target, png);
console.log(`og-cover.png written (${png.length} bytes)`);
