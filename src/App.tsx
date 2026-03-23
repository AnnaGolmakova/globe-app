import { GlobeCanvas } from "./components/GlobeCanvas";
import { useSelectedCountry } from "./hooks/useSelectedCountry";

export default function App() {
	const selectedCode = useSelectedCountry();

	// temporary — remove in Phase 9
	console.log("selected:", selectedCode);

	return (
		<div className="relative w-screen h-screen overflow-hidden bg-[--color-background]">
			<GlobeCanvas />
		</div>
	);
}
