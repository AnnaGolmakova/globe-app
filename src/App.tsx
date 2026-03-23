import { useState, useEffect } from "react";
import { GlobeCanvas } from "./components/GlobeCanvas";
import { CountryPanel } from "./components/CountryPanel/CountryPanel";
import { useSelectedCountry } from "./hooks/useSelectedCountry";

export default function App() {
	const selectedCode = useSelectedCountry();
	const [panelCode, setPanelCode] = useState<string | null>(null);

	// Sync globe selection into panel state
	useEffect(() => {
		if (selectedCode) {
			setPanelCode(selectedCode);
		}
	}, [selectedCode]);

	return (
		<div className="relative w-screen h-screen overflow-hidden bg-[--color-background]">
			<GlobeCanvas />
			<CountryPanel code={panelCode} onClose={() => setPanelCode(null)} />
		</div>
	);
}
