// Region-based pricing for a 45-generation one-time product
// Groups:
// - africa, india: $9.99
// - usa, canada, europe: $19.99
// - rest: $14.99 (default)

export type RegionGroup = 'africa_india' | 'us_canada_europe' | 'rest';

export interface RegionPrice {
  amountCents: number;
  currency: string; // ISO code for Stripe (e.g., 'usd')
  display: string; // e.g., '$9.99'
}

const PRICES: Record<RegionGroup, RegionPrice> = {
  africa_india: { amountCents: 999, currency: 'usd', display: '$9.99' },
  us_canada_europe: { amountCents: 1999, currency: 'usd', display: '$19.99' },
  rest: { amountCents: 1499, currency: 'usd', display: '$14.99' },
};

// Lightweight country lists (ISO alpha-2)
const AFRICA_COUNTRIES = new Set([
  'DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW'
]);

const EUROPE_COUNTRIES = new Set([
  'AL','AD','AT','BY','BE','BA','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','XK','LV','LI','LT','LU','MT','MD','MC','ME','NL','MK','NO','PL','PT','RO','RU','SM','RS','SK','SI','ES','SE','CH','UA','GB','VA'
]);

export function mapCountryToRegionGroup(countryCode?: string): RegionGroup {
  const code = (countryCode || '').toUpperCase();
  if (!code) return 'rest';
  if (code === 'IN' || AFRICA_COUNTRIES.has(code)) return 'africa_india';
  if (code === 'US' || code === 'CA' || EUROPE_COUNTRIES.has(code)) return 'us_canada_europe';
  return 'rest';
}

export function getRegionPriceForCountry(countryCode?: string): RegionPrice {
  const group = mapCountryToRegionGroup(countryCode);
  return PRICES[group];
}

export function resolveCountryFromHeaders(headers: Headers): string | undefined {
  // Cloud/Vercel proxies often pass CloudFront-Viewer-Country or X-Country-Code
  const cfCountry = headers.get('cloudfront-viewer-country') || headers.get('x-country-code');
  if (cfCountry) return cfCountry;
  // Accept-Language heuristic (very rough)
  const acceptLanguage = headers.get('accept-language') || '';
  const match = /-([A-Z]{2})\b/.exec(acceptLanguage);
  if (match && match[1]) return match[1];
  return undefined;
}



