import Phaser from "phaser";
import { useCallback, useEffect, useRef, useState } from "react";
import { WorkflowPanel } from "../components/WorkflowPanel";
import { useGameState } from "./hooks/useGameState";
import { createPhaserConfig } from "./index";
import { musicManager } from "./managers/MusicManager";
import { MinimapOverlay } from "./ui/MinimapOverlay";
import { TouchControls } from "./ui/TouchControls";
import {
  CAREER_LEVEL_FORMULA,
  GAME_EVENTS,
  XP_REWARDS,
} from "./utils/Constants";

const CANVAS_ID = "game-canvas";
const NAV_BAR_H = 52;
const BOTTOM_HUD_H = 56;

// D-pad size bumped to 56px for reliable touch targets
const DPAD_BTN = 56;

const XP_PER_LEVEL_BASE = 100;
function xpForNextLevel(level: number): number {
  return (level + 1) * (level + 1) * XP_PER_LEVEL_BASE;
}

/** Detect mobile/touch device */
function isMobileDevice(): boolean {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(
      navigator.userAgent,
    )
  );
}

/** Return available canvas area in pixels (accounts for bars + safe-areas) */
function getCanvasDimensions(): { w: number; h: number } {
  return {
    w: window.innerWidth,
    h: Math.max(100, window.innerHeight - NAV_BAR_H - BOTTOM_HUD_H),
  };
}

// ── Landscape enforcement overlay ────────────────────────────────────────────

function LandscapeEnforcementOverlay({ visible }: { visible: boolean }) {
  // Always render — visibility controlled by display so the DOM node is stable
  // and the overlay reliably covers the game regardless of transition timing.
  return (
    <div
      data-ocid="landscape_overlay.panel"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        display: visible ? "flex" : "none",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1.5em",
        padding: "2em",
        boxSizing: "border-box",
        touchAction: "none",
      }}
    >
      <div
        style={{
          fontSize: "3.5em",
          animation: "rotateHint 2s ease-in-out infinite",
        }}
      >
        📱
      </div>
      <p
        style={{
          fontFamily: "Orbitron, sans-serif",
          fontSize: "1em",
          color: "#39ff14",
          textAlign: "center",
          lineHeight: 1.8,
          letterSpacing: "0.05em",
          fontWeight: 700,
          textShadow: "0 0 12px #39ff14",
          margin: 0,
        }}
      >
        ROTATE YOUR DEVICE
      </p>
      <p
        style={{
          fontFamily: "Orbitron, sans-serif",
          fontSize: "0.7em",
          color: "rgba(57,255,20,0.6)",
          textAlign: "center",
          lineHeight: 1.8,
          letterSpacing: "0.08em",
          maxWidth: "280px",
          margin: 0,
        }}
      >
        Career City is best played in landscape mode.
        <br />
        Rotate your device to continue your quest.
      </p>
      <style>{`
        @keyframes rotateHint {
          0%, 100% { transform: rotate(0deg); }
          40% { transform: rotate(-90deg); }
          60% { transform: rotate(-90deg); }
        }
      `}</style>
    </div>
  );
}

// ── Mobile D-pad ─────────────────────────────────────────────────────────────

type DPadDirection = "up" | "down" | "left" | "right";

function MobileDPad({ visible }: { visible: boolean }) {
  if (!visible) return null;

  const dispatchDir = (direction: DPadDirection, pressed: boolean) => {
    window.dispatchEvent(
      new CustomEvent("game:move", { detail: { direction, pressed } }),
    );
  };

  const makeBtn = (
    dir: DPadDirection,
    label: string,
    ocid: string,
    style: React.CSSProperties,
  ) => {
    const handleStart = (e: React.TouchEvent | React.PointerEvent) => {
      e.preventDefault();
      dispatchDir(dir, true);
    };
    const handleEnd = (e: React.TouchEvent | React.PointerEvent) => {
      e.preventDefault();
      dispatchDir(dir, false);
    };

    return (
      <button
        type="button"
        key={dir}
        data-ocid={ocid}
        aria-label={`Move ${dir}`}
        onPointerDown={handleStart}
        onPointerUp={handleEnd}
        onPointerLeave={handleEnd}
        onTouchStart={handleStart}
        onTouchEnd={handleEnd}
        onTouchCancel={handleEnd}
        style={{
          position: "absolute",
          width: `${DPAD_BTN}px`,
          height: `${DPAD_BTN}px`,
          background: "rgba(0,0,0,0.78)",
          border: "2px solid rgba(57,255,20,0.65)",
          borderRadius: "8px",
          color: "#39ff14",
          fontSize: "1.4em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          userSelect: "none",
          WebkitUserSelect: "none",
          touchAction: "none",
          boxShadow: "0 0 8px rgba(57,255,20,0.3)",
          ...style,
        }}
      >
        {label}
      </button>
    );
  };

  // Container: 176x176 (3 × 56px + 2 × 4px gaps), positioned bottom-right
  // inside the canvas area. Sits ABOVE canvas (z-index:30) and won't overlap
  // the HUD because it's inside the canvas wrapper which has overflow:hidden.
  const containerSize = DPAD_BTN * 3 + 8; // ~176px

  return (
    <div
      data-ocid="mobile_dpad.panel"
      style={{
        position: "absolute",
        bottom: "calc(12px + env(safe-area-inset-bottom, 0px))",
        right: "calc(12px + env(safe-area-inset-right, 0px))",
        width: `${containerSize}px`,
        height: `${containerSize}px`,
        zIndex: 30,
        pointerEvents: "none",
      }}
    >
      {makeBtn("up", "▲", "dpad.up_button", {
        top: 0,
        left: "50%",
        transform: "translateX(-50%)",
        pointerEvents: "all",
      })}
      {makeBtn("down", "▼", "dpad.down_button", {
        bottom: 0,
        left: "50%",
        transform: "translateX(-50%)",
        pointerEvents: "all",
      })}
      {makeBtn("left", "◄", "dpad.left_button", {
        left: 0,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "all",
      })}
      {makeBtn("right", "►", "dpad.right_button", {
        right: 0,
        top: "50%",
        transform: "translateY(-50%)",
        pointerEvents: "all",
      })}
      {/* Center fill */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: `${DPAD_BTN}px`,
          height: `${DPAD_BTN}px`,
          background: "rgba(0,0,0,0.4)",
          border: "1px solid rgba(57,255,20,0.2)",
          borderRadius: "8px",
        }}
      />
    </div>
  );
}

// ── Music hint ────────────────────────────────────────────────────────────────

function MusicHint({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div
      data-ocid="music_hint.panel"
      style={{
        position: "absolute",
        bottom: "1em",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 15,
        pointerEvents: "none",
        fontFamily: "Orbitron, sans-serif",
        fontSize: "0.75em",
        color: "rgba(57,255,20,0.55)",
        letterSpacing: "0.12em",
        whiteSpace: "nowrap",
        userSelect: "none",
        animation: "musicHintPulse 2s ease-in-out infinite",
      }}
    >
      ♪ TAP ANYWHERE TO START MUSIC
      <style>{`
        @keyframes musicHintPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 0.85; }
        }
      `}</style>
    </div>
  );
}

// ── Nav button ───────────────────────────────────────────────────────────────

interface NavButtonProps {
  color: string;
  ocid: string;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
  /** Render as icon-only on small viewports */
  icon?: string;
}

function NavButton({
  color,
  ocid,
  onClick,
  children,
  title,
  icon,
}: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-ocid={ocid}
      title={title}
      aria-label={title}
      style={{
        fontFamily: "Orbitron, sans-serif",
        fontSize: "0.75em",
        color,
        background: "rgba(0,0,0,0.88)",
        border: `1px solid ${color}`,
        boxShadow: `0 0 6px ${color}44`,
        padding: "6px 10px",
        cursor: "pointer",
        whiteSpace: "nowrap",
        fontWeight: 700,
        letterSpacing: "0.04em",
        lineHeight: 1.4,
        transition: "box-shadow 0.15s, background 0.15s",
        flexShrink: 0,
        minHeight: "36px",
        minWidth: "36px",
        display: "flex",
        alignItems: "center",
        gap: "4px",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          `0 0 14px ${color}88`;
        (e.currentTarget as HTMLButtonElement).style.background = `${color}14`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLButtonElement).style.boxShadow =
          `0 0 6px ${color}44`;
        (e.currentTarget as HTMLButtonElement).style.background =
          "rgba(0,0,0,0.88)";
      }}
    >
      {/* On very small screens (mobile landscape), show icon; on larger show full label */}
      <span
        className="nav-btn-icon"
        aria-hidden="true"
        style={{ fontSize: "1.1em" }}
      >
        {icon}
      </span>
      <span className="nav-btn-label">{children}</span>
    </button>
  );
}

// ── Bottom HUD bar ────────────────────────────────────────────────────────────

function BottomHUD({ xp, level }: { xp: number; level: number }) {
  const nextLevelXP = xpForNextLevel(level);
  const prevLevelXP = level > 0 ? xpForNextLevel(level - 1) : 0;
  const progress =
    nextLevelXP === prevLevelXP
      ? 1
      : Math.min((xp - prevLevelXP) / (nextLevelXP - prevLevelXP), 1);

  const [track, setTrack] = useState({ name: "", muted: false });

  useEffect(() => {
    const handler = (e: Event) => {
      const d = (
        e as CustomEvent<{ name: string; key: string; muted: boolean }>
      ).detail;
      setTrack({ name: d.name, muted: d.muted });
    };
    window.addEventListener("music:trackChanged", handler);
    return () => window.removeEventListener("music:trackChanged", handler);
  }, []);

  const handleToggleMute = async () => {
    musicManager.resumeAudioContextAndPlay();
    const nowMuted = musicManager.toggleMute();
    setTrack((prev) => ({ ...prev, muted: nowMuted }));
  };

  return (
    <div
      data-ocid="game_hud.bottom_bar"
      style={{
        flexShrink: 0,
        height: `${BOTTOM_HUD_H}px`,
        width: "100%",
        /* z-index: 50 ensures this bar renders ABOVE the Phaser canvas (z-index:1).
           position:relative is required for z-index to take effect. */
        zIndex: 50,
        position: "relative",
        background: "rgba(0,0,0,0.92)",
        borderTop: "1px solid rgba(57,255,20,0.25)",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "0 12px",
        paddingLeft: "calc(12px + env(safe-area-inset-left, 0px))",
        paddingRight: "calc(12px + env(safe-area-inset-right, 0px))",
        boxSizing: "border-box",
        overflow: "hidden",
      }}
    >
      {/* Level badge */}
      <div
        data-ocid="xp_bar.level_badge"
        style={{
          fontFamily: "Orbitron, sans-serif",
          fontSize: "0.8em",
          color: "#39ff14",
          fontWeight: 700,
          whiteSpace: "nowrap",
          letterSpacing: "0.06em",
          userSelect: "none",
          border: "1px solid rgba(57,255,20,0.5)",
          padding: "2px 6px",
          background: "rgba(57,255,20,0.08)",
          flexShrink: 0,
        }}
      >
        LVL {level}
      </div>

      {/* XP label */}
      <span
        style={{
          fontFamily: "Orbitron, sans-serif",
          fontSize: "0.7em",
          color: "rgba(57,255,20,0.55)",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
          userSelect: "none",
          flexShrink: 0,
        }}
      >
        XP
      </span>

      {/* XP bar track */}
      <div
        data-ocid="xp_bar.panel"
        style={{
          flex: 1,
          height: "12px",
          background: "#0a0a0a",
          border: "1px solid rgba(57,255,20,0.4)",
          position: "relative",
          overflow: "hidden",
          minWidth: 0,
          maxWidth: "480px",
        }}
      >
        <div
          data-ocid="xp_bar.fill"
          style={{
            position: "absolute",
            top: "2px",
            left: 0,
            bottom: "2px",
            width: `${Math.round(progress * 100)}%`,
            background: "#39ff14",
            transition: "width 0.6s ease",
            boxShadow: "0 0 8px #39ff14aa",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "2px",
            left: 0,
            bottom: "2px",
            width: `${Math.round(progress * 100)}%`,
            background: "rgba(57,255,20,0.22)",
            transition: "width 0.6s ease",
            mixBlendMode: "screen",
          }}
        />
      </div>

      {/* XP fraction — hidden on very small screens */}
      <span
        style={{
          fontFamily: "Orbitron, sans-serif",
          fontSize: "0.65em",
          color: "#00ffff",
          whiteSpace: "nowrap",
          userSelect: "none",
          flexShrink: 0,
        }}
        className="xp-fraction"
      >
        {xp} / {nextLevelXP}
      </span>

      {/* Divider */}
      <div
        style={{
          width: "1px",
          height: "28px",
          background: "rgba(255,191,0,0.25)",
          flexShrink: 0,
          marginLeft: "4px",
        }}
      />

      {/* Music player */}
      <div
        data-ocid="music_hud.panel"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          background: "rgba(0,0,0,0.5)",
          border: "1px solid #ffbf00",
          boxShadow: "0 0 8px #ffbf0033",
          padding: "4px 8px",
          minWidth: "100px",
          maxWidth: "180px",
          borderRadius: "2px",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        <span
          style={{
            fontSize: "0.85em",
            animation:
              track.muted || !track.name ? "none" : "notePulse 1.2s infinite",
            display: "inline-block",
            flexShrink: 0,
            color: track.muted ? "#555" : "#ffbf00",
          }}
          aria-hidden="true"
        >
          ♪
        </span>
        <span
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "0.65em",
            color: track.muted ? "#666" : "#ffbf00",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            lineHeight: 1.4,
            minWidth: 0,
          }}
          title={track.name || "Click to start music"}
        >
          {track.name || (track.muted ? "MUTED" : "CLICK TO PLAY")}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            void handleToggleMute();
          }}
          data-ocid="music_hud.mute_button"
          aria-label={track.muted ? "Unmute music" : "Mute music"}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "0.85em",
            padding: "0",
            lineHeight: 1,
            flexShrink: 0,
            color: track.muted ? "#555" : "#ffbf00",
            transition: "color 0.2s",
            minWidth: "24px",
            minHeight: "24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {track.muted ? "🔇" : "🔊"}
        </button>
      </div>

      <style>{`
        @keyframes notePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.35); }
        }
        /* On very narrow landscape phones hide the XP fraction to save space */
        @media (max-height: 420px) {
          .xp-fraction { display: none; }
        }
      `}</style>
    </div>
  );
}

// ── Loading overlay ────────────────────────────────────────────────────────────
// Rendered by React above the Phaser canvas — stays visible until 'gameReady'
// fires so there is never a black screen gap between the Phaser loading bar
// fading out and the CareerCity world appearing.

function LoadingOverlay({ visible }: { visible: boolean }) {
  const [punny, setPunny] = useState("GENERATING WORLD...");
  const punnyLines = [
    "GENERATING WORLD...",
    "shuffling resumes...",
    "bribing the ATS robots...",
    "polishing the cover letters...",
    "caffeinating the AI agents...",
    "preparing your destiny...",
  ];

  useEffect(() => {
    if (!visible) return;
    let idx = 0;
    const id = window.setInterval(() => {
      idx = (idx + 1) % punnyLines.length;
      setPunny(punnyLines[idx]);
    }, 700);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      data-ocid="loading_overlay.panel"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 8000,
        background: "#050510",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "1em",
        fontFamily: "Orbitron, sans-serif",
        pointerEvents: "all",
      }}
    >
      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, rgba(0,0,0,0.12), rgba(0,0,0,0.12) 1px, transparent 1px, transparent 4px)",
          pointerEvents: "none",
        }}
      />
      <h1
        style={{
          fontSize: "2.2em",
          color: "#39ff14",
          fontWeight: 900,
          letterSpacing: "0.08em",
          textShadow: "0 0 18px #39ff14",
          margin: 0,
        }}
      >
        JOB QUEST
      </h1>
      <p
        style={{
          fontSize: "1em",
          color: "#00ffff",
          letterSpacing: "0.1em",
          margin: 0,
          fontWeight: 700,
        }}
      >
        CAREER CITY
      </p>
      <p
        style={{
          fontSize: "0.8em",
          color: "#ffbf00",
          textAlign: "center",
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        Because job hunting wasn't
        <br />
        enough of a grind.
      </p>
      <p
        style={{
          fontSize: "0.75em",
          color: "#ff00ff",
          fontWeight: 700,
          letterSpacing: "0.06em",
          margin: "0.5em 0 0",
          minHeight: "1.4em",
          textAlign: "center",
          animation: "loadPulse 1.4s ease-in-out infinite",
        }}
      >
        {punny}
      </p>
      {/* Progress bar */}
      <div
        style={{
          width: "min(280px, 75vw)",
          height: "12px",
          background: "#111",
          border: "2px solid #39ff14",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "2px",
            left: 0,
            bottom: "2px",
            background: "#39ff14",
            boxShadow: "0 0 8px #39ff14aa",
            animation: "loadBar 2s ease-out forwards",
          }}
        />
      </div>
      <style>{`
        @keyframes loadPulse { 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes loadBar   { from{width:0} to{width:100%} }
      `}</style>
    </div>
  );
}

// ── Main GameContainer ─────────────────────────────────────────────────────────

export function GameContainer() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [showMinimap, setShowMinimap] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);
  const [showMusicHint, setShowMusicHint] = useState(true);
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  /** True once CareerCityScene fires 'careerCityReady' — hides the React loading overlay */
  const [gameReady, setGameReady] = useState(false);

  const [isMobile] = useState(() => isMobileDevice());
  const [isPortrait, setIsPortrait] = useState(
    () => window.innerHeight > window.innerWidth,
  );

  const { addXP, totalXP, careerLevel } = useGameState();
  const [displayXP, setDisplayXP] = useState(0);
  const [displayLevel, setDisplayLevel] = useState(0);

  // ── Orientation tracking ────────────────────────────────────────────────
  useEffect(() => {
    const checkOrientation = () => {
      setIsPortrait(window.innerHeight > window.innerWidth);
    };
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);
    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  // ── Phaser initialisation ────────────────────────────────────────────────
  useEffect(() => {
    if (gameRef.current) return;

    musicManager.init();
    const { w, h } = getCanvasDimensions();
    const config = createPhaserConfig(CANVAS_ID, NAV_BAR_H, BOTTOM_HUD_H, w, h);
    gameRef.current = new Phaser.Game(config);

    // Listen for game ready — fire once
    const onReady = () => setGameReady(true);
    gameRef.current.events.once("careerCityReady", onReady);

    // Handle resize: update Phaser canvas dimensions
    const onResize = () => {
      if (!gameRef.current) return;
      const { w: nw, h: nh } = getCanvasDimensions();
      gameRef.current.scale.resize(nw, nh);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", () => {
      // Brief delay to allow browser to report new dimensions
      setTimeout(onResize, 150);
    });

    return () => {
      window.removeEventListener("resize", onResize);
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // ── Sync XP ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (totalXP > 0) {
      window.dispatchEvent(
        new CustomEvent("hud:setXP", {
          detail: { xp: totalXP, level: careerLevel },
        }),
      );
      setDisplayXP(totalXP);
      setDisplayLevel(careerLevel);
    }
  }, [totalXP, careerLevel]);

  useEffect(() => {
    const handleXPUpdate = (e: Event) => {
      const { xp, level } = (e as CustomEvent<{ xp: number; level: number }>)
        .detail;
      setDisplayXP(xp);
      setDisplayLevel(level);
    };
    window.addEventListener("hud:xpUpdate", handleXPUpdate);
    return () => window.removeEventListener("hud:xpUpdate", handleXPUpdate);
  }, []);

  // ── Phaser → React events ────────────────────────────────────────────────
  useEffect(() => {
    const handleMinimapToggle = () => setShowMinimap((v) => !v);
    const handleXPGained = (e: Event) => {
      const { amount } = (e as CustomEvent<{ amount: number; reason: string }>)
        .detail;
      addXP(amount);
      setDisplayXP((prev) => {
        const next = prev + amount;
        setDisplayLevel(CAREER_LEVEL_FORMULA(next));
        return next;
      });
    };
    window.addEventListener(GAME_EVENTS.MINIMAP_TOGGLE, handleMinimapToggle);
    window.addEventListener(GAME_EVENTS.XP_GAINED, handleXPGained);
    return () => {
      window.removeEventListener(
        GAME_EVENTS.MINIMAP_TOGGLE,
        handleMinimapToggle,
      );
      window.removeEventListener(GAME_EVENTS.XP_GAINED, handleXPGained);
    };
  }, [addXP]);

  const dismissMusicHint = useCallback(() => setShowMusicHint(false), []);

  const handleInteraction = useCallback(() => {
    musicManager.resumeAudioContextAndPlay();
    dismissMusicHint();
  }, [dismissMusicHint]);

  const handleOpenWorkflow = useCallback((workflowId: string) => {
    setActiveWorkflow(workflowId);
    window.dispatchEvent(
      new CustomEvent(GAME_EVENTS.XP_GAINED, {
        detail: { amount: XP_REWARDS.INTERACT_NPC, reason: "NPC Interaction" },
      }),
    );
  }, []);

  const handleCloseWorkflow = () => setActiveWorkflow(null);

  // ── How To Play modal ────────────────────────────────────────────────────
  const HowToPlayModal = showHowToPlay ? (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 600,
        background: "rgba(0,0,0,0.85)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={() => setShowHowToPlay(false)}
      onKeyDown={(e) => e.key === "Escape" && setShowHowToPlay(false)}
      role="presentation"
      data-ocid="how_to_play.dialog"
    >
      <div
        style={{
          background: "#000",
          border: "2px solid #39ff14",
          boxShadow: "0 0 40px #39ff1444",
          padding: "1.75em 2em",
          maxWidth: "420px",
          width: "90vw",
          maxHeight: "85vh",
          overflowY: "auto",
          fontFamily: "Orbitron, sans-serif",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "1em",
            color: "#39ff14",
            marginBottom: "1em",
            letterSpacing: "0.05em",
            fontWeight: 700,
          }}
        >
          ☰ HOW TO PLAY
        </h2>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "1.25em",
          }}
        >
          <tbody>
            {[
              { keys: "WASD / Arrow Keys", action: "Move around Career City" },
              { keys: "E / Space / Enter", action: "Interact with NPCs" },
              { keys: "ESC", action: "Exit building / Close dialogue" },
              { keys: "Click + Drag", action: "Pan the camera (desktop)" },
              { keys: "D-Pad (mobile)", action: "Move character" },
              { keys: "Double-tap (mobile)", action: "Interact" },
            ].map((row) => (
              <tr key={row.keys}>
                <td
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "0.8em",
                    color: "#00ffff",
                    padding: "0.375em 0.75em 0.375em 0",
                    whiteSpace: "nowrap",
                    fontWeight: 700,
                    borderBottom: "1px solid #1a1a1a",
                  }}
                >
                  {row.keys}
                </td>
                <td
                  style={{
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "0.8em",
                    color: "#aaa",
                    padding: "0.375em 0",
                    borderBottom: "1px solid #1a1a1a",
                  }}
                >
                  {row.action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button
          type="button"
          onClick={() => setShowHowToPlay(false)}
          data-ocid="how_to_play.close_button"
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "0.85em",
            color: "#000",
            background: "#39ff14",
            border: "none",
            padding: "0.625em 1.5em",
            cursor: "pointer",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
        >
          ▶ GOT IT
        </button>
      </div>
    </div>
  ) : null;

  // ── Render ───────────────────────────────────────────────────────────────
  // Layout (flex column, 100vw × 100dvh):
  //   [NAV BAR   — 52px, z-index:50, position:relative]
  //   [CANVAS    — flex:1, z-index:1 (canvas inside)]
  //   [BOTTOM HUD — 56px, z-index:50, position:relative]
  //
  // The canvas wrapper has z-index:1 via its children (the canvas el in index.css).
  // BottomHUD has z-index:50 and position:relative — always paints on top.

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100dvh",
        background: "#000",
        overflow: "hidden",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
      }}
      data-ocid="game_container"
      onClick={handleInteraction}
      onKeyDown={handleInteraction}
      onTouchStart={handleInteraction}
      onPointerDown={handleInteraction}
    >
      {/* ── React loading overlay — stays until Phaser fires careerCityReady ── */}
      <LoadingOverlay visible={!gameReady} />

      {/* ── TOP NAV BAR ──────────────────────────────────────────────────── */}
      <div
        data-ocid="game_hud.nav_bar"
        style={{
          flexShrink: 0,
          height: `${NAV_BAR_H}px`,
          width: "100%",
          zIndex: 50,
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "0 10px",
          paddingLeft: "calc(10px + env(safe-area-inset-left, 0px))",
          paddingRight: "calc(10px + env(safe-area-inset-right, 0px))",
          background: "rgba(0,0,0,0.92)",
          borderBottom: "1px solid rgba(57,255,20,0.2)",
          boxSizing: "border-box",
          overflowX: "auto",
          flexWrap: "nowrap",
        }}
      >
        {/* Game title */}
        <span
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "0.85em",
            color: "#39ff14",
            fontWeight: 700,
            letterSpacing: "0.1em",
            whiteSpace: "nowrap",
            marginRight: "2px",
            flexShrink: 0,
          }}
        >
          ✦ CAREER CITY
        </span>

        <span
          style={{
            width: "1px",
            height: "24px",
            background: "rgba(57,255,20,0.2)",
            flexShrink: 0,
          }}
        />

        <NavButton
          color="#ff00ff"
          ocid="game_hud.master_resume_button"
          onClick={() => handleOpenWorkflow("resume")}
          title="Open Master Resume"
          icon="📄"
        >
          MASTER RESUME
        </NavButton>

        <NavButton
          color="#39ff14"
          ocid="game_hud.study_materials_button"
          onClick={() => handleOpenWorkflow("study")}
          title="Open Study Materials"
          icon="📚"
        >
          STUDY MATERIALS
        </NavButton>

        <NavButton
          color="#00ffff"
          ocid="game_hud.map_button"
          onClick={() => setShowMinimap((v) => !v)}
          title="Toggle minimap"
          icon="🗺️"
        >
          MAP
        </NavButton>

        <NavButton
          color="#ffbf00"
          ocid="game_hud.how_to_play_button"
          onClick={() => setShowHowToPlay(true)}
          title="How to Play"
          icon="☰"
        >
          HOW TO PLAY
        </NavButton>
      </div>

      {/* ── GAME CANVAS AREA ─────────────────────────────────────────────── */}
      {/*
       * flex:1 + minHeight:0 fills all remaining vertical space between bars.
       * position:relative provides offset parent for D-pad and overlays.
       * NO explicit z-index here — Phaser canvas gets z-index:1 via CSS (index.css),
       * and the BottomHUD below this div gets z-index:50 and position:relative,
       * so it always paints above the canvas regardless of scene.
       */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          minHeight: 0,
        }}
      >
        {/* Phaser canvas mount point */}
        <div
          id={CANVAS_ID}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
          }}
        />

        {/* Invisible swipe / touch layer */}
        <TouchControls />

        {/* D-pad — mobile landscape only, above canvas */}
        <MobileDPad visible={isMobile && !isPortrait} />

        {/* Minimap */}
        <MinimapOverlay
          isOpen={showMinimap}
          onClose={() => setShowMinimap(false)}
        />

        {/* Music hint */}
        <MusicHint visible={showMusicHint && gameReady} />
      </div>

      {/* ── BOTTOM HUD ───────────────────────────────────────────────────── */}
      {/* Rendered as a sibling AFTER the canvas wrapper in DOM order.
          Its z-index:50 + position:relative guarantees it paints on top. */}
      <BottomHUD xp={displayXP} level={displayLevel} />

      {/* ── MODALS ───────────────────────────────────────────────────────── */}
      {HowToPlayModal}

      {/* Landscape enforcement — covers everything on mobile portrait */}
      <LandscapeEnforcementOverlay visible={isMobile && isPortrait} />

      {/* Workflow panel */}
      {activeWorkflow && (
        <WorkflowPanel
          workflowId={activeWorkflow}
          onClose={handleCloseWorkflow}
        />
      )}

      {/* Responsive nav label hiding for narrow mobile landscape */}
      <style>{`
        /* On mobile landscape (height <= 500px) hide text labels, show icons only */
        @media (max-height: 500px) {
          .nav-btn-label { display: none; }
        }
        @media (min-height: 501px) {
          .nav-btn-label { display: inline; }
        }
      `}</style>
    </div>
  );
}
