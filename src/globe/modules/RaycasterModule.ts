import * as THREE from "three/webgpu";
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import { GlobeEvents } from "../GlobeEvents";
import type { CountriesFeature } from "../features/CountriesFeature";

export class RaycasterModule extends KVY.CoreContextModule {
	private raycaster = new THREE.Raycaster();
	private pointer = new THREE.Vector2();
	countriesFeature: CountriesFeature | null = null;

	useCtx() {
		const canvas = this.ctx.three.renderer.domElement;

		const onMove = (e: PointerEvent) => this.cast(e, "hover");
		const onDown = (e: PointerEvent) => this.cast(e, "select");

		canvas.addEventListener("pointermove", onMove);
		canvas.addEventListener("pointerdown", onDown);

		return () => {
			canvas.removeEventListener("pointermove", onMove);
			canvas.removeEventListener("pointerdown", onDown);
		};
	}

	private cast(e: PointerEvent, mode: "hover" | "select") {
		if (!this.countriesFeature) return;

		const canvas = this.ctx.three.renderer.domElement;
		const rect = canvas.getBoundingClientRect();

		this.pointer.set(
			((e.clientX - rect.left) / rect.width) * 2 - 1,
			-((e.clientY - rect.top) / rect.height) * 2 + 1
		);

		this.raycaster.setFromCamera(this.pointer, this.ctx.three.camera);
		const hits = this.raycaster.intersectObjects(
			this.countriesFeature.meshGroup.children,
			false
		);

		if (!hits.length) return;

		const code = hits[0].object.userData.code as string;
		if (!code) return;

		if (mode === "hover") {
			GlobeEvents.emit("countryHovered", { code });
		} else {
			GlobeEvents.emit("countrySelected", { code });
		}
	}
}
