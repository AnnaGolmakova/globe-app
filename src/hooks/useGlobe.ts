import { useEffect, useRef } from "react";
import type { RefObject } from "react";
import { createGlobeContext, type GlobeCtx } from "../globe/GlobeContext";

export function useGlobe(containerRef: RefObject<HTMLDivElement | null>) {
	const ctxRef = useRef<GlobeCtx | null>(null);

	useEffect(() => {
		const container = containerRef.current;
		if (!container) return;

		let ctx: GlobeCtx | null = null;

		createGlobeContext(container).then((instance) => {
			ctx = instance;
			ctxRef.current = instance;
			instance.run();
		});

		return () => {
			ctx?.destroy();
			ctxRef.current = null;
		};
	}, [containerRef]);

	return ctxRef;
}
