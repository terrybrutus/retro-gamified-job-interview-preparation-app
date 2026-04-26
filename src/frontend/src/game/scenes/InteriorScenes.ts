import Phaser from "phaser";
import { Player } from "../entities/Player";
import { musicManager } from "../managers/MusicManager";
import {
  GAME_EVENTS,
  MUSIC_TRACKS,
  type NPCKey,
  SCENE_KEYS,
} from "../utils/Constants";

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
  private _pendingFastTravel: NPCKey | null = null;

  private _fastTravelHandler = (e: Event): void => {
    if (this._exiting) return;
    const detail = (e as CustomEvent).detail as { npcKey: NPCKey };
    if (!detail?.npcKey) return;
    // Store the destination and immediately begin exiting the building.
    // exitToOverworld() will pass this key through wake data so CareerCityScene
    // teleports the player directly to the destination on wake.
    this._pendingFastTravel = detail.npcKey;
    this.exitToOverworld();
  };

  create(data?: InteriorData): void {
    this._fromData = data ?? {};
    // Always reset _exiting on every scene entry so re-entering a building
    // after a previous visit never gets stuck with the flag still true.
    this._exiting = false;
    this._pendingFastTravel = null;

    // Also reset flag on scene shutdown/sleep so it is clean for next entry.
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this._exiting = false;
      this._pendingFastTravel = null;
      window.removeEventListener(
        GAME_EVENTS.FAST_TRAVEL,
        this._fastTravelHandler as EventListener,
      );
    });
    this.events.once(Phaser.Scenes.Events.SLEEP, () => {
      this._exiting = false;
      this._pendingFastTravel = null;
      window.removeEventListener(
        GAME_EVENTS.FAST_TRAVEL,
        this._fastTravelHandler as EventListener,
      );
    });

    // Intercept fast-travel requests fired while inside this building.
    // When triggered, we store the destination and call exitToOverworld() so
    // the scene transitions out and passes the destination to CareerCityScene
    // via wake data — no waiting for the player to walk out manually.
    window.addEventListener(
      GAME_EVENTS.FAST_TRAVEL,
      this._fastTravelHandler as EventListener,
    );

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
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#000000cc",
        padding: { x: 6, y: 4 },
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5);
    nameLabel.setResolution(window.devicePixelRatio || 1);

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
        fontSize: "16px",
        color: "#ffbf00",
        backgroundColor: "#000000dd",
        padding: { x: 6, y: 4 },
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(60)
      .setAlpha(0);
    this.interactPrompt.setResolution(window.devicePixelRatio || 1);
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

    // Box is wide enough for text but never wider than the room minus margins.
    // Height is generous (120px) so multi-line text always fits.
    const bw = Math.min(ROOM_W - 40, 460);
    const bh = 120;
    const bx = ROOM_W / 2;
    const by = ROOM_H - 76;

    const bg = this.add.rectangle(0, 0, bw, bh, 0x000000, 0.95);
    bg.setStrokeStyle(2, this.npcColor, 1);

    // Text is centred inside the box with 30px horizontal padding each side
    // and 16px vertical offset from centre so the hint arrow fits below it.
    const txt = this.add
      .text(0, -10, line, {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#ffffff",
        align: "center",
        lineSpacing: 8,
        wordWrap: { width: bw - 60 },
      })
      .setOrigin(0.5, 0.5);
    txt.setResolution(window.devicePixelRatio || 1);

    // Clamp the text's rendered height within the box — shrink font if needed.
    if (txt.height > bh - 40) {
      txt.setFontSize(12);
    }

    // Hint arrow sits near the bottom-right corner, well inside the box bounds.
    const hint = this.add
      .text(bw / 2 - 14, bh / 2 - 12, "▶", {
        fontFamily: FONT,
        fontSize: "14px",
        color: "#ffbf00",
      })
      .setOrigin(1, 1);
    hint.setResolution(window.devicePixelRatio || 1);

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

    // Snapshot everything we need BEFORE the fade so we never touch scene
    // state after it has been torn down.
    const exitX = this._fromData.exitX;
    const exitY = this._fromData.exitY;
    const fastTravelTo = this._pendingFastTravel;
    const myKey = this.scene.key;
    const ccKey = SCENE_KEYS.CAREER_CITY;

    this.cameras.main.fadeOut(300, 0, 0, 0);

    // Use the camera fadeOut 'complete' event — fires exactly once after the
    // fade finishes, avoiding the timing race of an arbitrary delayedCall.
    this.cameras.main.once(
      Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE,
      () => {
        const mgr = this.scene.manager;

        // Build the wake payload. fastTravelTo is forwarded so CareerCityScene
        // can teleport the player immediately instead of placing them at exitX/Y.
        const wakePayload: {
          exitX?: number;
          exitY?: number;
          fastTravelTo?: NPCKey;
        } = { exitX, exitY };
        if (fastTravelTo) wakePayload.fastTravelTo = fastTravelTo;

        if (mgr.isSleeping(ccKey)) {
          // Normal path: CareerCity was put to sleep when entering this interior.
          // Wake it (passes exitX/exitY and optional fastTravelTo) THEN stop this scene.
          this.scene.wake(ccKey, wakePayload);
          this.scene.stop(myKey);
        } else if (mgr.isActive(ccKey)) {
          // Fallback: CareerCity is still running (e.g. launched instead of slept).
          // Fire the interior:exit event so it can reposition the player.
          window.dispatchEvent(
            new CustomEvent("interior:exit", { detail: wakePayload }),
          );
          this.scene.stop(myKey);
        } else {
          // CareerCity was never started or was stopped — restart it fresh.
          // Pass exit coords as scene data so create() can use them.
          this.scene.stop(myKey);
          this.scene.start(ccKey, wakePayload);
        }
      },
    );
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

    // Exit zone: player walks south to the bottom door area.
    // Zone starts at ROOM_H-40 (40px from bottom), giving 24px of overlap with
    // the maxY clamp at ROOM_H-16. Half-width is 60px so it's easy to trigger.
    const exitZoneY = ROOM_H - 40;
    const exitZoneHalfW = 60;
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
    const exitHint = this.add
      .text(cx, ROOM_H - 8, "↓ EXIT", {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#00000099",
        padding: { x: 4, y: 3 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(8);
    exitHint.setResolution(window.devicePixelRatio || 1);
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
    const scrollQuote = this.add
      .text(qsX + qsW / 2, 18 + qsH / 2, '"Words are\nyour sword."', {
        fontFamily: FONT,
        fontSize: "13px",
        color: "#3a1800",
        align: "center",
        lineSpacing: 4,
        fontStyle: "italic",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);
    scrollQuote.setResolution(window.devicePixelRatio || 1);

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
    const coverTitle = this.add
      .text(w / 2, 16, "✦ COVER LETTER BUILDER ✦", {
        fontFamily: FONT,
        fontSize: "18px",
        color: "#d4aaff",
        stroke: "#000000",
        strokeThickness: 2,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);
    coverTitle.setResolution(window.devicePixelRatio || 1);

    // ── Exit door ─────────────────────────────────────────────────────────
    this.drawExitDoor(g, 0x6b3410, 0x8b4513, 0xffd700);

    g.setDepth(2);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RESUME TAILOR SCENE — fully detailed professional workshop interior
// ─────────────────────────────────────────────────────────────────────────────

export class ResumeTailorScene extends BaseInteriorScene {
  constructor() {
    super({ key: SCENE_KEYS.RESUME_TAILOR });
  }

  protected startMusic(): void {
    musicManager.crossFadeTo(MUSIC_TRACKS.RESUME_TAILOR.key);
  }
  protected getNPCColor(): number {
    return 0x8b1a1a;
  }
  protected getNPCX(): number {
    return 260;
  }
  protected getNPCY(): number {
    return 260;
  }
  protected getNPCLabel(): string {
    return "Rita";
  }
  protected getDialogueLines(): string[] {
    return [
      "Another resume? I've seen worse. Barely.",
      "The secret? Quantify everything.\n'5 tasks' becomes '500% more tasks than Gary.'",
      "ATS systems are just robots.\nI dress your resume so robots like it.",
      "Your font choice says a lot about you.\nTimes New Roman says... a lot.",
    ];
  }

  /** Override: Rita is drawn procedurally in drawEnvironment — just set state */
  protected override spawnNPC(): void {
    this.npcX = this.getNPCX();
    this.npcY = this.getNPCY();
    this.npcColor = this.getNPCColor();
    this.dialogueLines = this.getDialogueLines();
    // Visual is drawn inside drawEnvironment — no duplicate generic NPC
  }

  protected drawEnvironment(): void {
    const w = ROOM_W;
    const h = ROOM_H;
    const g = this.add.graphics();
    g.setDepth(2);

    // ── FLOOR & WALLS ─────────────────────────────────────────────────────
    const floorY = Math.round(h * 0.45);

    // Warm off-white wall
    g.fillStyle(0xf5f0e8, 1);
    g.fillRect(0, 0, w, floorY);

    // Subtle wall texture grain lines
    g.lineStyle(1, 0xe8e0d0, 0.45);
    for (let wy = 10; wy < floorY; wy += 14) {
      g.lineBetween(0, wy, w, wy);
    }

    // Wainscoting / lower wood-panel strip on wall (bottom 80px of wall area)
    const wainY = floorY - 80;
    g.fillStyle(0xd4b896, 1);
    g.fillRect(0, wainY, w, 80);
    // Wainscoting panel lines (vertical dividers)
    g.lineStyle(1, 0xb89060, 0.6);
    for (let wx = 0; wx < w; wx += 60) {
      g.lineBetween(wx, wainY, wx, floorY - 5);
    }
    // Wainscoting top rail
    g.fillStyle(0xb89060, 1);
    g.fillRect(0, wainY, w, 4);
    g.fillStyle(0xcaa870, 0.7);
    g.fillRect(0, wainY + 4, w, 2);

    // Dark wood floor with plank lines
    for (let fy = floorY; fy < h; fy += 20) {
      const shade =
        Math.floor((fy - floorY) / 20) % 2 === 0 ? 0x7a4e28 : 0x6b4423;
      g.fillStyle(shade, 1);
      g.fillRect(0, fy, w, 20);
    }
    // Floor plank vertical breaks
    g.lineStyle(1, 0x4a2e14, 0.4);
    for (let fx = 0; fx < w; fx += 75) {
      g.lineBetween(fx, floorY, fx, h);
    }
    // Baseboard at floor edge
    g.fillStyle(0x8b6914, 1);
    g.fillRect(0, floorY - 5, w, 5);

    // Crown molding at top
    g.fillStyle(0xd4c4a8, 1);
    g.fillRect(0, 0, w, 7);
    g.fillStyle(0xe8d8b8, 1);
    g.fillRect(0, 7, w, 3);

    // ── TWO WINDOWS (top wall) ────────────────────────────────────────────
    // Left window at x:230, right at x:370 — amber/cream curtains
    for (const wx of [230, 370]) {
      // Window frame
      g.fillStyle(0x7b4f2a, 1);
      g.fillRect(wx - 36, 14, 72, 88);
      // Glass pane
      g.fillStyle(0xc8e8f8, 1);
      g.fillRect(wx - 32, 18, 64, 80);
      // Sky gradient suggestion
      g.fillStyle(0xa8d8f0, 0.5);
      g.fillRect(wx - 32, 18, 64, 30);
      // Cross divider
      g.fillStyle(0x7b4f2a, 1);
      g.fillRect(wx - 2, 18, 4, 80);
      g.fillRect(wx - 32, 56, 64, 4);
      // Curtains pulled to sides — amber/cream
      g.fillStyle(0xd4a843, 0.88);
      g.fillRect(wx - 46, 14, 14, 88);
      g.fillRect(wx + 32, 14, 14, 88);
      // Curtain tie-back knot
      g.fillStyle(0xa07830, 1);
      g.fillRect(wx - 46, 50, 16, 6);
      g.fillRect(wx + 32, 50, 16, 6);
      // Window sill
      g.fillStyle(0x9b7040, 1);
      g.fillRect(wx - 38, 100, 76, 5);
    }

    // ── LEFT SIDE: TWO FILING CABINETS ────────────────────────────────────
    // Tall cabinet at x:60, y:100
    const cab1X = 60;
    const cab1Y = 95;
    const cab1W = 40;
    const cab1H = 70;
    // Cabinet shadow
    g.fillStyle(0x000000, 0.15);
    g.fillRect(cab1X + 3, cab1Y + cab1H, cab1W, 6);
    // Cabinet body
    g.fillStyle(0x8b5e3c, 1);
    g.fillRect(cab1X, cab1Y, cab1W, cab1H);
    // Right edge shadow
    g.fillStyle(0x5c3a1e, 1);
    g.fillRect(cab1X + cab1W - 4, cab1Y, 4, cab1H);
    // Three drawers
    for (let d = 0; d < 3; d++) {
      const dy = cab1Y + 5 + d * 22;
      g.fillStyle(0x7a5030, 1);
      g.fillRect(cab1X + 4, dy, cab1W - 8, 18);
      g.fillStyle(0xa06835, 1);
      g.fillRect(cab1X + 5, dy + 1, cab1W - 10, 4);
      // Brass handle
      g.fillStyle(0xd4a830, 1);
      g.fillRect(cab1X + cab1W / 2 - 5, dy + 7, 10, 4);
      g.fillRect(cab1X + cab1W / 2 - 4, dy + 5, 2, 8);
      g.fillRect(cab1X + cab1W / 2 + 2, dy + 5, 2, 8);
    }
    // Cabinet top
    g.fillStyle(0xaa7040, 1);
    g.fillRect(cab1X - 1, cab1Y - 3, cab1W + 2, 5);

    // Shorter second cabinet at x:108, y:120
    const cab2X = 108;
    const cab2Y = 118;
    const cab2W = 40;
    const cab2H = 55;
    g.fillStyle(0x000000, 0.12);
    g.fillRect(cab2X + 3, cab2Y + cab2H, cab2W, 5);
    g.fillStyle(0x8b5e3c, 1);
    g.fillRect(cab2X, cab2Y, cab2W, cab2H);
    g.fillStyle(0x5c3a1e, 1);
    g.fillRect(cab2X + cab2W - 4, cab2Y, 4, cab2H);
    for (let d = 0; d < 2; d++) {
      const dy = cab2Y + 5 + d * 24;
      g.fillStyle(0x7a5030, 1);
      g.fillRect(cab2X + 4, dy, cab2W - 8, 18);
      g.fillStyle(0xa06835, 1);
      g.fillRect(cab2X + 5, dy + 1, cab2W - 10, 4);
      g.fillStyle(0xd4a830, 1);
      g.fillRect(cab2X + cab2W / 2 - 5, dy + 7, 10, 4);
      g.fillRect(cab2X + cab2W / 2 - 4, dy + 5, 2, 8);
      g.fillRect(cab2X + cab2W / 2 + 2, dy + 5, 2, 8);
    }
    g.fillStyle(0xaa7040, 1);
    g.fillRect(cab2X - 1, cab2Y - 3, cab2W + 2, 5);

    // Stack of folders on top of short cabinet
    for (let fi = 2; fi >= 0; fi--) {
      g.fillStyle(fi === 0 ? 0xcc8844 : fi === 1 ? 0x4488cc : 0x44aa66, 1);
      g.fillRect(cab2X + 2 + fi * 2, cab2Y - 8 - fi * 3, cab2W - 8, 7);
    }

    // Wall-mounted coat rack above cabinets
    // Rack bar
    g.fillStyle(0x6b3a1e, 1);
    g.fillRect(cab1X - 4, 68, 60, 5);
    g.fillRect(cab1X - 4, 63, 4, 10);
    g.fillRect(cab1X + 52, 63, 4, 10);
    // Two hooks
    g.fillStyle(0xcc9922, 1);
    g.fillCircle(cab1X + 12, 72, 4);
    g.fillRect(cab1X + 10, 72, 4, 10);
    g.fillCircle(cab1X + 40, 72, 4);
    g.fillRect(cab1X + 38, 72, 4, 10);
    // Jacket on left hook — simplified shape
    g.fillStyle(0x2c3e6b, 0.9);
    g.fillRect(cab1X + 4, 82, 22, 28);
    g.fillStyle(0x1a2a4a, 1);
    g.fillRect(cab1X + 10, 82, 10, 14); // lapel area
    g.fillStyle(0xffffff, 0.7);
    g.fillRect(cab1X + 12, 84, 4, 10); // shirt/collar

    // ── MAIN WORK DESK (center-left) ─────────────────────────────────────
    const deskX = 140;
    const deskY = 200;
    const deskW = 190;
    const deskH = 28;

    // Desk shadow
    g.fillStyle(0x000000, 0.12);
    g.fillRect(deskX + 4, deskY + deskH + 2, deskW, 8);

    // Desk surface — rich wood
    g.fillStyle(0xa0522d, 1);
    g.fillRect(deskX, deskY, deskW, deskH);
    // Desk top highlight
    g.fillStyle(0xc0723d, 1);
    g.fillRect(deskX + 2, deskY, deskW - 4, 8);
    g.fillStyle(0xffffff, 0.06);
    g.fillRect(deskX + 2, deskY, deskW - 4, 3);
    // Desk front edge
    g.fillStyle(0x6b3a1e, 1);
    g.fillRect(deskX, deskY + deskH, deskW, 5);

    // Desk legs
    g.fillStyle(0x4a2010, 1);
    g.fillRect(deskX + 8, deskY + deskH + 4, 10, 18);
    g.fillRect(deskX + deskW - 18, deskY + deskH + 4, 10, 18);

    // ── VINTAGE TYPEWRITER on desk center ─────────────────────────────────
    const twX = deskX + 65;
    const twY = deskY - 34;
    const twW = 60;
    const twH = 30;
    // Typewriter body shadow
    g.fillStyle(0x000000, 0.18);
    g.fillRect(twX + 3, twY + twH + 2, twW, 6);
    // Typewriter main body
    g.fillStyle(0x2d2d2d, 1);
    g.fillRect(twX, twY + 8, twW, twH - 8);
    // Typewriter top / carriage
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(twX + 4, twY, twW - 8, 12);
    // Paper roll visible at top — white
    g.fillStyle(0xf8f8f0, 1);
    g.fillRect(twX + 10, twY - 10, twW - 20, 14);
    // Paper lines
    g.lineStyle(1, 0xccccbb, 0.6);
    g.lineBetween(twX + 14, twY - 6, twX + twW - 14, twY - 6);
    g.lineBetween(twX + 14, twY - 1, twX + twW - 14, twY - 1);
    // Platen roller (horizontal bar)
    g.fillStyle(0x444444, 1);
    g.fillRect(twX + 2, twY + 6, twW - 4, 5);
    // Key rows — small dots for keys
    g.fillStyle(0x555555, 1);
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 9; col++) {
        const kx = twX + 5 + col * 6;
        const ky = twY + 12 + row * 7;
        g.fillRect(kx, ky, 4, 4);
        g.fillStyle(0x333333, 1);
        g.fillRect(kx + 1, ky + 1, 2, 2);
        g.fillStyle(0x555555, 1);
      }
    }
    // Space bar
    g.fillStyle(0x444444, 1);
    g.fillRect(twX + 12, twY + 34, twW - 24, 4);

    // ── DESK LAMP (left side of desk) ─────────────────────────────────────
    const lampX = deskX + 20;
    const lampBaseY = deskY - 2;
    // Lamp base
    g.fillStyle(0x2d2d2d, 1);
    g.fillRect(lampX - 7, lampBaseY - 4, 14, 5);
    // Lamp arm (angled)
    g.lineStyle(3, 0x888888, 1);
    g.lineBetween(lampX, lampBaseY - 4, lampX + 10, lampBaseY - 26);
    g.lineBetween(lampX + 10, lampBaseY - 26, lampX + 22, lampBaseY - 20);
    // Lamp cone shade
    g.fillStyle(0xffcc00, 1);
    g.fillTriangle(
      lampX + 14,
      lampBaseY - 24,
      lampX + 30,
      lampBaseY - 24,
      lampX + 22,
      lampBaseY - 12,
    );
    // Lamp bulb glow
    g.fillStyle(0xfffbaa, 0.6);
    g.fillEllipse(lampX + 22, lampBaseY - 12, 22, 16);
    g.fillStyle(0xfff9cc, 0.25);
    g.fillEllipse(lampX + 22, lampBaseY - 6, 40, 24);

    // ── STACK OF PAPERS right side of desk ────────────────────────────────
    const papX = deskX + deskW - 50;
    const papY = deskY - 2;
    for (let pi = 3; pi >= 0; pi--) {
      g.fillStyle(pi % 2 === 0 ? 0xfffef0 : 0xf0ece0, 1);
      g.fillRect(papX - 2 + pi * 2, papY - 26 + pi * 2, 44, 30);
    }
    // Lines on top paper
    g.lineStyle(1, 0xccccbb, 0.5);
    for (let ln = 0; ln < 4; ln++) {
      g.lineBetween(
        papX + 4,
        papY - 22 + ln * 7,
        papX + 38,
        papY - 22 + ln * 7,
      );
    }
    // Red pen on papers
    g.fillStyle(0xcc2222, 1);
    g.fillRect(papX + 22, papY - 28, 3, 18);
    g.fillStyle(0xaa0000, 1);
    g.fillTriangle(
      papX + 22,
      papY - 10,
      papX + 25,
      papY - 10,
      papX + 23,
      papY - 4,
    );

    // ── WOODEN CHAIR in front of desk ─────────────────────────────────────
    const chairX = deskX + 90;
    const chairY = deskY + deskH + 8;
    // Chair seat
    g.fillStyle(0x8b5e3c, 1);
    g.fillRect(chairX - 14, chairY, 28, 16);
    // Chair back rest
    g.fillRect(chairX - 12, chairY - 20, 24, 14);
    // Seat highlight
    g.fillStyle(0xaa7048, 1);
    g.fillRect(chairX - 13, chairY, 26, 5);
    // Chair legs
    g.fillStyle(0x5c3a1e, 1);
    g.fillRect(chairX - 12, chairY + 14, 7, 16);
    g.fillRect(chairX + 5, chairY + 14, 7, 16);
    // Chair shadow
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(chairX, chairY + 30, 28, 6);

    // ── RIGHT SIDE: CORKBOARD ─────────────────────────────────────────────
    const cbX = 468;
    const cbY = 95;
    const cbW = 96;
    const cbH = 100;

    // Corkboard frame
    g.fillStyle(0x8b5e3c, 1);
    g.fillRect(cbX - 4, cbY - 4, cbW + 8, cbH + 8);
    // Cork surface
    g.fillStyle(0xcc9966, 1);
    g.fillRect(cbX, cbY, cbW, cbH);
    // Cork texture dots
    g.fillStyle(0xc09060, 0.5);
    for (let cx2 = cbX + 6; cx2 < cbX + cbW - 4; cx2 += 10) {
      for (let cy2 = cbY + 6; cy2 < cbY + cbH - 4; cy2 += 10) {
        g.fillRect(cx2, cy2, 3, 3);
      }
    }

    // Pinned sticky notes (various colors + angles — simulated with slight offsets)
    const notes = [
      { x: cbX + 8, y: cbY + 8, w: 22, h: 18, color: 0xffeb3b },
      { x: cbX + 38, y: cbY + 6, w: 20, h: 16, color: 0x4fc3f7 },
      { x: cbX + 68, y: cbY + 10, w: 20, h: 18, color: 0xef9a9a },
      { x: cbX + 6, y: cbY + 36, w: 22, h: 16, color: 0xaed581 },
      { x: cbX + 36, y: cbY + 38, w: 20, h: 18, color: 0xffcc02 },
      { x: cbX + 64, y: cbY + 34, w: 22, h: 16, color: 0xce93d8 },
    ];
    for (const n of notes) {
      g.fillStyle(n.color, 0.9);
      g.fillRect(n.x, n.y, n.w, n.h);
      // Pin dot
      g.fillStyle(0xcc2222, 1);
      g.fillCircle(n.x + n.w / 2, n.y + 2, 2);
      // Text lines on note
      g.lineStyle(1, 0x00000044, 0.5);
      g.lineBetween(n.x + 3, n.y + 7, n.x + n.w - 3, n.y + 7);
      g.lineBetween(n.x + 3, n.y + 12, n.x + n.w - 3, n.y + 12);
    }
    // A printed page pinned near bottom of corkboard
    g.fillStyle(0xfdfdf0, 0.95);
    g.fillRect(cbX + 10, cbY + 62, 36, 28);
    g.lineStyle(1, 0xccccbb, 0.5);
    for (let ln = 0; ln < 4; ln++) {
      g.lineBetween(cbX + 13, cbY + 66 + ln * 6, cbX + 43, cbY + 66 + ln * 6);
    }
    g.fillStyle(0xcc2222, 1);
    g.fillCircle(cbX + 28, cbY + 62, 2);

    // ── SMALL SIDE TABLE below corkboard ──────────────────────────────────
    const stX = 455;
    const stY = 205;
    const stW = 72;
    const stH = 18;
    // Table shadow
    g.fillStyle(0x000000, 0.1);
    g.fillRect(stX + 3, stY + stH + 2, stW, 6);
    // Table surface
    g.fillStyle(0x9b6b3e, 1);
    g.fillRect(stX, stY, stW, stH);
    g.fillStyle(0xb88050, 1);
    g.fillRect(stX + 2, stY, stW - 4, 6);
    // Table legs
    g.fillStyle(0x6b3a1e, 1);
    g.fillRect(stX + 6, stY + stH, 8, 14);
    g.fillRect(stX + stW - 14, stY + stH, 8, 14);

    // Mug on side table
    const mugX = stX + 16;
    const mugY = stY - 14;
    g.fillStyle(0x5588aa, 1);
    g.fillRect(mugX - 8, mugY, 16, 14);
    g.fillStyle(0x7aaacc, 1);
    g.fillRect(mugX - 7, mugY, 14, 4);
    // Mug handle
    g.lineStyle(2, 0x5588aa, 1);
    g.strokeCircle(mugX + 10, mugY + 7, 5);
    // Steam wisps
    g.lineStyle(1, 0xcccccc, 0.5);
    g.lineBetween(mugX - 2, mugY - 4, mugX - 4, mugY - 10);
    g.lineBetween(mugX + 2, mugY - 5, mugX + 4, mugY - 11);

    // Small paper stack on side table
    for (let pi = 2; pi >= 0; pi--) {
      g.fillStyle(0xfffef0, 1);
      g.fillRect(stX + 36 + pi * 2, stY - 14 + pi * 2, 24, 16);
    }

    // ── TOP WALL: "RESUME WORKSHOP" SCROLL BANNER ─────────────────────────
    const scrollX = 20;
    const scrollY = 10;
    const scrollW = w - 40;
    const scrollH = 28;
    // Scroll body
    g.fillStyle(0xf5deb3, 0.95);
    g.fillRect(scrollX, scrollY, scrollW, scrollH);
    g.lineStyle(1.5, 0xc8a060, 0.8);
    g.strokeRect(scrollX, scrollY, scrollW, scrollH);
    // Scroll end caps
    g.fillStyle(0xd4b880, 1);
    g.fillRect(scrollX, scrollY, scrollW, 5);
    g.fillRect(scrollX, scrollY + scrollH - 5, scrollW, 5);
    // Decorative bullet-point lines on scroll
    g.lineStyle(1, 0xaa8040, 0.35);
    g.lineBetween(scrollX + 180, scrollY + 10, scrollX + 260, scrollY + 10);
    g.lineBetween(scrollX + 180, scrollY + 16, scrollX + 280, scrollY + 16);
    g.lineBetween(
      scrollX + scrollW - 280,
      scrollY + 10,
      scrollX + scrollW - 180,
      scrollY + 10,
    );
    g.lineBetween(
      scrollX + scrollW - 290,
      scrollY + 16,
      scrollX + scrollW - 180,
      scrollY + 16,
    );

    const resumeWorkshopTitle = this.add
      .text(w / 2, scrollY + scrollH / 2, "✦ RESUME WORKSHOP ✦", {
        fontFamily: FONT,
        fontSize: "13px",
        color: "#8b4513",
        stroke: "#f5deb3",
        strokeThickness: 1,
        fontStyle: "bold",
        wordWrap: { width: scrollW - 32 },
        align: "center",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);
    resumeWorkshopTitle.setResolution(window.devicePixelRatio || 1);

    // ── CUSTOM NPC: RITA (overrides spawnNPC glyph, drawn here for detail) ─
    // Rita is drawn AFTER exit door, positioned at x:260, y:260
    // She wears a deep red tailored jacket with spectacles
    const ritaX = 260;
    const ritaY = 260;
    const rg = this.add.graphics();
    rg.setDepth(42);

    // Shadow
    rg.fillStyle(0x000000, 0.2);
    rg.fillEllipse(ritaX, ritaY + 16, 20, 6);
    // Legs — dark trousers
    rg.fillStyle(0x1a1a2e, 1);
    rg.fillRect(ritaX - 6, ritaY + 4, 5, 12);
    rg.fillRect(ritaX + 1, ritaY + 4, 5, 12);
    // Shoes
    rg.fillStyle(0x4a3728, 1);
    rg.fillRect(ritaX - 7, ritaY + 14, 6, 3);
    rg.fillRect(ritaX + 1, ritaY + 14, 7, 3);
    // Body — deep red jacket
    rg.fillStyle(0x8b1a1a, 1);
    rg.fillRect(ritaX - 8, ritaY - 10, 16, 16);
    // Jacket lapels
    rg.fillStyle(0x6a1212, 1);
    rg.fillTriangle(
      ritaX - 8,
      ritaY - 10,
      ritaX - 2,
      ritaY - 10,
      ritaX - 8,
      ritaY - 2,
    );
    rg.fillTriangle(
      ritaX + 8,
      ritaY - 10,
      ritaX + 2,
      ritaY - 10,
      ritaX + 8,
      ritaY - 2,
    );
    // Shirt visible in center
    rg.fillStyle(0xf8f0e0, 1);
    rg.fillRect(ritaX - 2, ritaY - 10, 4, 10);
    // Arms
    rg.fillStyle(0x8b1a1a, 1);
    rg.fillRect(ritaX - 12, ritaY - 9, 4, 10);
    rg.fillRect(ritaX + 8, ritaY - 9, 4, 10);
    // Hands
    rg.fillStyle(0xffcc80, 1);
    rg.fillRect(ritaX - 12, ritaY - 1, 4, 4);
    rg.fillRect(ritaX + 8, ritaY - 1, 4, 4);
    // Head
    rg.fillStyle(0xffcc80, 1);
    rg.fillRect(ritaX - 6, ritaY - 22, 12, 12);
    // Hair — dark brown bun style
    rg.fillStyle(0x2c1810, 1);
    rg.fillRect(ritaX - 7, ritaY - 24, 14, 6);
    rg.fillRect(ritaX - 6, ritaY - 22, 3, 4);
    rg.fillRect(ritaX + 3, ritaY - 22, 3, 4);
    // Hair bun at top
    rg.fillEllipse(ritaX + 3, ritaY - 26, 8, 7);
    // Spectacles — thin lines across eyes area
    rg.lineStyle(1, 0x444444, 1);
    rg.strokeRect(ritaX - 5, ritaY - 16, 4, 3);
    rg.strokeRect(ritaX + 1, ritaY - 16, 4, 3);
    rg.lineBetween(ritaX - 1, ritaY - 15, ritaX + 1, ritaY - 15);
    // Eyes
    rg.fillStyle(0x000000, 1);
    rg.fillRect(ritaX - 4, ritaY - 16, 2, 2);
    rg.fillRect(ritaX + 2, ritaY - 16, 2, 2);
    // Glow ring — warm red/gold
    rg.lineStyle(1.5, 0xd4830a, 0.32);
    rg.strokeCircle(ritaX, ritaY, 26);

    // Rita name label
    const ritaLabel = this.add
      .text(ritaX, ritaY - 40, "Rita", {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#000000cc",
        padding: { x: 6, y: 4 },
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(44);
    ritaLabel.setResolution(window.devicePixelRatio || 1);

    // Float animation for Rita container
    this.tweens.add({
      targets: rg,
      y: "-=4",
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // ── EXIT DOOR ─────────────────────────────────────────────────────────
    this.drawExitDoor(g, 0x5c3a1e, 0x7a4e28, 0xd4a830);

    g.setDepth(2);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// INTERVIEW COACH SCENE — executive boardroom coaching studio
// ─────────────────────────────────────────────────────────────────────────────

export class InterviewCoachScene extends BaseInteriorScene {
  constructor() {
    super({ key: SCENE_KEYS.INTERVIEW_COACH });
  }

  protected startMusic(): void {
    musicManager.crossFadeTo(MUSIC_TRACKS.INTERVIEW_COACH.key);
  }
  protected getNPCColor(): number {
    return 0x0077ff;
  }
  protected getNPCX(): number {
    return 250;
  }
  protected getNPCY(): number {
    return 270;
  }
  protected getNPCLabel(): string {
    return "Coach Marcus";
  }
  protected getDialogueLines(): string[] {
    return [
      "Welcome. Sit down.\nThey can smell fear, so don't.",
      "Every interview answer is just storytelling.\nTell better stories than the other candidates.",
      "The classic 'What's your weakness?'\nSay 'I care too much.' They hate it. It works.",
      "You're not looking for a job.\nYou're solving their problem.\nKnow their problem.",
    ];
  }

  /** Override: Marcus is drawn procedurally in drawEnvironment — just set state */
  protected override spawnNPC(): void {
    this.npcX = this.getNPCX();
    this.npcY = this.getNPCY();
    this.npcColor = this.getNPCColor();
    this.dialogueLines = this.getDialogueLines();
    // Visual is drawn inside drawEnvironment — no duplicate generic NPC
  }

  protected drawEnvironment(): void {
    const w = ROOM_W;
    const h = ROOM_H;
    const g = this.add.graphics();
    g.setDepth(2);

    // ── FLOOR ─────────────────────────────────────────────────────────────
    const floorY = Math.round(h * 0.45);

    // Crisp white upper walls
    g.fillStyle(0xf8f8f8, 1);
    g.fillRect(0, 0, w, floorY);

    // Subtle wall texture
    g.lineStyle(1, 0xeeeeee, 0.5);
    for (let wy = 10; wy < floorY - 6; wy += 12) {
      g.lineBetween(0, wy, w, wy);
    }

    // Chair rail border at y~180
    g.fillStyle(0xcccccc, 1);
    g.fillRect(0, 178, w, 4);
    g.fillStyle(0xdddddd, 1);
    g.fillRect(0, 182, w, 2);

    // Grey fabric paneling below chair rail (bottom strip of wall area)
    g.fillStyle(0xe0e0e0, 1);
    g.fillRect(0, 184, w, floorY - 184);
    // Subtle vertical line texture on fabric panels
    g.lineStyle(1, 0xd0d0d0, 0.55);
    for (let vx = 0; vx < w; vx += 8) {
      g.lineBetween(vx, 184, vx, floorY - 5);
    }

    // Baseboard
    g.fillStyle(0xbbbbbb, 1);
    g.fillRect(0, floorY - 5, w, 5);

    // Crown molding at top
    g.fillStyle(0xd0d0d0, 1);
    g.fillRect(0, 0, w, 5);
    g.fillStyle(0xe8e8e8, 1);
    g.fillRect(0, 5, w, 3);

    // Dark grey carpet floor
    g.fillStyle(0x3a3a3a, 1);
    g.fillRect(0, floorY, w, h - floorY);

    // Lighter grey area rug in the center
    g.fillStyle(0x4a4a4a, 1);
    g.fillRect((w - 180) / 2, floorY + 14, 180, 120);
    // Rug border inset line
    g.lineStyle(1.5, 0x555555, 0.7);
    g.strokeRect((w - 180) / 2 + 4, floorY + 18, 172, 112);

    // ── TWO WINDOWS (back wall) ───────────────────────────────────────────
    for (const wx of [230, 340]) {
      // Window outer frame
      g.fillStyle(0xcccccc, 1);
      g.fillRect(wx - 34, 12, 68, 85);
      // Window pane — white base
      g.fillStyle(0xf0f4f8, 1);
      g.fillRect(wx - 30, 16, 60, 77);
      // Blind slat effect — grey-blue horizontal lines suggesting partially open blinds
      for (let sl = 0; sl < 10; sl++) {
        const alpha = sl % 2 === 0 ? 0.55 : 0.2;
        g.fillStyle(0x9eb8cc, alpha);
        g.fillRect(wx - 30, 16 + sl * 8, 60, 5);
      }
      // Window frame cross divider
      g.fillStyle(0xcccccc, 1);
      g.fillRect(wx - 2, 16, 4, 77);
      g.fillRect(wx - 30, 53, 60, 4);
      // Window sill
      g.fillStyle(0xbbbbbb, 1);
      g.fillRect(wx - 34, 95, 68, 5);
    }

    // ── TOP WALL: "INTERVIEW PREP" PARCHMENT BANNER ───────────────────────
    const bannerX = (w - 130) / 2;
    const bannerY = 8;
    const bannerW = 130;
    const bannerH = 28;
    // Parchment scroll
    g.fillStyle(0xf0e6d3, 0.97);
    g.fillRect(bannerX, bannerY, bannerW, bannerH);
    g.lineStyle(1.5, 0xc8a870, 0.8);
    g.strokeRect(bannerX, bannerY, bannerW, bannerH);
    // Scroll end caps
    g.fillStyle(0xd4bc96, 1);
    g.fillRect(bannerX, bannerY, bannerW, 5);
    g.fillRect(bannerX, bannerY + bannerH - 5, bannerW, 5);
    const interviewPrepTitle = this.add
      .text(bannerX + bannerW / 2, bannerY + bannerH / 2, "INTERVIEW PREP", {
        fontFamily: FONT,
        fontSize: "11px",
        color: "#4a3820",
        fontStyle: "bold",
        wordWrap: { width: bannerW - 16 },
        align: "center",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);
    interviewPrepTitle.setResolution(window.devicePixelRatio || 1);

    // ── LEFT SIDE: WHITEBOARD ─────────────────────────────────────────────
    // Whiteboard frame
    g.fillStyle(0xbbbbbb, 1);
    g.fillRect(58, 82, 88, 98);
    // Whiteboard surface
    g.fillStyle(0xfafafa, 1);
    g.fillRect(62, 86, 80, 90);
    // Whiteboard horizontal text lines
    g.lineStyle(1, 0xcccccc, 0.7);
    for (let wl = 0; wl < 6; wl++) {
      const lineY = 96 + wl * 12;
      g.lineBetween(66, lineY, 138, lineY);
    }
    // Star/checkmark doodle top-right of board
    g.fillStyle(0x777777, 0.6);
    g.fillTriangle(130, 90, 134, 96, 126, 96);
    g.lineStyle(1.5, 0x777777, 0.7);
    g.lineBetween(119, 94, 122, 98);
    g.lineBetween(122, 98, 128, 88);
    // "YOU GOT THIS" on whiteboard — centered within the whiteboard surface
    // Whiteboard surface: x:62, y:86, w:80, h:90 → center at (102, 131)
    const youGotThis = this.add
      .text(102, 128, "YOU\nGOT\nTHIS", {
        fontFamily: FONT,
        fontSize: "9px",
        color: "#2255aa",
        fontStyle: "bold",
        align: "center",
        lineSpacing: 3,
        wordWrap: { width: 64 },
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);
    youGotThis.setResolution(window.devicePixelRatio || 1);

    // Whiteboard tray/ledge
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(62, 176, 80, 5);
    // Marker caps on tray
    g.fillStyle(0xdd2222, 1);
    g.fillCircle(72, 179, 3);
    g.fillStyle(0x2244dd, 1);
    g.fillCircle(84, 179, 3);
    g.fillStyle(0x111111, 1);
    g.fillCircle(96, 179, 3);

    // ── CENTER: CONFERENCE TABLE ──────────────────────────────────────────
    const tableX = 240;
    const tableY = 195;
    const tableW = 120;
    const tableH = 40;

    // Table shadow
    g.fillStyle(0x000000, 0.14);
    g.fillRect(tableX + 4, tableY + tableH + 2, tableW, 8);

    // Table top — dark walnut
    g.fillStyle(0x4a2c0a, 1);
    g.fillRect(tableX, tableY, tableW, tableH);
    // Table top edge highlight
    g.fillStyle(0x6b3d18, 1);
    g.fillRect(tableX + 2, tableY, tableW - 4, 8);
    // Subtle sheen
    g.fillStyle(0xffffff, 0.04);
    g.fillRect(tableX + 2, tableY, tableW - 4, 3);
    // Table front edge
    g.fillStyle(0x341e06, 1);
    g.fillRect(tableX, tableY + tableH, tableW, 4);
    // Table legs
    g.fillStyle(0x2a1404, 1);
    g.fillRect(tableX + 8, tableY + tableH + 3, 8, 14);
    g.fillRect(tableX + tableW - 16, tableY + tableH + 3, 8, 14);

    // ── TABLE PROPS ───────────────────────────────────────────────────────
    // Nameplate (cream, centered on table)
    const npX = tableX + (tableW - 50) / 2;
    g.fillStyle(0xe8d5b7, 1);
    g.fillRect(npX, tableY + 8, 50, 12);
    g.lineStyle(1, 0xc8aa88, 0.8);
    g.strokeRect(npX, tableY + 8, 50, 12);
    g.lineStyle(1, 0xaaaaaa, 0.4);
    g.lineBetween(npX + 5, tableY + 13, npX + 45, tableY + 13);
    g.lineBetween(npX + 8, tableY + 17, npX + 42, tableY + 17);

    // Glass of water (left side of table)
    g.lineStyle(1.5, 0x88aacc, 0.9);
    g.strokeRect(tableX + 10, tableY + 6, 12, 16);
    g.fillStyle(0xa8d8f8, 0.35);
    g.fillRect(tableX + 11, tableY + 12, 10, 10);

    // Folded paper card (right side of table)
    g.fillStyle(0xf5f5f5, 1);
    g.fillRect(tableX + tableW - 26, tableY + 8, 16, 12);
    g.lineStyle(1, 0xdddddd, 0.8);
    g.lineBetween(
      tableX + tableW - 26,
      tableY + 14,
      tableX + tableW - 10,
      tableY + 14,
    );

    // ── CHAIRS ────────────────────────────────────────────────────────────
    // Far side chairs (interviewer side) — grey, 28px wide, behind table
    const farChairY = tableY - 30;
    for (const cx of [tableX + 20, tableX + tableW - 48]) {
      // Chair seat
      g.fillStyle(0x5a5a5a, 1);
      g.fillRect(cx, farChairY, 28, 16);
      g.fillStyle(0x6a6a6a, 1);
      g.fillRect(cx + 1, farChairY, 26, 5);
      // Chair back
      g.fillStyle(0x5a5a5a, 1);
      g.fillRect(cx + 2, farChairY - 18, 24, 14);
      // Chair legs
      g.fillStyle(0x3a3a3a, 1);
      g.fillRect(cx + 2, farChairY + 14, 6, 10);
      g.fillRect(cx + 20, farChairY + 14, 6, 10);
    }

    // Near side chair (player side) — premium dark green upholstery
    const nearChairX = tableX + tableW / 2 - 14;
    const nearChairY = tableY + tableH + 10;
    g.fillStyle(0x2a6a2a, 1);
    g.fillRect(nearChairX, nearChairY, 28, 18);
    g.fillStyle(0x3a7d3a, 1);
    g.fillRect(nearChairX + 1, nearChairY, 26, 6);
    // Back rest
    g.fillStyle(0x2a6a2a, 1);
    g.fillRect(nearChairX + 2, nearChairY - 22, 24, 16);
    g.fillStyle(0x3a7d3a, 1);
    g.fillRect(nearChairX + 3, nearChairY - 21, 22, 5);
    // Chair legs
    g.fillStyle(0x1a4a1a, 1);
    g.fillRect(nearChairX + 2, nearChairY + 16, 7, 12);
    g.fillRect(nearChairX + 19, nearChairY + 16, 7, 12);
    // Chair shadow
    g.fillStyle(0x000000, 0.1);
    g.fillEllipse(nearChairX + 14, nearChairY + 28, 28, 6);

    // ── RIGHT SIDE: BOOKCASE ──────────────────────────────────────────────
    const bcX = 492;
    const bcY = 82;
    const bcW = 52;
    const bcH = 96;
    this.drawBookshelf(g, bcX, bcY, bcW, bcH, 0x8b6914);

    // Trophy on top of bookcase — gold cup
    const trX = bcX + bcW / 2;
    const trY = bcY - 2;
    g.fillStyle(0xffd700, 1);
    g.fillRect(trX - 7, trY - 18, 14, 16);
    // Trophy handles
    g.fillStyle(0xd4a800, 1);
    g.fillRect(trX - 10, trY - 14, 3, 8);
    g.fillRect(trX + 7, trY - 14, 3, 8);
    // Trophy base
    g.fillStyle(0xd4a800, 1);
    g.fillRect(trX - 9, trY - 2, 18, 3);
    g.fillRect(trX - 5, trY + 1, 10, 3);

    // ── RIGHT SIDE: FRAMED MOTIVATIONAL POSTER ────────────────────────────
    // Gold frame
    g.fillStyle(0xd4a843, 1);
    g.fillRect(480, 188, 58, 70);
    // Cream interior
    g.fillStyle(0xfff8e7, 1);
    g.fillRect(484, 192, 50, 62);
    // Decorative star in center
    g.fillStyle(0xd4a843, 0.6);
    g.fillTriangle(509, 210, 505, 222, 513, 222);
    g.fillTriangle(509, 224, 505, 212, 513, 212);
    // Text lines in poster
    g.lineStyle(1, 0xbbaa88, 0.6);
    g.lineBetween(488, 230, 530, 230);
    g.lineBetween(490, 237, 528, 237);
    g.lineBetween(492, 244, 526, 244);
    g.lineBetween(490, 251, 528, 251);

    // ── CUSTOM NPC: COACH MARCUS ──────────────────────────────────────────
    const marcusX = 250;
    const marcusY = 270;
    const mg = this.add.graphics();
    mg.setDepth(42);

    // Shadow
    mg.fillStyle(0x000000, 0.18);
    mg.fillEllipse(marcusX, marcusY + 16, 20, 6);

    // Legs — dark navy trousers
    mg.fillStyle(0x1a1a2e, 1);
    mg.fillRect(marcusX - 6, marcusY + 4, 5, 12);
    mg.fillRect(marcusX + 1, marcusY + 4, 5, 12);

    // Shoes — dark
    mg.fillStyle(0x2c1810, 1);
    mg.fillRect(marcusX - 7, marcusY + 14, 7, 3);
    mg.fillRect(marcusX + 1, marcusY + 14, 7, 3);

    // Body — dark navy suit jacket
    mg.fillStyle(0x1a3a6b, 1);
    mg.fillRect(marcusX - 8, marcusY - 10, 16, 16);

    // Jacket lapels
    mg.fillStyle(0x122a55, 1);
    mg.fillTriangle(
      marcusX - 8,
      marcusY - 10,
      marcusX - 2,
      marcusY - 10,
      marcusX - 8,
      marcusY - 2,
    );
    mg.fillTriangle(
      marcusX + 8,
      marcusY - 10,
      marcusX + 2,
      marcusY - 10,
      marcusX + 8,
      marcusY - 2,
    );

    // White shirt visible at chest
    mg.fillStyle(0xe8e8e8, 1);
    mg.fillRect(marcusX - 2, marcusY - 10, 4, 10);

    // Tie — narrow dark blue tie
    mg.fillStyle(0x0a1a44, 1);
    mg.fillRect(marcusX - 1, marcusY - 10, 2, 12);

    // Arms
    mg.fillStyle(0x1a3a6b, 1);
    mg.fillRect(marcusX - 12, marcusY - 9, 4, 10);
    mg.fillRect(marcusX + 8, marcusY - 9, 4, 10);

    // Hands
    mg.fillStyle(0xffcc80, 1);
    mg.fillRect(marcusX - 12, marcusY - 1, 4, 4);
    mg.fillRect(marcusX + 8, marcusY - 1, 4, 4);

    // Head
    mg.fillStyle(0xffcc80, 1);
    mg.fillRect(marcusX - 6, marcusY - 22, 12, 12);

    // Hair — short, dark brown, neat
    mg.fillStyle(0x2c1810, 1);
    mg.fillRect(marcusX - 7, marcusY - 24, 14, 5);
    mg.fillRect(marcusX - 6, marcusY - 22, 3, 4);
    mg.fillRect(marcusX + 3, marcusY - 22, 3, 4);

    // Slight confident smile — tiny curve lines
    mg.lineStyle(1, 0x4a2800, 1);
    mg.lineBetween(marcusX - 3, marcusY - 13, marcusX - 1, marcusY - 12);
    mg.lineBetween(marcusX + 1, marcusY - 13, marcusX + 3, marcusY - 12);

    // Eyes
    mg.fillStyle(0x000000, 1);
    mg.fillRect(marcusX - 4, marcusY - 18, 2, 2);
    mg.fillRect(marcusX + 2, marcusY - 18, 2, 2);

    // Glow ring — blue
    mg.lineStyle(1.5, 0x0077ff, 0.3);
    mg.strokeCircle(marcusX, marcusY, 26);

    // Marcus name label
    const marcusLabel = this.add
      .text(marcusX, marcusY - 40, "Coach Marcus", {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#000000cc",
        padding: { x: 6, y: 4 },
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(44);
    marcusLabel.setResolution(window.devicePixelRatio || 1);

    // Float animation for Marcus
    this.tweens.add({
      targets: mg,
      y: "-=4",
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // ── EXIT DOOR ─────────────────────────────────────────────────────────
    this.drawExitDoor(g, 0x888888, 0xbbbbbb, 0xd4a843);

    g.setDepth(2);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// JOB ANALYZER SCENE — dark tech lab / hacker den
// ─────────────────────────────────────────────────────────────────────────────

export class JobAnalyzerScene extends BaseInteriorScene {
  constructor() {
    super({ key: SCENE_KEYS.JOB_ANALYZER });
  }

  protected startMusic(): void {
    musicManager.crossFadeTo(MUSIC_TRACKS.JOB_ANALYZER.key);
  }
  protected getNPCColor(): number {
    return 0x00ff00;
  }
  protected getNPCX(): number {
    return 300;
  }
  protected getNPCY(): number {
    return 295;
  }
  protected getNPCLabel(): string {
    return "Alex";
  }
  protected getDialogueLines(): string[] {
    return [
      "Every job posting is just a wishlist.\nNobody actually has all those skills.",
      "They want 10 years experience\nwith a 2-year-old technology. Classic.",
      "Your resume has the keywords.\nThe algorithm is satisfied.\nThe human will read it eventually.",
      "I've analyzed 1,000 job descriptions.\nThey all want the same 3 things.\nI know which 3.",
    ];
  }

  /** Override: Alex is drawn procedurally in drawEnvironment — just set state */
  protected override spawnNPC(): void {
    this.npcX = this.getNPCX();
    this.npcY = this.getNPCY();
    this.npcColor = this.getNPCColor();
    this.dialogueLines = this.getDialogueLines();
    // Visual is drawn inside drawEnvironment — no duplicate generic NPC
  }

  protected drawEnvironment(): void {
    const w = ROOM_W;
    const h = ROOM_H;
    const g = this.add.graphics();
    g.setDepth(2);

    // ── WALLS: very dark navy with circuit-board horizontal lines ─────────
    const floorY = Math.round(h * 0.45);

    // Dark navy wall base
    g.fillStyle(0x0d1117, 1);
    g.fillRect(0, 0, w, floorY);

    // Circuit-board-style horizontal grid lines
    g.lineStyle(1, 0x161b22, 1);
    for (let wy = 8; wy < floorY; wy += 14) {
      g.lineBetween(0, wy, w, wy);
    }
    // Occasional brighter accent lines suggesting PCB traces
    g.lineStyle(1, 0x1e2a38, 0.7);
    for (let wy = 20; wy < floorY; wy += 42) {
      g.lineBetween(0, wy, w, wy);
    }

    // Crown strip at top
    g.fillStyle(0x1a2a3a, 1);
    g.fillRect(0, 0, w, 6);
    g.fillStyle(0x0d1b2a, 1);
    g.fillRect(0, 6, w, 3);

    // Neon teal baseboard glow strip at floor/wall boundary
    g.fillStyle(0x00cccc, 0.55);
    g.fillRect(0, floorY - 3, w, 3);

    // ── FLOOR: very dark charcoal with green radar grid ───────────────────
    g.fillStyle(0x161616, 1);
    g.fillRect(0, floorY, w, h - floorY);

    // Green radar grid (thin lines every 30px)
    g.lineStyle(1, 0x1a2a1a, 0.9);
    for (let gx = 0; gx < w; gx += 30) {
      g.lineBetween(gx, floorY, gx, h);
    }
    for (let gy = floorY; gy < h; gy += 30) {
      g.lineBetween(0, gy, w, gy);
    }

    // ── LEFT SIDE: SERVER RACK ────────────────────────────────────────────
    const srvX = 60;
    const srvY = 80;
    const srvW = 40;
    const srvH = 80;

    // Server rack shadow
    g.fillStyle(0x000000, 0.25);
    g.fillRect(srvX + 3, srvY + srvH, srvW, 6);

    // Server rack main body
    g.fillStyle(0x1a1a2e, 1);
    g.fillRect(srvX, srvY, srvW, srvH);

    // Rack panel lines (horizontal divisions suggesting server units)
    g.fillStyle(0x2a2a3e, 1);
    for (let ru = 0; ru < 5; ru++) {
      const ry = srvY + 4 + ru * 15;
      g.fillRect(srvX + 2, ry, srvW - 4, 12);
    }
    // Right-edge shadow strip
    g.fillStyle(0x111120, 1);
    g.fillRect(srvX + srvW - 3, srvY, 3, srvH);

    // Server status LEDs (alternating green/red dots in pairs per unit)
    const ledColors = [
      0x00ff00, 0xff4444, 0x00ff00, 0x00ff00, 0xff4444, 0x00ff00, 0x00ff00,
      0xff4444,
    ];
    for (let li = 0; li < 8; li++) {
      const ledRow = Math.floor(li / 2);
      const ledCol = li % 2;
      const lx = srvX + 5 + ledCol * 6;
      const ly = srvY + 8 + ledRow * 15;
      g.fillStyle(ledColors[li], 1);
      g.fillRect(lx, ly, 3, 3);
    }

    // UPS / power unit below server rack
    g.fillStyle(0x000000, 0.15);
    g.fillRect(srvX + 2, srvY + srvH + 6 + 3, 30, 4);
    g.fillStyle(0x2a2a2e, 1);
    g.fillRect(srvX + 2, srvY + srvH + 6, 30, 20);
    g.fillStyle(0x3a3a4e, 1);
    g.fillRect(srvX + 4, srvY + srvH + 8, 24, 6);
    // UPS status light
    g.fillStyle(0x00cc00, 0.9);
    g.fillRect(srvX + 6, srvY + srvH + 18, 4, 4);

    // Cable from server rack down-left (dark grey curved suggestion)
    g.lineStyle(2, 0x333366, 0.7);
    g.lineBetween(
      srvX + srvW,
      srvY + srvH / 2,
      srvX + srvW + 50,
      srvY + srvH / 2 + 40,
    );
    g.lineStyle(1, 0x444488, 0.4);
    g.lineBetween(
      srvX + srvW + 2,
      srvY + srvH / 2 + 4,
      srvX + srvW + 48,
      srvY + srvH / 2 + 44,
    );

    // ── CENTER-LEFT WORKSTATION DESK ──────────────────────────────────────
    const desk1X = 200;
    const desk1Y = 220;
    const desk1W = 85;
    const desk1H = 35;

    // Desk shadow
    g.fillStyle(0x000000, 0.2);
    g.fillRect(desk1X + 3, desk1Y + desk1H + 2, desk1W, 7);

    // Desk surface — very dark with edge highlight
    g.fillStyle(0x1e1e2e, 1);
    g.fillRect(desk1X, desk1Y, desk1W, desk1H);
    // Edge highlight
    g.fillStyle(0x2a2a3e, 1);
    g.fillRect(desk1X, desk1Y, desk1W, 6);
    g.fillStyle(0x111128, 1);
    g.fillRect(desk1X, desk1Y + desk1H, desk1W, 4);
    // Desk legs
    g.fillStyle(0x0d0d1e, 1);
    g.fillRect(desk1X + 6, desk1Y + desk1H + 3, 7, 14);
    g.fillRect(desk1X + desk1W - 13, desk1Y + desk1H + 3, 7, 14);

    // ── MONITOR ON DESK 1 (terminal/code display) ─────────────────────────
    const mon1X = desk1X + 8;
    const mon1Y = desk1Y - 40;

    // Monitor frame (dark black)
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(mon1X, mon1Y, 55, 40);
    // Monitor screen — dark with neon green code lines
    g.fillStyle(0x0a0a0a, 1);
    g.fillRect(mon1X + 3, mon1Y + 3, 49, 32);
    // Simulated green terminal code lines
    const codeLineWidths = [38, 30, 44, 24, 35, 28];
    for (let cl = 0; cl < 6; cl++) {
      g.fillStyle(0x00ff00, 0.85);
      g.fillRect(mon1X + 5, mon1Y + 6 + cl * 5, codeLineWidths[cl], 2);
    }
    // Cursor blink suggestion
    g.fillStyle(0x00ff00, 1);
    g.fillRect(mon1X + 5, mon1Y + 6 + 6 * 5, 4, 2);
    // Monitor stand/neck
    g.fillStyle(0x111111, 1);
    g.fillRect(mon1X + 23, mon1Y + 40, 9, 6);
    g.fillRect(mon1X + 16, mon1Y + 45, 23, 4);

    // ── KEYBOARD on desk 1 ────────────────────────────────────────────────
    const kb1X = desk1X + 10;
    const kb1Y = desk1Y + 6;
    g.fillStyle(0x2d2d3d, 1);
    g.fillRect(kb1X, kb1Y, 50, 12);
    // Key grid dots
    g.fillStyle(0x3d3d4d, 1);
    for (let kr = 0; kr < 3; kr++) {
      for (let kc = 0; kc < 10; kc++) {
        g.fillRect(kb1X + 2 + kc * 5, kb1Y + 2 + kr * 4, 3, 2);
      }
    }

    // ── COFFEE MUG on right of desk 1 ────────────────────────────────────
    const mug1X = desk1X + desk1W - 14;
    const mug1Y = desk1Y + 4;
    g.fillStyle(0x2a2a2e, 1);
    g.fillRect(mug1X - 6, mug1Y, 12, 12);
    g.fillStyle(0x3a3a4a, 1);
    g.fillRect(mug1X - 5, mug1Y, 10, 3);
    // Mug handle
    g.lineStyle(1.5, 0x3a3a4a, 1);
    g.strokeCircle(mug1X + 7, mug1Y + 6, 4);
    // Steam wisps
    g.lineStyle(1, 0x444466, 0.5);
    g.lineBetween(mug1X - 2, mug1Y - 3, mug1X - 4, mug1Y - 7);
    g.lineBetween(mug1X + 1, mug1Y - 4, mug1X + 3, mug1Y - 8);

    // ── RIGHT SIDE DESK ───────────────────────────────────────────────────
    const desk2X = 370;
    const desk2Y = 215;
    const desk2W = 80;
    const desk2H = 35;

    // Desk shadow
    g.fillStyle(0x000000, 0.2);
    g.fillRect(desk2X + 3, desk2Y + desk2H + 2, desk2W, 7);

    // Desk surface
    g.fillStyle(0x1e1e2e, 1);
    g.fillRect(desk2X, desk2Y, desk2W, desk2H);
    g.fillStyle(0x2a2a3e, 1);
    g.fillRect(desk2X, desk2Y, desk2W, 6);
    g.fillStyle(0x111128, 1);
    g.fillRect(desk2X, desk2Y + desk2H, desk2W, 4);
    g.fillStyle(0x0d0d1e, 1);
    g.fillRect(desk2X + 6, desk2Y + desk2H + 3, 7, 14);
    g.fillRect(desk2X + desk2W - 13, desk2Y + desk2H + 3, 7, 14);

    // ── MONITOR 2 (data chart display) ────────────────────────────────────
    const mon2X = desk2X + 5;
    const mon2Y = desk2Y - 45;

    // Monitor frame
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(mon2X, mon2Y, 50, 45);
    // Monitor screen — very dark blue showing data chart
    g.fillStyle(0x050510, 1);
    g.fillRect(mon2X + 3, mon2Y + 3, 44, 37);
    // Blue horizontal grid lines
    g.lineStyle(1, 0x002244, 0.8);
    for (let bl = 0; bl < 6; bl++) {
      g.lineBetween(
        mon2X + 4,
        mon2Y + 8 + bl * 6,
        mon2X + 46,
        mon2Y + 8 + bl * 6,
      );
    }
    // Neon blue line graph
    g.lineStyle(2, 0x00aaff, 1);
    const chartPoints = [
      [mon2X + 5, mon2Y + 32],
      [mon2X + 12, mon2Y + 25],
      [mon2X + 18, mon2Y + 28],
      [mon2X + 25, mon2Y + 16],
      [mon2X + 32, mon2Y + 20],
      [mon2X + 38, mon2Y + 12],
      [mon2X + 44, mon2Y + 18],
    ];
    for (let cp = 0; cp < chartPoints.length - 1; cp++) {
      g.lineBetween(
        chartPoints[cp][0],
        chartPoints[cp][1],
        chartPoints[cp + 1][0],
        chartPoints[cp + 1][1],
      );
    }
    // Small dots on chart nodes
    g.fillStyle(0x00aaff, 1);
    for (const [cpx, cpy] of chartPoints) {
      g.fillRect(cpx - 1, cpy - 1, 3, 3);
    }
    // Monitor stand
    g.fillStyle(0x111111, 1);
    g.fillRect(mon2X + 21, mon2Y + 45, 8, 6);
    g.fillRect(mon2X + 14, mon2Y + 50, 22, 4);

    // ── FILING TRAY on desk 2 ─────────────────────────────────────────────
    const trayX = desk2X + desk2W - 44;
    const trayY = desk2Y + 4;
    // Tray body (dark grey wire mesh look)
    g.fillStyle(0x2a2a2e, 1);
    g.fillRect(trayX, trayY, 40, 10);
    g.fillStyle(0x3a3a3e, 1);
    g.fillRect(trayX + 1, trayY + 1, 38, 4);
    // Paper edges (white) — visible in tray
    g.fillStyle(0xe8e8d0, 1);
    for (let pap = 0; pap < 3; pap++) {
      g.fillRect(trayX + 3 + pap * 3, trayY - 8 + pap * 2, 32, 10);
    }
    g.lineStyle(1, 0xccccbb, 0.4);
    for (let pl = 0; pl < 3; pl++) {
      g.lineBetween(
        trayX + 5,
        trayY - 3 + pl * 2,
        trayX + 33,
        trayY - 3 + pl * 2,
      );
    }

    // ── STICKY NOTES on wall above desk 2 ────────────────────────────────
    const stickyData = [
      { x: desk2X - 10, y: 115, color: 0xffeb3b },
      { x: desk2X + 22, y: 108, color: 0xff8f00 },
      { x: desk2X + 52, y: 118, color: 0xffeb3b },
      { x: desk2X + 80, y: 112, color: 0xff8f00 },
    ];
    for (const s of stickyData) {
      g.fillStyle(s.color, 0.92);
      g.fillRect(s.x, s.y, 24, 20);
      // Shadow fold at corner
      g.fillStyle(0x000000, 0.1);
      g.fillTriangle(s.x + 20, s.y, s.x + 24, s.y, s.x + 24, s.y + 4);
      // Handwritten keyword lines
      g.lineStyle(1, 0x333300, 0.55);
      g.lineBetween(s.x + 3, s.y + 6, s.x + 20, s.y + 6);
      g.lineBetween(s.x + 3, s.y + 11, s.x + 17, s.y + 11);
      g.lineBetween(s.x + 3, s.y + 16, s.x + 19, s.y + 16);
    }

    // ── CENTER-TOP: WALL-MOUNTED ANALYTICS PANEL ─────────────────────────
    const panelX = 270;
    const panelY = 70;
    const panelW = 110;
    const panelH = 65;

    // Panel label above — constrained to panel width
    const jobAnalysisLabel = this.add
      .text(panelX + panelW / 2, panelY - 8, "JOB ANALYSIS", {
        fontFamily: FONT,
        fontSize: "11px",
        color: "#00ccff",
        fontStyle: "bold",
        wordWrap: { width: panelW },
        align: "center",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);
    jobAnalysisLabel.setResolution(window.devicePixelRatio || 1);

    // Panel frame (neon blue border)
    g.fillStyle(0x0d1b2a, 1);
    g.fillRect(panelX, panelY, panelW, panelH);
    g.lineStyle(2, 0x00aaff, 0.9);
    g.strokeRect(panelX, panelY, panelW, panelH);

    // Panel interior — dark
    g.fillStyle(0x050a10, 1);
    g.fillRect(panelX + 2, panelY + 2, panelW - 4, panelH - 4);

    // Simulated pie chart (left half of panel) — circle arcs with color wedges
    const pieX = panelX + 30;
    const pieY = panelY + 34;
    const pieR = 20;
    // Fill the circle in segments using filled ellipses + masking trick:
    // Draw full circle in base color, then overlay wedge sectors
    g.fillStyle(0x00ff88, 1);
    g.fillCircle(pieX, pieY, pieR);
    // Overlay a dark wedge to create 2 segments (rough approximation)
    g.fillStyle(0x0055ff, 1);
    g.fillTriangle(
      pieX,
      pieY,
      pieX + pieR,
      pieY,
      pieX + pieR * 0.5,
      pieY - pieR * 0.86,
    );
    g.fillTriangle(
      pieX,
      pieY,
      pieX + pieR * 0.5,
      pieY - pieR * 0.86,
      pieX - pieR * 0.5,
      pieY - pieR * 0.86,
    );
    g.fillStyle(0xff00cc, 1);
    g.fillTriangle(
      pieX,
      pieY,
      pieX - pieR,
      pieY,
      pieX - pieR * 0.7,
      pieY + pieR * 0.7,
    );
    // Pie center white circle (donut hole)
    g.fillStyle(0x050a10, 1);
    g.fillCircle(pieX, pieY, pieR * 0.45);

    // Bar chart (right side of panel) — 5 bars of varying heights in neon green
    const barBaseY = panelY + panelH - 6;
    const barHeights = [22, 15, 32, 18, 26];
    const barW = 7;
    for (let bi = 0; bi < 5; bi++) {
      const bx = panelX + 64 + bi * 9;
      const bh = barHeights[bi];
      g.fillStyle(0x00ff88, 0.9);
      g.fillRect(bx, barBaseY - bh, barW, bh);
      // Bar top highlight
      g.fillStyle(0x88ffcc, 0.5);
      g.fillRect(bx, barBaseY - bh, barW, 2);
    }
    // Chart baseline
    g.lineStyle(1, 0x00aaff, 0.6);
    g.lineBetween(panelX + 62, barBaseY, panelX + panelW - 3, barBaseY);

    // ── ROOM TITLE TEXT ───────────────────────────────────────────────────
    const jobAnalyzerTitle = this.add
      .text(w / 2, 16, "✦ JOB ANALYZER ✦", {
        fontFamily: FONT,
        fontSize: "18px",
        color: "#39ff14",
        stroke: "#000000",
        strokeThickness: 2,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);
    jobAnalyzerTitle.setResolution(window.devicePixelRatio || 1);

    // ── CUSTOM NPC: ALEX (drawn here for full procedural detail) ──────────
    const alexX = 300;
    const alexY = 295;
    const ag = this.add.graphics();
    ag.setDepth(42);

    // Shadow
    ag.fillStyle(0x000000, 0.2);
    ag.fillEllipse(alexX, alexY + 16, 20, 6);

    // Legs — very dark pants (near-black with dark navy tint)
    ag.fillStyle(0x0d1117, 1);
    ag.fillRect(alexX - 6, alexY + 4, 5, 12);
    ag.fillRect(alexX + 1, alexY + 4, 5, 12);

    // Shoes — dark
    ag.fillStyle(0x1a1a2e, 1);
    ag.fillRect(alexX - 7, alexY + 14, 6, 3);
    ag.fillRect(alexX + 1, alexY + 14, 7, 3);

    // Body — dark green hoodie (programmer aesthetic)
    ag.fillStyle(0x1a3a1a, 1);
    ag.fillRect(alexX - 8, alexY - 10, 16, 16);

    // Hoodie front pocket suggestion
    ag.fillStyle(0x142e14, 1);
    ag.fillRect(alexX - 5, alexY - 2, 10, 8);

    // Hoodie hood behind head (dark green lump above shoulders)
    ag.fillStyle(0x1a3a1a, 1);
    ag.fillRect(alexX - 9, alexY - 22, 18, 8);

    // Arms
    ag.fillStyle(0x1a3a1a, 1);
    ag.fillRect(alexX - 12, alexY - 9, 4, 10);
    ag.fillRect(alexX + 8, alexY - 9, 4, 10);

    // Hands
    ag.fillStyle(0xffcc80, 1);
    ag.fillRect(alexX - 12, alexY - 1, 4, 4);
    ag.fillRect(alexX + 8, alexY - 1, 4, 4);

    // Head
    ag.fillStyle(0xffcc80, 1);
    ag.fillRect(alexX - 6, alexY - 22, 12, 12);

    // Hair — dark brown, messy/tousled (uneven top)
    ag.fillStyle(0x4a2c0a, 1);
    ag.fillRect(alexX - 7, alexY - 25, 14, 6);
    // Messy tufts
    ag.fillRect(alexX - 8, alexY - 24, 3, 3);
    ag.fillRect(alexX + 5, alexY - 26, 4, 4);
    ag.fillRect(alexX - 2, alexY - 26, 3, 3);
    ag.fillRect(alexX + 1, alexY - 24, 3, 5);

    // Eyes
    ag.fillStyle(0x000000, 1);
    ag.fillRect(alexX - 4, alexY - 18, 2, 2);
    ag.fillRect(alexX + 2, alexY - 18, 2, 2);

    // Tech glasses — thin blue-tinted lines across eyes
    ag.lineStyle(1, 0x00aaff, 0.85);
    ag.strokeRect(alexX - 5, alexY - 19, 4, 3);
    ag.strokeRect(alexX + 1, alexY - 19, 4, 3);
    ag.lineBetween(alexX - 1, alexY - 18, alexX + 1, alexY - 18);

    // Glow ring — neon green
    ag.lineStyle(1.5, 0x00ff00, 0.32);
    ag.strokeCircle(alexX, alexY, 26);

    // Alex name label
    const alexLabel = this.add
      .text(alexX, alexY - 40, "Alex", {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#000000cc",
        padding: { x: 6, y: 4 },
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(44);
    alexLabel.setResolution(window.devicePixelRatio || 1);

    // Float animation for Alex
    this.tweens.add({
      targets: ag,
      y: "-=4",
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // ── EXIT DOOR with neon teal glow outline ────────────────────────────
    this.drawExitDoor(g, 0x0a0e18, 0x111122, 0x00cccc);

    // Subtle teal/cyan glow around door frame
    const cx2 = ROOM_W / 2;
    const doorW = 48;
    const doorH = 70;
    const doorTop = ROOM_H - doorH - 2;
    g.lineStyle(2, 0x00cccc, 0.45);
    g.strokeRect(cx2 - doorW / 2 - 6, doorTop - 7, doorW + 12, doorH + 9);
    g.lineStyle(1, 0x00ffff, 0.2);
    g.strokeRect(cx2 - doorW / 2 - 9, doorTop - 10, doorW + 18, doorH + 12);

    g.setDepth(2);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// STUDY HALL SCENE — warm academic library, Hogwarts-meets-university reading room
// ─────────────────────────────────────────────────────────────────────────────

export class StudyHallScene extends BaseInteriorScene {
  constructor() {
    super({ key: SCENE_KEYS.STUDY_HALL });
  }

  protected startMusic(): void {
    musicManager.crossFadeTo(MUSIC_TRACKS.STUDY_HALL.key);
  }
  protected getNPCColor(): number {
    return 0xd4a843;
  }
  protected getNPCX(): number {
    return 295;
  }
  protected getNPCY(): number {
    return 265;
  }
  protected getNPCLabel(): string {
    return "Prof. Sage";
  }
  protected getDialogueLines(): string[] {
    return [
      "Ah, a student. Pull up a chair.\nThe good ones are taken, naturally.",
      "Interview prep is just storytelling\nwith citations. What's your cited story?",
      "Flashcards are not cheating.\nFlashcards are how humans learned\nbefore Wi-Fi.",
      "The best candidates prepared.\nThe hired ones prepared more. Study.",
    ];
  }

  /** Override: Prof. Sage is drawn procedurally in drawEnvironment — just set state */
  protected override spawnNPC(): void {
    this.npcX = this.getNPCX();
    this.npcY = this.getNPCY();
    this.npcColor = this.getNPCColor();
    this.dialogueLines = this.getDialogueLines();
    // Visual is drawn inside drawEnvironment — no duplicate generic NPC
  }

  protected drawEnvironment(): void {
    const w = ROOM_W;
    const h = ROOM_H;
    const g = this.add.graphics();
    g.setDepth(2);

    // ── WALLS: warm cream/ivory with vertical panel groove pattern ────────
    const floorY = Math.round(h * 0.45);

    // Warm ivory wall base
    g.fillStyle(0xfaf0dc, 1);
    g.fillRect(0, 0, w, floorY);

    // Vertical panel groove lines every ~40px (subtle darker shade)
    g.lineStyle(1, 0xe8d9b0, 0.65);
    for (let vx = 40; vx < w; vx += 40) {
      g.lineBetween(vx, 0, vx, floorY - 5);
    }

    // Chair rail / dado rail at y~200
    g.fillStyle(0xd4b896, 1);
    g.fillRect(0, 198, w, 4);
    g.fillStyle(0xc8a87a, 0.5);
    g.fillRect(0, 202, w, 2);

    // Crown molding at top — warm ivory strip
    g.fillStyle(0xe0ccaa, 1);
    g.fillRect(0, 0, w, 7);
    g.fillStyle(0xeeddbb, 1);
    g.fillRect(0, 7, w, 3);

    // ── FLOOR: rich warm dark brown parquet with herringbone-ish strips ───
    // Base dark brown planks
    for (let fy = floorY; fy < h; fy += 16) {
      const shade =
        Math.floor((fy - floorY) / 16) % 2 === 0 ? 0x6b3a1e : 0x7a4428;
      g.fillStyle(shade, 1);
      g.fillRect(0, fy, w, 16);
    }
    // Plank vertical breaks
    g.lineStyle(1, 0x4a2510, 0.4);
    for (let fx = 0; fx < w; fx += 70) {
      g.lineBetween(fx, floorY, fx, h);
    }
    // Herringbone diagonal accent stripes (thin lighter diagonals)
    g.lineStyle(1, 0x8a5030, 0.18);
    for (let dx = -h; dx < w + h; dx += 28) {
      g.lineBetween(dx, floorY, dx + h, h);
    }
    // Baseboard
    g.fillStyle(0x5c2e0e, 1);
    g.fillRect(0, floorY - 5, w, 5);

    // ── CENTER-LOWER: plush green reading rug ─────────────────────────────
    const rugX = (w - 160) / 2;
    const rugY = 300;
    const rugW = 160;
    const rugH = 90;
    // Rug shadow
    g.fillStyle(0x000000, 0.1);
    g.fillRect(rugX + 4, rugY + rugH, rugW, 6);
    // Rug body
    g.fillStyle(0x2d5a1b, 1);
    g.fillRect(rugX, rugY, rugW, rugH);
    // Rug border (slightly lighter)
    g.fillStyle(0x3a7024, 1);
    g.fillRect(rugX, rugY, rugW, 5);
    g.fillRect(rugX, rugY + rugH - 5, rugW, 5);
    g.fillRect(rugX, rugY, 5, rugH);
    g.fillRect(rugX + rugW - 5, rugY, 5, rugH);
    // Rug inner border line
    g.lineStyle(1, 0x4a8a30, 0.5);
    g.strokeRect(rugX + 8, rugY + 8, rugW - 16, rugH - 16);

    // ── LEFT WALL: TALL BOOKSHELF #1 ──────────────────────────────────────
    const bs1X = 22;
    const bs1Y = 65;
    const bs1W = 55;
    const bs1H = 110;

    // Shelf shadow
    g.fillStyle(0x000000, 0.18);
    g.fillRect(bs1X + 4, bs1Y + bs1H, bs1W, 6);

    // Shelf body — dark mahogany
    g.fillStyle(0x5c3317, 1);
    g.fillRect(bs1X, bs1Y, bs1W, bs1H);

    // Shelf right-side shadow strip
    g.fillStyle(0x3a1f0d, 1);
    g.fillRect(bs1X + bs1W - 4, bs1Y, 4, bs1H);

    // Shelf top
    g.fillStyle(0x7a4a22, 1);
    g.fillRect(bs1X - 2, bs1Y - 3, bs1W + 4, 5);

    // 4 rows of books with varied heights & colors
    const bookRows = [
      // Row 1: blues & teals
      [0x1a3a6b, 0x2255aa, 0x006b7a, 0x003d4a, 0x1a3a6b],
      // Row 2: reds & burgundy
      [0x8b0000, 0xa01515, 0x6b0f0f, 0xcc2200, 0x8b0000],
      // Row 3: greens
      [0x1a4a1a, 0x2d6e2d, 0x0d3d0d, 0x3a7a3a, 0x1a4a1a],
      // Row 4: golds & purples
      [0xb8860b, 0xd4a843, 0x5a1a7a, 0x7a2d8f, 0xb8860b],
    ];
    const rowH = (bs1H - 8) / 4;
    for (let row = 0; row < 4; row++) {
      const shelfBaseY = bs1Y + 4 + row * rowH + rowH - 5;
      // Shelf board
      g.fillStyle(0x3a2010, 1);
      g.fillRect(bs1X + 2, shelfBaseY, bs1W - 4, 4);
      const colors = bookRows[row];
      const bookW = Math.floor((bs1W - 8) / colors.length);
      for (let bi = 0; bi < colors.length; bi++) {
        const bh = Math.floor(rowH * 0.6) + (bi % 3) * 4;
        const bx = bs1X + 4 + bi * bookW;
        g.fillStyle(colors[bi], 1);
        g.fillRect(bx, shelfBaseY - bh, bookW - 1, bh);
        // Spine highlight
        g.fillStyle(0xffffff, 0.08);
        g.fillRect(bx + 1, shelfBaseY - bh, 2, bh);
        // Bookend at start & end of row
        if (bi === 0 || bi === colors.length - 1) {
          g.fillStyle(0x3a2010, 1);
          const endX = bi === 0 ? bs1X + 2 : bs1X + bs1W - 6;
          g.fillRect(endX, shelfBaseY - bh - 2, 3, bh + 2);
        }
      }
    }

    // Small reading lamp mounted to left side of bookshelf
    g.lineStyle(2, 0xc8a844, 1);
    g.lineBetween(bs1X + bs1W + 2, bs1Y + 20, bs1X + bs1W + 14, bs1Y + 12);
    g.fillStyle(0xd4a843, 1);
    g.fillRect(bs1X + bs1W + 12, bs1Y + 8, 6, 3); // shade
    g.fillStyle(0xffa500, 0.7);
    g.fillEllipse(bs1X + bs1W + 15, bs1Y + 14, 12, 8); // warm glow

    // ── RIGHT WALL: TALL BOOKSHELF #2 ─────────────────────────────────────
    const bs2X = w - 22 - 55;
    const bs2Y = 65;
    const bs2W = 55;
    const bs2H = 110;

    // Shelf shadow
    g.fillStyle(0x000000, 0.18);
    g.fillRect(bs2X + 4, bs2Y + bs2H, bs2W, 6);

    // Shelf body
    g.fillStyle(0x5c3317, 1);
    g.fillRect(bs2X, bs2Y, bs2W, bs2H);
    g.fillStyle(0x3a1f0d, 1);
    g.fillRect(bs2X + bs2W - 4, bs2Y, 4, bs2H);
    g.fillStyle(0x7a4a22, 1);
    g.fillRect(bs2X - 2, bs2Y - 3, bs2W + 4, 5);

    // Books on right shelf (mirrored color order)
    const bookRows2 = [
      [0x5a1a7a, 0x7a2d8f, 0xb8860b, 0xd4a843, 0x5a1a7a],
      [0x0d3d0d, 0x3a7a3a, 0x1a4a1a, 0x2d6e2d, 0x0d3d0d],
      [0x6b0f0f, 0xcc2200, 0x8b0000, 0xa01515, 0x6b0f0f],
      [0x003d4a, 0x006b7a, 0x1a3a6b, 0x2255aa, 0x003d4a],
    ];
    for (let row = 0; row < 4; row++) {
      const shelfBaseY = bs2Y + 4 + row * rowH + rowH - 5;
      g.fillStyle(0x3a2010, 1);
      g.fillRect(bs2X + 2, shelfBaseY, bs2W - 4, 4);
      const colors2 = bookRows2[row];
      const bookW2 = Math.floor((bs2W - 8) / colors2.length);
      for (let bi = 0; bi < colors2.length; bi++) {
        const bh = Math.floor(rowH * 0.6) + ((bi + 2) % 3) * 4;
        const bx = bs2X + 4 + bi * bookW2;
        g.fillStyle(colors2[bi], 1);
        g.fillRect(bx, shelfBaseY - bh, bookW2 - 1, bh);
        g.fillStyle(0xffffff, 0.08);
        g.fillRect(bx + 1, shelfBaseY - bh, 2, bh);
        if (bi === 0 || bi === colors2.length - 1) {
          g.fillStyle(0x3a2010, 1);
          const endX = bi === 0 ? bs2X + 2 : bs2X + bs2W - 6;
          g.fillRect(endX, shelfBaseY - bh - 2, 3, bh + 2);
        }
      }
    }

    // Globe on top of right bookshelf
    const globeX = bs2X + bs2W / 2 - 4;
    const globeY = bs2Y - 20;
    // Globe stand
    g.fillStyle(0xd4a843, 1);
    g.fillRect(globeX - 2, globeY + 16, 4, 6);
    g.fillRect(globeX - 6, globeY + 20, 12, 3);
    // Globe sphere (ocean blue)
    g.fillStyle(0x1a4a8a, 1);
    g.fillCircle(globeX, globeY + 8, 12);
    // Continent patches (green ovals)
    g.fillStyle(0x2d7a2d, 1);
    g.fillEllipse(globeX - 3, globeY + 4, 8, 6);
    g.fillEllipse(globeX + 4, globeY + 10, 6, 5);
    g.fillEllipse(globeX - 2, globeY + 14, 5, 4);

    // Brass candlestick on top of right bookshelf
    const candleX = bs2X + bs2W - 14;
    const candleY = bs2Y - 16;
    g.fillStyle(0xd4a843, 1);
    g.fillRect(candleX - 2, candleY, 4, 14);
    g.fillRect(candleX - 5, candleY + 12, 10, 3);
    g.fillStyle(0xfff9e0, 1);
    g.fillEllipse(candleX, candleY - 4, 5, 8); // flame
    g.fillStyle(0xffcc44, 0.6);
    g.fillEllipse(candleX, candleY - 2, 3, 5); // inner flame

    // ── CENTER-TOP: ROUND STUDY TABLE ─────────────────────────────────────
    const tableX = 264;
    const tableY = 178;
    const tableW = 72;
    const tableH = 30;

    // Table shadow
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(tableX + tableW / 2, tableY + tableH + 8, tableW + 10, 12);

    // Table legs (visible below)
    g.fillStyle(0x5c3317, 1);
    g.fillRect(tableX + 8, tableY + tableH, 7, 16);
    g.fillRect(tableX + tableW - 15, tableY + tableH, 7, 16);

    // Table surface — warm mahogany ellipse-ish (wide rect)
    g.fillStyle(0x8b5e3c, 1);
    g.fillRect(tableX, tableY, tableW, tableH);
    // Table top highlight
    g.fillStyle(0xa8724c, 1);
    g.fillRect(tableX + 2, tableY, tableW - 4, 8);
    g.fillStyle(0xffffff, 0.05);
    g.fillRect(tableX + 2, tableY, tableW - 4, 3);
    // Table front edge
    g.fillStyle(0x5c3317, 1);
    g.fillRect(tableX, tableY + tableH, tableW, 4);

    // Chair at top of table (back visible, pushed in)
    const topChairX = tableX + (tableW - 28) / 2;
    const topChairY = tableY - 26;
    g.fillStyle(0x6b3d18, 1);
    g.fillRect(topChairX, topChairY, 28, 14); // backrest
    g.fillStyle(0x5c3010, 1);
    g.fillRect(topChairX + 2, topChairY + 14, 24, 12); // seat (partially hidden by table)

    // Chair at bottom of table (facing player)
    const botChairX = tableX + (tableW - 28) / 2;
    const botChairY = tableY + tableH + 18;
    g.fillStyle(0x6b3d18, 1);
    g.fillRect(botChairX, botChairY, 28, 16); // seat
    g.fillStyle(0x5c3010, 1);
    g.fillRect(botChairX + 1, botChairY, 26, 6); // seat top highlight
    g.fillRect(botChairX + 2, botChairY - 18, 24, 14); // backrest
    g.fillStyle(0x3a1e08, 1);
    g.fillRect(botChairX + 2, botChairY + 14, 6, 12); // legs
    g.fillRect(botChairX + 20, botChairY + 14, 6, 12);

    // ── TABLE PROPS ───────────────────────────────────────────────────────
    // Open book on table center
    const bookX = tableX + 8;
    const bookY = tableY + 4;
    const bookW = 36;
    const bookH = 20;
    // Book cover (left page)
    g.fillStyle(0x8b5e3c, 1);
    g.fillRect(bookX - 2, bookY - 2, bookW / 2 + 2, bookH + 4);
    // Left page (cream)
    g.fillStyle(0xfff8e7, 1);
    g.fillRect(bookX, bookY, bookW / 2, bookH);
    // Right page (cream, slight angle)
    g.fillStyle(0xf5eed8, 1);
    g.fillRect(bookX + bookW / 2, bookY, bookW / 2, bookH);
    // Text lines on left page
    g.lineStyle(1, 0xccbbaa, 0.6);
    for (let ln = 0; ln < 3; ln++) {
      g.lineBetween(
        bookX + 2,
        bookY + 4 + ln * 5,
        bookX + bookW / 2 - 2,
        bookY + 4 + ln * 5,
      );
    }
    // Text lines on right page
    for (let ln = 0; ln < 3; ln++) {
      g.lineBetween(
        bookX + bookW / 2 + 2,
        bookY + 4 + ln * 5,
        bookX + bookW - 2,
        bookY + 4 + ln * 5,
      );
    }
    // Spine shadow (center line)
    g.lineStyle(1, 0x5c3317, 0.7);
    g.lineBetween(bookX + bookW / 2, bookY, bookX + bookW / 2, bookY + bookH);

    // Reading lantern (small brass, right side of table)
    const lanX = tableX + tableW - 18;
    const lanY = tableY + 2;
    g.fillStyle(0xd4a843, 1);
    g.fillRect(lanX - 5, lanY, 10, 12);
    g.fillStyle(0xc09030, 1);
    g.fillRect(lanX - 6, lanY - 3, 12, 3); // top cap
    g.fillRect(lanX - 6, lanY + 12, 12, 2); // bottom cap
    // Lantern inner warm glow
    g.fillStyle(0xffa500, 0.6);
    g.fillRect(lanX - 3, lanY + 1, 6, 10);
    g.fillStyle(0xffcc44, 0.3);
    g.fillEllipse(lanX, lanY + 18, 18, 8); // glow on table

    // Round spectacles (tiny circles)
    const specX = tableX + 18;
    const specY = tableY + 14;
    g.lineStyle(1, 0x8b6914, 1);
    g.strokeCircle(specX - 4, specY, 4);
    g.strokeCircle(specX + 4, specY, 4);
    g.lineBetween(specX, specY, specX, specY); // bridge line

    // Small scroll/parchment note
    const scrollX = tableX + tableW - 12;
    const scrollY = tableY + 14;
    g.fillStyle(0xf5deb3, 1);
    g.fillRect(scrollX - 6, scrollY - 2, 12, 8);
    g.fillStyle(0xe0c89a, 1);
    g.fillRect(scrollX - 6, scrollY - 2, 12, 2);
    g.fillRect(scrollX - 6, scrollY + 4, 12, 2);

    // ── RIGHT-CENTER: CORK NOTICE BOARD ──────────────────────────────────
    const cbX = 462;
    const cbY = 98;
    const cbW = 60;
    const cbH = 55;

    // Board wooden frame
    g.fillStyle(0x8b5e3c, 1);
    g.fillRect(cbX - 4, cbY - 4, cbW + 8, cbH + 8);
    // Cork surface
    g.fillStyle(0xcc9966, 1);
    g.fillRect(cbX, cbY, cbW, cbH);
    // Cork texture dots
    g.fillStyle(0xbb8855, 0.45);
    for (let cx3 = cbX + 5; cx3 < cbX + cbW - 3; cx3 += 8) {
      for (let cy3 = cbY + 5; cy3 < cbY + cbH - 3; cy3 += 8) {
        g.fillRect(cx3, cy3, 2, 2);
      }
    }

    // 5 small flashcard notes on cork board
    const cardData = [
      { x: cbX + 4, y: cbY + 4, w: 18, h: 14, color: 0xffeb3b },
      { x: cbX + 28, y: cbY + 6, w: 16, h: 12, color: 0x90caf9 },
      { x: cbX + 6, y: cbY + 24, w: 18, h: 14, color: 0xa5d6a7 },
      { x: cbX + 28, y: cbY + 24, w: 16, h: 14, color: 0xffcc80 },
      { x: cbX + 14, y: cbY + 42, w: 20, h: 10, color: 0xce93d8 },
    ];
    for (const card of cardData) {
      g.fillStyle(card.color, 0.92);
      g.fillRect(card.x, card.y, card.w, card.h);
      // Pin
      g.fillStyle(0xcc3333, 1);
      g.fillCircle(card.x + card.w / 2, card.y + 2, 2);
      // Lines
      g.lineStyle(1, 0x00000033, 0.5);
      g.lineBetween(card.x + 3, card.y + 6, card.x + card.w - 3, card.y + 6);
      if (card.h > 10) {
        g.lineBetween(
          card.x + 3,
          card.y + 10,
          card.x + card.w - 3,
          card.y + 10,
        );
      }
    }

    // Small wooden study desk below cork board
    const sdX = 454;
    const sdY = 268;
    const sdW = 62;
    const sdH = 18;

    // Desk shadow
    g.fillStyle(0x000000, 0.1);
    g.fillRect(sdX + 3, sdY + sdH + 2, sdW, 5);
    // Desk surface
    g.fillStyle(0x8b5e3c, 1);
    g.fillRect(sdX, sdY, sdW, sdH);
    g.fillStyle(0xaa7448, 1);
    g.fillRect(sdX + 2, sdY, sdW - 4, 6);
    // Desk legs
    g.fillStyle(0x5c3317, 1);
    g.fillRect(sdX + 5, sdY + sdH, 6, 12);
    g.fillRect(sdX + sdW - 11, sdY + sdH, 6, 12);

    // Flashcards stack on desk (3 small white rects fanned)
    for (let fc = 2; fc >= 0; fc--) {
      g.fillStyle(fc === 0 ? 0xffffff : 0xf5f5ea, 1);
      g.fillRect(sdX + 8 + fc * 3, sdY - 10 + fc * 2, 28, 14);
      // Lines on top card
      if (fc === 0) {
        g.lineStyle(1, 0xccccbb, 0.5);
        g.lineBetween(sdX + 11, sdY - 7, sdX + 33, sdY - 7);
        g.lineBetween(sdX + 11, sdY - 3, sdX + 33, sdY - 3);
      }
    }

    // ── LOWER-CENTER: PLUSH READING ARMCHAIR (on rug) ─────────────────────
    const acX = 148;
    const acY = 300;

    // Armchair shadow
    g.fillStyle(0x000000, 0.12);
    g.fillEllipse(acX + 25, acY + 42, 50, 8);

    // Armchair body — deep purple velvet
    g.fillStyle(0x4a0080, 1);
    g.fillRect(acX, acY + 12, 50, 28); // seat
    // Seat cushion highlight
    g.fillStyle(0x5a1090, 1);
    g.fillRect(acX + 2, acY + 13, 46, 8);
    g.fillStyle(0x3a0060, 1);
    g.fillRect(acX + 2, acY + 10, 46, 14); // seat front edge shadow

    // Chair back rest (taller)
    g.fillStyle(0x4a0080, 1);
    g.fillRect(acX + 4, acY - 20, 42, 34);
    g.fillStyle(0x5a1090, 1);
    g.fillRect(acX + 6, acY - 18, 38, 8); // back highlight
    g.fillStyle(0x3a0060, 0.7);
    g.fillRect(acX + 4, acY, 42, 12); // shadow at seat/back join

    // Armrests
    g.fillStyle(0x3a0060, 1);
    g.fillRect(acX, acY - 4, 8, 36); // left armrest
    g.fillRect(acX + 42, acY - 4, 8, 36); // right armrest
    g.fillStyle(0x5a1090, 1);
    g.fillRect(acX, acY - 4, 8, 6); // armrest tops
    g.fillRect(acX + 42, acY - 4, 8, 6);

    // Chair legs
    g.fillStyle(0x5c3317, 1);
    g.fillRect(acX + 4, acY + 38, 8, 8);
    g.fillRect(acX + 38, acY + 38, 8, 8);

    // Small side table beside armchair
    const stX = acX + 56;
    const stY = acY + 10;
    const stW = 30;
    const stH = 14;
    g.fillStyle(0x000000, 0.08);
    g.fillRect(stX + 2, stY + stH + 2, stW, 4);
    g.fillStyle(0x8b5e3c, 1);
    g.fillRect(stX, stY, stW, stH);
    g.fillStyle(0xa87040, 1);
    g.fillRect(stX + 2, stY, stW - 4, 5);
    // Table legs
    g.fillStyle(0x5c3317, 1);
    g.fillRect(stX + 3, stY + stH, 5, 10);
    g.fillRect(stX + stW - 8, stY + stH, 5, 10);
    // Tea cup on side table
    const tcX = stX + stW / 2;
    const tcY = stY - 8;
    // Saucer
    g.fillStyle(0xd4a843, 1);
    g.fillEllipse(tcX, tcY + 8, 14, 5);
    // Cup
    g.fillStyle(0xf5f5f5, 1);
    g.fillRect(tcX - 5, tcY, 10, 9);
    g.fillStyle(0xe8e8e8, 1);
    g.fillRect(tcX - 4, tcY, 8, 3);
    // Cup handle
    g.lineStyle(1.5, 0xd0d0d0, 1);
    g.strokeCircle(tcX + 6, tcY + 5, 3);
    // Steam
    g.lineStyle(1, 0xcccccc, 0.45);
    g.lineBetween(tcX - 1, tcY - 2, tcX - 3, tcY - 6);
    g.lineBetween(tcX + 2, tcY - 3, tcX + 4, tcY - 7);

    // Floor lamp beside armchair
    const flpX = acX - 18;
    const flpBaseY = acY + 40;
    // Pole
    g.lineStyle(2, 0xd4a843, 1);
    g.lineBetween(flpX, flpBaseY, flpX, flpBaseY - 52);
    // Base
    g.fillStyle(0xd4a843, 1);
    g.fillRect(flpX - 7, flpBaseY, 14, 4);
    g.fillRect(flpX - 5, flpBaseY + 4, 10, 2);
    // Lamp shade (cone/triangle — amber)
    g.fillStyle(0xd4aa6a, 1);
    g.fillTriangle(
      flpX - 12,
      flpBaseY - 54,
      flpX + 12,
      flpBaseY - 54,
      flpX,
      flpBaseY - 46,
    );
    // Warm glow beneath shade
    g.fillStyle(0xffcc44, 0.18);
    g.fillEllipse(flpX, flpBaseY - 44, 28, 14);

    // ── ROOM TITLE ────────────────────────────────────────────────────────
    const studyHallTitle = this.add
      .text(w / 2, 16, "✦ STUDY HALL ✦", {
        fontFamily: FONT,
        fontSize: "18px",
        color: "#ffd060",
        stroke: "#000000",
        strokeThickness: 2,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(5);
    studyHallTitle.setResolution(window.devicePixelRatio || 1);

    // ── CUSTOM NPC: PROF. SAGE ─────────────────────────────────────────────
    const sageX = 295;
    const sageY = 265;
    const sg = this.add.graphics();
    sg.setDepth(42);

    // Shadow
    sg.fillStyle(0x000000, 0.2);
    sg.fillEllipse(sageX, sageY + 16, 20, 6);

    // Legs — very dark green trousers
    sg.fillStyle(0x1a2a1a, 1);
    sg.fillRect(sageX - 6, sageY + 4, 5, 12);
    sg.fillRect(sageX + 1, sageY + 4, 5, 12);

    // Shoes — warm brown
    sg.fillStyle(0x2c1810, 1);
    sg.fillRect(sageX - 7, sageY + 14, 7, 3);
    sg.fillRect(sageX + 1, sageY + 14, 7, 3);

    // Body — deep navy/indigo academic robe
    sg.fillStyle(0x2d3d6b, 1);
    sg.fillRect(sageX - 8, sageY - 10, 16, 16);
    // Elbow patches (lighter tweed patches)
    sg.fillStyle(0x4a5080, 1);
    sg.fillRect(sageX - 12, sageY - 7, 4, 6); // left elbow
    sg.fillRect(sageX + 8, sageY - 7, 4, 6); // right elbow

    // Arms
    sg.fillStyle(0x2d3d6b, 1);
    sg.fillRect(sageX - 12, sageY - 9, 4, 10);
    sg.fillRect(sageX + 8, sageY - 9, 4, 10);

    // Hands (holding tiny open book)
    sg.fillStyle(0xffcc80, 1);
    sg.fillRect(sageX - 12, sageY - 1, 4, 4);
    sg.fillRect(sageX + 8, sageY - 1, 4, 4);

    // Tiny open book held at waist
    sg.fillStyle(0x8b5e3c, 1);
    sg.fillRect(sageX - 5, sageY - 2, 4, 6); // left page cover
    sg.fillStyle(0xfff8e7, 1);
    sg.fillRect(sageX - 4, sageY - 1, 4, 5); // left page
    sg.fillStyle(0xf5eed8, 1);
    sg.fillRect(sageX + 1, sageY - 1, 4, 5); // right page
    sg.lineStyle(1, 0x5c3317, 0.8);
    sg.lineBetween(sageX, sageY - 1, sageX, sageY + 4); // spine
    sg.fillStyle(0x8b5e3c, 1);
    sg.fillRect(sageX + 1, sageY - 2, 4, 6); // right page cover

    // Head
    sg.fillStyle(0xffcc80, 1);
    sg.fillRect(sageX - 6, sageY - 22, 12, 12);

    // Hair — silver/grey distinguished professor
    sg.fillStyle(0xd4d4d4, 1);
    sg.fillRect(sageX - 7, sageY - 24, 14, 6);
    sg.fillRect(sageX - 6, sageY - 22, 3, 4);
    sg.fillRect(sageX + 3, sageY - 22, 3, 4);
    // Slight side-part texture
    sg.fillStyle(0xc0c0c0, 0.5);
    sg.fillRect(sageX - 1, sageY - 24, 2, 5);

    // Small round spectacles — gold frames
    sg.lineStyle(1, 0x8b6914, 1);
    sg.strokeRect(sageX - 5, sageY - 16, 4, 3);
    sg.strokeRect(sageX + 1, sageY - 16, 4, 3);
    sg.lineBetween(sageX - 1, sageY - 15, sageX + 1, sageY - 15); // bridge

    // Eyes (behind spectacles — small dots)
    sg.fillStyle(0x000000, 1);
    sg.fillRect(sageX - 4, sageY - 16, 2, 2);
    sg.fillRect(sageX + 2, sageY - 16, 2, 2);

    // Glow ring — warm amber/gold
    sg.lineStyle(1.5, 0xd4a843, 0.3);
    sg.strokeCircle(sageX, sageY, 26);

    // Prof. Sage name label
    const sageLabel = this.add
      .text(sageX, sageY - 42, "Prof. Sage", {
        fontFamily: FONT,
        fontSize: "16px",
        color: "#ffffff",
        backgroundColor: "#000000cc",
        padding: { x: 6, y: 4 },
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(44);
    sageLabel.setResolution(window.devicePixelRatio || 1);

    // Float animation for Prof. Sage
    this.tweens.add({
      targets: sg,
      y: "-=4",
      duration: 1200,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });

    // ── EXIT DOOR ─────────────────────────────────────────────────────────
    this.drawExitDoor(g, 0x5c3317, 0x7a4a22, 0xd4a843);

    g.setDepth(2);
  }
}
