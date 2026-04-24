import Phaser from "phaser";
import { useCallback, useEffect, useRef, useState } from "react";
import { WorkflowPanel } from "../components/WorkflowPanel";
import { useGameState } from "./hooks/useGameState";
import { createPhaserConfig } from "./index";
import { MinimapOverlay } from "./ui/MinimapOverlay";
import { NPCModal } from "./ui/NPCModal";
import { TouchControls } from "./ui/TouchControls";
import { GAME_EVENTS, XP_REWARDS } from "./utils/Constants";
import type { NPCConfig } from "./utils/Constants";

interface NPCInteractEvent {
  npc: NPCConfig;
  dialogue: string;
}

const CANVAS_ID = "game-canvas";

export function GameContainer() {
  const gameRef = useRef<Phaser.Game | null>(null);
  const [showMinimap, setShowMinimap] = useState(false);
  const [npcModal, setNPCModal] = useState<NPCInteractEvent | null>(null);
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
    const handleNPCInteract = (e: Event) => {
      const { npc, dialogue } = (e as CustomEvent<NPCInteractEvent>).detail;
      setNPCModal({ npc, dialogue });
    };

    const handleMinimapToggle = () => {
      setShowMinimap((v) => !v);
    };

    const handleXPGained = (e: Event) => {
      const { amount } = (e as CustomEvent<{ amount: number; reason: string }>)
        .detail;
      addXP(amount);
    };

    window.addEventListener(GAME_EVENTS.NPC_INTERACT, handleNPCInteract);
    window.addEventListener(GAME_EVENTS.MINIMAP_TOGGLE, handleMinimapToggle);
    window.addEventListener(GAME_EVENTS.XP_GAINED, handleXPGained);

    return () => {
      window.removeEventListener(GAME_EVENTS.NPC_INTERACT, handleNPCInteract);
      window.removeEventListener(
        GAME_EVENTS.MINIMAP_TOGGLE,
        handleMinimapToggle,
      );
      window.removeEventListener(GAME_EVENTS.XP_GAINED, handleXPGained);
    };
  }, [addXP]);

  const handleOpenWorkflow = useCallback((workflowId: string) => {
    setActiveWorkflow(workflowId);
    setNPCModal(null);
    // Award XP for opening a workflow from an NPC
    const event = new CustomEvent(GAME_EVENTS.XP_GAINED, {
      detail: { amount: XP_REWARDS.INTERACT_NPC, reason: "NPC Interaction" },
    });
    window.dispatchEvent(event);
  }, []);

  const handleCloseWorkflow = () => {
    setActiveWorkflow(null);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        background: "#000",
        overflow: "hidden",
      }}
      data-ocid="game_container"
    >
      {/* Phaser canvas mount point */}
      <div
        id={CANVAS_ID}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />

      {/* Touch D-pad (mobile only) */}
      <TouchControls />

      {/* Persistent HUD quick-access buttons */}
      <div
        style={{
          position: "absolute",
          top: "12px",
          right: "12px",
          zIndex: 200,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
        }}
        data-ocid="game_hud.quick_access"
      >
        <button
          type="button"
          onClick={() => handleOpenWorkflow("resume")}
          data-ocid="game_hud.master_resume_button"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "7px",
            color: "#ff00ff",
            background: "rgba(0,0,0,0.85)",
            border: "2px solid #ff00ff",
            boxShadow: "0 0 8px #ff00ff66",
            padding: "7px 10px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            minWidth: "140px",
            textAlign: "center",
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
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "7px",
            color: "#39ff14",
            background: "rgba(0,0,0,0.85)",
            border: "2px solid #39ff14",
            boxShadow: "0 0 8px #39ff1466",
            padding: "7px 10px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            minWidth: "140px",
            textAlign: "center",
          }}
          title="Open Study Materials"
        >
          📚 STUDY MATERIALS
        </button>
      </div>

      {/* Minimap overlay */}
      <MinimapOverlay
        isOpen={showMinimap}
        onClose={() => setShowMinimap(false)}
      />

      {/* NPC dialogue modal */}
      <NPCModal
        npc={npcModal?.npc ?? null}
        dialogue={npcModal?.dialogue ?? ""}
        isOpen={!!npcModal}
        onClose={() => setNPCModal(null)}
        onOpenWorkflow={handleOpenWorkflow}
      />

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
