import * as THREE from "three/webgpu";
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import { GlobeFeature } from "./features/GlobeFeature";
import { LightsFeature } from "./features/LightsFeature";
import { CountriesFeature } from "./features/CountriesFeature";
import { ResizeModule } from "./modules/ResizeModule";
import { CameraModule } from "./modules/CameraModule";

export type GlobeModules = {
	resize: ResizeModule;
	camera: CameraModule;
};

export type GlobeCtx = KVY.CoreContext<GlobeModules>;

// Keep a reference on the context for use by later modules/features
export let countriesFeature: CountriesFeature;

export async function createGlobeContext(container: HTMLDivElement) {
	const renderer = new THREE.WebGPURenderer({ antialias: true });
	renderer.setPixelRatio(window.devicePixelRatio);

	const camera = new THREE.PerspectiveCamera(
		50,
		container.clientWidth / container.clientHeight,
		0.1,
		1000
	);
	camera.position.set(0, 0, 3);

	const scene = new THREE.Scene();
	scene.background = new THREE.Color(0x0a0e1a);

	const ctx = KVY.CoreContext.create({
		renderer,
		camera,
		scene,
		clock: new THREE.Clock(),
		modules: {
			resize: new ResizeModule(),
			camera: new CameraModule(),
		},
	});

	await renderer.init();
	ctx.three.mount(container);

	const root = new THREE.Object3D();

	KVY.addFeature(root, LightsFeature);
	KVY.addFeature(root, GlobeFeature);
	const countries = KVY.addFeature(root, CountriesFeature);
	countriesFeature = countries;

	ctx.three.scene.add(root);

	return ctx;
}
