import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import type { World } from "./world";
import { blocks } from "./blocks";

const CENTER_SCREEN = new THREE.Vector2(0, 0);

export class Player {
  radius = 0.5;
  height = 1.75;

  jumpSpeed = 10;
  maxSpeed = 10;

  onGround = false;

  input = new THREE.Vector3();
  velocity = new THREE.Vector3();
  #worldVelocity = new THREE.Vector3();

  boundsHelper: THREE.Mesh;

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  controls = new PointerLockControls(this.camera, document.body);
  cameraHelper = new THREE.CameraHelper(this.camera);

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(), 0, 8);
  selectedCoords: THREE.Vector3 | null = null;

  selectionHelper: THREE.Mesh;

  activeBlockId = blocks.grass.id;

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
    // scene.add(this.boundsHelper);

    const selectionMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.3,
      color: 0xffffaa,
    })
    const selectionGeometry = new THREE.BoxGeometry(1.001, 1.001, 1.001);
    this.selectionHelper = new THREE.Mesh(selectionGeometry, selectionMaterial);
    scene.add(this.selectionHelper);
  }

  get worldVelocity() {
    this.#worldVelocity.copy(this.velocity);
    this.#worldVelocity.applyEuler(
      new THREE.Euler(0, this.camera.rotation.y, 0),
    );
    return this.#worldVelocity;
  }

  update(world: World) {
    this.updateRaycaster(world);
  }

  updateRaycaster(world: World) {
    this.raycaster.setFromCamera(CENTER_SCREEN, this.camera);
    const intersections = this.raycaster.intersectObjects(world.children, true);

    if (intersections.length > 0) {
      const intersection = intersections[0];

      // Get the position of the chunk that the block is contained in
      const chunk = intersection.object.parent as THREE.InstancedMesh;

      // Get transformation matrix of the intersected block
      const blockMatrix = new THREE.Matrix4();
      // @ts-ignore
      intersection.object.getMatrixAt(intersection.instanceId!, blockMatrix);

      // Extract the position from the block's transformation matrix
      // and store it in selectedCoords
      this.selectedCoords = chunk.position.clone()
      this.selectedCoords.applyMatrix4(blockMatrix);

      if (this.activeBlockId !== blocks.empty.id) {
        this.selectedCoords.add(intersection.normal!);
      }

      this.selectionHelper.position.copy(this.selectedCoords);
      this.selectionHelper.visible = true;
    } else{
      this.selectedCoords = null;
      this.selectionHelper.visible = false;
    }
  }

  applyWorldDeltaVelocity(dv: THREE.Vector3) {
    dv.applyEuler(new THREE.Euler(0, -this.camera.rotation.y, 0));
    this.velocity.add(dv);
  }

  applyInputs(dt: number) {
    if (this.controls.isLocked) {
      this.velocity.x = this.input.x;
      this.velocity.z = this.input.z;

      this.controls.moveRight(this.velocity.x * dt);
      this.controls.moveForward(this.velocity.z * dt);
      this.position.y += this.velocity.y * dt;

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
      case 'Digit0':
      case 'Digit1':
      case 'Digit2':
      case 'Digit3':
      case 'Digit4':
      case 'Digit5':
        this.activeBlockId = Number(event.key);
        break;
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
      case "Space":
        if (this.onGround) {
          this.velocity.y = this.jumpSpeed;
        }
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
