import { RetroHeader } from "@/components/RetroHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { AgentWorkflow } from "@/components/workflow/AgentWorkflow";
import { ApiKeyConfig } from "@/components/workflow/ApiKeyConfig";
import { DocumentExport } from "@/components/workflow/DocumentExport";
import { JobDescriptionEntry } from "@/components/workflow/JobDescriptionEntry";
import { MasterResumeSetup } from "@/components/workflow/MasterResumeSetup";
import { useGetWorkflowState, useSaveWorkflowState } from "@/hooks/useQueries";
import { Gamepad2, Heart } from "lucide-react";
import { useEffect, useState } from "react";

export type WorkflowStage =
  | "api-key"
  | "resume"
  | "job-description"
  | "agents"
  | "export";

export interface WorkflowState {
  currentStage: WorkflowStage;
  apiKey?: string;
  apiKeyValidated?: boolean;
  availableModels?: string[];
  masterResume?: {
    content: string;
    filename: string;
    uploadDate: string;
  };
  jobDescription?: string;
  agentResults?: {
    jobAnalyzer?: string;
    resumeTailor?: string;
    coverLetterBuilder?: string;
    brandQualityFinisher?: string;
  };
  completedStages: WorkflowStage[];
}

export function RetroWorkflow({
  initialStage,
}: { initialStage?: WorkflowStage }) {
  const { data: savedState } = useGetWorkflowState();
  const saveState = useSaveWorkflowState();

  const [workflowState, setWorkflowState] = useState<WorkflowState>({
    currentStage: initialStage ?? "api-key",
    completedStages: [],
  });

  // Load saved state
  useEffect(() => {
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        // If initialStage provided, override the saved stage
        if (initialStage && initialStage !== "api-key") {
          parsed.currentStage = initialStage;
        }
        setWorkflowState(parsed);
      } catch (error) {
        console.error("Failed to parse workflow state:", error);
      }
    }
  }, [savedState, initialStage]);

  // Save state on changes
  useEffect(() => {
    const saveFn = saveState.mutate;
    const saveTimeout = setTimeout(() => {
      saveFn(JSON.stringify(workflowState));
    }, 1000);

    return () => clearTimeout(saveTimeout);
  }, [workflowState, saveState.mutate]);

  const updateWorkflowState = (updates: Partial<WorkflowState>) => {
    setWorkflowState((prev) => ({ ...prev, ...updates }));
  };

  const completeStage = (stage: WorkflowStage, nextStage: WorkflowStage) => {
    setWorkflowState((prev) => ({
      ...prev,
      completedStages: [...new Set([...prev.completedStages, stage])],
      currentStage: nextStage,
    }));
  };

  const getStageProgress = () => {
    const stages: WorkflowStage[] = [
      "api-key",
      "resume",
      "job-description",
      "agents",
      "export",
    ];
    const currentIndex = stages.indexOf(workflowState.currentStage);
    return ((currentIndex + 1) / stages.length) * 100;
  };

  const canAccessStage = (stage: WorkflowStage): boolean => {
    switch (stage) {
      case "api-key":
        return true;
      case "resume":
        return workflowState.completedStages.includes("api-key");
      case "job-description":
        return workflowState.completedStages.includes("resume");
      case "agents":
        return workflowState.completedStages.includes("job-description");
      case "export":
        return workflowState.completedStages.includes("agents");
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-black retro-scanlines">
      <RetroHeader />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Progress Bar */}
        <Card className="retro-card border-4 border-neon-cyan bg-black shadow-neon-cyan mb-8">
          <CardHeader>
            <CardTitle className="font-press-start text-neon-cyan text-sm flex items-center gap-3">
              <Gamepad2 className="w-6 h-6" />
              QUEST PROGRESS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Progress
              value={getStageProgress()}
              className="h-4 retro-progress"
            />
            <div className="flex justify-between font-press-start text-[0.6em] text-neon-green">
              <span
                className={
                  workflowState.completedStages.includes("api-key")
                    ? "text-neon-green"
                    : "text-gray-600"
                }
              >
                API KEY
              </span>
              <span
                className={
                  workflowState.completedStages.includes("resume")
                    ? "text-neon-green"
                    : "text-gray-600"
                }
              >
                RESUME
              </span>
              <span
                className={
                  workflowState.completedStages.includes("job-description")
                    ? "text-neon-green"
                    : "text-gray-600"
                }
              >
                JOB DESC
              </span>
              <span
                className={
                  workflowState.completedStages.includes("agents")
                    ? "text-neon-green"
                    : "text-gray-600"
                }
              >
                AGENTS
              </span>
              <span
                className={
                  workflowState.currentStage === "export"
                    ? "text-neon-green"
                    : "text-gray-600"
                }
              >
                EXPORT
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Current Stage */}
        <div className="animate-fade-in">
          {workflowState.currentStage === "api-key" && (
            <ApiKeyConfig
              onComplete={(apiKey, models) => {
                updateWorkflowState({
                  apiKey,
                  apiKeyValidated: true,
                  availableModels: models,
                });
                completeStage("api-key", "resume");
              }}
              savedApiKey={workflowState.apiKey}
            />
          )}

          {workflowState.currentStage === "resume" &&
            canAccessStage("resume") && (
              <MasterResumeSetup
                onComplete={(resume) => {
                  updateWorkflowState({ masterResume: resume });
                  completeStage("resume", "job-description");
                }}
                savedResume={workflowState.masterResume}
                onBack={() =>
                  setWorkflowState((prev) => ({
                    ...prev,
                    currentStage: "api-key",
                  }))
                }
              />
            )}

          {workflowState.currentStage === "job-description" &&
            canAccessStage("job-description") && (
              <JobDescriptionEntry
                onComplete={(jobDescription) => {
                  updateWorkflowState({ jobDescription });
                  completeStage("job-description", "agents");
                }}
                savedJobDescription={workflowState.jobDescription}
                onBack={() =>
                  setWorkflowState((prev) => ({
                    ...prev,
                    currentStage: "resume",
                  }))
                }
              />
            )}

          {workflowState.currentStage === "agents" &&
            canAccessStage("agents") && (
              <AgentWorkflow
                apiKey={workflowState.apiKey!}
                resume={workflowState.masterResume!.content}
                jobDescription={workflowState.jobDescription!}
                onComplete={(results) => {
                  updateWorkflowState({ agentResults: results });
                  completeStage("agents", "export");
                }}
                savedResults={workflowState.agentResults}
                onBack={() =>
                  setWorkflowState((prev) => ({
                    ...prev,
                    currentStage: "job-description",
                  }))
                }
              />
            )}

          {workflowState.currentStage === "export" &&
            canAccessStage("export") && (
              <DocumentExport
                agentResults={workflowState.agentResults!}
                onBack={() =>
                  setWorkflowState((prev) => ({
                    ...prev,
                    currentStage: "agents",
                  }))
                }
              />
            )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t-4 border-neon-green bg-black mt-16 py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-2 font-press-start text-[0.6em] text-neon-green">
            <span>© 2025 BUILT WITH</span>
            <Heart className="w-3 h-3 text-neon-magenta fill-current animate-pulse" />
            <span>USING</span>
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-neon-cyan hover:text-neon-amber transition-colors"
            >
              CAFFEINE.AI
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
