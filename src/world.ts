import * as THREE from "three";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import { RNG } from './rng'

const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshLambertMaterial({ color: 0x00db00 });

export class World extends THREE.Group {
  public data: { id: number; instanceId: number | null }[][][] = [];
  public params = {
    seed: 0,
    terrain: {
      scale: 30,
      magnitude: 0.5,
      offset: 0.2,
    },
  };

  public size: { width: number; height: number };

  constructor(size = { width: 64, height: 32 }) {
    super();
    this.size = size;
  }

  /**
   * Generates the world data and meshes
   */
  generate() {
    this.initializeTerrain();
    this.generateTerrain();
    this.generateMeshes();
  }

  /**
   * Initializing the world terrain data
   */
  initializeTerrain() {
    this.data = [];
    for (let x = 0; x < this.size.width; x++) {
      const slice = [];
      for (let y = 0; y < this.size.height; y++) {
        const row = [];
        for (let z = 0; z < this.size.width; z++) {
          row.push({
            id: 0,
            instanceId: null,
          });
        }
        slice.push(row);
      }
      this.data.push(slice);
    }
  }

  /**
   * Generates the terrain data for the world
   */
  generateTerrain() {
    const rng = new RNG(this.params.seed);
    const simplex = new SimplexNoise(rng);
    for (let x = 0; x < this.size.width; x++) {
      for (let z = 0; z < this.size.width; z++) {

        // Compute the noise value for the current (x, z) position
        const value = simplex.noise(
          x / this.params.terrain.scale,
          z / this.params.terrain.scale,
        );

        // Scale the noise based on the magnitude/offset
        const scaledNoise =
          this.params.terrain.offset + value * this.params.terrain.magnitude;

          // Computing the height of the terrain at (x,z)
        let height = Math.floor(this.size.height * scaledNoise);

        // Clamping height between 0 and the maximum height of the world
        height = Math.max(0, Math.min(height, this.size.height - 1));

        // Fill in all blocks at or below the terrain height
        for (let y = 0; y < height; y++) {
          this.setBlockId(x, y, z, 1);
        }
      }
    }
  }

  /**
   * Generates the 3D representation of the world from the world data
   */
  generateMeshes() {
    this.clear();

    const maxCount = this.size.width * this.size.height * this.size.width;
    const mesh = new THREE.InstancedMesh(geometry, material, maxCount);
    mesh.count = 0;

    const matrix = new THREE.Matrix4();
    for (let x = 0; x < this.size.width; x++) {
      for (let y = 0; y < this.size.height; y++) {
        for (let z = 0; z < this.size.width; z++) {
          const blockId = this.getBlock(x, y, z)?.id;
          const instanceId = mesh.count;

          if (blockId !== 0) {
            matrix.setPosition(x + 0.5, y + 0.5, z + 0.5);
            mesh.setMatrixAt(instanceId, matrix);
            this.setBlockInstanceId(x, y, z, instanceId);
            mesh.count++;
          }
        }
      }
    }

    this.add(mesh);
  }

  /**
   * Gets the block data at (x, y, z)
   * @param x
   * @param y
   * @param z
   * @returns {{id, instanceId}}
   */
  getBlock(x: number, y: number, z: number) {
    if (this.inBounds(x, y, z)) {
      return this.data[x][y][z];
    } else {
      return null;
    }
  }

  /**
   * Sets the block ID for the block at (x, y, z)
   * @param x
   * @param y
   * @param z
   * @param id
   * @returns
   */
  setBlockId(x: number, y: number, z: number, id: number) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].id = id;
    } else {
      return null;
    }
  }

  /**
   * Sets the block instance ID for the block at (x, y, z)
   * @param x
   * @param y
   * @param z
   * @param instanceId
   * @returns
   */
  setBlockInstanceId(x: number, y: number, z: number, instanceId: number) {
    if (this.inBounds(x, y, z)) {
      this.data[x][y][z].instanceId = instanceId;
    } else {
      return null;
    }
  }

  /**
   * Checks if the (x, y, z) coordinates are within the bounds
   * @param x
   * @param y
   * @param z
   * @returns
   */
  private inBounds(x: number, y: number, z: number) {
    if (x < 0 || x >= this.size.width) return false;
    if (y < 0 || y >= this.size.height) return false;
    if (z < 0 || z >= this.size.width) return false;
    return true;
  }
}
