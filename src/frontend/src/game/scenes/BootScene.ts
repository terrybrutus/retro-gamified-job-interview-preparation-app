import Phaser from "phaser";
import { AssetGenerator } from "../utils/AssetGenerator";
import { NPC_CONFIGS, SCENE_KEYS } from "../utils/Constants";

/**
 * BootScene — generates all procedural textures then launches CareerCityScene.
 *
 * The visible loading UI is now handled entirely by the React <LoadingOverlay>
 * component in GameContainer.tsx (which stays rendered until 'careerCityReady'
 * fires). BootScene therefore draws nothing itself and just does its work
 * before handing off.
 *
 * This eliminates the black-screen gap that occurred when BootScene faded out
 * its own Phaser-drawn overlay before the React overlay knew the game was ready.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  preload(): void {
    // No external assets to preload — all textures are procedurally generated
    // and music is synthesised via Web Audio API
  }

  create(): void {
    // Generate all procedural textures (tiles, sprites, atlas)
    const generator = new AssetGenerator(this);
    generator.generateAll(NPC_CONFIGS);

    // Brief pause so Phaser has one frame to commit textures,
    // then immediately launch the game world.
    this.time.delayedCall(60, () => {
      this.scene.launch(SCENE_KEYS.CAREER_CITY);
      this.scene.launch(SCENE_KEYS.HUD);

      // Stop this scene once CareerCityScene signals it is fully rendered.
      // CareerCityScene.create() calls game.events.emit('careerCityReady') —
      // the React LoadingOverlay listens for the same event on gameRef.current.events.
      this.game.events.once("careerCityReady", () => {
        this.scene.stop(SCENE_KEYS.BOOT);
      });
    });
  }
}
