import * as THREE from "three/webgpu";
import * as KVY from "@vladkrutenyuk/three-kvy-core";

export class ResizeModule extends KVY.CoreContextModule {
	useCtx() {
		const { renderer, camera } = this.ctx.three;

		let observer: ResizeObserver | null = null;

		const onResize = (container: HTMLElement) => {
			const w = container.clientWidth;
			const h = container.clientHeight;
			(camera as THREE.PerspectiveCamera).aspect = w / h;
			(camera as THREE.PerspectiveCamera).updateProjectionMatrix();
			renderer.setSize(w, h);
		};

		const onMount = (container: HTMLElement) => {
			console.log("[ResizeModule] Mounting, container:", container);
			observer = new ResizeObserver(() => onResize(container));
			observer.observe(container);
			onResize(container); // run once immediately
			console.log("[ResizeModule] Initial size:", {
				width: container.clientWidth,
				height: container.clientHeight,
			});
		};

		// Wait for mount before observing
		if (this.ctx.three.isMounted && this.ctx.three.container) {
			onMount(this.ctx.three.container);
		} else {
			this.ctx.three.once("mount", onMount);
		}

		return () => {
			if (observer) {
				observer.disconnect();
			}
		};
	}
}
