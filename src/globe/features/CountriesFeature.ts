import * as THREE from "three/webgpu";
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import earcut from "earcut";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";
import world from "world-atlas/countries-110m.json";
import { lngLatToVec3, centroid } from "../../utils/geo";
import { GLOBE_RADIUS } from "./GlobeFeature";

// Offset country meshes slightly above globe surface to avoid z-fighting
const SURFACE_OFFSET = 0.002;

export interface CountryMeshUserData {
	code: string; // numeric ISO 3166-1 (from world-atlas)
	centroid: THREE.Vector3;
}

const defaultMaterial = new THREE.MeshStandardMaterial({
	color: 0x2d6a4f,
	roughness: 1,
	metalness: 0,
	side: THREE.DoubleSide,
});

export const highlightMaterial = new THREE.MeshStandardMaterial({
	color: 0x74c69d,
	roughness: 1,
	metalness: 0,
	side: THREE.DoubleSide,
});

export class CountriesFeature extends KVY.Object3DFeature {
	/** All country meshes — exposed for RaycasterModule */
	readonly meshGroup = new THREE.Group();
	/** All country border lines */
	readonly borderGroup = new THREE.Group();

	useCtx() {
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

			// Extract outer rings from polygons
			let rings: number[][][] = [];
			if (geom.type === "Polygon") {
				rings = [geom.coordinates[0]];
			} else if (geom.type === "MultiPolygon") {
				rings = geom.coordinates.map((poly: number[][][]) => poly[0]);
			}

			for (const ring of rings) {
				const mesh = this.buildMesh(ring, code);
				if (mesh) this.meshGroup.add(mesh);

				// Add border line for this ring
				const border = this.buildBorder(ring);
				if (border) this.borderGroup.add(border);
			}
		}
	}

	private buildBorder(ring: number[][]): THREE.Line | null {
		if (!ring || ring.length < 3) {
			return null;
		}

		const r = GLOBE_RADIUS + SURFACE_OFFSET + 0.001; // Slightly above the country mesh

		// Subdivide the ring edges to follow sphere curvature
		const subdivided = this.subdivideBorderRing(ring, 2); // 2 degrees max segment

		const positions = new Float32Array(subdivided.length * 3);
		for (let i = 0; i < subdivided.length; i++) {
			const [lng, lat] = subdivided[i];
			const v = lngLatToVec3(lng, lat, r);
			positions[i * 3 + 0] = v.x;
			positions[i * 3 + 1] = v.y;
			positions[i * 3 + 2] = v.z;
		}

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

		const material = new THREE.LineBasicMaterial({
			color: 0x1a1a1a,
			linewidth: 1,
		});

		return new THREE.Line(geometry, material);
	}

	private subdivideBorderRing(ring: number[][], maxSegmentDegrees: number): number[][] {
		const result: number[][] = [];

		for (let i = 0; i < ring.length; i++) {
			const [lng1, lat1] = ring[i];
			const [lng2, lat2] = ring[(i + 1) % ring.length];

			result.push([lng1, lat1]);

			// Calculate angular distance between points
			const dlng = lng2 - lng1;
			const dlat = lat2 - lat1;
			const dist = Math.sqrt(dlng * dlng + dlat * dlat);

			// If distance exceeds threshold, subdivide
			if (dist > maxSegmentDegrees) {
				const steps = Math.ceil(dist / maxSegmentDegrees);
				for (let j = 1; j < steps; j++) {
					const t = j / steps;
					result.push([lng1 + dlng * t, lat1 + dlat * t]);
				}
			}
		}

		return result;
	}

	private buildMesh(ring: number[][], code: string): THREE.Mesh | null {
		if (!ring || ring.length < 3) {
			return null;
		}

		const r = GLOBE_RADIUS + SURFACE_OFFSET;

		// Triangulate directly in lat/lng space (2D)
		const flat: number[] = [];
		for (const [lng, lat] of ring) {
			flat.push(lng, lat);
		}

		const indices = earcut(flat);
		if (!indices.length) {
			return null;
		}

		// Convert original vertices to 3D
		const originalVerts = ring.map(([lng, lat]) => lngLatToVec3(lng, lat, r));

		// Subdivide triangles geodesically
		const finalPositions: number[] = [];
		const finalIndices: number[] = [];

		for (let i = 0; i < indices.length; i += 3) {
			const i0 = indices[i];
			const i1 = indices[i + 1];
			const i2 = indices[i + 2];

			const v0 = originalVerts[i0];
			const v1 = originalVerts[i1];
			const v2 = originalVerts[i2];

			// Subdivide this triangle
			this.subdivideTriangle(v0, v1, v2, r, 2, finalPositions, finalIndices);
		}

		// Calculate centroid for userData
		const c = centroid(originalVerts);

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			"position",
			new THREE.BufferAttribute(new Float32Array(finalPositions), 3)
		);
		geometry.setIndex(finalIndices);
		geometry.computeVertexNormals();

		const mesh = new THREE.Mesh(geometry, defaultMaterial);
		mesh.userData = {
			code,
			centroid: c,
		} satisfies CountryMeshUserData;

		return mesh;
	}

	/**
	 * Recursively subdivide a triangle on the sphere surface
	 */
	private subdivideTriangle(
		v0: THREE.Vector3,
		v1: THREE.Vector3,
		v2: THREE.Vector3,
		radius: number,
		depth: number,
		positions: number[],
		indices: number[]
	): void {
		if (depth === 0) {
			// Base case: add the triangle
			const baseIndex = positions.length / 3;
			positions.push(v0.x, v0.y, v0.z);
			positions.push(v1.x, v1.y, v1.z);
			positions.push(v2.x, v2.y, v2.z);
			indices.push(baseIndex, baseIndex + 1, baseIndex + 2);
			return;
		}

		// Find midpoints and project them onto the sphere
		const m01 = new THREE.Vector3()
			.addVectors(v0, v1)
			.multiplyScalar(0.5)
			.normalize()
			.multiplyScalar(radius);
		const m12 = new THREE.Vector3()
			.addVectors(v1, v2)
			.multiplyScalar(0.5)
			.normalize()
			.multiplyScalar(radius);
		const m20 = new THREE.Vector3()
			.addVectors(v2, v0)
			.multiplyScalar(0.5)
			.normalize()
			.multiplyScalar(radius);

		// Recursively subdivide the 4 new triangles
		this.subdivideTriangle(v0, m01, m20, radius, depth - 1, positions, indices);
		this.subdivideTriangle(v1, m12, m01, radius, depth - 1, positions, indices);
		this.subdivideTriangle(v2, m20, m12, radius, depth - 1, positions, indices);
		this.subdivideTriangle(m01, m12, m20, radius, depth - 1, positions, indices);
	}

	getMeshByCode(code: string): THREE.Mesh | undefined {
		return this.meshGroup.children.find(
			(c) => (c.userData as CountryMeshUserData).code === code
		) as THREE.Mesh | undefined;
	}
}
