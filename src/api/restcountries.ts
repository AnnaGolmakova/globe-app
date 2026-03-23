export interface RestCountry {
	name: { common: string; official: string };
	capital?: string[];
	population: number;
	area: number;
	region: string;
	subregion?: string;
	flags: { svg: string; alt?: string };
	languages?: Record<string, string>;
	currencies?: Record<string, { name: string; symbol: string }>;
}

const BASE = "https://restcountries.com/v3.1";

const FIELDS =
	"name,capital,population,area,flags,languages,currencies,region,subregion,ccn3";

export const countryKeys = {
	byCode: (code: string) => ["country", code] as const,
	all: () => ["countries", "all"] as const,
};

// Cache for all countries
let allCountriesCache: any[] | null = null;

async function getAllCountries(): Promise<any[]> {
	if (allCountriesCache) return allCountriesCache;

	const res = await fetch(`${BASE}/all?fields=${FIELDS}`);
	if (!res.ok) throw new Error(`Failed to fetch countries: ${res.status}`);
	allCountriesCache = await res.json();
	return allCountriesCache!;
}

export async function fetchCountryByCode(code: string): Promise<RestCountry> {
	// world-atlas uses numeric ISO 3166-1 codes (ccn3)
	const countries = await getAllCountries();

	// Pad the code to 3 digits if needed (e.g., "76" -> "076")
	const paddedCode = code.padStart(3, "0");

	const country = countries.find((c) => {
		// ccn3 might be a string or might not exist, try both padded and unpadded
		return c.ccn3 === paddedCode || c.ccn3 === code;
	});

	if (!country) {
		console.error(`Country not found for code: ${code} (padded: ${paddedCode})`);
		console.error(
			`Available ccn3 codes:`,
			countries.slice(0, 5).map((c) => c.ccn3)
		);
		throw new Error(`Country not found: ${code}`);
	}
	return country;
}
