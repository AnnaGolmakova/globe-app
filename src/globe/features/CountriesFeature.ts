import * as THREE from "three/webgpu";
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import earcut from "earcut";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { lngLatToVec3, centroid } from "../../utils/geo";
import { GLOBE_RADIUS } from "./GlobeFeature";

// Offset country meshes slightly above globe surface to avoid z-fighting
const SURFACE_OFFSET = 0.02;

export interface CountryMeshUserData {
	code: string; // numeric ISO 3166-1 (from world-atlas)
	centroid: THREE.Vector3;
}

// Invisible material for raycasting
const defaultMaterial = new THREE.MeshBasicMaterial({
	color: 0x000000,
	transparent: true,
	opacity: 0,
	side: THREE.DoubleSide,
	depthWrite: false,
});

export const highlightMaterial = new THREE.MeshBasicMaterial({
	color: 0x4a9eff,
	transparent: true,
	opacity: 0.8,
	side: THREE.DoubleSide,
	depthWrite: true,
	depthTest: true,
});

export class CountriesFeature extends KVY.Object3DFeature {
	/** All country meshes — exposed for RaycasterModule */
	readonly meshGroup = new THREE.Group();
	/** All country border lines */
	readonly borderGroup = new THREE.Group();

	useCtx() {
		// Add both meshes (invisible for raycasting) and borders (visible)
		this.object.add(this.meshGroup);
		this.object.add(this.borderGroup);
		this.buildCountries();

		return () => {
			this.object.remove(this.meshGroup);
			this.object.remove(this.borderGroup);
			this.meshGroup.clear();
			this.borderGroup.clear();
		};
	}

	private buildCountries() {
		// Convert TopoJSON → GeoJSON synchronously — no fetch needed
		const geojson = feature(
			world as unknown as Topology,
			(world as any).objects.countries
		);

		for (const feat of (geojson as any).features) {
			// world-atlas uses numeric ISO 3166-1 codes as the id
			const code = String(feat.id ?? "UNKNOWN");
			const geom = feat.geometry;

			if (!geom || !geom.coordinates) {
				continue;
			}

			const polygons: number[][][] =
				geom.type === "Polygon"
					? [geom.coordinates[0]]
					: geom.coordinates.map((poly: number[][][]) => poly[0]);

			for (const ring of polygons) {
				// Build invisible mesh for raycasting
				const mesh = this.buildMesh(ring, code);
				if (mesh) this.meshGroup.add(mesh);

				// Build visible border
				const border = this.buildBorder(ring);
				if (border) this.borderGroup.add(border);
			}
		}
	}

	private buildBorder(ring: number[][]): THREE.Line | null {
		if (!ring || ring.length < 3) {
			return null;
		}

		const r = GLOBE_RADIUS + SURFACE_OFFSET;

		// Subdivide edges more aggressively to follow sphere curvature smoothly
		const subdivided = this.subdivideBorderRing(ring, 0.5);

		// Add first point at the end to close the loop (since LineLoop not supported in WebGPU)
		const closedRing = [...subdivided, subdivided[0]];

		const positions = new Float32Array(closedRing.length * 3);
		for (let i = 0; i < closedRing.length; i++) {
			const [lng, lat] = closedRing[i];
			const v = lngLatToVec3(lng, lat, r);
			positions[i * 3 + 0] = v.x;
			positions[i * 3 + 1] = v.y;
			positions[i * 3 + 2] = v.z;
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

		const material = new THREE.LineBasicMaterial({
			color: 0xaaaaaa,
			linewidth: 1,
			opacity: 0.4,
			transparent: true,
			depthTest: true,
			depthWrite: false,
		});

		const line = new THREE.Line(geometry, material);
		line.renderOrder = 1; // Render after globe surface
		return line;
	}

	private subdivideBorderRing(ring: number[][], maxSegmentDegrees: number): number[][] {
		const result: number[][] = [];

		for (let i = 0; i < ring.length - 1; i++) {
			const [lng1, lat1] = ring[i];
			const [lng2, lat2] = ring[i + 1];

			result.push([lng1, lat1]);

			// Handle longitude wrapping (e.g., across date line)
			let dlng = lng2 - lng1;
			if (Math.abs(dlng) > 180) {
				dlng = dlng > 0 ? dlng - 360 : dlng + 360;
			}

			const dlat = lat2 - lat1;
			const dist = Math.sqrt(dlng * dlng + dlat * dlat);

			if (dist > maxSegmentDegrees) {
				const steps = Math.ceil(dist / maxSegmentDegrees);
				for (let j = 1; j < steps; j++) {
					const t = j / steps;
					let newLng = lng1 + dlng * t;
					// Normalize longitude to -180 to 180 range
					if (newLng > 180) newLng -= 360;
					if (newLng < -180) newLng += 360;
					result.push([newLng, lat1 + dlat * t]);
				}
			}
		}

		return result;
	}

	private buildMesh(ring: number[][], code: string): THREE.Mesh | null {
		if (ring.length < 3) return null;

		const r = GLOBE_RADIUS + SURFACE_OFFSET;

		// Triangulate in 2D lng/lat space
		const flat: number[] = [];
		for (const [lng, lat] of ring) {
			flat.push(lng, lat);
		}

		const indices = earcut(flat);
		if (!indices.length) return null;

		// Convert to 3D
		const verts3d = ring.map(([lng, lat]) => lngLatToVec3(lng, lat, r));

		const positions = new Float32Array(verts3d.length * 3);
		for (let i = 0; i < verts3d.length; i++) {
			positions[i * 3 + 0] = verts3d[i].x;
			positions[i * 3 + 1] = verts3d[i].y;
			positions[i * 3 + 2] = verts3d[i].z;
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
		geometry.setIndex(indices);
		geometry.computeVertexNormals();

		const c = centroid(verts3d);

		const mesh = new THREE.Mesh(geometry, defaultMaterial);
		mesh.userData = {
			code,
			centroid: c,
		} satisfies CountryMeshUserData;

		return mesh;
	}

	getMeshByCode(code: string): THREE.Mesh | undefined {
		return this.meshGroup.children.find(
			(c) => (c.userData as CountryMeshUserData).code === code
		) as THREE.Mesh | undefined;
	}
}
