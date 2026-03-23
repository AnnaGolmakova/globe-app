import type { RestCountry } from "../../api/restcountries";

interface Props {
	country: RestCountry;
}

function Stat({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-0.5">
			<span className="text-xs text-[var(--color-muted)] uppercase tracking-wider">
				{label}
			</span>
			<span className="text-sm text-[var(--color-text)]">{value}</span>
		</div>
	);
}

export function CountryStats({ country }: Props) {
	const languages = country.languages
		? Object.values(country.languages).join(", ")
		: "—";

	const currencies = country.currencies
		? Object.values(country.currencies)
				.map((c) => `${c.name} (${c.symbol})`)
				.join(", ")
		: "—";

	return (
		<div className="grid grid-cols-2 gap-4 mt-4">
			<Stat label="Capital" value={country.capital?.[0] ?? "—"} />
			<Stat label="Region" value={country.subregion ?? country.region} />
			<Stat
				label="Population"
				value={country.population.toLocaleString()}
			/>
			<Stat label="Area" value={`${country.area.toLocaleString()} km²`} />
			<Stat label="Languages" value={languages} />
			<Stat label="Currencies" value={currencies} />
		</div>
	);
}
