import * as THREE from "three/webgpu";
import * as KVY from "@vladkrutenyuk/three-kvy-core";

export const GLOBE_RADIUS = 1;

export class GlobeFeature extends KVY.Object3DFeature {
	private mesh!: THREE.Mesh;

	useCtx() {
		const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 64, 64);

		const material = new THREE.MeshStandardMaterial({
			color: 0x1a3a5c,
			roughness: 0.8,
			metalness: 0.1,
		});

		this.mesh = new THREE.Mesh(geometry, material);
		this.object.add(this.mesh);

		return () => {
			geometry.dispose();
			material.dispose();
			this.object.remove(this.mesh);
		};
	}
}
