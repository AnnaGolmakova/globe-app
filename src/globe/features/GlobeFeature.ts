import * as THREE from "three/webgpu";
import {
	positionWorld,
	normalWorld,
	cameraPosition,
	vec3,
	vec4,
	dot,
	normalize,
	clamp,
	pow,
	oneMinus,
	float,
} from "three/tsl";
import * as KVY from "@vladkrutenyuk/three-kvy-core";

export const GLOBE_RADIUS = 1;

export class GlobeFeature extends KVY.Object3DFeature {
	private mesh!: THREE.Mesh;
	private atmosphere!: THREE.Mesh;

	useCtx() {
		const geometry = new THREE.SphereGeometry(GLOBE_RADIUS, 256, 256);

		// Create texture loader
		const textureLoader = new THREE.TextureLoader();

		// Create material with dark, realistic appearance
		const material = new THREE.MeshStandardMaterial({
			color: 0x2a2a2a,
			roughness: 0.95,
			metalness: 0.05,
		});

		this.mesh = new THREE.Mesh(geometry, material);
		this.atmosphere = this.buildAtmosphere();

		this.object.add(this.mesh, this.atmosphere);

		// Load textures asynchronously with fallback
		this.loadTextures(textureLoader, material);

		return () => {
			geometry.dispose();
			material.dispose();
			if (material.map) material.map.dispose();
			if (material.displacementMap) material.displacementMap.dispose();
			if (material.bumpMap) material.bumpMap.dispose();

			// Dispose atmosphere
			this.atmosphere.geometry.dispose();
			(this.atmosphere.material as THREE.Material).dispose();

			this.object.remove(this.mesh, this.atmosphere);
		};
	}

	private buildAtmosphere(): THREE.Mesh {
		const geometry = new THREE.SphereGeometry(GLOBE_RADIUS * 1.06, 64, 64);

		// Fresnel / rim factor:
		// viewDir = normalize(cameraPosition - worldPosition)
		// rimFactor = 1 - dot(normal, viewDir) → 1 at edges, 0 at centre
		const viewDir = normalize(cameraPosition.sub(positionWorld));
		const rimFactor = oneMinus(clamp(dot(normalWorld, viewDir), 0, 1));
		const glow = pow(rimFactor, float(3.5));

		const atmosphereColor = vec3(0.2, 0.5, 1.0); // blue

		const material = new THREE.MeshBasicNodeMaterial({
			transparent: true,
			depthWrite: false,
			side: THREE.BackSide,
		});

		material.colorNode = vec4(atmosphereColor, glow.mul(0.7));

		const mesh = new THREE.Mesh(geometry, material);
		return mesh;
	}

	private async loadTextures(
		loader: THREE.TextureLoader,
		material: THREE.MeshStandardMaterial
	) {
		try {
			// Try to load displacement/elevation map
			const displacementMap = await loader.loadAsync(
				"https://raw.githubusercontent.com/turban/webgl-earth/master/images/elev_bump_4k.jpg"
			);

			displacementMap.colorSpace = THREE.SRGBColorSpace;
			material.displacementMap = displacementMap;
			material.displacementScale = 0.04;
			material.needsUpdate = true;

			// Also use as bump map for additional detail
			material.bumpMap = displacementMap;
			material.bumpScale = 0.02;

			// Load earth texture for base color
			try {
				const earthTexture = await loader.loadAsync(
					"https://raw.githubusercontent.com/turban/webgl-earth/master/images/2_no_clouds_4k.jpg"
				);
				earthTexture.colorSpace = THREE.SRGBColorSpace;
				material.map = earthTexture;
				material.color.setHex(0x666666); // Darken the texture
				material.needsUpdate = true;
			} catch {
				console.warn("Could not load earth texture, using solid color");
			}
		} catch {
			console.warn("Could not load terrain textures, using procedural fallback");
			this.createProceduralTerrain(material);
		}
	}

	private createProceduralTerrain(material: THREE.MeshStandardMaterial) {
		// Create a procedural noise texture for terrain-like appearance
		const canvas = document.createElement("canvas");
		canvas.width = 1024;
		canvas.height = 512;
		const ctx = canvas.getContext("2d");

		if (!ctx) return;

		const imageData = ctx.createImageData(canvas.width, canvas.height);
		const data = imageData.data;

		// Generate noise-based terrain
		for (let y = 0; y < canvas.height; y++) {
			for (let x = 0; x < canvas.width; x++) {
				const i = (y * canvas.width + x) * 4;

				// Multi-octave noise simulation
				const noise =
					this.simpleNoise(x * 0.01, y * 0.01) * 0.5 +
					this.simpleNoise(x * 0.02, y * 0.02) * 0.25 +
					this.simpleNoise(x * 0.04, y * 0.04) * 0.125 +
					this.simpleNoise(x * 0.08, y * 0.08) * 0.0625;

				const value = Math.floor((noise + 0.5) * 255);

				data[i] = value;
				data[i + 1] = value;
				data[i + 2] = value;
				data[i + 3] = 255;
			}
		}

		ctx.putImageData(imageData, 0, 0);

		const texture = new THREE.CanvasTexture(canvas);
		texture.colorSpace = THREE.SRGBColorSpace;

		material.bumpMap = texture;
		material.bumpScale = 0.015;
		material.needsUpdate = true;
	}

	private simpleNoise(x: number, y: number): number {
		// Simple pseudo-random noise function
		const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
		return (n - Math.floor(n)) * 2 - 1;
	}
}
