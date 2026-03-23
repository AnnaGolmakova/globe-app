import * as THREE from "three/webgpu";
import * as THREE_STANDARD from "three";
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import CameraControls from "camera-controls";
import TWEEN from "@tweenjs/tween.js";

CameraControls.install({ THREE: THREE_STANDARD });

export class CameraModule extends KVY.CoreContextModule {
	controls!: CameraControls;
	private clock!: THREE_STANDARD.Clock;
	private autoRotate = true;
	private autoRotateSpeed = 2.0; // degrees per second

	useCtx() {
		const { renderer, camera } = this.ctx.three;

		// Create a separate clock for camera controls to avoid conflicts
		this.clock = new THREE_STANDARD.Clock();

		const onMount = () => {
			// Ensure canvas can receive pointer events
			const canvas = renderer.domElement;
			canvas.style.touchAction = "none";
			canvas.style.userSelect = "none";
			canvas.style.cursor = "grab";

			// Initialize controls after mount
			this.controls = new CameraControls(camera as THREE.PerspectiveCamera, canvas);

			// Sensible defaults for globe navigation
			this.controls.minDistance = 1.5;
			this.controls.maxDistance = 6;
			this.controls.smoothTime = 0.25;
			this.controls.enabled = true;

			// Disable auto-rotate when user interacts
			canvas.addEventListener("pointerdown", () => {
				this.autoRotate = false;
			});
		};

		// Update controls on every render frame
		const onRenderBefore = () => {
			if (!this.controls) return;

			// Use our own clock for camera controls
			const delta = this.clock.getDelta();

			// Auto-rotate the globe
			if (this.autoRotate) {
				const rotationAmount = (this.autoRotateSpeed * delta * Math.PI) / 180;
				this.controls.azimuthAngle += rotationAmount;
			}

			this.controls.update(delta);
			TWEEN.update();
		};

		// Wait for mount before initializing controls
		if (this.ctx.three.isMounted) {
			onMount();
		} else {
			this.ctx.three.once("mount", onMount);
		}

		// Listen to render events
		this.ctx.three.on("renderbefore", onRenderBefore);

		return () => {
			this.ctx.three.off("renderbefore", onRenderBefore);
			if (this.controls) {
				this.controls.dispose();
			}
		};
	}

	/** Smoothly fly camera to look at a world-space position on the globe surface */
	flyTo(target: THREE.Vector3, duration = 700) {
		// Get the direction from origin to target, then position camera
		// at a comfortable distance along that direction
		const direction = target.clone().normalize();
		const distance = this.controls.distance;
		const newCameraPos = direction.multiplyScalar(distance);

		const currentCameraPos = new THREE.Vector3();
		this.controls.getPosition(currentCameraPos);

		const currentTarget = new THREE.Vector3();
		this.controls.getTarget(currentTarget);

		const fromPos = {
			px: currentCameraPos.x,
			py: currentCameraPos.y,
			pz: currentCameraPos.z,
			tx: currentTarget.x,
			ty: currentTarget.y,
			tz: currentTarget.z,
		};

		const toPos = {
			px: newCameraPos.x,
			py: newCameraPos.y,
			pz: newCameraPos.z,
			tx: 0,
			ty: 0,
			tz: 0,
		};

		new TWEEN.Tween(fromPos)
			.to(toPos, duration)
			.easing(TWEEN.Easing.Cubic.InOut)
			.onUpdate((obj) => {
				this.controls.setLookAt(
					obj.px,
					obj.py,
					obj.pz,
					obj.tx,
					obj.ty,
					obj.tz,
					false
				);
			})
			.start();
	}
}
