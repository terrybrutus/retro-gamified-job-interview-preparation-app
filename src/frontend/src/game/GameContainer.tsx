import Phaser from "phaser";
import { useCallback, useEffect, useRef, useState } from "react";
import { WorkflowPanel } from "../components/WorkflowPanel";
import { useGameState } from "./hooks/useGameState";
import { createPhaserConfig } from "./index";
import { musicManager } from "./managers/MusicManager";
import { MinimapOverlay } from "./ui/MinimapOverlay";
import { MusicHUD } from "./ui/MusicHUD";
import { TouchControls } from "./ui/TouchControls";
import { GAME_EVENTS, XP_REWARDS } from "./utils/Constants";

const CANVAS_ID = "game-canvas";

export function GameContainer() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [showMinimap, setShowMinimap] = useState(false);
  const [activeWorkflow, setActiveWorkflow] = useState<string | null>(null);

  const { addXP, totalXP, careerLevel } = useGameState();

  // Initialize Phaser
  useEffect(() => {
    if (gameRef.current) return;

    const config = createPhaserConfig(CANVAS_ID);
    gameRef.current = new Phaser.Game(config);

    return () => {
      gameRef.current?.destroy(true);
      gameRef.current = null;
    };
  }, []);

  // Sync backend XP to Phaser HUD after query resolves
  useEffect(() => {
    if (totalXP > 0) {
      window.dispatchEvent(
        new CustomEvent("hud:setXP", {
          detail: { xp: totalXP, level: careerLevel },
        }),
      );
    }
  }, [totalXP, careerLevel]);

  // Wire Phaser → React events
  useEffect(() => {
    const handleMinimapToggle = () => {
      setShowMinimap((v) => !v);
    };

    const handleXPGained = (e: Event) => {
      const { amount } = (e as CustomEvent<{ amount: number; reason: string }>)
        .detail;
      addXP(amount);
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

  // Any interaction on the container unlocks audio
  const handleInteraction = useCallback(() => {
    musicManager.resumeAudioContextAndPlay();
  }, []);

  const handleOpenWorkflow = useCallback((workflowId: string) => {
    setActiveWorkflow(workflowId);
    window.dispatchEvent(
      new CustomEvent(GAME_EVENTS.XP_GAINED, {
        detail: { amount: XP_REWARDS.INTERACT_NPC, reason: "NPC Interaction" },
      }),
    );
  }, []);

  const handleCloseWorkflow = () => {
    setActiveWorkflow(null);
  };

  return (
    <div
      role="presentation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        background: "#000",
        overflow: "hidden",
        margin: 0,
        padding: 0,
      }}
      data-ocid="game_container"
      onClick={handleInteraction}
      onKeyDown={handleInteraction}
      onTouchStart={handleInteraction}
      onPointerDown={handleInteraction}
    >
      {/* Phaser canvas mount point — fills full viewport */}
      <div
        id={CANVAS_ID}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
      />

      {/* Hamburger menu + first-visit tutorial + invisible touch swipe */}
      <TouchControls />

      {/* Persistent HUD quick-access buttons — top right, stacked vertically */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          alignItems: "flex-end",
        }}
        data-ocid="game_hud.quick_access"
      >
        <button
          type="button"
          onClick={() => handleOpenWorkflow("resume")}
          data-ocid="game_hud.master_resume_button"
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "9px",
            color: "#ff00ff",
            background: "rgba(0,0,0,0.88)",
            border: "2px solid #ff00ff",
            boxShadow: "0 0 8px #ff00ff55",
            padding: "7px 10px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            width: "152px",
            textAlign: "center",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
          title="Open Master Resume"
        >
          📄 MASTER RESUME
        </button>
        <button
          type="button"
          onClick={() => handleOpenWorkflow("study")}
          data-ocid="game_hud.study_materials_button"
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "9px",
            color: "#39ff14",
            background: "rgba(0,0,0,0.88)",
            border: "2px solid #39ff14",
            boxShadow: "0 0 8px #39ff1455",
            padding: "7px 10px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            width: "152px",
            textAlign: "center",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
          title="Open Study Materials"
        >
          📚 STUDY MATERIALS
        </button>
        <button
          type="button"
          onClick={() => setShowMinimap((v) => !v)}
          data-ocid="game_hud.map_button"
          style={{
            fontFamily: "Orbitron, sans-serif",
            fontSize: "9px",
            color: "#00ffff",
            background: "rgba(0,0,0,0.88)",
            border: "2px solid #00ffff",
            boxShadow: "0 0 8px #00ffff55",
            padding: "7px 10px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            width: "152px",
            textAlign: "center",
            fontWeight: 700,
            letterSpacing: "0.05em",
          }}
          title="Toggle minimap"
        >
          🗺️ MAP
        </button>
      </div>

      {/* Minimap overlay */}
      <MinimapOverlay
        isOpen={showMinimap}
        onClose={() => setShowMinimap(false)}
      />

      {/* Music HUD — bottom right, above XP bar */}
      <MusicHUD />

      {/* Workflow panel (opens over game) */}
      {activeWorkflow && (
        <WorkflowPanel
          workflowId={activeWorkflow}
          onClose={handleCloseWorkflow}
        />
      )}
    </div>
  );
}
