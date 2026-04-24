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

export function createPhaserConfig(
  parent: string,
): Phaser.Types.Core.GameConfig {
  return {
    type: Phaser.AUTO,
    width: window.innerWidth,
    height: window.innerHeight,
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
      width: window.innerWidth,
      height: window.innerHeight,
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
