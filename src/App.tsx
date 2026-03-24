import { GlobeCanvas } from "./components/GlobeCanvas";
import { CountryPanel } from "./components/CountryPanel/CountryPanel";
import { useSelectedCountry } from "./hooks/useSelectedCountry";

export default function App() {
	const selectedCode = useSelectedCountry();

	return (
		<div className="relative w-screen h-screen overflow-hidden">
			<GlobeCanvas />
			<CountryPanel code={selectedCode} />
		</div>
	);
}
