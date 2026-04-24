import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useSaveAgentResult } from "@/hooks/useQueries";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AgentWorkflowProps {
  apiKey: string;
  resume: string;
  jobDescription: string;
  onComplete: (results: AgentResults) => void;
  savedResults?: AgentResults;
  onBack: () => void;
}

export interface AgentResults {
  jobAnalyzer?: string;
  resumeTailor?: string;
  coverLetterBuilder?: string;
  brandQualityFinisher?: string;
}

type AgentStage =
  | "job-analyzer"
  | "resume-tailor"
  | "cover-letter-builder"
  | "brand-quality-finisher"
  | "complete";

const AGENT_CONFIG = {
  "job-analyzer": {
    name: "JOB ANALYZER",
    avatar: "/assets/generated/job-analyzer-avatar.dim_64x64.png",
    color: "neon-green",
    description: "ANALYZING JOB REQUIREMENTS",
  },
  "resume-tailor": {
    name: "RESUME TAILOR",
    avatar: "/assets/generated/resume-tailor-avatar.dim_64x64.png",
    color: "neon-magenta",
    description: "TAILORING RESUME",
  },
  "cover-letter-builder": {
    name: "COVER LETTER BUILDER",
    avatar: "/assets/generated/cover-letter-builder-avatar.dim_64x64.png",
    color: "neon-cyan",
    description: "BUILDING COVER LETTER",
  },
  "brand-quality-finisher": {
    name: "BRAND & QUALITY FINISHER",
    avatar: "/assets/generated/brand-quality-finisher-avatar.dim_64x64.png",
    color: "neon-amber",
    description: "FINALIZING DOCUMENTS",
  },
};

export function AgentWorkflow({
  apiKey,
  resume,
  jobDescription,
  onComplete,
  savedResults,
  onBack,
}: AgentWorkflowProps) {
  const [currentStage, setCurrentStage] = useState<AgentStage>("job-analyzer");
  const [results, setResults] = useState<AgentResults>(savedResults || {});
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const saveAgentResult = useSaveAgentResult();

  useEffect(() => {
    if (savedResults) {
      // Determine current stage based on saved results
      if (!savedResults.jobAnalyzer) {
        setCurrentStage("job-analyzer");
      } else if (!savedResults.resumeTailor) {
        setCurrentStage("resume-tailor");
      } else if (!savedResults.coverLetterBuilder) {
        setCurrentStage("cover-letter-builder");
      } else if (!savedResults.brandQualityFinisher) {
        setCurrentStage("brand-quality-finisher");
      } else {
        setCurrentStage("complete");
      }
    }
  }, [savedResults]);

  const callGeminiAPI = async (prompt: string): Promise<string> => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      },
    );

    if (!response.ok) {
      throw new Error("API CALL FAILED");
    }

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }

    return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  };

  const executeAgent = async (stage: AgentStage) => {
    setIsProcessing(true);
    setError(null);

    try {
      let prompt = "";
      let result = "";

      switch (stage) {
        case "job-analyzer":
          prompt = `Analyze this job description and extract key requirements, skills, and qualifications:\n\n${jobDescription}`;
          result = await callGeminiAPI(prompt);
          setResults((prev) => ({ ...prev, jobAnalyzer: result }));
          await saveAgentResult.mutateAsync({
            agentId: "job-analyzer",
            result,
          });
          setCurrentStage("resume-tailor");
          break;

        case "resume-tailor":
          prompt = `Tailor this resume to match the job requirements:\n\nJob Analysis:\n${results.jobAnalyzer}\n\nResume:\n${resume}`;
          result = await callGeminiAPI(prompt);
          setResults((prev) => ({ ...prev, resumeTailor: result }));
          await saveAgentResult.mutateAsync({
            agentId: "resume-tailor",
            result,
          });
          setCurrentStage("cover-letter-builder");
          break;

        case "cover-letter-builder":
          prompt = `You're writing a cover letter for me. I'm an experienced instructional designer with a tone that's confident, direct, personable, and never robotic or overly polished.

Here is the job analysis:
${results.jobAnalyzer}

Here is my tailored resume:
${results.resumeTailor}

RULES YOU MUST FOLLOW — NO EXCEPTIONS:

1. Write in FIRST PERSON ONLY. Never refer to "the candidate" or use third person.
2. DO NOT mention the company name anywhere in the body of the letter. I'm speaking directly to the people there — I don't need to reference them in third person.
3. ALWAYS include my portfolio and work samples, formatted exactly like this:
   • Portfolio: http://www.instructionaldesignbyterry.com/
   • Why Blockchain Actually Matters – https://whyblockchainmatters-by-terrybrutus.netlify.app/
   • AI and the Future of Work – https://terrybrutus-aiandthefuture-sample.netlify.app/#/
4. MATCH MY TONE EXACTLY — confident, direct, and human. Short sentences. Natural language. Examples of my voice: "I can do this." "I've done this before — happy to walk through how I'd approach it." NOT: "I'm excited to apply for this opportunity" or "I'm not just clicking through blocks."
5. NO filler transitions. No phrases like "I'm a great fit" or "This role aligns with my passion." If it sounds like a template, cut it.
6. NO robotic, AI-sounding language. If it reads like AI wrote it, it's wrong. Rewrite it.
7. ONLY include a smart, unanswered question if the job description genuinely leaves something important out. To decide: read the job post carefully, do not assume, do not infer. If the answer is already in the post — do not ask it. If asking on LinkedIn or Indeed, only add a question if it feels completely natural at the end.
8. Keep it tight. No fluff. No motivational filler. Say exactly what needs to be said and stop.

Job description context for reference:
${jobDescription}

Write the cover letter now. Make it sound like a real, confident human wrote it.`;
          result = await callGeminiAPI(prompt);
          setResults((prev) => ({ ...prev, coverLetterBuilder: result }));
          await saveAgentResult.mutateAsync({
            agentId: "cover-letter-builder",
            result,
          });
          setCurrentStage("brand-quality-finisher");
          break;

        case "brand-quality-finisher":
          prompt = `Polish and finalize these documents for professional presentation:\n\nResume:\n${results.resumeTailor}\n\nCover Letter:\n${results.coverLetterBuilder}`;
          result = await callGeminiAPI(prompt);
          setResults((prev) => ({ ...prev, brandQualityFinisher: result }));
          await saveAgentResult.mutateAsync({
            agentId: "brand-quality-finisher",
            result,
          });
          setCurrentStage("complete");
          break;
      }

      toast.success(`${AGENT_CONFIG[stage].name} COMPLETE!`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "AGENT FAILED";
      setError(message);
      toast.error(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    executeAgent(currentStage as Exclude<AgentStage, "complete">);
  };

  const handleContinue = () => {
    onComplete(results);
  };

  const getProgress = () => {
    const stages = [
      "job-analyzer",
      "resume-tailor",
      "cover-letter-builder",
      "brand-quality-finisher",
    ];
    const completedCount = stages.filter(
      (stage) => results[stage as keyof AgentResults],
    ).length;
    return (completedCount / stages.length) * 100;
  };

  return (
    <Card className="retro-card border-4 border-neon-amber bg-black shadow-neon-amber">
      <CardHeader>
        <CardTitle className="font-press-start text-neon-amber text-lg">
          STAGE 4: AGENT WORKFLOW
        </CardTitle>
        <CardDescription className="font-press-start text-neon-cyan text-[8px] mt-2">
          AI AGENTS PROCESSING YOUR APPLICATION
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Progress value={getProgress()} className="h-4 retro-progress" />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(AGENT_CONFIG).map(([key, config]) => {
            const isComplete = !!results[key as keyof AgentResults];
            const isCurrent = currentStage === key;
            const isProcessingCurrent = isCurrent && isProcessing;

            return (
              <div
                key={key}
                className={`retro-pixel-border p-4 ${
                  isComplete
                    ? "bg-black border-neon-green"
                    : isCurrent
                      ? "bg-black border-neon-cyan animate-pulse"
                      : "bg-black border-gray-600"
                }`}
              >
                <div className="flex items-center gap-3">
                  <img
                    src={config.avatar}
                    alt={config.name}
                    className="w-12 h-12 pixelated"
                  />
                  <div className="flex-1">
                    <h3
                      className={`font-press-start text-xs ${isComplete ? "text-neon-green" : isCurrent ? "text-neon-cyan" : "text-gray-600"}`}
                    >
                      {config.name}
                    </h3>
                    <p className="font-press-start text-[8px] text-gray-400 mt-1">
                      {isComplete
                        ? "COMPLETE"
                        : isCurrent
                          ? config.description
                          : "WAITING"}
                    </p>
                  </div>
                  {isComplete && (
                    <CheckCircle className="w-5 h-5 text-neon-green" />
                  )}
                  {isProcessingCurrent && (
                    <Loader2 className="w-5 h-5 text-neon-cyan animate-spin" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <Alert className="retro-alert border-2 border-neon-magenta bg-black">
            <AlertTriangle className="h-4 w-4 text-neon-magenta" />
            <AlertDescription className="font-press-start text-neon-magenta text-[8px]">
              {error}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            disabled={isProcessing}
            className="retro-button bg-black border-2 border-neon-amber text-neon-amber hover:bg-neon-amber hover:text-black font-press-start text-xs py-4 touch-target"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK
          </Button>

          {currentStage !== "complete" && !error && (
            <Button
              onClick={() =>
                executeAgent(currentStage as Exclude<AgentStage, "complete">)
              }
              disabled={isProcessing}
              className="flex-1 retro-button bg-neon-amber text-black hover:bg-neon-cyan font-press-start text-sm py-6 touch-target"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  PROCESSING...
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  RUN{" "}
                  {AGENT_CONFIG[currentStage as keyof typeof AGENT_CONFIG].name}
                </>
              )}
            </Button>
          )}

          {error && (
            <Button
              onClick={handleRetry}
              className="flex-1 retro-button bg-neon-magenta text-black hover:bg-neon-cyan font-press-start text-sm py-6 touch-target"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              RETRY
            </Button>
          )}

          {currentStage === "complete" && (
            <Button
              onClick={handleContinue}
              className="flex-1 retro-button bg-neon-green text-black hover:bg-neon-cyan font-press-start text-sm py-6 touch-target"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              EXPORT DOCUMENTS
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
