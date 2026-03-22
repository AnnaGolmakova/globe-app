import * as THREE from "three/webgpu";
import * as KVY from "@vladkrutenyuk/three-kvy-core";

export class LightsFeature extends KVY.Object3DFeature {
	useCtx() {
		const ambient = new THREE.AmbientLight(0xffffff, 0.4);

		const sun = new THREE.DirectionalLight(0xffffff, 1.2);
		sun.position.set(5, 3, 5);

		this.object.add(ambient, sun);

		return () => {
			this.object.remove(ambient, sun);
		};
	}
}
