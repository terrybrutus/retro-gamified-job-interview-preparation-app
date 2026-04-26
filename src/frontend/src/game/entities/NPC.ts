import Phaser from "phaser";
import type { NPCConfig } from "../utils/Constants";
import { COLORS } from "../utils/Constants";

const INTERACT_RADIUS = 90;
const NPC_W = 24;
const NPC_H = 40;

export class NPC extends Phaser.GameObjects.Container {
  readonly config: NPCConfig;
  private buildingSprite!: Phaser.GameObjects.Image;
  private npcSprite!: Phaser.GameObjects.Sprite;
  private buildingLabel!: Phaser.GameObjects.Text;
  private interactLabel!: Phaser.GameObjects.Text;
  private glowRect!: Phaser.GameObjects.Rectangle;
  private proximityCircle!: Phaser.GameObjects.Arc;
  private isNearby = false;
  private dialogueIndex = 0;

  constructor(scene: Phaser.Scene, config: NPCConfig) {
    super(scene, config.x, config.y);
    this.config = config;

    // Proximity glow circle
    this.proximityCircle = scene.add.arc(
      0,
      20,
      40,
      0,
      360,
      false,
      config.color,
      0.03,
    );
    this.proximityCircle.setStrokeStyle(1, config.color, 0.15);
    this.add(this.proximityCircle);

    // Building glow
    this.glowRect = scene.add.rectangle(0, -55, 128, 115, config.color, 0);
    this.glowRect.setBlendMode(Phaser.BlendModes.ADD);
    this.add(this.glowRect);

    // Building sprite
    this.buildingSprite = scene.add.image(0, -55, `building-${config.key}`);
    this.buildingSprite.setOrigin(0.5, 0.5);
    this.add(this.buildingSprite);

    // Building sign label — larger, centered above the building roof
    this.buildingLabel = scene.add.text(0, -128, config.label, {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "22px",
      fontStyle: "bold",
      color: config.textColor,
      align: "center",
      stroke: "#000000",
      strokeThickness: 2,
      lineSpacing: 4,
      shadow: {
        offsetX: 0,
        offsetY: 0,
        color: config.textColor,
        blur: 10,
        fill: true,
      },
    });
    this.buildingLabel.setOrigin(0.5, 1);
    this.buildingLabel.setResolution(window.devicePixelRatio || 1);
    this.add(this.buildingLabel);

    // NPC sprite with idle animation
    const sheetKey = `npc-${config.key}-anim`;
    this.ensureNPCSpritesheet(scene, config.key, sheetKey);

    const animKey = `npc-${config.key}-idle`;
    if (!scene.anims.exists(animKey)) {
      scene.anims.create({
        key: animKey,
        frames: [
          { key: sheetKey, frame: 0 },
          { key: sheetKey, frame: 1 },
        ],
        frameRate: 2,
        repeat: -1,
      });
    }

    this.npcSprite = scene.add.sprite(0, 22, sheetKey, 0);
    this.npcSprite.setOrigin(0.5, 0.5);
    this.npcSprite.play(animKey);
    this.add(this.npcSprite);

    // Interact label
    this.interactLabel = scene.add.text(0, 44, "[ E ] TALK", {
      fontFamily: "Orbitron, sans-serif",
      fontSize: "16px",
      color: "#39ff14",
      backgroundColor: "#000000dd",
      padding: { x: 6, y: 4 },
      stroke: "#000000",
      strokeThickness: 1,
    });
    this.interactLabel.setOrigin(0.5, 0.5);
    this.interactLabel.setResolution(window.devicePixelRatio || 1);
    this.interactLabel.setVisible(false);
    this.add(this.interactLabel);

    scene.add.existing(this);
    this.setDepth(5);

    // Start glow animation
    this.scene.tweens.add({
      targets: this.glowRect,
      alpha: { from: 0, to: 0.06 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  private ensureNPCSpritesheet(
    scene: Phaser.Scene,
    npcKey: string,
    sheetKey: string,
  ): void {
    if (scene.textures.exists(sheetKey)) return;

    const srcTex = scene.textures.get(`npc-${npcKey}`);
    const src = srcTex.getSourceImage();
    const canvas = document.createElement("canvas");
    canvas.width = NPC_W * 2;
    canvas.height = NPC_H;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(src as CanvasImageSource, 0, 0);
    scene.textures.addCanvas(sheetKey, canvas);
    // Register frames
    scene.textures.get(sheetKey).add(0, 0, 0, 0, NPC_W, NPC_H);
    scene.textures.get(sheetKey).add(1, 0, NPC_W, 0, NPC_W, NPC_H);
  }

  private colorToHex(color: number): string {
    return `#${color.toString(16).padStart(6, "0")}`;
  }

  checkProximity(playerX: number, playerY: number): boolean {
    const dx = playerX - this.x;
    const dy = playerY - this.y;
    const near = Math.sqrt(dx * dx + dy * dy) < INTERACT_RADIUS;

    if (near !== this.isNearby) {
      this.isNearby = near;
      this.interactLabel.setVisible(near);

      if (near) {
        this.scene.tweens.add({
          targets: this.glowRect,
          alpha: 0.2,
          duration: 200,
        });
        this.scene.tweens.add({
          targets: this.proximityCircle,
          alpha: 0.12,
          duration: 200,
        });
        this.scene.tweens.add({
          targets: this.buildingSprite,
          scaleX: 1.03,
          scaleY: 1.03,
          duration: 200,
          ease: "Back.easeOut",
        });
        this.scene.tweens.add({
          targets: this.npcSprite,
          y: 16,
          duration: 120,
          yoyo: true,
          ease: "Quad.easeOut",
        });
      } else {
        this.scene.tweens.add({
          targets: [this.glowRect, this.proximityCircle],
          alpha: 0,
          duration: 300,
        });
        this.scene.tweens.add({
          targets: this.buildingSprite,
          scaleX: 1,
          scaleY: 1,
          duration: 200,
        });
      }
    }

    return near;
  }

  getNextDialogue(): string {
    const line =
      this.config.dialogues[this.dialogueIndex % this.config.dialogues.length];
    this.dialogueIndex++;
    return line;
  }

  getIsNearby(): boolean {
    return this.isNearby;
  }

  playInteractAnimation(): void {
    this.scene.tweens.add({
      targets: this.npcSprite,
      scaleX: 1.3,
      scaleY: 1.3,
      duration: 80,
      yoyo: true,
      ease: "Back.easeOut",
    });
  }
}
