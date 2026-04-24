import { FlashcardLibrary } from "@/components/FlashcardLibrary";
import { InterviewAdviceGenerator } from "@/components/InterviewAdviceGenerator";
import { NotesManager } from "@/components/NotesManager";
import { useState } from "react";
import { RetroWorkflow } from "./RetroWorkflow";

interface WorkflowPanelProps {
  workflowId: string;
  onClose: () => void;
}

type WorkflowStage =
  | "api-key"
  | "resume"
  | "job-description"
  | "agents"
  | "export";

const RETRO_STAGE_MAP: Record<string, WorkflowStage> = {
  agents: "agents",
  resume: "resume",
  "cover-letter": "job-description",
  "api-key": "api-key",
};

export function WorkflowPanel({ workflowId, onClose }: WorkflowPanelProps) {
  const [visible, setVisible] = useState(true);

  const handleClose = () => {
    setVisible(false);
    onClose();
  };

  if (!visible) return null;

  const isStudyHall = workflowId === "study";
  const isInterview = workflowId === "interview";
  const isSpecialView = isStudyHall || isInterview;
  const retryStage = RETRO_STAGE_MAP[workflowId] ?? "api-key";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 300,
        background: "#000",
        overflowY: "auto",
      }}
      data-ocid="workflow_panel"
    >
      {/* Sticky header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 310,
          background: "#000",
          borderBottom: "3px solid #39ff14",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <button
          type="button"
          onClick={handleClose}
          data-ocid="workflow_panel.close_button"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "9px",
            color: "#39ff14",
            background: "transparent",
            border: "2px solid #39ff14",
            padding: "8px 16px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          ◀ BACK TO CAREER CITY
        </button>
        <span
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "8px",
            color: "#00ffff",
          }}
        >
          {isStudyHall
            ? "STUDY HALL"
            : isInterview
              ? "INTERVIEW COACH"
              : "JOB QUEST"}
        </span>
      </div>

      <div style={{ minHeight: "calc(100vh - 60px)", padding: "24px 16px" }}>
        {isStudyHall && (
          <div
            style={{
              maxWidth: "900px",
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: "32px",
            }}
            data-ocid="study_hall.panel"
          >
            {/* Section: Flashcards */}
            <section>
              <p
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: "9px",
                  color: "#39ff14",
                  marginBottom: "16px",
                  borderBottom: "2px solid #39ff1433",
                  paddingBottom: "8px",
                }}
              >
                📚 FLASHCARDS
              </p>
              <FlashcardLibrary />
            </section>

            {/* Section: Interview Advice */}
            <section>
              <p
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: "9px",
                  color: "#ffbf00",
                  marginBottom: "16px",
                  borderBottom: "2px solid #ffbf0033",
                  paddingBottom: "8px",
                }}
              >
                🎤 INTERVIEW ADVICE
              </p>
              <InterviewAdviceGenerator />
            </section>

            {/* Section: Notes */}
            <section>
              <p
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: "9px",
                  color: "#00ffff",
                  marginBottom: "16px",
                  borderBottom: "2px solid #00ffff33",
                  paddingBottom: "8px",
                }}
              >
                📝 NOTES
              </p>
              <NotesManager />
            </section>
          </div>
        )}

        {isInterview && (
          <div
            style={{ maxWidth: "800px", margin: "0 auto" }}
            data-ocid="interview_coach.panel"
          >
            <p
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: "9px",
                color: "#ffbf00",
                marginBottom: "16px",
                borderBottom: "2px solid #ffbf0033",
                paddingBottom: "8px",
              }}
            >
              🎤 INTERVIEW ADVICE
            </p>
            <InterviewAdviceGenerator />
          </div>
        )}

        {!isSpecialView && <RetroWorkflow initialStage={retryStage} />}
      </div>
    </div>
  );
}
