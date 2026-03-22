import { GlobeCanvas } from "./components/GlobeCanvas";

export default function App() {
	return (
		<div className="relative w-screen h-screen overflow-hidden bg-[--color-background]">
			<GlobeCanvas />
		</div>
	);
}
