import * as KVY from "@vladkrutenyuk/three-kvy-core";
import type { GlobeModules } from "../GlobeContext";

export class GlobeRotationFeature extends KVY.Object3DFeature<GlobeModules> {
	private autoRotate = true;
	private autoRotateSpeed = 2.0;
	private isDragging = false;
	private previousMousePosition = { x: 0, y: 0 };

	useCtx(ctx: KVY.CoreContext<GlobeModules>) {
		const canvas = ctx.three.renderer.domElement;

		const onPointerDown = (e: PointerEvent) => {
			this.autoRotate = false;
			this.isDragging = true;
			this.previousMousePosition = { x: e.clientX, y: e.clientY };
			canvas.style.cursor = "grabbing";
		};

		const onPointerMove = (e: PointerEvent) => {
			if (!this.isDragging) return;

			const deltaX = e.clientX - this.previousMousePosition.x;
			const deltaY = e.clientY - this.previousMousePosition.y;

			this.object.rotation.y += deltaX * 0.005;
			this.object.rotation.x += deltaY * 0.005;

			this.object.rotation.x = Math.max(
				-Math.PI / 2,
				Math.min(Math.PI / 2, this.object.rotation.x)
			);

			this.previousMousePosition = { x: e.clientX, y: e.clientY };
		};

		const onPointerUp = () => {
			this.isDragging = false;
			canvas.style.cursor = "grab";
		};

		const onPointerLeave = () => {
			this.isDragging = false;
			canvas.style.cursor = "grab";
		};

		canvas.style.cursor = "grab";

		canvas.addEventListener("pointerdown", onPointerDown);
		canvas.addEventListener("pointermove", onPointerMove);
		canvas.addEventListener("pointerup", onPointerUp);
		canvas.addEventListener("pointerleave", onPointerLeave);

		return () => {
			canvas.removeEventListener("pointerdown", onPointerDown);
			canvas.removeEventListener("pointermove", onPointerMove);
			canvas.removeEventListener("pointerup", onPointerUp);
			canvas.removeEventListener("pointerleave", onPointerLeave);
			canvas.style.cursor = "";
		};
	}

	onBeforeRender(ctx: KVY.CoreContext<GlobeModules>) {
		if (this.autoRotate) {
			const rotationAmount = (this.autoRotateSpeed * ctx.deltaTime * Math.PI) / 180;
			this.object.rotation.y += rotationAmount;
		}
	}

	disableAutoRotate() {
		this.autoRotate = false;
	}

	enableAutoRotate() {
		this.autoRotate = true;
	}

	setAutoRotateSpeed(speed: number) {
		this.autoRotateSpeed = speed;
	}
}
