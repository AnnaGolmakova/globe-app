import { useEffect, useState } from "react";
import { GlobeEvents } from "../globe/GlobeEvents";

export function useSelectedCountry() {
	const [selectedCode, setSelectedCode] = useState<string | null>(null);

	useEffect(() => {
		const handler = ({ code }: { code: string }) => setSelectedCode(code);
		GlobeEvents.on("countrySelected", handler);
		return () => {
			GlobeEvents.off("countrySelected", handler);
		};
	}, []);

	return selectedCode;
}
