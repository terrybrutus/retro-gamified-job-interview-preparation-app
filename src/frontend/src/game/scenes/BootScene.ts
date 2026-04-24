import Phaser from "phaser";
import { AssetGenerator } from "../utils/AssetGenerator";
import { NPC_CONFIGS, SCENE_KEYS } from "../utils/Constants";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: SCENE_KEYS.BOOT });
  }

  create(): void {
    const { width, height } = this.scale;

    // Loading screen
    this.add.rectangle(width / 2, height / 2, width, height, 0x050510);

    // Retro scanline effect on boot
    for (let y = 0; y < height; y += 4) {
      this.add.rectangle(width / 2, y + 1, width, 2, 0x000000, 0.15);
    }

    const title = this.add.text(width / 2, height / 2 - 60, "JOB QUEST", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "28px",
      color: "#39ff14",
      stroke: "#000",
      strokeThickness: 5,
      shadow: { offsetX: 3, offsetY: 3, color: "#1a8a00", blur: 8, fill: true },
    });
    title.setOrigin(0.5, 0.5);

    const subtitle = this.add.text(width / 2, height / 2 - 16, "CAREER CITY", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "14px",
      color: "#00ffff",
      stroke: "#000",
      strokeThickness: 3,
    });
    subtitle.setOrigin(0.5, 0.5);

    const tagline = this.add.text(
      width / 2,
      height / 2 + 14,
      "Because job hunting wasn't\nenough of a grind.",
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "7px",
        color: "#ffbf00",
        align: "center",
        lineSpacing: 6,
      },
    );
    tagline.setOrigin(0.5, 0.5);

    const loading = this.add.text(
      width / 2,
      height / 2 + 70,
      "GENERATING WORLD...",
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "9px",
        color: "#ff00ff",
      },
    );
    loading.setOrigin(0.5, 0.5);

    // Progress bar
    const barBg = this.add.rectangle(
      width / 2,
      height / 2 + 90,
      280,
      12,
      0x111111,
    );
    barBg.setStrokeStyle(2, 0x39ff14, 1);
    const bar = this.add.rectangle(
      width / 2 - 140,
      height / 2 + 90,
      0,
      8,
      0x39ff14,
    );
    bar.setOrigin(0, 0.5);

    // Generate all assets
    const generator = new AssetGenerator(this);
    generator.generateAll(NPC_CONFIGS);

    // Animate progress bar
    this.tweens.add({
      targets: bar,
      width: 280,
      duration: 800,
      ease: "Power2",
      onComplete: () => {
        loading.setText("READY!");
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

    // Blink loading text
    this.tweens.add({
      targets: loading,
      alpha: 0.4,
      duration: 300,
      yoyo: true,
      repeat: 4,
    });
  }
}
