import * as THREE from "three/webgpu";
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import earthTextureUrl from "../../assets/earth.jpg";
import elevationTextureUrl from "../../assets/elev_bump.jpg";

export const GLOBE_RADIUS = 1;

export class GlobeFeature extends KVY.Object3DFeature {
	private mesh!: THREE.Mesh;

	useCtx() {
		const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 512, 512);

		const textureLoader = new THREE.TextureLoader();

		const elevationTexture = textureLoader.load(elevationTextureUrl);
		elevationTexture.colorSpace = THREE.SRGBColorSpace;

		const earthTexture = textureLoader.load(earthTextureUrl);
		earthTexture.colorSpace = THREE.SRGBColorSpace;

		const material = new THREE.MeshStandardMaterial({
			color: 0x969696,
			roughness: 0.95,
			metalness: 0.05,
			map: earthTexture,
			displacementMap: elevationTexture,
			displacementScale: 0.04,
			bumpMap: elevationTexture,
			bumpScale: 0.01,
		});

		this.mesh = new THREE.Mesh(geometry, material);
		this.object.add(this.mesh);

		return () => {
			geometry.dispose();
			material.dispose();
			earthTexture.dispose();
			elevationTexture.dispose();

			this.object.remove(this.mesh);
		};
	}
}
