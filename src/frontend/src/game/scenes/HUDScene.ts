import Phaser from "phaser";
import {
  CAREER_LEVEL_FORMULA,
  COLORS,
  GAME_EVENTS,
  SCENE_KEYS,
} from "../utils/Constants";
import type { NPCConfig } from "../utils/Constants";

const FONT = "Orbitron, sans-serif";
const XP_PER_LEVEL_BASE = 100;

function xpForNextLevel(level: number): number {
  return (level + 1) * (level + 1) * XP_PER_LEVEL_BASE;
}

export class HUDScene extends Phaser.Scene {
  private xpText!: Phaser.GameObjects.Text;
  private levelText!: Phaser.GameObjects.Text;
  private xpBarBg!: Phaser.GameObjects.Rectangle;
  private xpBar!: Phaser.GameObjects.Rectangle;
  private barGlow!: Phaser.GameObjects.Rectangle;
  private npcNameText!: Phaser.GameObjects.Text;
  private minimapBtn!: Phaser.GameObjects.Container;
  private xpFlash!: Phaser.GameObjects.Text;
  private barX = 0;
  private barW = 0;

  private totalXP = 0;
  private careerLevel = 0;

  constructor() {
    super({ key: SCENE_KEYS.HUD, active: false });
  }

  create(): void {
    const { width, height } = this.scale;
    this.buildHUDBottom(width, height);
    this.buildMinimapButton(width);
    this.buildNPCNameDisplay(width);
    this.buildXPFlash(width, height);
    this.setupEventListeners();
  }

  buildHUDBottom(width: number, height: number): void {
    const hudH = 58;

    const hudBg = this.add.rectangle(
      width / 2,
      height - hudH / 2,
      width,
      hudH,
      0x000000,
      0.94,
    );
    hudBg.setStrokeStyle(3, COLORS.NEON_GREEN, 1);
    hudBg.setDepth(90);

    const accent = this.add.rectangle(
      width / 2,
      height - hudH,
      width,
      1,
      COLORS.NEON_GREEN,
      0.3,
    );
    accent.setDepth(90);

    const levelBadge = this.add.rectangle(
      70,
      height - hudH / 2,
      110,
      38,
      0x0a1a0a,
      1,
    );
    levelBadge.setStrokeStyle(2, COLORS.NEON_GREEN, 0.8);
    levelBadge.setDepth(91);

    this.levelText = this.add.text(70, height - hudH / 2 - 8, "LEVEL 0", {
      fontFamily: FONT,
      fontSize: "11px",
      color: "#39ff14",
      fontStyle: "bold",
    });
    this.levelText.setOrigin(0.5, 0.5).setDepth(92);

    this.xpText = this.add.text(70, height - hudH / 2 + 10, "XP: 0", {
      fontFamily: FONT,
      fontSize: "9px",
      color: "#00ffff",
    });
    this.xpText.setOrigin(0.5, 0.5).setDepth(92);

    const barPad = 140;
    this.barX = barPad;
    this.barW = width - barPad - 200;
    const barY = height - hudH / 2;

    this.add
      .text(barPad, barY - 14, "XP", {
        fontFamily: FONT,
        fontSize: "8px",
        color: "#39ff1466",
      })
      .setDepth(91);

    this.xpBarBg = this.add.rectangle(
      this.barX + this.barW / 2,
      barY,
      this.barW,
      14,
      0x0a0a0a,
      1,
    );
    this.xpBarBg.setStrokeStyle(1, COLORS.NEON_GREEN, 0.5);
    this.xpBarBg.setDepth(91);

    this.xpBar = this.add.rectangle(
      this.barX,
      barY,
      0,
      10,
      COLORS.NEON_GREEN,
      1,
    );
    this.xpBar.setOrigin(0, 0.5).setDepth(92);

    this.barGlow = this.add.rectangle(
      this.barX,
      barY,
      0,
      10,
      COLORS.NEON_GREEN,
      0.25,
    );
    this.barGlow.setOrigin(0, 0.5).setDepth(91);
    this.barGlow.setBlendMode(Phaser.BlendModes.ADD);

    this.add
      .text(width / 2, height - hudH + 8, "◆ CAREER CITY ◆", {
        fontFamily: FONT,
        fontSize: "7px",
        color: "#39ff1433",
        align: "center",
      })
      .setOrigin(0.5, 0)
      .setDepth(90);
  }

  buildMinimapButton(width: number): void {
    const bg = this.add.rectangle(0, 0, 114, 34, 0x001a1a, 0.95);
    bg.setStrokeStyle(2, COLORS.NEON_CYAN, 1);

    const label = this.add.text(0, 0, "[ MAP ]", {
      fontFamily: FONT,
      fontSize: "10px",
      color: "#00ffff",
      fontStyle: "bold",
    });
    label.setOrigin(0.5, 0.5);

    this.minimapBtn = this.add.container(width - 80, 24, [bg, label]);
    this.minimapBtn.setDepth(91);
    this.minimapBtn.setInteractive(
      new Phaser.Geom.Rectangle(-57, -17, 114, 34),
      Phaser.Geom.Rectangle.Contains,
    );
    this.minimapBtn.on("pointerover", () => {
      bg.setStrokeStyle(2, COLORS.NEON_AMBER, 1);
      label.setColor("#ffbf00");
    });
    this.minimapBtn.on("pointerout", () => {
      bg.setStrokeStyle(2, COLORS.NEON_CYAN, 1);
      label.setColor("#00ffff");
    });
    this.minimapBtn.on("pointerdown", () => {
      window.dispatchEvent(new CustomEvent(GAME_EVENTS.MINIMAP_TOGGLE));
    });
  }

  private buildNPCNameDisplay(width: number): void {
    this.npcNameText = this.add.text(width / 2, 32, "", {
      fontFamily: FONT,
      fontSize: "12px",
      color: "#ffbf00",
      backgroundColor: "#000000ee",
      padding: { x: 10, y: 5 },
      stroke: "#000000",
      strokeThickness: 2,
      fontStyle: "bold",
    });
    this.npcNameText.setOrigin(0.5, 0.5).setDepth(91).setVisible(false);
  }

  buildXPFlash(width: number, height: number): void {
    this.xpFlash = this.add.text(width / 2, height - 80, "", {
      fontFamily: FONT,
      fontSize: "14px",
      color: "#39ff14",
      stroke: "#000000",
      strokeThickness: 4,
      fontStyle: "bold",
    });
    this.xpFlash.setOrigin(0.5, 0.5).setDepth(95).setAlpha(0);
  }

  private setupEventListeners(): void {
    window.addEventListener(GAME_EVENTS.NPC_NEARBY, (e: Event) => {
      const npc = (e as CustomEvent).detail.npc as NPCConfig;
      this.npcNameText.setText(`▶ ${npc.name}`);
      this.npcNameText.setVisible(true);
      this.tweens.add({ targets: this.npcNameText, alpha: 1, duration: 200 });
    });

    window.addEventListener(GAME_EVENTS.NPC_LEAVE, () => {
      this.tweens.add({
        targets: this.npcNameText,
        alpha: 0,
        duration: 300,
        onComplete: () => this.npcNameText.setVisible(false),
      });
    });

    window.addEventListener(GAME_EVENTS.XP_GAINED, (e: Event) => {
      const { amount, reason } = (e as CustomEvent).detail as {
        amount: number;
        reason: string;
      };
      this.addXP(amount, reason);
    });

    window.addEventListener("hud:setXP", (e: Event) => {
      const { xp } = (e as CustomEvent).detail as { xp: number };
      this.totalXP = xp;
      this.updateXPDisplay();
    });
  }

  private addXP(amount: number, reason: string): void {
    this.totalXP += amount;
    this.updateXPDisplay();
    this.showXPFlash(amount, reason);
  }

  updateXP(xp: number): void {
    this.totalXP = xp;
    this.updateXPDisplay();
  }

  updateLevel(_level: number): void {
    // level is derived from XP
  }

  private updateXPDisplay(): void {
    this.careerLevel = CAREER_LEVEL_FORMULA(this.totalXP);
    const nextLevelXP = xpForNextLevel(this.careerLevel);
    const prevLevelXP =
      this.careerLevel > 0 ? xpForNextLevel(this.careerLevel - 1) : 0;
    const progress = Math.min(
      (this.totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP),
      1,
    );

    this.levelText.setText(`LEVEL ${this.careerLevel}`);
    this.xpText.setText(`XP: ${this.totalXP}`);

    const newWidth = Math.max(0, this.barW * progress);
    this.tweens.add({
      targets: this.xpBar,
      width: newWidth,
      duration: 600,
      ease: "Power2",
    });
    this.tweens.add({
      targets: this.barGlow,
      width: newWidth,
      duration: 600,
      ease: "Power2",
    });
  }

  private showXPFlash(amount: number, reason: string): void {
    this.xpFlash.setText(`+${amount} XP  ${reason.toUpperCase()}`);
    this.xpFlash.setAlpha(1);
    this.xpFlash.setY(this.scale.height - 78);

    this.tweens.add({
      targets: this.xpFlash,
      y: this.scale.height - 120,
      alpha: 0,
      duration: 1600,
      ease: "Power2",
    });
  }
}
