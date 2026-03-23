import * as THREE from "three/webgpu";
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import TWEEN from "@tweenjs/tween.js";
import { GlobeEvents } from "../GlobeEvents";
import { highlightMaterial } from "./CountriesFeature";
import type { CountriesFeature, CountryMeshUserData } from "./CountriesFeature";
import type { CameraModule } from "../modules/CameraModule";

export class SelectionFeature extends KVY.Object3DFeature {
	countriesFeature: CountriesFeature | null = null;
	private previousMesh: THREE.Mesh | null = null;
	private previousMaterial: THREE.Material | null = null;

	useCtx() {
		const handler = ({ code }: { code: string }) => this.select(code);
		GlobeEvents.on("countrySelected", handler);
		return () => {
			GlobeEvents.off("countrySelected", handler);
		};
	}

	private select(code: string) {
		if (!this.countriesFeature) return;

		// Restore previous selection
		if (this.previousMesh && this.previousMaterial) {
			this.previousMesh.material = this.previousMaterial;
		}

		const mesh = this.countriesFeature.getMeshByCode(code);
		if (!mesh) return;

		// Store original material and apply highlight
		this.previousMaterial = mesh.material as THREE.Material;
		this.previousMesh = mesh;

		const from = { opacity: 0 };
		const cloned = highlightMaterial.clone();
		cloned.transparent = true;
		cloned.opacity = 0;
		cloned.depthWrite = true;
		cloned.depthTest = true;
		mesh.material = cloned;

		new TWEEN.Tween(from)
			.to({ opacity: 0.5 }, 400)
			.easing(TWEEN.Easing.Quadratic.Out)
			.onUpdate(({ opacity }) => {
				cloned.opacity = opacity;
			})
			.start();

		// Fly camera to country centroid
		const userData = mesh.userData as CountryMeshUserData;
		const cameraModule = this.ctx?.modules.camera as CameraModule | undefined;
		cameraModule?.flyTo(userData.centroid);
	}
}
