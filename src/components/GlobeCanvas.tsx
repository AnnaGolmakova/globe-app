import { useRef } from "react";
import { useGlobe } from "../hooks/useGlobe";

export function GlobeCanvas() {
	const containerRef = useRef<HTMLDivElement>(null);
	useGlobe(containerRef);

	return <div ref={containerRef} className="absolute inset-0 overflow-hidden" />;
}
