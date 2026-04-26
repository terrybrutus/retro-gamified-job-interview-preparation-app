import { useState } from "react";
import type { NPCConfig } from "../utils/Constants";

interface NPCModalProps {
  npc: NPCConfig | null;
  dialogue: string;
  isOpen: boolean;
  onClose: () => void;
  onOpenWorkflow: (workflowId: string) => void;
}

const NPC_COLOR_MAP: Record<string, string> = {
  "job-analyzer": "#39ff14",
  "resume-tailor": "#ff00ff",
  "cover-letter": "#00ffff",
  "interview-coach": "#ffbf00",
  "study-hall": "#39ff14",
};

const NPC_EMOJI_MAP: Record<string, string> = {
  "job-analyzer": "🔍",
  "resume-tailor": "✂️",
  "cover-letter": "✉️",
  "interview-coach": "🎤",
  "study-hall": "📚",
};

const WORKFLOW_LABELS: Record<string, string> = {
  agents: "ANALYZE JOB",
  resume: "MANAGE RESUME",
  "cover-letter": "BUILD COVER LETTER",
  interview: "PREP FOR INTERVIEW",
  study: "OPEN STUDY HALL",
};

export function NPCModal({
  npc,
  dialogue,
  isOpen,
  onClose,
  onOpenWorkflow,
}: NPCModalProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen || !npc) return null;

  const color = NPC_COLOR_MAP[npc.key] ?? "#39ff14";
  const emoji = NPC_EMOJI_MAP[npc.key] ?? "🤖";
  const workflowLabel = WORKFLOW_LABELS[npc.workflowId] ?? "OPEN";

  const handleWorkflow = () => {
    onOpenWorkflow(npc.workflowId);
    onClose();
  };

  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  return (
    <dialog
      open
      className="fixed inset-0 z-50 flex items-center justify-center m-0 p-0 max-w-none max-h-none w-full h-full"
      style={{ background: "rgba(0,0,0,0.75)", border: "none" }}
      aria-label={`Talk to ${npc.name}`}
      data-ocid="npc_modal.dialog"
    >
      <div
        className="absolute inset-0"
        onClick={onClose}
        onKeyDown={handleDialogKeyDown}
        role="presentation"
        aria-hidden="true"
      />

      <div
        style={{
          position: "relative",
          background: "#000",
          border: `4px solid ${color}`,
          boxShadow: `0 0 40px ${color}88, 0 0 80px ${color}33`,
          padding: "24px",
          maxWidth: "380px",
          width: "90vw",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="document"
      >
        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialogue"
          style={{
            position: "absolute",
            top: "8px",
            right: "8px",
            fontFamily: '"Orbitron", cursive',
            fontSize: "0.85em",
            color: "#ffffff",
            background: "transparent",
            border: `2px solid ${color}`,
            padding: "4px 8px",
            cursor: "pointer",
          }}
          data-ocid="npc_modal.close_button"
        >
          ✕
        </button>

        {/* NPC Portrait & Name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              background: "#0a0a0a",
              border: `3px solid ${color}`,
              boxShadow: `0 0 16px ${color}66`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2em",
              flexShrink: 0,
            }}
          >
            {emoji}
          </div>
          <div>
            <p
              style={{
                fontFamily: '"Orbitron", cursive',
                fontSize: "0.9em",
                color: "#cccccc",
                marginBottom: "6px",
              }}
            >
              TALKING TO:
            </p>
            <p
              style={{
                fontFamily: '"Orbitron", cursive',
                fontSize: "0.9em",
                color: "#ffffff",
                lineHeight: "1.6",
              }}
            >
              {npc.name}
            </p>
          </div>
        </div>

        {/* Dialogue box */}
        <div
          style={{
            background: "#12122a",
            border: `2px solid ${color}`,
            boxShadow: `inset 0 0 20px ${color}18`,
            padding: "14px 16px",
            marginBottom: "20px",
            position: "relative",
          }}
        >
          {/* Typing indicator corner */}
          <div
            style={{
              position: "absolute",
              top: "-2px",
              left: "-2px",
              width: "8px",
              height: "8px",
              background: color,
            }}
          />
          <p
            style={{
              fontFamily: '"Orbitron", cursive',
              fontSize: "1em",
              color: "#ffffff",
              lineHeight: "2.0",
              margin: 0,
              whiteSpace: "pre-wrap",
            }}
          >
            {dialogue}
          </p>
        </div>

        {/* XP reward badge */}
        <div
          style={{
            display: "inline-block",
            background: "transparent",
            border: "1px solid #ffbf0088",
            padding: "3px 8px",
            marginBottom: "16px",
          }}
        >
          <span
            style={{
              fontFamily: '"Orbitron", cursive',
              fontSize: "0.85em",
              color: "#ffbf00",
            }}
          >
            +{npc.xpReward} XP REWARD
          </span>
        </div>

        {/* Action buttons */}
        {!showConfirm ? (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={() => setShowConfirm(true)}
              data-ocid="npc_modal.primary_button"
              style={{
                flex: 1,
                fontFamily: '"Orbitron", cursive',
                fontSize: "0.85em",
                color: "#000",
                background: color,
                border: `2px solid ${color}`,
                padding: "10px 12px",
                cursor: "pointer",
                minWidth: "140px",
              }}
            >
              {workflowLabel}
            </button>
            <button
              type="button"
              onClick={onClose}
              data-ocid="npc_modal.cancel_button"
              style={{
                fontFamily: '"Orbitron", cursive',
                fontSize: "0.85em",
                color: "#cccccc",
                background: "transparent",
                border: "2px solid #555555",
                padding: "10px 12px",
                cursor: "pointer",
              }}
            >
              LATER
            </button>
          </div>
        ) : (
          <div>
            <p
              style={{
                fontFamily: '"Orbitron", cursive',
                fontSize: "0.85em",
                color: "#dddddd",
                marginBottom: "12px",
              }}
            >
              OPEN THE WORKFLOW?
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={handleWorkflow}
                data-ocid="npc_modal.confirm_button"
                style={{
                  flex: 1,
                  fontFamily: '"Orbitron", cursive',
                  fontSize: "0.85em",
                  color: "#000",
                  background: color,
                  border: `2px solid ${color}`,
                  padding: "10px 12px",
                  cursor: "pointer",
                }}
              >
                ▶ YES, LET'S GO
              </button>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                data-ocid="npc_modal.back_button"
                style={{
                  fontFamily: '"Orbitron", cursive',
                  fontSize: "0.85em",
                  color: "#cccccc",
                  background: "transparent",
                  border: "2px solid #555555",
                  padding: "10px 12px",
                  cursor: "pointer",
                }}
              >
                WAIT
              </button>
            </div>
          </div>
        )}
      </div>
    </dialog>
  );
}
