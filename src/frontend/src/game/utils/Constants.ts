// Game configuration constants

export const GAME_WIDTH = 900;
export const GAME_HEIGHT = 700;
export const MAP_WIDTH = 1600;
export const MAP_HEIGHT = 1200;
export const PLAYER_SPEED = 150;

export const COLORS = {
  BLACK: 0x000000,
  WHITE: 0xffffff,
  NEON_GREEN: 0x39ff14,
  NEON_MAGENTA: 0xff00ff,
  NEON_CYAN: 0x00ffff,
  NEON_AMBER: 0xffbf00,
  DARK_GRAY: 0x1a1a1a,
  MID_GRAY: 0x333333,
  PLAYER: 0xffd700,
  // World palette
  SKY_TOP: 0x87ceeb,
  SKY_HORIZON: 0xe0f0ff,
  GRASS_BASE: 0x4caf50,
  GRASS_DARK: 0x388e3c,
  GRASS_LIGHT: 0x56c25e,
  DIRT_BASE: 0xc4a35a,
  DIRT_DARK: 0xb8936a,
  STONE_BASE: 0xcccccc,
  STONE_GROUT: 0xaaaaaa,
  STONE_DARK: 0x999999,
  // Building colors
  BLDG_JOB_WALL: 0x1a237e,
  BLDG_JOB_ROOF: 0xff6f00,
  BLDG_RESUME_WALL: 0xfff8e1,
  BLDG_RESUME_ROOF: 0xb71c1c,
  BLDG_COVER_WALL: 0x2e7d32,
  BLDG_COVER_ROOF: 0xffd600,
  BLDG_INTERVIEW_WALL: 0x4a148c,
  BLDG_INTERVIEW_ROOF: 0x00695c,
  BLDG_STUDY_WALL: 0x4e342e,
  BLDG_STUDY_ROOF: 0x37474f,
  // Prop colors
  LAMP_POLE: 0x333333,
  LAMP_GLOBE: 0xfffde7,
  TREE_TRUNK: 0x5d4037,
  TREE_CANOPY_OUTER: 0x2e7d32,
  TREE_CANOPY_MID: 0x388e3c,
  TREE_CANOPY_HIGHLIGHT: 0x66bb6a,
  BENCH_WOOD: 0x795548,
  BENCH_DARK: 0x4e342e,
  FENCE_WOOD: 0x8d6e63,
  MAILBOX_RED: 0xf44336,
  BUSH_GREEN: 0x4caf50,
  WATER_BLUE: 0x2196f3,
  STONE_FOUNTAIN: 0x9e9e9e,
};

export type NPCKey =
  | "job-analyzer"
  | "resume-tailor"
  | "cover-letter"
  | "interview-coach"
  | "study-hall";

export interface NPCConfig {
  key: NPCKey;
  name: string;
  label: string;
  x: number;
  y: number;
  color: number;
  dialogues: string[];
  xpReward: number;
  workflowId: string;
}

// NPC positions scaled for 1600x1200 map
export const NPC_CONFIGS: NPCConfig[] = [
  {
    key: "job-analyzer",
    name: "JOB ANALYZER",
    label: "JOB\nANALYZER",
    x: 1150,
    y: 300,
    color: COLORS.NEON_GREEN,
    dialogues: [
      "Another job description?\nYou're brave.",
      "Let me guess — it says\n'fast-paced environment.'",
      "Requirements: 10 years exp.\nIn a 2-year-old framework.",
      "'Competitive salary.'\nSure it is.",
    ],
    xpReward: 100,
    workflowId: "agents",
  },
  {
    key: "resume-tailor",
    name: "RESUME TAILOR",
    label: "RESUME\nTAILOR",
    x: 1150,
    y: 550,
    color: COLORS.NEON_MAGENTA,
    dialogues: [
      "Let me guess — your resume\nsays 'team player.'",
      "Results-oriented professional.\nAren't we all.",
      "I'll make it ATS-friendly.\nThe robots will love it.",
      "Quantifiable achievements.\nYou did save that budget, right?",
    ],
    xpReward: 100,
    workflowId: "resume",
  },
  {
    key: "cover-letter",
    name: "COVER LETTER BUILDER",
    label: "COVER LETTER\nBUILDER",
    x: 450,
    y: 950,
    color: COLORS.NEON_CYAN,
    dialogues: [
      "Cover letters: because emails\nweren't painful enough.",
      "I'll write it. You'll edit it.\nWe'll both pretend it's perfect.",
      "No company name in the body.\nI know. I know.",
      "First person. Confident.\nNever robotic. Got it.",
    ],
    xpReward: 100,
    workflowId: "cover-letter",
  },
  {
    key: "interview-coach",
    name: "INTERVIEW COACH",
    label: "INTERVIEW\nCOACH",
    x: 350,
    y: 400,
    color: COLORS.NEON_AMBER,
    dialogues: [
      "Deep breaths. They're just\npeople. Stressed, overworked\npeople.",
      "Tell me about yourself.\nBut like, in 2 minutes.",
      "Where do you see yourself\nin 5 years? Still employed,\nhopefully.",
      "Your greatest weakness?\nApparently job interviews.",
    ],
    xpReward: 100,
    workflowId: "interview",
  },
  {
    key: "study-hall",
    name: "STUDY HALL",
    label: "STUDY\nHALL",
    x: 800,
    y: 200,
    color: COLORS.NEON_GREEN,
    dialogues: [
      "Flashcards. The adult version\nof hoping for a miracle.",
      "Notes won't write themselves.\nWell, actually...",
      "Review your materials.\nYour future self will thank you.",
      "Knowledge is XP.\nAnd XP is power.",
    ],
    xpReward: 25,
    workflowId: "study",
  },
];

export const XP_REWARDS = {
  UPLOAD_RESUME: 50,
  ENTER_JOB_DESC: 75,
  COMPLETE_AGENT: 100,
  VIEW_STUDY: 25,
  INTERACT_NPC: 10,
};

export const CAREER_LEVEL_FORMULA = (xp: number): number =>
  Math.floor(Math.sqrt(xp / 100));

export const SCENE_KEYS = {
  BOOT: "BootScene",
  CAREER_CITY: "CareerCityScene",
  HUD: "HUDScene",
  RESUME_TAILOR: "ResumeTailorScene",
  COVER_LETTER: "CoverLetterScene",
  INTERVIEW_COACH: "InterviewCoachScene",
  JOB_ANALYZER: "JobAnalyzerScene",
  STUDY_HALL: "StudyHallScene",
};

export const ASSET_KEYS = {
  PLAYER: "player",
  NPC_BASE: "npc-base",
  BUILDING: "building",
  FLOOR_TILE: "floor-tile",
  PATH_TILE: "path-tile",
  INTERACT_ZONE: "interact-zone",
  GRASS_TILE: "grass-tile",
  STONE_TILE: "stone-tile",
  SKY_BG: "sky-bg",
  PROP_ATLAS: "prop-atlas",
};

// Custom event names for Phaser → React communication
export const GAME_EVENTS = {
  NPC_INTERACT: "npc:interact",
  NPC_NEARBY: "npc:nearby",
  NPC_LEAVE: "npc:leave",
  XP_GAINED: "xp:gained",
  PLAYER_MOVE: "player:move",
  FAST_TRAVEL: "fasttravel:request",
  MINIMAP_TOGGLE: "minimap:toggle",
  INTERIOR_EXIT: "interior:exit",
};

// Music track definitions — URLs are kept for API compatibility but music is
// now synthesized via Web Audio API in MusicManager (no external CDN needed)
export const MUSIC_TRACKS = {
  CAREER_CITY: {
    key: "music_career_city",
    url: "",
    name: "Town Theme",
  },
  RESUME_TAILOR: {
    key: "music_resume_tailor",
    url: "",
    name: "Castle on the Mountain",
  },
  COVER_LETTER: {
    key: "music_cover_letter",
    url: "",
    name: "Rainy Streets",
  },
  INTERVIEW_COACH: {
    key: "music_interview_coach",
    url: "",
    name: "In the Royal Court",
  },
  JOB_ANALYZER: {
    key: "music_job_analyzer",
    url: "",
    name: "Dungeon",
  },
  STUDY_HALL: {
    key: "music_study_hall",
    url: "",
    name: "Shrine of Mysteries",
  },
} as const;

export type MusicTrackKey = keyof typeof MUSIC_TRACKS;
