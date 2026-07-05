import * as THREE from "three";
import { WorldChunk } from "./worldChunk";
import type { Player } from "./player";

export class World extends THREE.Group {
  /**
   * Whether or not we want to load the chunks async
   */
  asyncLoading = true;

  drawDistance = 1;

  public seed: number;
  public params = {
    seed: 0,
    terrain: {
      scale: 100,
      magnitude: 0.25,
      offset: 0.1,
    },
  };

  chunkSize = {
    width: 32,
    height: 32,
  };

  chunk!: WorldChunk;

  constructor(seed = 0) {
    super();
    this.seed = seed;
  }

  /**
   * Regenerate the world data model and the meshes
   */
  generate() {
    this.disposeChunks();

    for (let x = -this.drawDistance; x <= this.drawDistance; x++) {
      for (let z = -this.drawDistance; z <= this.drawDistance; z++) {
        this.generateChunk(x, z);
      }
    }
  }

  /**
   * Updates the visible portions of the world based on the current player position
   * @param player
   */
  update(player: Player) {
    const visibleChunks = this.getVisibleChunks(player);
    const chunksToAdd = this.getChunksToAdd(visibleChunks);
    this.removeUnusedChunks(visibleChunks);

    for (const chunk of chunksToAdd) {
      this.generateChunk(chunk.x, chunk.z);
    }
  }

  /**
   * Returns an array containing the coordinates of the chunks that are currently visible to the player
   */
  getVisibleChunks(player: Player) {
    const visibleChunks = [];

    const coords = this.worldToChunkCoordinates(
      player.position.x,
      player.position.y,
      player.position.z,
    );

    const chunkX = coords.chunk.x;
    const chunkZ = coords.chunk.z;

    for (
      let x = chunkX - this.drawDistance;
      x <= chunkX + this.drawDistance;
      x++
    ) {
      for (
        let z = chunkZ - this.drawDistance;
        z <= chunkZ + this.drawDistance;
        z++
      ) {
        visibleChunks.push({ x, z });
      }
    }

    return visibleChunks;
  }

  /**
   * Returns an array containing the coordinated of the chunks that are not yet loaded and need to be added to the scene
   */
  getChunksToAdd(visibleChunks: { x: number; z: number }[]) {
    // Filter down the visible chunks to those not already in the world

    return visibleChunks.filter((chunk) => {
      const chunkExists = this.children
        .map((obj) => obj.userData)
        .find(({ x, z }) => chunk.x === x && chunk.z === z);

      return !chunkExists;
    });
  }

  /**
   * Removes current loaded chunks that are no longer visible to the player
   */
  removeUnusedChunks(visibleChunks: { x: number; z: number }[]) {
    const chunksToRemove = this.children.filter((chunk) => {
      const { x, z } = chunk.userData;
      const chunkExists = visibleChunks.find(
        (visibleChunk) => visibleChunk.x === x && visibleChunk.z === z,
      );

      return !chunkExists;
    });

    for (const chunk of chunksToRemove) {
      // @ts-ignore
      chunk.disposeInstances();
      this.remove(chunk);
      console.log(
        `Removed chunk at (${chunk.userData.x}, ${chunk.userData.z})`,
      );
    }
  }

  /**
   * Generates the chunk at the (x, z) coordinates
   */
  generateChunk(x: number, z: number) {
    const chunk = new WorldChunk(this.chunkSize, this.params);
    chunk.position.set(x * this.chunkSize.width, 0, z * this.chunkSize.width);
    chunk.userData = { x, z };

    if (this.asyncLoading) {
      requestIdleCallback(chunk.generate.bind(chunk), { timeout: 1000 });
    } else {
      chunk.generate();
    }
    this.add(chunk);
  }

  /**
   * Gets the block data at (x, y, z)
   */
  getBlock(x: number, y: number, z: number) {
    const coords = this.worldToChunkCoordinates(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk && chunk.loaded) {
      return chunk.getBlock(coords.block.x, coords.block.y, coords.block.z);
    } else {
      return null;
    }
  }

  worldToChunkCoordinates(
    x: number,
    y: number,
    z: number,
  ): {
    chunk: { x: number; z: number };
    block: { x: number; y: number; z: number };
  } {
    const chunkCoords = {
      x: Math.floor(x / this.chunkSize.width),
      z: Math.floor(z / this.chunkSize.width),
    };

    const blockCoords = {
      x: x - this.chunkSize.width * chunkCoords.x,
      y: y,
      z: z - this.chunkSize.width * chunkCoords.z,
    };

    return {
      chunk: chunkCoords,
      block: blockCoords,
    };
  }

  getChunk(chunkX: number, chunkZ: number): WorldChunk {
    return this.children.find((chunk) => {
      return chunk.userData.x === chunkX && chunk.userData.z === chunkZ;
    }) as WorldChunk;
  }

  disposeChunks() {
    this.traverse((chunk) => {
      // @ts-ignore
      if (chunk.disposeInstances) chunk.disposeInstances();
    });
    this.clear();
  }

  /**
   * Adds a new block at (x, y, z) of type 'blockId'
   */
  addBlock(x: number, y: number, z: number, blockId: number) {
    const coords = this.worldToChunkCoordinates(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.addBlock(coords.block.x, coords.block.y, coords.block.z, blockId);

      this.hideBlock(x - 1, y, z);
      this.hideBlock(x + 1, y, z);
      this.hideBlock(x, y - 1, z);
      this.hideBlock(x, y + 1, z);
      this.hideBlock(x, y, z - 1);
      this.hideBlock(x, y, z + 1);
    }
  }

  /**
   * Removes the block at (x, y, z) and sets it to empty
   */
  removeBlock(x: number, y: number, z: number) {
    const coords = this.worldToChunkCoordinates(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.removeBlock(coords.block.x, coords.block.y, coords.block.z);
    }

    this.revealBlock(x - 1, y, z);
    this.revealBlock(x + 1, y, z);
    this.revealBlock(x, y - 1, z);
    this.revealBlock(x, y + 1, z);
    this.revealBlock(x, y, z - 1);
    this.revealBlock(x, y, z + 1);
  }

  /**
   * Reveals the block at (x, y, z) by adding a new mesh instance
   */
  revealBlock(x: number, y: number, z: number) {
    const coords = this.worldToChunkCoordinates(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (chunk) {
      chunk.addBlockInstance(coords.block.x, coords.block.y, coords.block.z);
    }
  }

  /**
   * Hides the block at (x, y, z) by removing its mesh instance
   */
  hideBlock(x: number, y: number, z: number) {
    const coords = this.worldToChunkCoordinates(x, y, z);
    const chunk = this.getChunk(coords.chunk.x, coords.chunk.z);

    if (
      chunk &&
      chunk.isBlockObscured(coords.block.x, coords.block.y, coords.block.z)
    ) {
      chunk.deleteBlockInstance(coords.block.x, coords.block.y, coords.block.z);
    }
  }
}
