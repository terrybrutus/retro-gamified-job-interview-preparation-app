import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { CareerCityScene } from "./scenes/CareerCityScene";
import { HUDScene } from "./scenes/HUDScene";
import { GAME_HEIGHT, GAME_WIDTH, SCENE_KEYS } from "./utils/Constants";

export function createPhaserConfig(
  parent: string,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent,
    backgroundColor: "#000000",
    scene: [BootScene, CareerCityScene, HUDScene],
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    render: {
      pixelArt: true,
      antialias: false,
      roundPixels: true,
    },
    input: {
      gamepad: false,
    },
    audio: {
      disableWebAudio: true,
    },
  };
}

export { SCENE_KEYS };
