import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, ArrowRight, Briefcase, CheckCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface JobDescriptionEntryProps {
  onComplete: (jobDescription: string) => void;
  savedJobDescription?: string;
  onBack: () => void;
}

export function JobDescriptionEntry({
  onComplete,
  savedJobDescription,
  onBack,
}: JobDescriptionEntryProps) {
  const [jobDescription, setJobDescription] = useState(
    savedJobDescription || "",
  );

  const handleContinue = () => {
    if (!jobDescription.trim()) {
      toast.error("ENTER JOB DESCRIPTION");
      return;
    }

    onComplete(jobDescription);
  };

  return (
    <Card className="retro-card border-4 border-neon-cyan bg-black shadow-neon-cyan">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="retro-pixel-border p-3 bg-black">
            <Briefcase className="w-8 h-8 text-neon-cyan animate-pulse-slow" />
          </div>
          <div>
            <CardTitle className="font-press-start text-neon-cyan text-lg">
              STAGE 3: JOB DESCRIPTION
            </CardTitle>
            <CardDescription className="font-press-start text-neon-magenta text-[8px] mt-2">
              ENTER TARGET JOB DETAILS
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="retro-alert border-2 border-neon-green bg-black">
          <Briefcase className="h-4 w-4 text-neon-green" />
          <AlertDescription className="font-press-start text-neon-green text-[8px] leading-relaxed">
            PASTE THE FULL JOB DESCRIPTION FOR AI ANALYSIS
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <Textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="PASTE JOB DESCRIPTION HERE..."
            className="retro-input bg-black border-2 border-neon-cyan text-neon-green font-mono text-sm min-h-[400px]"
          />

          {jobDescription && (
            <Alert className="retro-alert border-2 border-neon-green bg-black">
              <CheckCircle className="h-4 w-4 text-neon-green" />
              <AlertDescription className="font-press-start text-neon-green text-[8px]">
                JOB DESCRIPTION LOADED ({jobDescription.length} CHARS)
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-4">
            <Button
              onClick={onBack}
              variant="outline"
              className="retro-button bg-black border-2 border-neon-amber text-neon-amber hover:bg-neon-amber hover:text-black font-press-start text-xs py-4 touch-target"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              BACK
            </Button>
            <Button
              onClick={handleContinue}
              disabled={!jobDescription.trim()}
              className="flex-1 retro-button bg-neon-cyan text-black hover:bg-neon-magenta font-press-start text-sm py-6 touch-target"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              START AGENTS
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
