import { useQuery } from "@tanstack/react-query";
import { fetchCountryByCode, countryKeys } from "../api/restcountries";

export function useCountryData(code: string | null) {
	return useQuery({
		queryKey: countryKeys.byCode(code ?? ""),
		queryFn: () => fetchCountryByCode(code!),
		enabled: !!code,
		staleTime: Infinity, // country facts don't change
		retry: 1,
	});
}
