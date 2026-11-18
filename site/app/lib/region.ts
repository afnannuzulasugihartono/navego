// @last-edited: 2026-11-18 UTC+7.
// @title: region - which pricing band a visitor's country of origin lands on, in one pure function.
// @state: Europe (the EU/EEA, the United Kingdom, Switzerland and the microstates), the United States, Canada, Australia and New Zealand see the premium band; every other country, and an unknown country, sees the affordable band.
// @dependencies: none.

// WHY TWO BANDS AND NOT ONE PRICE.
// Every plan is sold at the same dollar prices everywhere; what changes is which group of plans leads the page.
// The visitor's country decides which presentation leads, because the purchasing power of a buyer in Jakarta and a buyer in Berlin is not the same, and the plans are built for both.
// The cohort is the owner's decision, stated plainly: Europe, North America and Australia/New Zealand see the premium group; everything else, including high-income Asia and the Gulf, sees the affordable group.
// "America" is read as the United States and Canada; Latin America is priced in the affordable band, which the owner can widen on request.

const PREMIUM_COUNTRIES = new Set([
  // EU 27
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT',
  'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE',
  // EEA + UK + Switzerland + microstates
  'GB', 'NO', 'IS', 'LI', 'CH', 'AD', 'MC', 'SM', 'VA', 'GI',
  // North America
  'US', 'CA',
  // Oceania
  'AU', 'NZ'
]);

export type PricingBand = 'affordable' | 'premium';

export function bandForCountry(code: string | null | undefined): PricingBand | null {
  const country = String(code ?? '').trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(country)) return null;
  return PREMIUM_COUNTRIES.has(country) ? 'premium' : 'affordable';
}
