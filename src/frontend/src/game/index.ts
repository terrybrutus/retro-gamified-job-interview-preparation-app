import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { CareerCityScene } from "./scenes/CareerCityScene";
import { HUDScene } from "./scenes/HUDScene";
import {
  CoverLetterScene,
  InterviewCoachScene,
  JobAnalyzerScene,
  ResumeTailorScene,
  StudyHallScene,
} from "./scenes/InteriorScenes";
import { SCENE_KEYS } from "./utils/Constants";

/**
 * Creates the Phaser game config.
 *
 * @param parent       - DOM id of the container element
 * @param navBarHeight - height of the top nav bar in px
 * @param bottomBarHeight - height of the bottom HUD bar in px
 * @param canvasWidth  - explicit canvas width (defaults to window.innerWidth)
 * @param canvasHeight - explicit canvas height (defaults to available height)
 */
export function createPhaserConfig(
  parent: string,
  navBarHeight = 52,
  bottomBarHeight = 56,
  canvasWidth?: number,
  canvasHeight?: number,
): Phaser.Types.Core.GameConfig {
  const w = canvasWidth ?? window.innerWidth;
  const h =
    canvasHeight ??
    Math.max(100, window.innerHeight - navBarHeight - bottomBarHeight);

  return {
    type: Phaser.AUTO,
    width: w,
    height: h,
    parent,
    backgroundColor: "#000000",
    scene: [
      BootScene,
      CareerCityScene,
      HUDScene,
      ResumeTailorScene,
      CoverLetterScene,
      InterviewCoachScene,
      JobAnalyzerScene,
      StudyHallScene,
    ],
    physics: {
      default: "arcade",
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: false,
      },
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.NO_CENTER,
      width: w,
      height: h,
      parent,
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
      disableWebAudio: false,
    },
  };
}

export { SCENE_KEYS };
