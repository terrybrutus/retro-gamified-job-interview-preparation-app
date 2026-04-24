import { useEffect, useState } from "react";
import {
  GAME_EVENTS,
  MAP_HEIGHT,
  MAP_WIDTH,
  type NPCKey,
  NPC_CONFIGS,
} from "../utils/Constants";

interface MinimapOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  playerPos?: { x: number; y: number };
}

// Scale NPC world positions to minimap percentage
function toMinimap(wx: number, wy: number): { x: number; y: number } {
  return {
    x: (wx / MAP_WIDTH) * 100,
    y: (wy / MAP_HEIGHT) * 100,
  };
}

const NPC_COLOR_MAP: Record<NPCKey, string> = {
  "job-analyzer": "#39ff14",
  "resume-tailor": "#ff00ff",
  "cover-letter": "#00ffff",
  "interview-coach": "#ffbf00",
  "study-hall": "#39ff14",
};

const NPC_ICON: Record<NPCKey, string> = {
  "job-analyzer": "📊",
  "resume-tailor": "📄",
  "cover-letter": "✉️",
  "interview-coach": "💪",
  "study-hall": "📚",
};

// Pre-compute minimap positions from world positions
const NPC_MINIMAP_POSITIONS: Record<NPCKey, { x: number; y: number }> =
  Object.fromEntries(
    NPC_CONFIGS.map((npc) => [npc.key, toMinimap(npc.x, npc.y)]),
  ) as Record<NPCKey, { x: number; y: number }>;

export function MinimapOverlay({
  isOpen,
  onClose,
  playerPos,
}: MinimapOverlayProps) {
  const [hoveredNPC, setHoveredNPC] = useState<NPCKey | null>(null);
  const [playerMini, setPlayerMini] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  // Update player position on minimap
  useEffect(() => {
    if (playerPos) {
      setPlayerMini(toMinimap(playerPos.x, playerPos.y));
    }
  }, [playerPos]);

  if (!isOpen) return null;

  const handleFastTravel = (npcKey: NPCKey) => {
    window.dispatchEvent(
      new CustomEvent(GAME_EVENTS.FAST_TRAVEL, { detail: { npcKey } }),
    );
    onClose();
  };

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center m-0 p-0 max-w-none max-h-none w-full h-full"
      style={{ background: "rgba(0,0,0,0.88)", border: "none" }}
      aria-label="Career City Map"
      data-ocid="minimap.modal"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        onClick={onClose}
        role="presentation"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === "Escape") onClose();
        }}
      />

      <div
        className="relative flex flex-col gap-4"
        style={{
          background: "#04040f",
          border: "3px solid #39ff14",
          boxShadow:
            "0 0 40px rgba(57,255,20,0.4), 0 0 80px rgba(57,255,20,0.15), inset 0 0 30px rgba(57,255,20,0.05)",
          padding: "20px",
          maxWidth: "420px",
          width: "95vw",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: "11px",
                color: "#39ff14",
                margin: 0,
              }}
            >
              CAREER CITY MAP
            </p>
            <p
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: "6px",
                color: "#444",
                margin: "4px 0 0",
              }}
            >
              {MAP_WIDTH}×{MAP_HEIGHT} WORLD
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close map"
            data-ocid="minimap.close_button"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "9px",
              color: "#ff00ff",
              background: "transparent",
              border: "2px solid #ff00ff",
              boxShadow: "0 0 8px rgba(255,0,255,0.4)",
              padding: "5px 10px",
              cursor: "pointer",
            }}
          >
            ✕ CLOSE
          </button>
        </div>

        {/* Map viewport */}
        <div
          style={{
            position: "relative",
            width: "100%",
            paddingTop: "75%", // 4:3 aspect ratio = 1600:1200
            background: "#0a1a0a",
            border: "2px solid #1a3a1a",
            overflow: "hidden",
          }}
        >
          <div style={{ position: "absolute", inset: 0 }}>
            {/* Sky zone */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "30%",
                background: "linear-gradient(to bottom, #1a3a5a, #0a1a2a)",
                opacity: 0.6,
              }}
            />

            {/* Grass background */}
            <div
              style={{
                position: "absolute",
                top: "30%",
                left: 0,
                right: 0,
                bottom: 0,
                background: "#0a1f0a",
              }}
            />

            {/* Main paths (cross) */}
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: "calc(50% - 4%)",
                height: "8%",
                background: "#2a1a08",
                opacity: 0.9,
              }}
            />
            <div
              style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                left: "calc(50% - 3%)",
                width: "6%",
                background: "#2a1a08",
                opacity: 0.9,
              }}
            />

            {/* Plaza center */}
            <div
              style={{
                position: "absolute",
                left: "37.5%",
                top: "33%",
                width: "25%",
                height: "33%",
                background: "#1a1a1a",
                border: "1px solid #333",
              }}
            />

            {/* Grid overlay */}
            <svg
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                opacity: 0.08,
              }}
            >
              {[10, 20, 30, 40, 50, 60, 70, 80, 90].map((pct) => (
                <line
                  key={`v${pct}`}
                  x1={`${pct}%`}
                  y1="0"
                  x2={`${pct}%`}
                  y2="100%"
                  stroke="#39ff14"
                  strokeWidth="0.5"
                />
              ))}
              {[12.5, 25, 37.5, 50, 62.5, 75, 87.5].map((pct) => (
                <line
                  key={`h${pct}`}
                  x1="0"
                  y1={`${pct}%`}
                  x2="100%"
                  y2={`${pct}%`}
                  stroke="#39ff14"
                  strokeWidth="0.5"
                />
              ))}
            </svg>

            {/* World border */}
            <div
              style={{
                position: "absolute",
                inset: "2px",
                border: "1px solid rgba(57,255,20,0.4)",
                pointerEvents: "none",
              }}
            />

            {/* NPC building markers */}
            {NPC_CONFIGS.map((npc) => {
              const pos = NPC_MINIMAP_POSITIONS[npc.key];
              const color = NPC_COLOR_MAP[npc.key];
              const isHovered = hoveredNPC === npc.key;
              const icon = NPC_ICON[npc.key];
              return (
                <button
                  key={npc.key}
                  type="button"
                  onClick={() => handleFastTravel(npc.key)}
                  onMouseEnter={() => setHoveredNPC(npc.key)}
                  onMouseLeave={() => setHoveredNPC(null)}
                  aria-label={`Fast travel to ${npc.name}`}
                  data-ocid={`minimap.npc.${npc.key}`}
                  title={npc.name}
                  style={{
                    position: "absolute",
                    left: `${pos.x}%`,
                    top: `${pos.y}%`,
                    transform: "translate(-50%, -50%)",
                    width: isHovered ? "20px" : "14px",
                    height: isHovered ? "20px" : "14px",
                    background: isHovered ? color : `${color}33`,
                    border: `2px solid ${color}`,
                    boxShadow: isHovered
                      ? `0 0 16px ${color}, 0 0 4px ${color}`
                      : `0 0 6px ${color}55`,
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: isHovered ? "10px" : "7px",
                    padding: 0,
                  }}
                >
                  {icon}
                </button>
              );
            })}

            {/* Player dot */}
            <div
              aria-label="Your current position"
              style={{
                position: "absolute",
                left: `${playerMini.x}%`,
                top: `${playerMini.y}%`,
                transform: "translate(-50%, -50%)",
                width: "10px",
                height: "10px",
                background: "#ffd700",
                border: "2px solid #ffffff",
                borderRadius: "50%",
                boxShadow: "0 0 10px #ffd700, 0 0 20px rgba(255,215,0,0.4)",
                zIndex: 10,
                animation: "pulse 1.5s infinite",
              }}
            />
          </div>
        </div>

        {/* NPC fast travel list */}
        <div>
          <p
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "6px",
              color: "#555",
              marginBottom: "8px",
            }}
          >
            FAST TRAVEL →
          </p>
          <div className="grid grid-cols-2 gap-2">
            {NPC_CONFIGS.map((npc) => {
              const color = NPC_COLOR_MAP[npc.key];
              const icon = NPC_ICON[npc.key];
              return (
                <button
                  key={npc.key}
                  type="button"
                  onClick={() => handleFastTravel(npc.key)}
                  data-ocid={`minimap.travel.${npc.key}`}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      `${color}22`;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background =
                      "transparent";
                  }}
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: "6px",
                    color,
                    background: "transparent",
                    border: `2px solid ${color}55`,
                    padding: "7px 8px",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.1s",
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                  }}
                >
                  <span>{icon}</span>
                  <span>{npc.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <p
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "5px",
            color: "#333",
            textAlign: "center",
          }}
        >
          CLICK MARKER OR BUTTON TO TELEPORT · ESC TO CLOSE
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.3); }
        }
      `}</style>
    </dialog>
  );
}
