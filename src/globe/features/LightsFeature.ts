import * as THREE from "three/webgpu";
import * as KVY from "@vladkrutenyuk/three-kvy-core";

export class LightsFeature extends KVY.Object3DFeature {
	useCtx() {
		// Reduced ambient light for more dramatic shadows
		const ambient = new THREE.AmbientLight(0xffffff, 0.3);

		// Main directional light (sun) - positioned to create relief shadows
		const sun = new THREE.DirectionalLight(0xffffff, 2.0);
		sun.position.set(-5, 2, 3);

		// Subtle fill light from opposite side
		const fillLight = new THREE.DirectionalLight(0x6688bb, 0.4);
		fillLight.position.set(3, -1, -2);

		// Hemisphere light for subtle sky/ground gradient
		const hemiLight = new THREE.HemisphereLight(0x4466aa, 0x111122, 0.5);

		this.object.add(ambient, sun, fillLight, hemiLight);

		return () => {
			this.object.remove(ambient, sun, fillLight, hemiLight);
		};
	}
}
