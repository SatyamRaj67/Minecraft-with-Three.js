import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";

export class Player {
  radius = 0.5;
  height = 1.75;
  maxSpeed = 10;
  input = new THREE.Vector3();
  velocity = new THREE.Vector3();

  boundsHelper: THREE.Mesh;

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  controls = new PointerLockControls(this.camera, document.body);
  cameraHelper = new THREE.CameraHelper(this.camera);

  /**
   * @param scene
   */
  constructor(scene: THREE.Scene) {
    this.camera.position.set(32, 16, 32);
    scene.add(this.camera);
    scene.add(this.cameraHelper);
    this.cameraHelper.visible = false;

    document.addEventListener("keydown", this.onKeyDown.bind(this));
    document.addEventListener("keyup", this.onKeyUp.bind(this));

    this.boundsHelper = new THREE.Mesh(
      new THREE.CylinderGeometry(this.radius, this.radius, this.height, 16),
      new THREE.MeshBasicMaterial({ wireframe: true }),
    );
    scene.add(this.boundsHelper);
  }

  applyInputs(dt: number) {
    if (this.controls.isLocked) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;

      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);

      document.getElementById("player-position")!.innerHTML = this.toString();
    }
  }

  /**
   * Updates the position of the player and the bounds helper mesh
   */
  updateBoundsHelper() {
    this.boundsHelper.position.copy(this.camera.position);
    this.boundsHelper.position.y -= this.height / 2;
  }

  /**
   * Returns the current world position of the player
   */
  get position() {
    return this.camera.position;
  }

  /**
   * Event handler for 'keydown' events
   */
  onKeyDown(event: KeyboardEvent) {
    if (!this.controls.isLocked) {
      this.controls.lock();
    }

    switch (event.code) {
      case "KeyW":
        this.input.z = this.maxSpeed;
        break;
      case "KeyS":
        this.input.z = -this.maxSpeed;
        break;
      case "KeyA":
        this.input.x = -this.maxSpeed;
        break;
      case "KeyD":
        this.input.x = this.maxSpeed;
        break;
      case "KeyR":
        this.camera.position.set(32, 16, 32);
        this.velocity.set(0, 0, 0);
        break;
    }
  }

  /**
   * Event handler for 'keyup' events
   */
  onKeyUp(event: KeyboardEvent) {
    switch (event.code) {
      case "KeyW":
        this.input.z = 0;
        break;
      case "KeyS":
        this.input.z = 0;
        break;
      case "KeyA":
        this.input.x = 0;
        break;
      case "KeyD":
        this.input.x = 0;
        break;
    }
  }

  /**
   * Returns player position in a readable string format
   */
  toString() {
    let str = "";
    str += `X: ${this.position.x.toFixed(2)}, `;
    str += `Y: ${this.position.y.toFixed(2)}, `;
    str += `Z: ${this.position.z.toFixed(2)}`;
    return str;
  }
}
