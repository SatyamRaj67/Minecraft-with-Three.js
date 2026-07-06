import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export class ModelLoader {
  loader = new GLTFLoader();

  models = {
    pickaxe: undefined as any,
  };

  loadModels(onLoad: (models: { pickaxe: any }) => void) {
    this.loader.load(
      `${import.meta.env.BASE_URL}model/pickaxe.glb`,
      (model) => {
        const mesh = model.scene;
        this.models.pickaxe = mesh;
        onLoad(this.models);
      },
    );
  }
}
