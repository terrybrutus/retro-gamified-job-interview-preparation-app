import Phaser from "phaser";
import { Player } from "../entities/Player";
import { musicManager } from "../managers/MusicManager";
import { MUSIC_TRACKS, SCENE_KEYS } from "../utils/Constants";

const FONT = "Orbitron, sans-serif";

// ── ROOM DIMENSIONS ──────────────────────────────────────────────────────────
// All rooms are drawn in a fixed 600x450 "game coordinate" space,
// then the camera is zoomed so the room fills the actual viewport.
// This keeps all object sizes proportional to the player (24×32 px).

const ROOM_W = 600;
const ROOM_H = 450;

interface InteriorData {
  fromScene?: string;
  exitX?: number;
  exitY?: number;
}

// ── BASE INTERIOR SCENE ──────────────────────────────────────────────────────

export abstract class BaseInteriorScene extends Phaser.Scene {
  protected playerEntity!: Player;
  protected npcX = 300;
  protected npcY = 180;
  protected interactPrompt!: Phaser.GameObjects.Text;
  protected dialogueBox?: Phaser.GameObjects.Container;
  protected cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  protected wasd!: Record<string, Phaser.Input.Keyboard.Key>;
  protected isNearNPC = false;
  protected dialogueLines: string[] = [];
  protected dialogueIndex = 0;
  protected dialogueOpen = false;
  protected npcColor = 0xffffff;
  private _exiting = false;
  private _fromData: InteriorData = {};

  create(data?: InteriorData): void {
    this._fromData = data ?? {};
    this._exiting = false;

    // Fixed room size in world space
    this.physics.world.setBounds(0, 0, ROOM_W, ROOM_H);

    // Calculate zoom to fill the actual viewport with the room
    const sw = this.scale.width;
    const sh = this.scale.height;
    const zoom = Math.min(sw / ROOM_W, sh / ROOM_H);
    this.cameras.main.setZoom(zoom);
    this.cameras.main.setBounds(0, 0, ROOM_W, ROOM_H);
    this.cameras.main.setScroll(0, 0);
    // Center the room if there are letterbox gaps
    this.cameras.main.centerOn(ROOM_W / 2, ROOM_H / 2);

    this.drawEnvironment();
    this.spawnPlayer();
    this.spawnNPC();
    this.buildInteractPrompt();
    this.setupInput();
    this.setupTouchListeners();

    this.cameras.main.fadeIn(300, 0, 0, 0);
    this.startMusic();
    musicManager.init();

    // Unlock audio on any interaction
    this.input.on("pointerdown", () =>
      musicManager.resumeAudioContextAndPlay(),
    );
    this.input.keyboard?.on("keydown", () =>
      musicManager.resumeAudioContextAndPlay(),
    );
  }

  protected abstract drawEnvironment(): void;
  protected abstract startMusic(): void;
  protected abstract getNPCColor(): number;
  protected abstract getDialogueLines(): string[];
  protected abstract getNPCLabel(): string;
  /** NPC position in room coordinates (0–600, 0–450) */
  protected abstract getNPCX(): number;
  protected abstract getNPCY(): number;

  // ── PLAYER SPAWN ──────────────────────────────────────────────────────────

  protected spawnPlayer(): void {
    // Spawn near bottom center, just above the exit door area
    const spawnX = ROOM_W / 2;
    const spawnY = ROOM_H - 72;
    this.playerEntity = new Player(this, spawnX, spawnY);
    this.playerEntity.setDepth(50);
    if (this.playerEntity.body) {
      (
        this.playerEntity.body as Phaser.Physics.Arcade.Body
      ).setCollideWorldBounds(true);
      (this.playerEntity.body as Phaser.Physics.Arcade.Body).setMaxVelocity(
        120,
        120,
      );
    }
  }

  // ── NPC ───────────────────────────────────────────────────────────────────

  protected spawnNPC(): void {
    this.npcX = this.getNPCX();
    this.npcY = this.getNPCY();
    this.npcColor = this.getNPCColor();
    this.dialogueLines = this.getDialogueLines();

    const colorHex = `#${this.npcColor.toString(16).padStart(6, "0")}`;
    const g = this.add.graphics();

    // Pixel-art person — same proportions as player (24w × 32h) but slightly taller (26w × 36h)
    const ox = 0;
    const fh = 36;
    // Shadow
    g.fillStyle(0x000000, 0.22);
    g.fillEllipse(ox + 13, fh - 2, 18, 5);
    // Legs
    g.fillStyle(this.npcColor, 0.9);
    g.fillRect(ox + 6, fh - 14, 5, 12);
    g.fillRect(ox + 15, fh - 14, 5, 12);
    // Shoes
    g.fillStyle(0x111111, 1);
    g.fillRect(ox + 5, fh - 4, 6, 3);
    g.fillRect(ox + 15, fh - 4, 6, 3);
    // Body
    g.fillStyle(this.npcColor, 1);
    g.fillRect(ox + 5, fh - 28, 16, 14);
    // Arms
    g.fillRect(ox + 1, fh - 27, 4, 10);
    g.fillRect(ox + 21, fh - 27, 4, 10);
    // Hands
    g.fillStyle(0xffcc80, 1);
    g.fillRect(ox + 1, fh - 20, 4, 4);
    g.fillRect(ox + 21, fh - 20, 4, 4);
    // Head
    g.fillStyle(0xffcc80, 1);
    g.fillRect(ox + 7, fh - 36, 12, 10);
    // Hair / hat (color-coded by NPC)
    g.fillStyle(this.npcColor, 1);
    g.fillRect(ox + 6, fh - 38, 14, 5);
    g.fillRect(ox + 6, fh - 36, 2, 4);
    g.fillRect(ox + 18, fh - 36, 2, 4);
    // Eyes
    g.fillStyle(0x000000, 1);
    g.fillRect(ox + 9, fh - 32, 3, 3);
    g.fillRect(ox + 14, fh - 32, 3, 3);
    // Colour glow ring
    g.lineStyle(1.5, this.npcColor, 0.3);
    g.strokeCircle(ox + 13, fh - 18, 24);

    const nameLabel = this.add
      .text(0, -48, this.getNPCLabel(), {
        fontFamily: FONT,
        fontSize: "8px",
        color: colorHex,
        backgroundColor: "#000000cc",
        padding: { x: 5, y: 3 },
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);

    const container = this.add.container(this.npcX, this.npcY, [g, nameLabel]);
    container.setDepth(40);

    // Gentle float
    this.tweens.add({
      targets: container,
      y: this.npcY - 4,
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  // ── INTERACT PROMPT ───────────────────────────────────────────────────────

  protected buildInteractPrompt(): void {
    this.interactPrompt = this.add
      .text(this.npcX, this.npcY - 68, "[ E ] TALK", {
        fontFamily: FONT,
        fontSize: "8px",
        color: "#ffbf00",
        backgroundColor: "#000000dd",
        padding: { x: 5, y: 3 },
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(60)
      .setAlpha(0);
  }

  // ── INPUT ─────────────────────────────────────────────────────────────────

  protected setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasd = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      E: Phaser.Input.Keyboard.KeyCodes.E,
    }) as Record<string, Phaser.Input.Keyboard.Key>;

    this.input.keyboard!.on("keydown-ESC", () => this.exitToOverworld());
    this.input.keyboard!.on("keydown-E", () => this.tryInteract());
    this.input.keyboard!.on("keydown-SPACE", () => this.tryInteract());
    this.input.keyboard!.on("keydown-ENTER", () => this.tryInteract());
  }

  protected setupTouchListeners(): void {
    window.addEventListener("game:move", this.handleTouchMove as EventListener);
    window.addEventListener(
      "game:interact",
      this.handleTouchInteract as EventListener,
    );
  }

  private handleTouchMove = (e: Event): void => {
    const { direction, pressed } = (e as CustomEvent).detail as {
      direction: string;
      pressed: boolean;
    };
    if (direction === "up") this.playerEntity?.setMoveUp(pressed);
    if (direction === "down") this.playerEntity?.setMoveDown(pressed);
    if (direction === "left") this.playerEntity?.setMoveLeft(pressed);
    if (direction === "right") this.playerEntity?.setMoveRight(pressed);
  };

  private handleTouchInteract = (): void => {
    this.tryInteract();
  };

  // ── DIALOGUE ──────────────────────────────────────────────────────────────

  protected tryInteract(): void {
    if (this.dialogueOpen) {
      this.closeDialogue();
      return;
    }
    if (this.isNearNPC) {
      this.openDialogue();
    }
  }

  protected openDialogue(): void {
    this.dialogueOpen = true;
    if (this.dialogueBox) this.dialogueBox.destroy();

    const line =
      this.dialogueLines[this.dialogueIndex % this.dialogueLines.length];
    this.dialogueIndex++;

    const colorHex = `#${this.npcColor.toString(16).padStart(6, "0")}`;
    const bw = Math.min(ROOM_W - 40, 440);
    const bh = 72;
    const bx = ROOM_W / 2;
    const by = ROOM_H - 68;

    const bg = this.add.rectangle(0, 0, bw, bh, 0x000000, 0.95);
    bg.setStrokeStyle(2, this.npcColor, 1);
    const txt = this.add
      .text(0, -4, line, {
        fontFamily: FONT,
        fontSize: "10px",
        color: colorHex,
        align: "center",
        lineSpacing: 5,
        wordWrap: { width: bw - 30 },
      })
      .setOrigin(0.5, 0.5);

    const hint = this.add
      .text(bw / 2 - 10, bh / 2 - 8, "▶", {
        fontFamily: FONT,
        fontSize: "8px",
        color: colorHex,
      })
      .setOrigin(1, 1);

    this.dialogueBox = this.add.container(bx, by, [bg, txt, hint]);
    this.dialogueBox.setDepth(70);
    this.dialogueBox.setAlpha(0);
    this.tweens.add({ targets: this.dialogueBox, alpha: 1, duration: 150 });
  }

  protected closeDialogue(): void {
    this.dialogueOpen = false;
    if (this.dialogueBox) {
      const box = this.dialogueBox;
      this.dialogueBox = undefined;
      this.tweens.add({
        targets: box,
        alpha: 0,
        duration: 150,
        onComplete: () => box.destroy(),
      });
    }
  }

  // ── EXIT ──────────────────────────────────────────────────────────────────

  protected exitToOverworld(): void {
    if (this._exiting) return;
    if (this.dialogueOpen) {
      this.closeDialogue();
      return;
    }
    this._exiting = true;

    if (this.playerEntity?.body) {
      (this.playerEntity.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }
    this.playerEntity?.setMoveUp(false);
    this.playerEntity?.setMoveDown(false);
    this.playerEntity?.setMoveLeft(false);
    this.playerEntity?.setMoveRight(false);

    window.removeEventListener(
      "game:move",
      this.handleTouchMove as EventListener,
    );
    window.removeEventListener(
      "game:interact",
      this.handleTouchInteract as EventListener,
    );

    this.cameras.main.fadeOut(300, 0, 0, 0);

    this.time.delayedCall(320, () => {
      const exitX = this._fromData.exitX;
      const exitY = this._fromData.exitY;

      // Stop this interior scene
      this.scene.stop();

      // Safely wake or restart CareerCityScene
      const mgr = this.scene.manager;
      const ccKey = SCENE_KEYS.CAREER_CITY;

      if (mgr.isSleeping(ccKey)) {
        this.scene.wake(ccKey, { exitX, exitY });
      } else if (mgr.isActive(ccKey)) {
        // Already running — dispatch a custom wakeup event as fallback
        window.dispatchEvent(
          new CustomEvent("interior:exit", { detail: { exitX, exitY } }),
        );
      } else {
        // Scene was never started — start fresh
        this.scene.start(ccKey);
      }
    });
  }

  // ── UPDATE ────────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    if (!this.playerEntity || this._exiting) return;

    const wKey = this.wasd.W as Phaser.Input.Keyboard.Key;
    const sKey = this.wasd.S as Phaser.Input.Keyboard.Key;
    const aKey = this.wasd.A as Phaser.Input.Keyboard.Key;
    const dKey = this.wasd.D as Phaser.Input.Keyboard.Key;

    const up = this.cursors.up.isDown || wKey.isDown;
    const down = this.cursors.down.isDown || sKey.isDown;
    const left = this.cursors.left.isDown || aKey.isDown;
    const right = this.cursors.right.isDown || dKey.isDown;

    this.playerEntity.setMoveUp(up);
    this.playerEntity.setMoveDown(down);
    this.playerEntity.setMoveLeft(left);
    this.playerEntity.setMoveRight(right);
    this.playerEntity.update(delta);

    // Clamp within room (walls at edges, ceiling at top, floor at bottom)
    const minX = 20;
    const maxX = ROOM_W - 20;
    const minY = 48; // just below ceiling wall
    const maxY = ROOM_H - 16;

    const px = Phaser.Math.Clamp(this.playerEntity.x, minX, maxX);
    const py = Phaser.Math.Clamp(this.playerEntity.y, minY, maxY);
    this.playerEntity.setPosition(px, py);
    this.playerEntity.setDepth(py);

    // Proximity to NPC
    const dx = px - this.npcX;
    const dy = py - this.npcY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const wasNear = this.isNearNPC;
    this.isNearNPC = dist < 70;

    if (this.isNearNPC !== wasNear) {
      this.tweens.add({
        targets: this.interactPrompt,
        alpha: this.isNearNPC ? 1 : 0,
        duration: 200,
      });
    }

    // Exit zone: player walks south to the bottom door area
    const exitZoneY = ROOM_H - 26;
    const exitZoneHalfW = 40;
    const inExit =
      py >= exitZoneY &&
      px >= ROOM_W / 2 - exitZoneHalfW &&
      px <= ROOM_W / 2 + exitZoneHalfW;

    if (inExit) {
      this.exitToOverworld();
    }
  }

  // ── SHARED DRAWING HELPERS ────────────────────────────────────────────────

  /** Draws the exit door at the bottom-center of every room */
  protected drawExitDoor(
    g: Phaser.GameObjects.Graphics,
    frameColor: number,
    doorColor: number,
    handleColor: number,
    labelColor: string,
  ): void {
    const cx = ROOM_W / 2;
    const doorW = 48;
    const doorH = 70;
    const doorTop = ROOM_H - doorH - 2;

    // Frame
    g.fillStyle(frameColor, 1);
    g.fillRect(cx - doorW / 2 - 4, doorTop - 5, doorW + 8, doorH + 7);
    g.fillEllipse(cx, doorTop - 5, doorW + 8, 20);
    // Door
    g.fillStyle(doorColor, 1);
    g.fillRect(cx - doorW / 2, doorTop, doorW, doorH);
    // Panel lines
    g.fillStyle(frameColor, 0.2);
    g.fillRect(cx - doorW / 2 + 3, doorTop + 4, (doorW - 10) / 2, 28);
    g.fillRect(cx + 2, doorTop + 4, (doorW - 10) / 2, 28);
    g.fillRect(cx - doorW / 2 + 3, doorTop + 36, (doorW - 10) / 2, 28);
    g.fillRect(cx + 2, doorTop + 36, (doorW - 10) / 2, 28);
    // Handle
    g.fillStyle(handleColor, 1);
    g.fillCircle(cx + doorW / 2 - 8, doorTop + doorH / 2, 4);
    // Threshold mat
    g.fillStyle(0x333333, 0.6);
    g.fillRect(cx - 34, ROOM_H - 4, 68, 4);

    // Subtle exit hint
    this.add
      .text(cx, ROOM_H - 8, "↓ EXIT", {
        fontFamily: FONT,
        fontSize: "7px",
        color: labelColor,
        backgroundColor: "#00000099",
        padding: { x: 3, y: 2 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(8);
  }

  protected drawWindow(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    ww: number,
    wh: number,
    frameColor: number,
    skyColor: number,
  ): void {
    g.fillStyle(frameColor, 1);
    g.fillRect(x - ww / 2, y, ww, wh);
    g.fillStyle(skyColor, 1);
    g.fillRect(x - ww / 2 + 4, y + 4, ww - 8, wh - 8);
    g.lineStyle(3, frameColor, 1);
    g.lineBetween(x, y, x, y + wh);
    g.lineBetween(x - ww / 2 + 4, y + wh / 2, x + ww / 2 - 4, y + wh / 2);
  }

  protected drawBookshelf(
    g: Phaser.GameObjects.Graphics,
    x: number,
    y: number,
    sw: number,
    sh: number,
    woodColor: number,
  ): void {
    const bookColors = [
      0x8b0000, 0x006400, 0x00008b, 0x4b0082, 0x8b4513, 0x2f4f4f, 0xb8860b,
      0x556b2f, 0x4a0070, 0x8b6914,
    ];
    const shelfCount = Math.max(2, Math.floor(sh / 42));
    const rowH = sh / shelfCount;
    const bookW = 9;
    const booksPerRow = Math.floor((sw - 6) / bookW);

    g.fillStyle(woodColor, 1);
    g.fillRect(x, y, sw, sh);

    for (let row = 0; row < shelfCount; row++) {
      const shelfBaseY = y + row * rowH + rowH - 6;
      g.fillStyle(Math.round(woodColor * 0.7), 1);
      g.fillRect(x + 2, shelfBaseY, sw - 4, 5);
      for (let bk = 0; bk < booksPerRow; bk++) {
        const bh = Math.round(rowH * 0.55) + (bk % 5) * 3;
        const bColor = bookColors[(row * 4 + bk) % bookColors.length];
        g.fillStyle(bColor, 1);
        g.fillRect(x + 3 + bk * bookW, shelfBaseY - bh, bookW - 1, bh);
        g.fillStyle(0xffffff, 0.1);
        g.fillRect(x + 4 + bk * bookW, shelfBaseY - bh, 2, bh);
      }
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COVER LETTER SCENE — fully detailed interior, Pokemon-scale
// ─────────────────────────────────────────────────────────────────────────────

export class CoverLetterScene extends BaseInteriorScene {
  constructor() {
    super({ key: SCENE_KEYS.COVER_LETTER });
  }

  protected startMusic(): void {
    musicManager.crossFadeTo(MUSIC_TRACKS.COVER_LETTER.key);
  }
  protected getNPCColor(): number {
    return 0xb060e0;
  }
  protected getNPCX(): number {
    return 340;
  }
  protected getNPCY(): number {
    return 190;
  }
  protected getNPCLabel(): string {
    return "Cover Letter Carl";
  }
  protected getDialogueLines(): string[] {
    return [
      "Oh, you're here for a cover letter.",
      "I write about 40 of these a day.\nThey all say 'passionate team player.'",
      "Yours won't.\nSit down.",
      "No company name in the body.\nFirst person. Confident.\nNever robotic.",
    ];
  }

  protected drawEnvironment(): void {
    const w = ROOM_W;
    const h = ROOM_H;
    const g = this.add.graphics();
    g.setDepth(2);

    // ── Warm wooden floor (lower 55%) ──────────────────────────────────────
    const floorY = Math.round(h * 0.45);
    // Wall — warm cream with slight grain
    g.fillStyle(0xf5edd8, 1);
    g.fillRect(0, 0, w, floorY);
    // Wall texture grain
    g.lineStyle(1, 0xe8dfc8, 0.5);
    for (let wy = 8; wy < floorY; wy += 12) {
      g.lineBetween(0, wy, w, wy);
    }

    // Wooden plank floor
    for (let fy = floorY; fy < h; fy += 18) {
      const shade =
        Math.floor((fy - floorY) / 18) % 2 === 0 ? 0xb07840 : 0xa06830;
      g.fillStyle(shade, 1);
      g.fillRect(0, fy, w, 18);
    }
    // Plank vertical breaks
    g.lineStyle(1, 0x7a4820, 0.35);
    for (let fx = 0; fx < w; fx += 80) {
      g.lineBetween(fx, floorY, fx, h);
    }
    // Floor/wall baseboard
    g.fillStyle(0x7a4820, 1);
    g.fillRect(0, floorY - 5, w, 5);
    // Crown molding (top)
    g.fillStyle(0xcaa870, 1);
    g.fillRect(0, 0, w, 6);
    g.fillStyle(0xdab880, 1);
    g.fillRect(0, 6, w, 3);

    // ── Back wall: two windows ─────────────────────────────────────────────
    // Left window
    this.drawWindow(g, 150, 14, 72, 90, 0x7b4f2a, 0x87ceeb);
    // Right window
    this.drawWindow(g, w - 150, 14, 72, 90, 0x7b4f2a, 0x87ceeb);
    // Window curtains
    for (const wx of [150, w - 150]) {
      g.fillStyle(0x8b2252, 0.75);
      g.fillRect(wx - 44, 14, 12, 90);
      g.fillRect(wx + 30, 14, 12, 90);
      // Curtain tie-back
      g.fillStyle(0xd4a030, 0.85);
      g.fillRect(wx - 44, 52, 14, 6);
      g.fillRect(wx + 30, 52, 14, 6);
    }

    // ── Left wall: tall bookshelf ─────────────────────────────────────────
    this.drawBookshelf(g, 8, 10, 70, 165, 0x5c3a1e);

    // ── Right wall: hanging quote scroll ─────────────────────────────────
    const qsX = w - 180;
    const qsW = 160;
    const qsH = 80;
    g.fillStyle(0xdeb887, 0.95);
    g.fillRect(qsX, 18, qsW, qsH);
    g.lineStyle(2, 0x8b4513, 0.8);
    g.strokeRect(qsX, 18, qsW, qsH);
    // Scroll curl ends
    g.fillStyle(0xc8a070, 1);
    g.fillRect(qsX, 18, qsW, 6);
    g.fillRect(qsX, 18 + qsH - 6, qsW, 6);
    // String lines in scroll
    g.lineStyle(1, 0x9b7550, 0.45);
    for (let sl = 0; sl < 4; sl++) {
      g.lineBetween(qsX + 10, 32 + sl * 14, qsX + qsW - 10, 32 + sl * 14);
    }
    this.add
      .text(qsX + qsW / 2, 18 + qsH / 2, '"Words are\nyour sword."', {
        fontFamily: FONT,
        fontSize: "9px",
        color: "#4a2800",
        align: "center",
        lineSpacing: 4,
        fontStyle: "italic",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);

    // ── Writing desk ─────────────────────────────────────────────────────
    const deskX = 200;
    const deskY = 225;
    const deskW = 200;
    const deskH = 28;
    // Desk shadow
    g.fillStyle(0x000000, 0.1);
    g.fillRect(deskX + 3, deskY + deskH + 4, deskW, 8);
    // Desk surface
    g.fillStyle(0x5c3a1e, 1);
    g.fillRect(deskX, deskY, deskW, deskH);
    g.fillStyle(0x7a4e28, 1);
    g.fillRect(deskX + 2, deskY, deskW - 4, 10);
    g.fillStyle(0xffffff, 0.05);
    g.fillRect(deskX + 2, deskY, deskW - 4, 4);
    // Desk legs
    g.fillStyle(0x3d2210, 1);
    g.fillRect(deskX + 6, deskY + deskH - 1, 8, 16);
    g.fillRect(deskX + deskW - 14, deskY + deskH - 1, 8, 16);

    // ── Paper + quill on desk ─────────────────────────────────────────────
    // Stack of papers
    for (let pi = 3; pi >= 0; pi--) {
      g.fillStyle(pi % 2 === 0 ? 0xfffef0 : 0xf0eade, 1);
      g.fillRect(deskX + 10 + pi * 2, deskY - 32 + pi * 2, 58, 42);
    }
    // Lines on top paper
    g.lineStyle(1, 0xccccbb, 0.55);
    for (let ln = 0; ln < 4; ln++) {
      g.lineBetween(
        deskX + 16,
        deskY - 26 + ln * 8,
        deskX + 62,
        deskY - 26 + ln * 8,
      );
    }

    // Quill (yellow diagonal line)
    const qX = deskX + 80;
    const qY = deskY + 4;
    g.lineStyle(2, 0xf5d060, 1);
    g.lineBetween(qX, qY, qX + 28, qY - 28);
    g.fillStyle(0xf5d060, 1);
    g.fillTriangle(qX, qY, qX + 4, qY - 3, qX - 3, qY - 4);
    // Inkwell
    g.fillStyle(0x1a1a2e, 1);
    g.fillCircle(qX - 14, qY + 6, 8);
    g.fillRect(qX - 17, qY - 2, 7, 8);

    // ── Lit candle on desk ────────────────────────────────────────────────
    const cdX = deskX + deskW - 28;
    const cdY = deskY - 22;
    g.fillStyle(0xfffff0, 1);
    g.fillRect(cdX - 4, cdY, 8, 22);
    g.fillStyle(0xff7700, 0.9);
    g.fillEllipse(cdX, cdY - 4, 9, 12);
    g.fillStyle(0xffee00, 0.75);
    g.fillEllipse(cdX, cdY - 5, 5, 7);
    // Candle warm glow on desk
    g.fillStyle(0xff8800, 0.08);
    g.fillEllipse(cdX, cdY + 12, 44, 28);

    // ── Chair ────────────────────────────────────────────────────────────
    const chairX = deskX + 70;
    const chairY = deskY + deskH + 6;
    // Seat
    g.fillStyle(0x8b4513, 1);
    g.fillRect(chairX - 14, chairY, 28, 18);
    // Backrest
    g.fillRect(chairX - 12, chairY - 22, 24, 16);
    // Legs
    g.fillStyle(0x5c2e0a, 1);
    g.fillRect(chairX - 12, chairY + 16, 6, 14);
    g.fillRect(chairX + 6, chairY + 16, 6, 14);

    // ── Potted plant in corner ────────────────────────────────────────────
    const plantX = 86;
    const plantY = floorY - 2;
    // Pot
    g.fillStyle(0xcc6633, 1);
    g.fillRect(plantX - 8, plantY - 18, 16, 18);
    g.fillStyle(0xaa4422, 1);
    g.fillRect(plantX - 10, plantY - 20, 20, 4);
    // Soil
    g.fillStyle(0x3d1e08, 1);
    g.fillRect(plantX - 7, plantY - 17, 14, 6);
    // Leaves
    g.fillStyle(0x2e7d32, 1);
    g.fillEllipse(plantX, plantY - 30, 28, 20);
    g.fillEllipse(plantX - 12, plantY - 24, 20, 14);
    g.fillEllipse(plantX + 10, plantY - 26, 18, 12);
    g.fillStyle(0x43a047, 1);
    g.fillEllipse(plantX, plantY - 32, 18, 14);

    // ── Room title ────────────────────────────────────────────────────────
    this.add
      .text(w / 2, 16, "✦ COVER LETTER BUILDER ✦", {
        fontFamily: FONT,
        fontSize: "12px",
        color: "#b060e0",
        stroke: "#000000",
        strokeThickness: 4,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);

    // ── Exit door ─────────────────────────────────────────────────────────
    this.drawExitDoor(g, 0x6b3410, 0x8b4513, 0xffd700, "#b060e0");

    g.setDepth(2);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESUME TAILOR SCENE — minimal placeholder with correct proportions
// ─────────────────────────────────────────────────────────────────────────────

export class ResumeTailorScene extends BaseInteriorScene {
  constructor() {
    super({ key: SCENE_KEYS.RESUME_TAILOR });
  }

  protected startMusic(): void {
    musicManager.crossFadeTo(MUSIC_TRACKS.RESUME_TAILOR.key);
  }
  protected getNPCColor(): number {
    return 0xff9900;
  }
  protected getNPCX(): number {
    return 300;
  }
  protected getNPCY(): number {
    return 180;
  }
  protected getNPCLabel(): string {
    return "Resume Rita";
  }
  protected getDialogueLines(): string[] {
    return [
      "Another resume? You're brave.",
      "I've seen 500 resumes this week.\nYours will be... different.",
      "This room is under construction.\nCome back later.\n(Not a metaphor for your career.\nMostly.)",
    ];
  }

  protected drawEnvironment(): void {
    this.drawMinimalRoom(
      0xf5edd8,
      0x9c6b3c,
      0x6b3d1a,
      0xff9900,
      "RESUME TAILOR",
    );
    this.drawExitDoor(
      this.add.graphics().setDepth(2),
      0x6b3d1a,
      0x9c6b3c,
      0xffd700,
      "#ff9900",
    );
  }

  private drawMinimalRoom(
    wallColor: number,
    floorColor: number,
    baseboardColor: number,
    titleColor: number,
    titleText: string,
  ): void {
    const g = this.add.graphics();
    g.setDepth(2);
    const floorY = Math.round(ROOM_H * 0.45);
    g.fillStyle(wallColor, 1);
    g.fillRect(0, 0, ROOM_W, floorY);
    for (let fy = floorY; fy < ROOM_H; fy += 18) {
      const shade =
        Math.floor((fy - floorY) / 18) % 2 === 0
          ? floorColor
          : Math.round(floorColor * 0.9);
      g.fillStyle(shade, 1);
      g.fillRect(0, fy, ROOM_W, 18);
    }
    g.fillStyle(baseboardColor, 1);
    g.fillRect(0, floorY - 5, ROOM_W, 5);
    // Crown molding
    g.fillStyle(0xcaa870, 1);
    g.fillRect(0, 0, ROOM_W, 6);
    this.add
      .text(ROOM_W / 2, 16, `✦ ${titleText} ✦`, {
        fontFamily: FONT,
        fontSize: "12px",
        color: `#${titleColor.toString(16).padStart(6, "0")}`,
        stroke: "#000000",
        strokeThickness: 4,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);
    // Under construction sign
    this.add
      .text(ROOM_W / 2, ROOM_H * 0.55, "🚧 UNDER CONSTRUCTION 🚧", {
        fontFamily: FONT,
        fontSize: "10px",
        color: "#ffbf00",
        backgroundColor: "#000000aa",
        padding: { x: 8, y: 6 },
        align: "center",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(6);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEW COACH SCENE — minimal placeholder
// ─────────────────────────────────────────────────────────────────────────────

export class InterviewCoachScene extends BaseInteriorScene {
  constructor() {
    super({ key: SCENE_KEYS.INTERVIEW_COACH });
  }

  protected startMusic(): void {
    musicManager.crossFadeTo(MUSIC_TRACKS.INTERVIEW_COACH.key);
  }
  protected getNPCColor(): number {
    return 0x00c8e0;
  }
  protected getNPCX(): number {
    return 300;
  }
  protected getNPCY(): number {
    return 180;
  }
  protected getNPCLabel(): string {
    return "Coach Chris";
  }
  protected getDialogueLines(): string[] {
    return [
      "Interviews are basically improv.\nGood luck.",
      "This room is under construction.\nCome back later.\n(Not a metaphor for your career.\nMostly.)",
    ];
  }

  protected drawEnvironment(): void {
    const g = this.add.graphics();
    g.setDepth(2);
    const floorY = Math.round(ROOM_H * 0.45);
    // Beige corporate walls
    g.fillStyle(0xe8e0d2, 1);
    g.fillRect(0, 0, ROOM_W, floorY);
    // Grey carpet floor
    g.fillStyle(0x6a6a7a, 1);
    g.fillRect(0, floorY, ROOM_W, ROOM_H - floorY);
    g.fillStyle(0xd5cdc0, 1);
    g.fillRect(0, floorY - 5, ROOM_W, 5);
    g.fillStyle(0xd5cdc0, 1);
    g.fillRect(0, 0, ROOM_W, 6);
    this.add
      .text(ROOM_W / 2, 16, "✦ INTERVIEW COACH ✦", {
        fontFamily: FONT,
        fontSize: "12px",
        color: "#00c8e0",
        stroke: "#000000",
        strokeThickness: 4,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);
    this.add
      .text(ROOM_W / 2, ROOM_H * 0.55, "🚧 UNDER CONSTRUCTION 🚧", {
        fontFamily: FONT,
        fontSize: "10px",
        color: "#ffbf00",
        backgroundColor: "#000000aa",
        padding: { x: 8, y: 6 },
        align: "center",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(6);
    this.drawExitDoor(g, 0x888888, 0xdddddd, 0xc0c0c0, "#00c8e0");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB ANALYZER SCENE — minimal placeholder
// ─────────────────────────────────────────────────────────────────────────────

export class JobAnalyzerScene extends BaseInteriorScene {
  constructor() {
    super({ key: SCENE_KEYS.JOB_ANALYZER });
  }

  protected startMusic(): void {
    musicManager.crossFadeTo(MUSIC_TRACKS.JOB_ANALYZER.key);
  }
  protected getNPCColor(): number {
    return 0x39ff14;
  }
  protected getNPCX(): number {
    return 300;
  }
  protected getNPCY(): number {
    return 180;
  }
  protected getNPCLabel(): string {
    return "Data Drake";
  }
  protected getDialogueLines(): string[] {
    return [
      "I've found 47 red flags\nin your job history. Impressive.",
      "This room is under construction.\nCome back later.\n(Not a metaphor for your career.\nMostly.)",
    ];
  }

  protected drawEnvironment(): void {
    const g = this.add.graphics();
    g.setDepth(2);
    const floorY = Math.round(ROOM_H * 0.45);
    // Dark tech walls
    g.fillStyle(0x040608, 1);
    g.fillRect(0, 0, ROOM_W, floorY);
    // Grid floor
    g.fillStyle(0x080c14, 1);
    g.fillRect(0, floorY, ROOM_W, ROOM_H - floorY);
    g.lineStyle(1, 0x0e1826, 1);
    for (let gx = 0; gx < ROOM_W; gx += 32)
      g.lineBetween(gx, floorY, gx, ROOM_H);
    for (let gy = floorY; gy < ROOM_H; gy += 32)
      g.lineBetween(0, gy, ROOM_W, gy);
    g.fillStyle(0x003300, 0.2);
    g.fillRect(0, floorY - 4, ROOM_W, 5);
    this.add
      .text(ROOM_W / 2, 16, "✦ JOB ANALYZER ✦", {
        fontFamily: FONT,
        fontSize: "12px",
        color: "#39ff14",
        stroke: "#000000",
        strokeThickness: 4,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);
    this.add
      .text(ROOM_W / 2, ROOM_H * 0.55, "🚧 UNDER CONSTRUCTION 🚧", {
        fontFamily: FONT,
        fontSize: "10px",
        color: "#ffbf00",
        backgroundColor: "#000000aa",
        padding: { x: 8, y: 6 },
        align: "center",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(6);
    this.drawExitDoor(g, 0x0a0e18, 0x111122, 0x39ff14, "#39ff14");
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDY HALL SCENE — minimal placeholder
// ─────────────────────────────────────────────────────────────────────────────

export class StudyHallScene extends BaseInteriorScene {
  constructor() {
    super({ key: SCENE_KEYS.STUDY_HALL });
  }

  protected startMusic(): void {
    musicManager.crossFadeTo(MUSIC_TRACKS.STUDY_HALL.key);
  }
  protected getNPCColor(): number {
    return 0xd4a017;
  }
  protected getNPCX(): number {
    return 300;
  }
  protected getNPCY(): number {
    return 180;
  }
  protected getNPCLabel(): string {
    return "Librarian Lena";
  }
  protected getDialogueLines(): string[] {
    return [
      "Shh. Learning is happening.\nMaybe.",
      "This room is under construction.\nCome back later.\n(Not a metaphor for your career.\nMostly.)",
    ];
  }

  protected drawEnvironment(): void {
    const g = this.add.graphics();
    g.setDepth(2);
    const floorY = Math.round(ROOM_H * 0.45);
    // Warm cream walls
    g.fillStyle(0xfff8e7, 1);
    g.fillRect(0, 0, ROOM_W, floorY);
    // Parquet floor
    for (let fy = floorY; fy < ROOM_H; fy += 18) {
      const shade =
        Math.floor((fy - floorY) / 18) % 2 === 0 ? 0xc9a96e : 0xb89058;
      g.fillStyle(shade, 1);
      g.fillRect(0, fy, ROOM_W, 18);
    }
    g.fillStyle(0xeedcc0, 1);
    g.fillRect(0, 0, ROOM_W, 6);
    g.fillStyle(0x7b5226, 1);
    g.fillRect(0, floorY - 5, ROOM_W, 5);
    this.add
      .text(ROOM_W / 2, 16, "✦ STUDY HALL ✦", {
        fontFamily: FONT,
        fontSize: "12px",
        color: "#d4a017",
        stroke: "#000000",
        strokeThickness: 4,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);
    this.add
      .text(ROOM_W / 2, ROOM_H * 0.55, "🚧 UNDER CONSTRUCTION 🚧", {
        fontFamily: FONT,
        fontSize: "10px",
        color: "#ffbf00",
        backgroundColor: "#000000aa",
        padding: { x: 8, y: 6 },
        align: "center",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(6);
    this.drawExitDoor(g, 0x5c3d1e, 0x7b5226, 0xffd700, "#d4a017");
  }
}
