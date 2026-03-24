import * as THREE from "three/webgpu";
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import { GlobeFeature } from "./features/GlobeFeature";
import { LightsFeature } from "./features/LightsFeature";
import { CountriesFeature } from "./features/CountriesFeature";
import { SelectionFeature } from "./features/SelectionFeature";
import { GlobeRotationFeature } from "./features/GlobeRotationFeature";
import { ResizeModule } from "./modules/ResizeModule";
import { CameraModule } from "./modules/CameraModule";
import { RaycasterModule } from "./modules/RaycasterModule";

export type GlobeModules = {
	resize: ResizeModule;
	camera: CameraModule;
	raycaster: RaycasterModule;
};

export type GlobeCtx = KVY.CoreContext<GlobeModules>;

export let countriesFeature: CountriesFeature;
export let globeContainer: THREE.Object3D;

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
	scene.background = new THREE.Color(0x000000);

	const root = new THREE.Object3D();

	KVY.addFeature(root, LightsFeature);

	globeContainer = new THREE.Object3D();
	KVY.addFeature(globeContainer, GlobeFeature);
	KVY.addFeature(globeContainer, GlobeRotationFeature);
	const countries = KVY.addFeature(globeContainer, CountriesFeature);
	countriesFeature = countries;

	// Create selection feature and link to countries feature
	const selection = KVY.addFeature(globeContainer, SelectionFeature);
	selection.countriesFeature = countries;

	root.add(globeContainer);

	// Create raycaster module and link to countries feature
	const raycaster = new RaycasterModule();
	raycaster.countriesFeature = countries;

	const ctx = KVY.CoreContext.create({
		renderer,
		camera,
		scene,
		clock: new THREE.Clock(),
		modules: {
			resize: new ResizeModule(),
			camera: new CameraModule(),
			raycaster,
		},
	});

	await renderer.init();
	ctx.three.mount(container);
	ctx.three.scene.add(root);

	return ctx;
}
