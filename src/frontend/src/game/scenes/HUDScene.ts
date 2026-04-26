/**
 * HUDScene — Pure event relay layer. No Phaser-drawn visuals.
 *
 * All HUD visuals (XP bar, level badge, music player) live in the React
 * BottomHUD component inside GameContainer.tsx. That component is always
 * present in the DOM regardless of which Phaser scene is active, so it
 * never disappears when transitioning between Career City and building interiors.
 *
 * HUDScene's only job is:
 *   1. Track totalXP state so it survives scene transitions
 *   2. Dispatch `hud:xpUpdate` window events that React BottomHUD listens to
 *   3. Show the floating "+XP" flash text (rendered on canvas, acceptable in all scenes)
 *   4. Show the NPC name prompt at the top of the screen
 */

import Phaser from "phaser";
import {
  CAREER_LEVEL_FORMULA,
  GAME_EVENTS,
  SCENE_KEYS,
} from "../utils/Constants";
import type { NPCConfig } from "../utils/Constants";

const FONT = "Orbitron, sans-serif";

export class HUDScene extends Phaser.Scene {
  private npcNameText!: Phaser.GameObjects.Text;
  private xpFlash!: Phaser.GameObjects.Text;

  private totalXP = 0;
  private careerLevel = 0;

  constructor() {
    super({ key: SCENE_KEYS.HUD, active: false });
  }

  create(): void {
    const { width, height } = this.scale;
    this.buildNPCNameDisplay(width);
    this.buildXPFlash(width, height);
    this.setupEventListeners();
  }

  private buildNPCNameDisplay(width: number): void {
    this.npcNameText = this.add.text(width / 2, 32, "", {
      fontFamily: FONT,
      fontSize: "16px",
      color: "#ffbf00",
      backgroundColor: "#000000ee",
      padding: { x: 10, y: 5 },
      stroke: "#000000",
      strokeThickness: 1,
      fontStyle: "bold",
    });
    this.npcNameText.setOrigin(0.5, 0.5).setDepth(91).setVisible(false);
    this.npcNameText.setResolution(window.devicePixelRatio || 1);
    // NPC name is a UI overlay — it should not scroll with the world
    this.npcNameText.setScrollFactor(0);
  }

  buildXPFlash(width: number, height: number): void {
    this.xpFlash = this.add.text(width / 2, height - 80, "", {
      fontFamily: FONT,
      fontSize: "20px",
      color: "#39ff14",
      stroke: "#000000",
      strokeThickness: 2,
      fontStyle: "bold",
    });
    this.xpFlash.setOrigin(0.5, 0.5).setDepth(95).setAlpha(0);
    this.xpFlash.setResolution(window.devicePixelRatio || 1);
    // XP flash is a screen-space overlay
    this.xpFlash.setScrollFactor(0);
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
      this.careerLevel = CAREER_LEVEL_FORMULA(xp);
      this.notifyReact();
    });
  }

  private addXP(amount: number, reason: string): void {
    this.totalXP += amount;
    this.careerLevel = CAREER_LEVEL_FORMULA(this.totalXP);
    this.notifyReact();
    this.showXPFlash(amount, reason);
  }

  /** Dispatch window event so React BottomHUD updates */
  private notifyReact(): void {
    window.dispatchEvent(
      new CustomEvent("hud:xpUpdate", {
        detail: { xp: this.totalXP, level: this.careerLevel },
      }),
    );
  }

  // Public API kept for compatibility
  updateXP(xp: number): void {
    this.totalXP = xp;
    this.careerLevel = CAREER_LEVEL_FORMULA(xp);
    this.notifyReact();
  }

  updateLevel(_level: number): void {
    // level is derived from XP — no-op
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
