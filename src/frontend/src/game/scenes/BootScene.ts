import Phaser from "phaser";
import { musicManager } from "../managers/MusicManager";
import { AssetGenerator } from "../utils/AssetGenerator";
import { MUSIC_TRACKS, NPC_CONFIGS, SCENE_KEYS } from "../utils/Constants";

const FONT = "Orbitron, sans-serif";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  preload(): void {
    // No external assets to preload — all textures are procedurally generated
    // and music is synthesized via Web Audio API
  }

  create(): void {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x050510);

    for (let y = 0; y < height; y += 4) {
      this.add.rectangle(width / 2, y + 1, width, 2, 0x000000, 0.15);
    }

    const title = this.add.text(width / 2, height / 2 - 60, "JOB QUEST", {
      fontFamily: FONT,
      fontSize: "32px",
      color: "#39ff14",
      stroke: "#000",
      strokeThickness: 5,
      shadow: { offsetX: 3, offsetY: 3, color: "#1a8a00", blur: 8, fill: true },
      fontStyle: "bold",
    });
    title.setOrigin(0.5, 0.5);

    const subtitle = this.add.text(width / 2, height / 2 - 16, "CAREER CITY", {
      fontFamily: FONT,
      fontSize: "16px",
      color: "#00ffff",
      stroke: "#000",
      strokeThickness: 3,
      fontStyle: "bold",
    });
    subtitle.setOrigin(0.5, 0.5);

    const tagline = this.add.text(
      width / 2,
      height / 2 + 16,
      "Because job hunting wasn't\nenough of a grind.",
      {
        fontFamily: FONT,
        fontSize: "12px",
        color: "#ffbf00",
        align: "center",
        lineSpacing: 6,
      },
    );
    tagline.setOrigin(0.5, 0.5);

    const loading = this.add.text(
      width / 2,
      height / 2 + 72,
      "GENERATING WORLD...",
      {
        fontFamily: FONT,
        fontSize: "11px",
        color: "#ff00ff",
        fontStyle: "bold",
      },
    );
    loading.setOrigin(0.5, 0.5);

    const barBg = this.add.rectangle(
      width / 2,
      height / 2 + 92,
      280,
      12,
      0x111111,
    );
    barBg.setStrokeStyle(2, 0x39ff14, 1);
    const bar = this.add.rectangle(
      width / 2 - 140,
      height / 2 + 92,
      0,
      8,
      0x39ff14,
    );
    bar.setOrigin(0, 0.5);

    const generator = new AssetGenerator(this);
    generator.generateAll(NPC_CONFIGS);

    this.tweens.add({
      targets: bar,
      width: 280,
      duration: 800,
      ease: "Power2",
      onComplete: () => {
        loading.setText("READY!");

        // Resume AudioContext — required before audio can play (browser autoplay policy)
        musicManager.resumeAudioContextAndPlay();

        musicManager.init();
        this.time.delayedCall(200, () => {
          musicManager.play(MUSIC_TRACKS.CAREER_CITY.key);
        });

        this.tweens.add({
          targets: [title, subtitle, tagline, loading, barBg, bar],
          alpha: 0,
          duration: 400,
          delay: 300,
          onComplete: () => {
            this.scene.start(SCENE_KEYS.CAREER_CITY);
            this.scene.launch(SCENE_KEYS.HUD);
          },
        });
      },
    });

    this.tweens.add({
      targets: loading,
      alpha: 0.4,
      duration: 300,
      yoyo: true,
      repeat: 4,
    });
  }
}
