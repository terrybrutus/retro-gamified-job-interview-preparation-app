import Phaser from "phaser";
import { COLORS, MAP_HEIGHT, MAP_WIDTH } from "./Constants";
import type { NPCConfig } from "./Constants";

/**
 * Procedurally generate ALL game textures using Phaser Graphics API.
 * No external image files — everything is drawn pixel by pixel.
 * Textures are generated once at boot and cached by Phaser's texture manager.
 */
export class AssetGenerator {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  generateAll(npcConfigs: NPCConfig[]): void {
    this.generateSkyBackground();
    this.generateGrassTile();
    this.generateDirtTile();
    this.generateStoneTile();
    this.generatePlayerSpritesheet();
    this.generateInteractPrompt();
    for (const npc of npcConfigs) {
      this.generateBuilding(npc);
      this.generateNPCSprite(npc);
    }
    this.generatePropAtlas();
  }

  // ── HELPER: make a transient graphics object (not added to scene) ─────────

  private makeG(): Phaser.GameObjects.Graphics {
    return this.scene.make.graphics({ x: 0, y: 0 });
  }

  // ── SKY BACKGROUND ──────────────────────────────────────────────────────────

  private generateSkyBackground(): void {
    const w = MAP_WIDTH;
    const h = MAP_HEIGHT;
    const g = this.makeG();

    // Gradient sky
    const skyTop = { r: 0x87, gc: 0xce, b: 0xeb };
    const skyBot = { r: 0xe0, gc: 0xf0, b: 0xff };
    const skyH = Math.floor(h * 0.35);
    for (let y = 0; y < skyH; y++) {
      const t = y / skyH;
      const r = Math.round(skyTop.r + (skyBot.r - skyTop.r) * t);
      const gc2 = Math.round(skyTop.gc + (skyBot.gc - skyTop.gc) * t);
      const b = Math.round(skyTop.b + (skyBot.b - skyTop.b) * t);
      g.fillStyle((r << 16) | (gc2 << 8) | b, 1);
      g.fillRect(0, y, w, 1);
    }
    g.fillStyle(0xe0f0ff, 1);
    g.fillRect(0, skyH, w, h - skyH);

    // Mountain silhouettes at horizon
    g.fillStyle(0x546e7a, 0.8);
    const mtnPts: { x: number; y: number }[] = [
      { x: 0, y: skyH },
      { x: 80, y: skyH - 70 },
      { x: 160, y: skyH },
      { x: 200, y: skyH - 90 },
      { x: 310, y: skyH },
      { x: 380, y: skyH - 55 },
      { x: 460, y: skyH },
      { x: 520, y: skyH - 100 },
      { x: 640, y: skyH },
      { x: 700, y: skyH - 60 },
      { x: 800, y: skyH },
      { x: 880, y: skyH - 85 },
      { x: 980, y: skyH },
      { x: 1050, y: skyH - 65 },
      { x: 1150, y: skyH },
      { x: 1240, y: skyH - 95 },
      { x: 1350, y: skyH },
      { x: 1430, y: skyH - 50 },
      { x: 1600, y: skyH },
      { x: 1600, y: skyH + 30 },
      { x: 0, y: skyH + 30 },
    ];
    g.fillPoints(
      mtnPts.map((p) => new Phaser.Geom.Point(p.x, p.y)),
      true,
    );

    // Cloud shapes
    const clouds = [
      { x: 120, y: 35 },
      { x: 420, y: 50 },
      { x: 750, y: 25 },
      { x: 1100, y: 45 },
    ];
    for (const c of clouds) {
      g.fillStyle(0xffffff, 0.85);
      g.fillEllipse(c.x, c.y, 60, 20);
      g.fillEllipse(c.x - 18, c.y + 4, 34, 16);
      g.fillEllipse(c.x + 20, c.y + 4, 38, 16);
      g.fillEllipse(c.x - 8, c.y - 8, 32, 18);
    }

    g.generateTexture("sky-bg", w, h);
    g.destroy();
  }

  // ── TERRAIN TILES ───────────────────────────────────────────────────────────

  generateGrassTile(): void {
    const size = 16;
    const g = this.makeG();
    g.fillStyle(0x4caf50, 1);
    g.fillRect(0, 0, size, size);
    const variants = [0x45a049, 0x56c25e, 0x388e3c, 0x4caf50, 0x3d9142];
    const pattern = [
      [0, 1, 0, 2, 1, 0, 3, 1, 0, 2, 0, 1, 2, 0, 1, 4],
      [1, 0, 2, 0, 1, 3, 0, 1, 2, 0, 1, 0, 3, 1, 0, 2],
      [2, 1, 0, 1, 2, 0, 1, 0, 3, 1, 2, 0, 1, 0, 2, 1],
      [0, 2, 1, 3, 0, 1, 2, 1, 0, 2, 0, 1, 2, 1, 0, 3],
    ];
    for (let py = 0; py < 4; py++) {
      for (let px = 0; px < 16; px++) {
        const vi = pattern[py][px];
        g.fillStyle(variants[vi], 1);
        g.fillRect(px, py * 4, 1, 4);
      }
    }
    g.generateTexture("grass-tile", size, size);
    g.destroy();
  }

  generateDirtTile(): void {
    const size = 16;
    const g = this.makeG();
    g.fillStyle(0xc4a35a, 1);
    g.fillRect(0, 0, size, size);
    const variants = [0xc4a35a, 0xb8936a, 0xcfb06b, 0xad8858, 0xc4a35a];
    for (let py = 0; py < 4; py++) {
      for (let px = 0; px < 4; px++) {
        const vi = (px + py * 3) % 5;
        g.fillStyle(variants[vi], 1);
        g.fillRect(px * 4, py * 4, 4, 4);
      }
    }
    g.generateTexture("dirt-tile", size, size);
    g.destroy();
  }

  generateStoneTile(): void {
    const size = 16;
    const g = this.makeG();
    g.fillStyle(0xcccccc, 1);
    g.fillRect(0, 0, size, size);
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(0, 0, size, 1);
    g.fillRect(0, 0, 1, size);
    g.fillRect(8, 0, 1, size);
    g.fillRect(0, 8, size, 1);
    g.fillStyle(0xc8c8c8, 0.5);
    g.fillRect(1, 1, 7, 7);
    g.fillRect(9, 9, 7, 7);
    g.generateTexture("stone-tile", size, size);
    g.destroy();
  }

  // ── PLAYER SPRITESHEET ──────────────────────────────────────────────────────

  generatePlayerSpritesheet(): void {
    const fw = 24;
    const fh = 32;
    const totalFrames = 16;
    const g = this.makeG();

    for (let dir = 0; dir < 4; dir++) {
      for (let frame = 0; frame < 4; frame++) {
        const fx = (dir * 4 + frame) * fw;
        this.drawPlayerFrame(g, fx, fh, dir, frame);
      }
    }

    g.generateTexture("player-sheet", fw * totalFrames, fh);
    g.destroy();
  }

  private drawPlayerFrame(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    fh: number,
    dir: number,
    frame: number,
  ): void {
    // Shadow
    g.fillStyle(0x000000, 0.25);
    g.fillEllipse(ox + 12, fh - 3, 14, 5);
    // Legs alternating
    const leftFwd = frame === 1;
    const rightFwd = frame === 3;
    g.fillStyle(0x1a237e, 1);
    if (leftFwd) {
      g.fillRect(ox + 7, fh - 12, 4, 10);
      g.fillRect(ox + 13, fh - 8, 4, 6);
    } else if (rightFwd) {
      g.fillRect(ox + 7, fh - 8, 4, 6);
      g.fillRect(ox + 13, fh - 12, 4, 10);
    } else {
      g.fillRect(ox + 7, fh - 10, 4, 8);
      g.fillRect(ox + 13, fh - 10, 4, 8);
    }
    // Shoes
    g.fillStyle(0x222222, 1);
    g.fillRect(ox + 6, fh - 4, 5, 2);
    g.fillRect(ox + 13, fh - 4, 5, 2);
    // Body shirt
    g.fillStyle(0x1565c0, 1);
    g.fillRect(ox + 7, fh - 20, 10, 10);
    // Arms
    g.fillStyle(0x1565c0, 1);
    if (dir === 2 || dir === 3) {
      g.fillRect(ox + 4, fh - 20, 3, 7);
      g.fillRect(ox + 17, fh - 20, 3, 7);
    } else {
      g.fillRect(ox + 4, fh - 19, 3, 6);
      g.fillRect(ox + 17, fh - 19, 3, 6);
    }
    // Hands
    g.fillStyle(0xffcc80, 1);
    g.fillRect(ox + 4, fh - 14, 3, 3);
    g.fillRect(ox + 17, fh - 14, 3, 3);
    // Head
    g.fillStyle(0xffcc80, 1);
    g.fillRect(ox + 8, fh - 30, 8, 9);
    // Hair
    g.fillStyle(0x333333, 1);
    g.fillRect(ox + 7, fh - 31, 10, 4);
    g.fillRect(ox + 7, fh - 30, 2, 3);
    g.fillRect(ox + 15, fh - 30, 2, 3);
    // Eyes
    g.fillStyle(0x111111, 1);
    if (dir === 0 || dir === 1) {
      g.fillRect(ox + 10, fh - 26, 2, 2);
      g.fillRect(ox + 14, fh - 26, 2, 2);
    } else if (dir === 3) {
      g.fillRect(ox + 14, fh - 26, 2, 2);
    } else {
      g.fillRect(ox + 8, fh - 26, 2, 2);
    }
  }

  // ── NPC SPRITES ─────────────────────────────────────────────────────────────

  generateNPCSprite(npc: NPCConfig): void {
    const w = 24;
    const h = 40;
    const g = this.makeG();

    // Frame 0 (shift=0) and Frame 1 (shift=1 for idle bob)
    this.drawNPCByKey(g, 0, 0, h, npc.key);
    this.drawNPCByKey(g, w, 1, h, npc.key);

    g.generateTexture(`npc-${npc.key}`, w * 2, h);
    g.destroy();
  }

  private drawNPCByKey(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    shift: number,
    h: number,
    key: string,
  ): void {
    switch (key) {
      case "job-analyzer":
        this.drawJobAnalyzerNPC(g, ox, shift, h);
        break;
      case "resume-tailor":
        this.drawResumeTailorNPC(g, ox, shift, h);
        break;
      case "cover-letter":
        this.drawCoverLetterNPC(g, ox, shift, h);
        break;
      case "interview-coach":
        this.drawInterviewCoachNPC(g, ox, shift, h);
        break;
      case "study-hall":
        this.drawStudyHallNPC(g, ox, shift, h);
        break;
    }
  }

  private drawJobAnalyzerNPC(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    shift: number,
    h: number,
  ): void {
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(ox + 12, h - 2, 12, 4);
    g.fillStyle(0x1a237e, 1);
    g.fillRect(ox + 8, h - 14, 4, 12);
    g.fillRect(ox + 13, h - 14, 4, 12);
    g.fillStyle(0x111111, 1);
    g.fillRect(ox + 7, h - 4, 5, 2);
    g.fillRect(ox + 13, h - 4, 5, 2);
    g.fillStyle(0x1565c0, 1);
    g.fillRect(ox + 6, h - 28, 13, 14);
    g.fillStyle(0xffffff, 1);
    g.fillRect(ox + 10, h - 28, 5, 5);
    g.fillStyle(0x1565c0, 1);
    g.fillRect(ox + 3, h - 27, 3, 10);
    g.fillRect(ox + 19, h - 27, 3, 10);
    g.fillStyle(0xd4a460, 1);
    g.fillRect(ox + 20, h - 28, 5, 7);
    g.fillStyle(0xffffff, 1);
    g.fillRect(ox + 21, h - 27, 3, 5);
    g.fillStyle(0xffcc80, 1);
    g.fillRect(ox + 8, h - 38 + shift, 9, 10);
    g.fillStyle(0x1a1a1a, 1);
    g.fillRect(ox + 7, h - 39 + shift, 11, 4);
    g.fillStyle(0x000000, 1);
    g.fillRect(ox + 9, h - 34 + shift, 2, 2);
    g.fillRect(ox + 13, h - 34 + shift, 2, 2);
    g.lineStyle(1, 0x111111, 1);
    g.strokeRect(ox + 8, h - 35 + shift, 4, 3);
    g.strokeRect(ox + 12, h - 35 + shift, 4, 3);
    g.fillStyle(0x111111, 1);
    g.fillRect(ox + 12, h - 34 + shift, 1, 1);
  }

  private drawResumeTailorNPC(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    shift: number,
    h: number,
  ): void {
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(ox + 12, h - 2, 12, 4);
    g.fillStyle(0x4a148c, 1);
    g.fillRect(ox + 8, h - 14, 4, 12);
    g.fillRect(ox + 13, h - 14, 4, 12);
    g.fillStyle(0x111111, 1);
    g.fillRect(ox + 7, h - 4, 5, 2);
    g.fillRect(ox + 13, h - 4, 5, 2);
    g.fillStyle(0x6a1b9a, 1);
    g.fillRect(ox + 5, h - 28, 15, 14);
    g.fillStyle(0xffffff, 0.9);
    g.fillRect(ox + 9, h - 28, 7, 2);
    g.fillRect(ox + 9, h - 26, 2, 6);
    g.fillRect(ox + 14, h - 26, 2, 6);
    g.fillStyle(0x6a1b9a, 1);
    g.fillRect(ox + 2, h - 27, 3, 11);
    g.fillRect(ox + 20, h - 27, 3, 11);
    g.fillStyle(0xbdbdbd, 1);
    g.fillRect(ox + 20, h - 20, 4, 2);
    g.fillRect(ox + 21, h - 22, 2, 6);
    g.fillStyle(0xffb74d, 1);
    g.fillRect(ox + 8, h - 38 + shift, 9, 10);
    g.fillStyle(0x4a148c, 1);
    g.fillRect(ox + 7, h - 39 + shift, 11, 4);
    g.fillRect(ox + 7, h - 38 + shift, 2, 3);
    g.fillRect(ox + 16, h - 38 + shift, 2, 3);
    g.fillStyle(0x000000, 1);
    g.fillRect(ox + 9, h - 34 + shift, 2, 2);
    g.fillRect(ox + 13, h - 34 + shift, 2, 2);
  }

  private drawCoverLetterNPC(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    shift: number,
    h: number,
  ): void {
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(ox + 12, h - 2, 12, 4);
    g.fillStyle(0x795548, 1);
    g.fillRect(ox + 8, h - 14, 4, 12);
    g.fillRect(ox + 13, h - 14, 4, 12);
    g.fillStyle(0x111111, 1);
    g.fillRect(ox + 7, h - 4, 5, 2);
    g.fillRect(ox + 13, h - 4, 5, 2);
    g.fillStyle(0xffffff, 1);
    g.fillRect(ox + 6, h - 28, 13, 14);
    g.fillStyle(0x2e7d32, 1);
    g.fillRect(ox + 5, h - 28, 4, 14);
    g.fillRect(ox + 16, h - 28, 4, 14);
    g.fillRect(ox + 5, h - 28, 15, 4);
    g.fillStyle(0xffffff, 1);
    g.fillRect(ox + 20, h - 30, 2, 12);
    g.fillStyle(0xbdbdbd, 1);
    g.fillRect(ox + 19, h - 19, 4, 2);
    g.fillStyle(0xffffff, 1);
    g.fillRect(ox + 2, h - 26, 3, 9);
    g.fillRect(ox + 20, h - 26, 3, 9);
    g.fillStyle(0xffcc80, 1);
    g.fillRect(ox + 8, h - 38 + shift, 9, 10);
    g.fillStyle(0x795548, 1);
    g.fillRect(ox + 7, h - 40 + shift, 11, 5);
    g.fillRect(ox + 6, h - 38 + shift, 3, 5);
    g.fillRect(ox + 16, h - 38 + shift, 3, 5);
    g.lineStyle(1, 0x333333, 1);
    g.strokeCircle(ox + 10, h - 34 + shift, 3);
    g.strokeCircle(ox + 15, h - 34 + shift, 3);
    g.fillStyle(0x333333, 1);
    g.fillRect(ox + 13, h - 35 + shift, 2, 1);
    g.fillStyle(0x000000, 1);
    g.fillRect(ox + 9, h - 35 + shift, 2, 2);
    g.fillRect(ox + 14, h - 35 + shift, 2, 2);
  }

  private drawInterviewCoachNPC(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    shift: number,
    h: number,
  ): void {
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(ox + 12, h - 2, 14, 5);
    g.fillStyle(0xc62828, 1);
    g.fillRect(ox + 7, h - 14, 5, 12);
    g.fillRect(ox + 13, h - 14, 5, 12);
    g.fillStyle(0x111111, 1);
    g.fillRect(ox + 6, h - 4, 6, 2);
    g.fillRect(ox + 13, h - 4, 6, 2);
    g.fillStyle(0xc62828, 1);
    g.fillRect(ox + 4, h - 28, 17, 14);
    g.fillStyle(0xffffff, 1);
    g.fillRect(ox + 4, h - 28, 2, 14);
    g.fillRect(ox + 19, h - 28, 2, 14);
    g.fillStyle(0xc62828, 1);
    g.fillRect(ox + 1, h - 25, 4, 8);
    g.fillRect(ox + 20, h - 25, 4, 8);
    g.fillStyle(0xffcc80, 1);
    g.fillRect(ox + 1, h - 19, 3, 3);
    g.fillRect(ox + 21, h - 19, 3, 3);
    g.fillStyle(0xc62828, 1);
    g.fillRect(ox + 6, h - 22, 13, 3);
    g.fillStyle(0xffffff, 0.7);
    g.fillRect(ox + 10, h - 28, 5, 2);
    g.fillStyle(0xffbf00, 1);
    g.fillCircle(ox + 12, h - 28, 2);
    g.fillStyle(0xffcc80, 1);
    g.fillRect(ox + 7, h - 38 + shift, 11, 10);
    g.fillStyle(0x222222, 1);
    g.fillRect(ox + 7, h - 40 + shift, 11, 4);
    g.fillRect(ox + 6, h - 39 + shift, 2, 4);
    g.fillRect(ox + 18, h - 39 + shift, 2, 4);
    g.fillStyle(0x000000, 1);
    g.fillRect(ox + 9, h - 34 + shift, 3, 2);
    g.fillRect(ox + 14, h - 34 + shift, 3, 2);
    g.fillStyle(0xf0a060, 1);
    g.fillRect(ox + 7, h - 30 + shift, 11, 2);
  }

  private drawStudyHallNPC(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    shift: number,
    h: number,
  ): void {
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(ox + 12, h - 2, 14, 5);
    g.fillStyle(0x4e342e, 1);
    g.fillRect(ox + 4, h - 28, 17, 26);
    g.fillRect(ox + 3, h - 20, 19, 18);
    g.fillStyle(0x4e342e, 1);
    g.fillRect(ox + 0, h - 26, 4, 14);
    g.fillRect(ox + 21, h - 26, 4, 14);
    g.fillStyle(0xffcc80, 1);
    g.fillRect(ox + 0, h - 14, 4, 4);
    g.fillRect(ox + 21, h - 14, 4, 4);
    g.fillStyle(0x795548, 1);
    g.fillRect(ox + 22, h - 40, 3, 38);
    g.fillStyle(0x00e5ff, 0.9);
    g.fillCircle(ox + 23, h - 42, 5);
    g.fillStyle(0x00e5ff, 0.3);
    g.fillCircle(ox + 23, h - 42, 8);
    g.fillStyle(0x795548, 1);
    g.fillRect(ox - 2, h - 24, 7, 9);
    g.fillStyle(0xfff9c4, 1);
    g.fillRect(ox - 1, h - 23, 5, 7);
    g.fillStyle(0x37474f, 1);
    g.fillRect(ox + 5, h - 28, 15, 6);
    g.fillStyle(0xffcc80, 1);
    g.fillRect(ox + 8, h - 38 + shift, 9, 10);
    // Hat
    g.fillStyle(0x37474f, 1);
    g.fillRect(ox + 6, h - 42 + shift, 13, 5);
    g.fillPoints(
      [
        new Phaser.Geom.Point(ox + 7, h - 42 + shift),
        new Phaser.Geom.Point(ox + 18, h - 42 + shift),
        new Phaser.Geom.Point(ox + 12, h - 52 + shift),
      ],
      true,
    );
    g.fillStyle(0x000000, 1);
    g.fillRect(ox + 9, h - 35 + shift, 2, 2);
    g.fillRect(ox + 13, h - 35 + shift, 2, 2);
    g.fillStyle(0xeeeeee, 1);
    g.fillRect(ox + 8, h - 30 + shift, 9, 2);
    g.fillStyle(0xdddddd, 1);
    g.fillRect(ox + 8, h - 28, 9, 6);
    g.fillRect(ox + 9, h - 22, 7, 6);
    g.fillRect(ox + 10, h - 16, 5, 4);
  }

  // ── BUILDINGS ───────────────────────────────────────────────────────────────

  generateBuilding(npc: NPCConfig): void {
    const w = 120;
    const h = 110;
    const g = this.makeG();

    switch (npc.key) {
      case "job-analyzer":
        this.drawJobAnalyzerBuilding(g, w, h);
        break;
      case "resume-tailor":
        this.drawResumeTailorBuilding(g, w, h);
        break;
      case "cover-letter":
        this.drawCoverLetterBuilding(g, w, h);
        break;
      case "interview-coach":
        this.drawInterviewCoachBuilding(g, w, h);
        break;
      case "study-hall":
        this.drawStudyHallBuilding(g, w, h);
        break;
    }

    g.generateTexture(`building-${npc.key}`, w, h);
    g.destroy();
  }

  private drawBuildingBase(
    g: Phaser.GameObjects.Graphics,
    wallColor: number,
    roofColor: number,
    w: number,
    h: number,
    doorColor: number,
    signColor: number,
    windowColor: number,
  ): void {
    const roofH = 30;
    // Shadow
    g.fillStyle(0x000000, 0.35);
    g.fillRect(4, h - 8, w - 4, 8);
    // Wall
    g.fillStyle(wallColor, 1);
    g.fillRect(0, roofH, w, h - roofH - 4);
    // Wall shading right
    g.fillStyle(0x000000, 0.12);
    g.fillRect(w - 12, roofH, 12, h - roofH - 4);
    // Roof eaves
    g.fillStyle(roofColor, 1);
    g.fillRect(-6, roofH, w + 12, 8);
    // Roof peak triangle
    g.fillPoints(
      [
        new Phaser.Geom.Point(0, roofH),
        new Phaser.Geom.Point(w, roofH),
        new Phaser.Geom.Point(w / 2, 0),
      ],
      true,
    );
    // Roof highlight
    const rHL = Phaser.Display.Color.IntegerToColor(roofColor);
    const hl =
      (Math.min(255, rHL.red + 40) << 16) |
      (Math.min(255, rHL.green + 40) << 8) |
      Math.min(255, rHL.blue + 40);
    g.fillStyle(hl, 1);
    g.fillRect(0, roofH - 1, w, 3);
    // Chimney
    g.fillStyle(wallColor, 1);
    g.fillRect(w - 32, roofH - 14, 10, 16);
    g.fillStyle(0x555555, 1);
    g.fillRect(w - 33, roofH - 14, 12, 3);
    // Windows
    for (let i = 0; i < 3; i++) {
      const wx = 8 + i * 36;
      const wy = roofH + 14;
      g.fillStyle(0x222222, 1);
      g.fillRect(wx - 1, wy - 1, 22, 18);
      g.fillStyle(windowColor, 1);
      g.fillRect(wx, wy, 20, 16);
      g.fillStyle(0xffffff, 0.35);
      g.fillRect(wx + 1, wy + 1, 4, 3);
      g.fillStyle(0x333333, 1);
      g.fillRect(wx + 9, wy, 2, 16);
      g.fillRect(wx, wy + 7, 20, 2);
    }
    // Door
    const doorX = w / 2 - 11;
    const doorY = h - 38;
    g.fillStyle(0x111111, 1);
    g.fillRect(doorX - 1, doorY - 1, 24, 34);
    g.fillStyle(doorColor, 1);
    g.fillRect(doorX, doorY, 22, 32);
    g.fillEllipse(doorX + 11, doorY + 2, 22, 10);
    g.fillStyle(0xffd700, 1);
    g.fillCircle(doorX + 18, doorY + 18, 2);
    g.fillStyle(0x000000, 0.2);
    g.fillRect(doorX + 2, doorY + 6, 8, 12);
    g.fillRect(doorX + 12, doorY + 6, 8, 12);
    // Sign board
    const signX = w / 2 - 40;
    g.fillStyle(signColor, 1);
    g.fillRect(signX, roofH + 2, 80, 14);
    g.lineStyle(1, 0x000000, 0.4);
    g.strokeRect(signX, roofH + 2, 80, 14);
  }

  private drawJobAnalyzerBuilding(
    g: Phaser.GameObjects.Graphics,
    w: number,
    h: number,
  ): void {
    this.drawBuildingBase(
      g,
      COLORS.BLDG_JOB_WALL,
      COLORS.BLDG_JOB_ROOF,
      w,
      h,
      0x1a237e,
      0xffca28,
      0xfff9c4,
    );
    g.fillStyle(0x888888, 1);
    g.fillRect(w / 2 - 1, 0, 2, 12);
    g.fillStyle(0xff0000, 1);
    g.fillCircle(w / 2, 0, 3);
  }

  private drawResumeTailorBuilding(
    g: Phaser.GameObjects.Graphics,
    w: number,
    h: number,
  ): void {
    this.drawBuildingBase(
      g,
      COLORS.BLDG_RESUME_WALL,
      COLORS.BLDG_RESUME_ROOF,
      w,
      h,
      0xb71c1c,
      0xef5350,
      0xbbdefb,
    );
    g.fillStyle(0xb71c1c, 1);
    g.fillRect(w / 2 - 20, h - 44, 40, 8);
    g.fillStyle(0xffffff, 0.3);
    for (let i = 0; i < 5; i++) {
      g.fillRect(w / 2 - 18 + i * 8, h - 44, 4, 8);
    }
  }

  private drawCoverLetterBuilding(
    g: Phaser.GameObjects.Graphics,
    w: number,
    h: number,
  ): void {
    this.drawBuildingBase(
      g,
      COLORS.BLDG_COVER_WALL,
      COLORS.BLDG_COVER_ROOF,
      w,
      h,
      0x1b5e20,
      0xffd600,
      0xfff9c4,
    );
    // Flower boxes
    const roofH = 30;
    g.fillStyle(0x795548, 1);
    for (let i = 0; i < 3; i++) {
      const wx = 8 + i * 36;
      g.fillRect(wx - 1, roofH + 44, 24, 6);
      g.fillStyle(0x4caf50, 1);
      g.fillRect(wx, roofH + 42, 6, 4);
      g.fillRect(wx + 8, roofH + 41, 6, 5);
      g.fillRect(wx + 16, roofH + 42, 6, 4);
      g.fillStyle(0xf44336, 1);
      g.fillCircle(wx + 3, roofH + 42, 2);
      g.fillStyle(0xffeb3b, 1);
      g.fillCircle(wx + 11, roofH + 41, 2);
      g.fillStyle(0xff69b4, 1);
      g.fillCircle(wx + 19, roofH + 42, 2);
      g.fillStyle(0x795548, 1);
    }
  }

  private drawInterviewCoachBuilding(
    g: Phaser.GameObjects.Graphics,
    w: number,
    h: number,
  ): void {
    this.drawBuildingBase(
      g,
      COLORS.BLDG_INTERVIEW_WALL,
      COLORS.BLDG_INTERVIEW_ROOF,
      w,
      h,
      0x4a148c,
      0x80cbc4,
      0xfce4ec,
    );
    g.fillStyle(0xffd700, 1);
    g.fillRect(w / 2 - 5, 50, 10, 12);
    g.fillRect(w / 2 - 8, 58, 16, 3);
    g.fillRect(w / 2 - 3, 62, 6, 4);
    g.fillRect(w / 2 - 8, 66, 16, 2);
  }

  private drawStudyHallBuilding(
    g: Phaser.GameObjects.Graphics,
    w: number,
    h: number,
  ): void {
    this.drawBuildingBase(
      g,
      COLORS.BLDG_STUDY_WALL,
      COLORS.BLDG_STUDY_ROOF,
      w,
      h,
      0x3e2723,
      0x546e7a,
      0xe0f7fa,
    );
    g.fillStyle(0x6d4c41, 1);
    g.fillRect(8, 30, 8, h - 38);
    g.fillRect(w - 16, 30, 8, h - 38);
    g.fillStyle(0x5d4037, 1);
    g.fillRect(10, 30, 4, h - 38);
    g.fillRect(w - 14, 30, 4, h - 38);
    g.fillStyle(0xffd700, 1);
    g.fillRect(w / 2 - 10, 52, 7, 10);
    g.fillStyle(0xef5350, 1);
    g.fillRect(w / 2 - 2, 54, 7, 8);
    g.fillStyle(0x42a5f5, 1);
    g.fillRect(w / 2 + 6, 52, 7, 10);
  }

  // ── PROP ATLAS ──────────────────────────────────────────────────────────────

  private generatePropAtlas(): void {
    const aw = 300;
    const ah = 130;
    const g = this.makeG();

    this.drawLampPost(g, 2, 0);
    this.drawTree(g, 42, 0);
    this.drawBench(g, 84, 0);
    this.drawMailbox(g, 124, 0);
    this.drawBarrel(g, 2, 68);
    this.drawBush(g, 30, 72);
    this.drawFlowers(g, 58, 76);
    this.drawFountain(g, 82, 70);

    g.generateTexture("prop-atlas", aw, ah);
    g.destroy();
  }

  private drawLampPost(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    oy: number,
  ): void {
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(ox + 8, oy + 62, 12, 4);
    g.fillStyle(0x424242, 1);
    g.fillRect(ox + 6, oy + 22, 4, 40);
    g.fillStyle(0x333333, 1);
    g.fillRect(ox + 7, oy + 22, 2, 40);
    g.fillStyle(0x333333, 1);
    g.fillRect(ox + 4, oy + 58, 8, 4);
    g.fillRect(ox + 3, oy + 60, 10, 2);
    g.fillStyle(0x424242, 1);
    g.fillRect(ox + 8, oy + 22, 8, 3);
    g.fillRect(ox + 14, oy + 8, 3, 16);
    g.fillStyle(0xfffde7, 0.9);
    g.fillEllipse(ox + 16, oy + 12, 14, 10);
    g.fillStyle(0xfffacd, 1);
    g.fillEllipse(ox + 16, oy + 12, 8, 6);
    g.fillStyle(0xffffaa, 0.15);
    g.fillEllipse(ox + 16, oy + 14, 22, 18);
    g.fillStyle(0x333333, 1);
    g.fillRect(ox + 12, oy + 6, 8, 3);
  }

  private drawTree(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    oy: number,
  ): void {
    const baseY = oy + 60;
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(ox + 12, baseY + 3, 16, 5);
    g.fillStyle(0x5d4037, 1);
    g.fillRect(ox + 9, baseY - 18, 6, 18);
    g.fillStyle(0x4e342e, 1);
    g.fillRect(ox + 10, baseY - 18, 2, 18);
    g.fillStyle(0x5d4037, 1);
    g.fillRect(ox + 6, baseY - 2, 4, 3);
    g.fillRect(ox + 14, baseY - 2, 4, 3);
    g.fillStyle(0x2e7d32, 1);
    g.fillEllipse(ox + 12, baseY - 36, 24, 20);
    g.fillEllipse(ox + 6, baseY - 28, 16, 14);
    g.fillEllipse(ox + 18, baseY - 28, 16, 14);
    g.fillStyle(0x388e3c, 1);
    g.fillEllipse(ox + 12, baseY - 38, 20, 18);
    g.fillEllipse(ox + 8, baseY - 32, 13, 12);
    g.fillEllipse(ox + 17, baseY - 32, 12, 11);
    g.fillStyle(0x66bb6a, 1);
    g.fillEllipse(ox + 12, baseY - 40, 13, 12);
    g.fillEllipse(ox + 8, baseY - 35, 7, 7);
    g.fillStyle(0xef5350, 1);
    g.fillCircle(ox + 10, baseY - 38, 2);
    g.fillCircle(ox + 16, baseY - 34, 2);
  }

  private drawBench(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    oy: number,
  ): void {
    g.fillStyle(0x000000, 0.2);
    g.fillRect(ox + 2, oy + 18, 28, 3);
    g.fillStyle(0x4e342e, 1);
    g.fillRect(ox + 2, oy + 10, 3, 8);
    g.fillRect(ox + 23, oy + 10, 3, 8);
    g.fillRect(ox + 2, oy + 6, 3, 8);
    g.fillRect(ox + 23, oy + 6, 3, 8);
    g.fillStyle(0x4e342e, 1);
    g.fillRect(ox + 2, oy + 2, 3, 8);
    g.fillRect(ox + 23, oy + 2, 3, 8);
    g.fillStyle(0x795548, 1);
    g.fillRect(ox + 1, oy + 10, 26, 3);
    g.fillRect(ox + 1, oy + 14, 26, 3);
    g.fillStyle(0x795548, 1);
    g.fillRect(ox + 1, oy + 3, 26, 3);
    g.fillRect(ox + 1, oy + 7, 26, 2);
  }

  private drawMailbox(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    oy: number,
  ): void {
    g.fillStyle(0x757575, 1);
    g.fillRect(ox + 10, oy + 12, 4, 20);
    g.fillStyle(0x616161, 1);
    g.fillRect(ox + 7, oy + 28, 10, 3);
    g.fillStyle(0xf44336, 1);
    g.fillRect(ox + 3, oy + 3, 18, 12);
    g.fillEllipse(ox + 12, oy + 4, 18, 10);
    g.fillStyle(0xb71c1c, 1);
    g.fillRect(ox + 3, oy + 10, 18, 2);
    g.fillStyle(0x757575, 1);
    g.fillRect(ox + 19, oy + 4, 2, 10);
    g.fillStyle(0xffeb3b, 1);
    g.fillRect(ox + 20, oy + 4, 5, 5);
    g.fillStyle(0xffffff, 0.5);
    g.fillRect(ox + 5, oy + 4, 10, 5);
  }

  private drawBarrel(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    oy: number,
  ): void {
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(ox + 10, oy + 23, 16, 4);
    g.fillStyle(0x795548, 1);
    g.fillRect(ox + 2, oy + 3, 16, 18);
    g.fillEllipse(ox + 10, oy + 3, 16, 6);
    g.fillEllipse(ox + 10, oy + 21, 16, 6);
    g.fillStyle(0x757575, 1);
    g.fillRect(ox + 1, oy + 6, 18, 2);
    g.fillRect(ox + 1, oy + 12, 18, 2);
    g.fillRect(ox + 1, oy + 18, 18, 2);
    g.fillStyle(0x6d4c41, 0.5);
    g.fillRect(ox + 5, oy + 3, 2, 18);
    g.fillRect(ox + 11, oy + 3, 2, 18);
    g.fillStyle(0x8d6e63, 1);
    g.fillEllipse(ox + 10, oy + 3, 14, 5);
  }

  private drawBush(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    oy: number,
  ): void {
    g.fillStyle(0x000000, 0.15);
    g.fillEllipse(ox + 10, oy + 16, 18, 4);
    g.fillStyle(0x2e7d32, 1);
    g.fillEllipse(ox + 10, oy + 10, 18, 12);
    g.fillEllipse(ox + 4, oy + 12, 12, 10);
    g.fillEllipse(ox + 16, oy + 12, 12, 10);
    g.fillStyle(0x388e3c, 1);
    g.fillEllipse(ox + 10, oy + 8, 14, 10);
    g.fillEllipse(ox + 5, oy + 10, 10, 8);
    g.fillStyle(0x4caf50, 1);
    g.fillEllipse(ox + 10, oy + 7, 8, 7);
    g.fillEllipse(ox + 16, oy + 9, 7, 6);
  }

  private drawFlowers(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    oy: number,
  ): void {
    g.fillStyle(0x4caf50, 1);
    g.fillRect(ox, oy + 5, 16, 7);
    g.fillStyle(0x388e3c, 1);
    g.fillRect(ox + 2, oy + 2, 1, 5);
    g.fillRect(ox + 7, oy + 1, 1, 5);
    g.fillRect(ox + 12, oy + 3, 1, 4);
    const fcol = [0xf44336, 0xffeb3b, 0xff69b4];
    const fpos = [
      { x: ox + 2, y: oy + 2 },
      { x: ox + 7, y: oy + 0 },
      { x: ox + 12, y: oy + 2 },
    ];
    for (let i = 0; i < 3; i++) {
      g.fillStyle(fcol[i], 1);
      g.fillCircle(fpos[i].x, fpos[i].y, 2);
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(fpos[i].x - 2, fpos[i].y - 1, 1);
      g.fillCircle(fpos[i].x + 2, fpos[i].y - 1, 1);
    }
  }

  private drawFountain(
    g: Phaser.GameObjects.Graphics,
    ox: number,
    oy: number,
  ): void {
    const cx = ox + 24;
    const cy = oy + 32;
    g.fillStyle(0x000000, 0.2);
    g.fillEllipse(cx, cy + 14, 44, 8);
    g.fillStyle(0x9e9e9e, 1);
    g.fillEllipse(cx, cy + 10, 46, 16);
    g.fillStyle(0x757575, 1);
    g.fillEllipse(cx, cy + 10, 40, 12);
    g.fillStyle(0x2196f3, 0.8);
    g.fillEllipse(cx, cy + 10, 34, 9);
    g.fillStyle(0x4fc3f7, 0.6);
    g.fillEllipse(cx - 6, cy + 8, 10, 4);
    g.fillEllipse(cx + 8, cy + 11, 8, 3);
    g.fillStyle(0xbdbdbd, 1);
    g.fillRect(cx - 4, cy - 8, 8, 18);
    g.fillEllipse(cx, cy - 8, 10, 6);
    g.fillStyle(0x64b5f6, 0.7);
    g.fillEllipse(cx, cy - 14, 16, 8);
    g.fillStyle(0x90caf9, 0.5);
    g.fillEllipse(cx - 4, cy - 10, 8, 5);
    g.fillEllipse(cx + 5, cy - 11, 7, 5);
    g.lineStyle(2, 0x616161, 0.8);
    g.strokeEllipse(cx, cy + 10, 46, 16);
  }

  private generateInteractPrompt(): void {
    const w = 36;
    const h = 20;
    const g = this.makeG();
    g.fillStyle(0x000000, 0.9);
    g.fillRect(0, 0, w, h);
    g.lineStyle(2, COLORS.NEON_GREEN, 1);
    g.strokeRect(0, 0, w, h);
    g.generateTexture("interact-prompt", w, h);
    g.destroy();
  }
}
