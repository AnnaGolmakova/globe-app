import * as THREE from "three/webgpu";
import * as KVY from "@vladkrutenyuk/three-kvy-core";
import CameraControls from "camera-controls";
import TWEEN from "@tweenjs/tween.js";

CameraControls.install({ THREE });

export class CameraModule extends KVY.CoreContextModule {
	controls!: CameraControls;

	useCtx() {
		const { renderer, camera } = this.ctx.three;

		const onMount = () => {
			const canvas = renderer.domElement;
			canvas.style.touchAction = "none";
			canvas.style.userSelect = "none";

			this.controls = new CameraControls(camera as THREE.PerspectiveCamera, canvas);

			this.controls.minDistance = 1.5;
			this.controls.maxDistance = 6;
			this.controls.smoothTime = 0.25;
			this.controls.enabled = true;
			this.controls.azimuthRotateSpeed = 0;
			this.controls.polarRotateSpeed = 0;
		};

		const onRenderBefore = () => {
			if (!this.controls) return;

			this.controls.update(this.ctx.deltaTime);
			TWEEN.update();
		};

		if (this.ctx.three.isMounted) {
			onMount();
		} else {
			this.ctx.three.once("mount", onMount);
		}

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
