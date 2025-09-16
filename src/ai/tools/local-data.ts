import type { BrandProfile } from '@/lib/types';

export type ResolvedLocation = {
	countryCode: string | null;
	countryName: string | null;
	region: 'africa' | 'asia' | 'europe' | 'north-america' | 'south-america' | 'oceania' | 'middle-east' | null;
	currency: { code: string; symbol: string } | null;
	canonicalLocation: string | null;
};

// Minimal country regex map for broad coverage without heavy deps
const COUNTRY_HINTS: Array<{ pattern: RegExp; code: string; name: string; region: ResolvedLocation['region']; currency: { code: string; symbol: string } }>= [
	{ pattern: /(kenya|nairobi|mombasa|kisumu)/i, code: 'KE', name: 'Kenya', region: 'africa', currency: { code: 'KES', symbol: 'KSh' } },
	{ pattern: /(uganda|kampala)/i, code: 'UG', name: 'Uganda', region: 'africa', currency: { code: 'UGX', symbol: 'USh' } },
	{ pattern: /(tanzania|dar\s*es\s*salaam)/i, code: 'TZ', name: 'Tanzania', region: 'africa', currency: { code: 'TZS', symbol: 'TSh' } },
	{ pattern: /(nigeria|lagos|abuja)/i, code: 'NG', name: 'Nigeria', region: 'africa', currency: { code: 'NGN', symbol: '₦' } },
	{ pattern: /(south\s*africa|johannesburg|cape\s*town)/i, code: 'ZA', name: 'South Africa', region: 'africa', currency: { code: 'ZAR', symbol: 'R' } },
	{ pattern: /(ghana|accra)/i, code: 'GH', name: 'Ghana', region: 'africa', currency: { code: 'GHS', symbol: '₵' } },
	{ pattern: /(usa|united\s*states|new\s*york|los\s*angeles|chicago)/i, code: 'US', name: 'United States', region: 'north-america', currency: { code: 'USD', symbol: '$' } },
	{ pattern: /(canada|toronto|vancouver|montreal)/i, code: 'CA', name: 'Canada', region: 'north-america', currency: { code: 'CAD', symbol: '$' } },
	{ pattern: /(united\s*kingdom|uk|london|manchester|england|scotland|wales)/i, code: 'GB', name: 'United Kingdom', region: 'europe', currency: { code: 'GBP', symbol: '£' } },
	{ pattern: /(europe|france|paris|germany|berlin|italy|rome|spain|madrid)/i, code: 'EU', name: 'Europe', region: 'europe', currency: { code: 'EUR', symbol: '€' } },
	{ pattern: /(india|delhi|mumbai|bengaluru)/i, code: 'IN', name: 'India', region: 'asia', currency: { code: 'INR', symbol: '₹' } },
	{ pattern: /(china|beijing|shanghai)/i, code: 'CN', name: 'China', region: 'asia', currency: { code: 'CNY', symbol: '¥' } },
	{ pattern: /(japan|tokyo)/i, code: 'JP', name: 'Japan', region: 'asia', currency: { code: 'JPY', symbol: '¥' } },
	{ pattern: /(brazil|rio\s*de\s*janeiro|sao\s*paulo)/i, code: 'BR', name: 'Brazil', region: 'south-america', currency: { code: 'BRL', symbol: 'R$' } },
];

export function resolveLocationFromProfile(profile: BrandProfile): ResolvedLocation {
	const sources: string[] = [];
	if (profile.location) sources.push(profile.location);
	if ((profile as any).contactAddress) sources.push((profile as any).contactAddress);
	if ((profile as any).websiteUrl) sources.push((profile as any).websiteUrl);
	if ((profile as any).contactPhone) sources.push((profile as any).contactPhone);

	const haystack = sources.filter(Boolean).join(' | ').trim();
	if (!haystack) {
		return { countryCode: null, countryName: null, region: null, currency: null, canonicalLocation: null };
	}

	for (const hint of COUNTRY_HINTS) {
		if (hint.pattern.test(haystack)) {
			return {
				countryCode: hint.code,
				countryName: hint.name,
				region: hint.region,
				currency: hint.currency,
				canonicalLocation: hint.name
			};
		}
	}

	return { countryCode: null, countryName: null, region: null, currency: null, canonicalLocation: null };
}

