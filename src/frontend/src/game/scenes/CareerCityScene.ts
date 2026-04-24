import Phaser from "phaser";
import { NPC } from "../entities/NPC";
import { Player } from "../entities/Player";
import { musicManager } from "../managers/MusicManager";
import {
  COLORS,
  GAME_EVENTS,
  MAP_HEIGHT,
  MAP_WIDTH,
  MUSIC_TRACKS,
  type NPCKey,
  NPC_CONFIGS,
  SCENE_KEYS,
} from "../utils/Constants";

const FONT = "Orbitron, sans-serif";

interface PropPlacement {
  type:
    | "lamp"
    | "tree"
    | "bench"
    | "mailbox"
    | "barrel"
    | "bush"
    | "flowers"
    | "fountain"
    | "signpost";
  x: number;
  y: number;
  flipX?: boolean;
  label?: string;
}

// Atlas source regions (x, y, w, h) within "prop-atlas" texture
const PROP_REGIONS: Record<string, [number, number, number, number]> = {
  lamp: [2, 0, 32, 64],
  tree: [42, 0, 32, 64],
  bench: [84, 0, 32, 20],
  mailbox: [124, 0, 24, 32],
  barrel: [2, 68, 20, 24],
  bush: [30, 72, 20, 16],
  flowers: [58, 76, 16, 12],
  fountain: [82, 70, 48, 48],
};

// Map NPC key to interior scene key
const NPC_SCENE_MAP: Partial<Record<NPCKey, string>> = {
  "resume-tailor": SCENE_KEYS.RESUME_TAILOR,
  "cover-letter": SCENE_KEYS.COVER_LETTER,
  "interview-coach": SCENE_KEYS.INTERVIEW_COACH,
  "job-analyzer": SCENE_KEYS.JOB_ANALYZER,
  "study-hall": SCENE_KEYS.STUDY_HALL,
};

export class CareerCityScene extends Phaser.Scene {
  private player!: Player;
  private npcs: NPC[] = [];
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    E: Phaser.Input.Keyboard.Key;
  };
  private nearbyNPC: NPC | null = null;
  private dialogueBubble?: Phaser.GameObjects.Container;
  private isDialogueOpen = false;

  constructor() {
    super({ key: SCENE_KEYS.CAREER_CITY });
  }

  create(): void {
    this.physics.world.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);

    this.buildTerrain();
    this.buildWorldBorder();
    this.placeProps();
    this.addDistrictLabels();
    this.spawnPlayer();
    this.spawnNPCs();
    this.setupCamera();
    this.setupInput();
    this.setupTouchEvents();
    this.addScanlineOverlay();

    // Hook Phaser's wake event — fires when scene.wake() is called from an interior
    this.events.on(
      "wake",
      (
        _sys: Phaser.Scenes.Systems,
        data: { exitX?: number; exitY?: number } | undefined,
      ) => {
        this.handleWake(data);
      },
    );

    // Start overworld music (will be gated by AudioContext until user gesture)
    musicManager.init();
    musicManager.crossFadeTo(MUSIC_TRACKS.CAREER_CITY.key);

    // Resume AudioContext on first player gesture (browser autoplay policy)
    this.input.once("pointerdown", () =>
      musicManager.resumeAudioContextAndPlay(),
    );
    this.input.keyboard?.once("keydown", () =>
      musicManager.resumeAudioContextAndPlay(),
    );

    window.addEventListener(
      GAME_EVENTS.FAST_TRAVEL,
      this.handleFastTravel as EventListener,
    );

    // Fallback: interior:exit event when scene wasn't sleeping
    window.addEventListener(
      GAME_EVENTS.INTERIOR_EXIT,
      this.handleInteriorExit as EventListener,
    );
  }

  /** Called by Phaser wake event when returning from an interior scene */
  private handleWake(
    data: { exitX?: number; exitY?: number } | undefined,
  ): void {
    // Reposition player to just outside the building entrance
    if (data?.exitX !== undefined && data?.exitY !== undefined) {
      this.player.setPosition(data.exitX, data.exitY);
    } else {
      // Fallback: center of map
      this.player.setPosition(MAP_WIDTH / 2, MAP_HEIGHT / 2);
    }

    // Re-enable physics and input
    if (this.player.body) {
      (this.player.body as Phaser.Physics.Arcade.Body).setVelocity(0, 0);
    }

    // Restore camera bounds (they may have been altered)
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);

    // Fade back in
    this.cameras.main.fadeIn(350, 0, 0, 0);

    // Resume town music
    musicManager.crossFadeTo(MUSIC_TRACKS.CAREER_CITY.key);
  }

  // ── TERRAIN ─────────────────────────────────────────────────────────────────

  private buildTerrain(): void {
    // Sky background
    this.add.image(0, 0, "sky-bg").setOrigin(0, 0).setDepth(0);

    // Draw terrain via a single large RenderTexture
    const rt = this.add.renderTexture(0, 0, MAP_WIDTH, MAP_HEIGHT);
    rt.setDepth(1);
    rt.setOrigin(0, 0);

    const tileSz = 16;

    // Grass — tile the grass-tile image over all non-path, non-plaza areas
    for (let ty = 0; ty < MAP_HEIGHT; ty += tileSz) {
      for (let tx = 0; tx < MAP_WIDTH; tx += tileSz) {
        if (!this.isPathOrPlaza(tx + tileSz / 2, ty + tileSz / 2)) {
          rt.drawFrame("grass-tile", undefined, tx, ty);
        }
      }
    }

    // Dirt paths
    const pathZones = this.getPathZones();
    for (const zone of pathZones) {
      for (let ty = zone.y; ty < zone.y + zone.h; ty += tileSz) {
        for (let tx = zone.x; tx < zone.x + zone.w; tx += tileSz) {
          rt.drawFrame("dirt-tile", undefined, tx, ty);
        }
      }
    }

    // Stone plaza
    const cx = MAP_WIDTH / 2;
    const cy = MAP_HEIGHT / 2;
    const plaHalf = 200;
    for (let ty = cy - plaHalf; ty < cy + plaHalf; ty += tileSz) {
      for (let tx = cx - plaHalf; tx < cx + plaHalf; tx += tileSz) {
        rt.drawFrame("stone-tile", undefined, tx, ty);
      }
    }

    // Draw path border lines via graphics on top of RT
    const pg = this.make.graphics({ x: 0, y: 0 });
    pg.lineStyle(2, COLORS.DIRT_DARK, 0.6);
    pg.lineBetween(0, cy - 48, MAP_WIDTH, cy - 48);
    pg.lineBetween(0, cy + 48, MAP_WIDTH, cy + 48);
    pg.lineBetween(cx - 48, 0, cx - 48, MAP_HEIGHT);
    pg.lineBetween(cx + 48, 0, cx + 48, MAP_HEIGHT);
    pg.lineStyle(3, COLORS.STONE_GROUT, 0.8);
    pg.strokeRect(cx - plaHalf, cy - plaHalf, plaHalf * 2, plaHalf * 2);
    rt.draw(pg, 0, 0);
    pg.destroy();
  }

  private getPathZones(): { x: number; y: number; w: number; h: number }[] {
    const cx = MAP_WIDTH / 2;
    const cy = MAP_HEIGHT / 2;
    return [
      // Main horizontal path
      { x: 0, y: cy - 48, w: MAP_WIDTH, h: 96 },
      // Main vertical path
      { x: cx - 48, y: 0, w: 96, h: MAP_HEIGHT },
      // East paths to NPC buildings
      { x: cx + 48, y: 210, w: 450, h: 48 },
      { x: cx + 48, y: 460, w: 450, h: 48 },
      // North path to study hall
      { x: 720, y: 80, w: 160, h: cy - 48 - 80 },
      // West path to interview coach
      { x: 220, y: 330, w: cx - 48 - 220, h: 48 },
      // South path to cover letter
      { x: 360, y: cy + 48, w: 160, h: 850 - (cy + 48) },
    ];
  }

  private isPathOrPlaza(x: number, y: number): boolean {
    const cx = MAP_WIDTH / 2;
    const cy = MAP_HEIGHT / 2;
    const inHPath = Math.abs(y - cy) < 48;
    const inVPath = Math.abs(x - cx) < 48;
    const inPlaza = Math.abs(x - cx) < 200 && Math.abs(y - cy) < 200;
    return inHPath || inVPath || inPlaza;
  }

  // ── WORLD BORDER ─────────────────────────────────────────────────────────────

  private buildWorldBorder(): void {
    const border = this.add.graphics();
    border.lineStyle(5, COLORS.NEON_GREEN, 0.7);
    border.strokeRect(2, 2, MAP_WIDTH - 4, MAP_HEIGHT - 4);
    border.lineStyle(2, COLORS.NEON_GREEN, 0.25);
    border.strokeRect(10, 10, MAP_WIDTH - 20, MAP_HEIGHT - 20);
    border.setDepth(25);
  }

  // ── PROP PLACEMENT ───────────────────────────────────────────────────────────

  private placeProps(): void {
    const props: PropPlacement[] = [
      // Lamp posts along plaza and main paths
      { type: "lamp", x: 596, y: 400 },
      { type: "lamp", x: 1000, y: 400 },
      { type: "lamp", x: 596, y: 800 },
      { type: "lamp", x: 1000, y: 800 },
      { type: "lamp", x: 300, y: 580 },
      { type: "lamp", x: 300, y: 680 },
      { type: "lamp", x: 820, y: 135 },
      { type: "lamp", x: 820, y: 545 },
      // Trees in park area (north) and corners
      { type: "tree", x: 100, y: 100 },
      { type: "tree", x: 200, y: 130 },
      { type: "tree", x: 160, y: 200 },
      { type: "tree", x: 980, y: 100 },
      { type: "tree", x: 1080, y: 150 },
      { type: "tree", x: 1050, y: 80 },
      { type: "tree", x: 100, y: 1050 },
      { type: "tree", x: 180, y: 1080 },
      // Benches near fountain
      { type: "bench", x: 640, y: 575 },
      { type: "bench", x: 960, y: 575 },
      { type: "bench", x: 800, y: 445 },
      { type: "bench", x: 800, y: 755 },
      // Mailboxes
      { type: "mailbox", x: 520, y: 880 },
      { type: "mailbox", x: 380, y: 880 },
      { type: "mailbox", x: 1350, y: 420 },
      // Barrels near buildings
      { type: "barrel", x: 1060, y: 365 },
      { type: "barrel", x: 1080, y: 375 },
      { type: "barrel", x: 1060, y: 615 },
      { type: "barrel", x: 1080, y: 625 },
      // Bushes
      { type: "bush", x: 555, y: 355 },
      { type: "bush", x: 580, y: 340 },
      { type: "bush", x: 1010, y: 355 },
      { type: "bush", x: 1040, y: 340 },
      { type: "bush", x: 200, y: 455 },
      { type: "bush", x: 230, y: 465 },
      { type: "bush", x: 555, y: 855 },
      { type: "bush", x: 580, y: 870 },
      { type: "bush", x: 1350, y: 205 },
      { type: "bush", x: 1380, y: 185 },
      // Flower patches
      { type: "flowers", x: 650, y: 415 },
      { type: "flowers", x: 950, y: 415 },
      { type: "flowers", x: 650, y: 790 },
      { type: "flowers", x: 950, y: 790 },
      { type: "flowers", x: 440, y: 915 },
      { type: "flowers", x: 700, y: 145 },
      // Fountain in center plaza
      { type: "fountain", x: 800, y: 625 },
      // Signposts
      { type: "signpost", x: 700, y: 430, label: "CAREER CITY" },
      { type: "signpost", x: 1100, y: 430, label: "BUSINESS DISTRICT" },
      { type: "signpost", x: 480, y: 430, label: "WEST QUARTER" },
      { type: "signpost", x: 700, y: 820, label: "SERVICE LANE" },
    ];

    for (const prop of props) {
      this.placeProp(prop);
    }

    // Border fences along edges
    for (let fx = 32; fx < MAP_WIDTH - 32; fx += 32) {
      this.drawFenceSegment(fx, 18, false);
      this.drawFenceSegment(fx, MAP_HEIGHT - 36, false);
    }
    for (let fy = 48; fy < MAP_HEIGHT - 32; fy += 32) {
      this.drawFenceSegment(18, fy, true);
      this.drawFenceSegment(MAP_WIDTH - 50, fy, true);
    }
  }

  private placeProp(prop: PropPlacement): void {
    if (prop.type === "signpost") {
      this.drawSignpost(prop.x, prop.y, prop.label ?? "");
      return;
    }

    const reg = PROP_REGIONS[prop.type];
    if (!reg) return;
    const [sx, sy, sw, sh] = reg;

    // Slice the atlas into a canvas and add as a unique texture
    const atlasCanvas = this.textures
      .get("prop-atlas")
      .getSourceImage() as HTMLCanvasElement;
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(atlasCanvas, sx, sy, sw, sh, 0, 0, sw, sh);

    const texKey = `prop-${prop.type}-${prop.x}-${prop.y}`;
    if (!this.textures.exists(texKey)) {
      this.textures.addCanvas(texKey, canvas);
    }

    const img = this.add.image(prop.x, prop.y, texKey);
    img.setOrigin(0.5, 1);
    img.setDepth(prop.y * 0.01 + 3);
    if (prop.flipX) img.setFlipX(true);
  }

  private drawFenceSegment(x: number, y: number, vertical: boolean): void {
    const g = this.add.graphics();
    g.setDepth(2);
    if (vertical) {
      g.fillStyle(COLORS.FENCE_WOOD, 1);
      g.fillRect(x, y, 3, 32);
      g.fillRect(x, y + 6, 16, 3);
      g.fillRect(x, y + 18, 16, 3);
    } else {
      g.fillStyle(COLORS.FENCE_WOOD, 1);
      g.fillRect(x, y, 32, 3);
      g.fillRect(x + 6, y, 3, 18);
      g.fillRect(x + 18, y, 3, 18);
    }
  }

  private drawSignpost(x: number, y: number, label: string): void {
    const g = this.add.graphics();
    g.fillStyle(0x757575, 1);
    g.fillRect(x - 1, y - 24, 3, 24);
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(x - 40, y - 44, 80, 18);
    g.lineStyle(2, COLORS.NEON_GREEN, 0.6);
    g.strokeRect(x - 40, y - 44, 80, 18);
    g.setDepth(3);

    this.add
      .text(x, y - 35, label, {
        fontFamily: FONT,
        fontSize: "9px",
        color: "#39ff14",
        align: "center",
        stroke: "#000000",
        strokeThickness: 2,
      })
      .setOrigin(0.5, 0.5)
      .setDepth(4);
  }

  // ── DISTRICT LABELS ──────────────────────────────────────────────────────────

  private addDistrictLabels(): void {
    this.add
      .text(MAP_WIDTH / 2, 38, "✦ CAREER CITY ✦", {
        fontFamily: FONT,
        fontSize: "20px",
        color: "#39ff14",
        stroke: "#000000",
        strokeThickness: 5,
        fontStyle: "bold",
      })
      .setOrigin(0.5, 0.5)
      .setDepth(22);

    const districts = [
      { x: 300, y: 70, text: "PARK\nDISTRICT", color: "#56c25e" },
      { x: 1260, y: 70, text: "BUSINESS\nDISTRICT", color: "#39ff14" },
      { x: 180, y: 350, text: "WEST\nQUARTER", color: "#ffbf00" },
      { x: 450, y: 1050, text: "SERVICE\nLANE", color: "#00ffff" },
    ];

    for (const d of districts) {
      this.add
        .text(d.x, d.y, d.text, {
          fontFamily: FONT,
          fontSize: "12px",
          color: d.color,
          align: "center",
          stroke: "#000000",
          strokeThickness: 3,
          lineSpacing: 4,
          fontStyle: "bold",
        })
        .setOrigin(0.5, 0.5)
        .setDepth(4)
        .setAlpha(0.85);
    }
  }

  // ── PLAYER & NPCS ────────────────────────────────────────────────────────────

  private spawnPlayer(): void {
    this.player = new Player(this, MAP_WIDTH / 2, MAP_HEIGHT / 2);
  }

  private spawnNPCs(): void {
    for (const config of NPC_CONFIGS) {
      const npc = new NPC(this, config);
      this.npcs.push(npc);
    }
  }

  // ── CAMERA ────────────────────────────────────────────────────────────────────

  setupCamera(): void {
    this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
    this.cameras.main.startFollow(this.player, true, 0.09, 0.09);
    const isMobile = this.scale.width < 768;
    this.cameras.main.setZoom(isMobile ? 0.75 : 1.0);
  }

  // ── INPUT ─────────────────────────────────────────────────────────────────────

  setupInput(): void {
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = this.input.keyboard!.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      E: Phaser.Input.Keyboard.KeyCodes.E,
    }) as typeof this.wasdKeys;

    this.input.keyboard!.on("keydown-E", () => this.tryInteract());
    this.input.keyboard!.on("keydown-ENTER", () => this.tryInteract());
    this.input.keyboard!.on("keydown-SPACE", () => this.tryInteract());
  }

  private setupTouchEvents(): void {
    window.addEventListener("game:move", (e: Event) => {
      const { direction, pressed } = (e as CustomEvent).detail as {
        direction: string;
        pressed: boolean;
      };
      if (direction === "up") this.player.setMoveUp(pressed);
      if (direction === "down") this.player.setMoveDown(pressed);
      if (direction === "left") this.player.setMoveLeft(pressed);
      if (direction === "right") this.player.setMoveRight(pressed);
    });
    window.addEventListener("game:interact", () => this.tryInteract());
  }

  private addScanlineOverlay(): void {
    const g = this.add.graphics();
    g.setDepth(100);
    g.setScrollFactor(0);
    const { width, height } = this.scale;
    for (let y = 0; y < height; y += 4) {
      g.fillStyle(0x000000, 0.05);
      g.fillRect(0, y, width, 2);
    }
  }

  // ── INTERACTION ───────────────────────────────────────────────────────────────

  private tryInteract(): void {
    if (this.isDialogueOpen) {
      this.closeDialogue();
      return;
    }
    if (this.nearbyNPC) {
      this.openDialogue(this.nearbyNPC);
    }
  }

  private openDialogue(npc: NPC): void {
    this.isDialogueOpen = true;
    npc.playInteractAnimation();
    const dialogue = npc.getNextDialogue();

    this.showDialogueBubble(npc, dialogue);

    // Go straight to interior scene after brief dialogue — NO modal
    const sceneKey = NPC_SCENE_MAP[npc.config.key];
    if (sceneKey) {
      this.time.delayedCall(600, () => {
        this.closeDialogue();
        this.cameras.main.fadeOut(400, 0, 0, 0);
        this.time.delayedCall(420, () => {
          // Use sleep (not pause) so the wake event fires correctly on return
          this.scene.sleep(SCENE_KEYS.CAREER_CITY);
          this.scene.launch(sceneKey, {
            fromScene: SCENE_KEYS.CAREER_CITY,
            exitX: npc.x,
            exitY: npc.y + 90,
          });
          // Award XP for visiting a building
          window.dispatchEvent(
            new CustomEvent(GAME_EVENTS.XP_GAINED, {
              detail: { amount: 10, reason: "Visited Building" },
            }),
          );
        });
      });
    }
  }

  private showDialogueBubble(npc: NPC, text: string): void {
    if (this.dialogueBubble) this.dialogueBubble.destroy();

    const bubbleW = 230;
    const bubbleH = 76;
    const colorHex = `#${npc.config.color.toString(16).padStart(6, "0")}`;

    const bg = this.add.rectangle(0, 0, bubbleW, bubbleH, 0x000000, 0.96);
    bg.setStrokeStyle(3, npc.config.color, 1);

    const txt = this.add.text(0, -4, text.split("\n"), {
      fontFamily: FONT,
      fontSize: "11px",
      color: colorHex,
      align: "center",
      lineSpacing: 6,
      wordWrap: { width: bubbleW - 20 },
    });
    txt.setOrigin(0.5, 0.5);

    const tail = this.add.triangle(
      0,
      bubbleH / 2 + 7,
      -7,
      0,
      7,
      0,
      0,
      12,
      npc.config.color,
      1,
    );
    const c1 = this.add.rectangle(
      -bubbleW / 2 + 2,
      -bubbleH / 2 + 2,
      4,
      4,
      npc.config.color,
      1,
    );
    const c2 = this.add.rectangle(
      bubbleW / 2 - 2,
      -bubbleH / 2 + 2,
      4,
      4,
      npc.config.color,
      1,
    );
    const c3 = this.add.rectangle(
      -bubbleW / 2 + 2,
      bubbleH / 2 - 2,
      4,
      4,
      npc.config.color,
      1,
    );
    const c4 = this.add.rectangle(
      bubbleW / 2 - 2,
      bubbleH / 2 - 2,
      4,
      4,
      npc.config.color,
      1,
    );

    this.dialogueBubble = this.add.container(npc.x, npc.y - 145, [
      bg,
      txt,
      tail,
      c1,
      c2,
      c3,
      c4,
    ]);
    this.dialogueBubble.setDepth(50);

    this.time.delayedCall(3800, () => {
      if (this.dialogueBubble) {
        this.tweens.add({
          targets: this.dialogueBubble,
          alpha: 0,
          duration: 300,
          onComplete: () => {
            this.dialogueBubble?.destroy();
            this.dialogueBubble = undefined;
            this.isDialogueOpen = false;
          },
        });
      }
    });

    this.dialogueBubble.setAlpha(0);
    this.dialogueBubble.setScale(0.8);
    this.tweens.add({
      targets: this.dialogueBubble,
      alpha: 1,
      scaleX: 1,
      scaleY: 1,
      duration: 180,
      ease: "Back.easeOut",
    });
  }

  private closeDialogue(): void {
    this.isDialogueOpen = false;
    if (this.dialogueBubble) {
      this.tweens.add({
        targets: this.dialogueBubble,
        alpha: 0,
        scaleX: 0.8,
        scaleY: 0.8,
        duration: 180,
        onComplete: () => {
          this.dialogueBubble?.destroy();
          this.dialogueBubble = undefined;
        },
      });
    }
  }

  handleFastTravel = (e: Event): void => {
    const detail = (e as CustomEvent).detail as { npcKey: NPCKey };
    const target = NPC_CONFIGS.find((c) => c.key === detail.npcKey);
    if (target) {
      this.cameras.main.flash(200, 0, 0, 0);
      this.time.delayedCall(100, () => {
        this.player.setPosition(target.x, target.y + 90);
        this.cameras.main.pan(target.x, target.y + 90, 400, "Power2");
      });
      window.dispatchEvent(
        new CustomEvent(GAME_EVENTS.XP_GAINED, {
          detail: { amount: 5, reason: "Fast Travel" },
        }),
      );
    }
  };

  handleInteriorExit = (e: Event): void => {
    const { exitX, exitY } = (e as CustomEvent).detail as {
      exitX?: number;
      exitY?: number;
    };
    this.handleWake({ exitX, exitY });
  };

  // ── UPDATE ────────────────────────────────────────────────────────────────────

  update(_time: number, delta: number): void {
    const up = this.cursors.up.isDown || this.wasdKeys.W.isDown;
    const down = this.cursors.down.isDown || this.wasdKeys.S.isDown;
    const left = this.cursors.left.isDown || this.wasdKeys.A.isDown;
    const right = this.cursors.right.isDown || this.wasdKeys.D.isDown;

    this.player.setMoveUp(up);
    this.player.setMoveDown(down);
    this.player.setMoveLeft(left);
    this.player.setMoveRight(right);
    this.player.update(delta);

    // Y-depth sort
    this.player.setDepth(this.player.y * 0.01 + 10);
    for (const npc of this.npcs) {
      npc.setDepth(npc.y * 0.01 + 5);
    }

    // NPC proximity
    let newNearby: NPC | null = null;
    for (const npc of this.npcs) {
      if (npc.checkProximity(this.player.x, this.player.y)) newNearby = npc;
    }

    if (newNearby !== this.nearbyNPC) {
      if (newNearby) {
        window.dispatchEvent(
          new CustomEvent(GAME_EVENTS.NPC_NEARBY, {
            detail: { npc: newNearby.config },
          }),
        );
      } else {
        window.dispatchEvent(new CustomEvent(GAME_EVENTS.NPC_LEAVE));
      }
      this.nearbyNPC = newNearby;
    }
  }

  shutdown(): void {
    window.removeEventListener(
      GAME_EVENTS.FAST_TRAVEL,
      this.handleFastTravel as EventListener,
    );
    window.removeEventListener(
      GAME_EVENTS.INTERIOR_EXIT,
      this.handleInteriorExit as EventListener,
    );
  }
}
