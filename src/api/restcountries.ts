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

const FIELDS = "name,capital,population,area,flags,languages,currencies,region,subregion";

export async function fetchCountryByCode(code: string): Promise<RestCountry> {
	const res = await fetch(`${BASE}/alpha/${code}?fields=${FIELDS}`);

	if (!res.ok) {
		throw new Error(`Failed to fetch country ${code}: ${res.status}`);
	}

	const data = await res.json();

	return Array.isArray(data) ? data[0] : data;
}
