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
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle,
  FileText,
  Loader2,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface MasterResumeSetupProps {
  onComplete: (resume: {
    content: string;
    filename: string;
    uploadDate: string;
  }) => void;
  savedResume?: { content: string; filename: string; uploadDate: string };
  onBack: () => void;
}

export function MasterResumeSetup({
  onComplete,
  savedResume,
  onBack,
}: MasterResumeSetupProps) {
  const [resumeContent, setResumeContent] = useState(
    savedResume?.content || "",
  );
  const [filename, setFilename] = useState(
    savedResume?.filename || "resume.txt",
  );
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      const text = await file.text();
      setResumeContent(text);
      setFilename(file.name);
      toast.success("FILE LOADED!");
    } catch (_error) {
      toast.error("FAILED TO READ FILE");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleContinue = () => {
    if (!resumeContent.trim()) {
      toast.error("ENTER RESUME CONTENT");
      return;
    }

    onComplete({
      content: resumeContent,
      filename,
      uploadDate: new Date().toISOString(),
    });
  };

  return (
    <Card className="retro-card border-4 border-neon-magenta bg-black shadow-neon-magenta">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="retro-pixel-border p-3 bg-black">
            <FileText className="w-8 h-8 text-neon-magenta animate-pulse-slow" />
          </div>
          <div>
            <CardTitle className="font-press-start text-neon-magenta text-lg">
              STAGE 2: MASTER RESUME
            </CardTitle>
            <CardDescription className="font-press-start text-neon-cyan text-[8px] mt-2">
              UPLOAD OR PASTE YOUR RESUME
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="retro-alert border-2 border-neon-cyan bg-black">
          <FileText className="h-4 w-4 text-neon-cyan" />
          <AlertDescription className="font-press-start text-neon-cyan text-[8px] leading-relaxed">
            YOUR MASTER RESUME IS ALWAYS ACCESSIBLE FOR UPDATES
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="flex gap-4">
            <label className="flex-1">
              <input
                type="file"
                accept=".txt,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
              <Button
                type="button"
                variant="outline"
                className="w-full retro-button bg-black border-2 border-neon-green text-neon-green hover:bg-neon-green hover:text-black font-press-start text-xs py-4 touch-target"
                disabled={isProcessing}
                onClick={() =>
                  document
                    .querySelector<HTMLInputElement>('input[type="file"]')
                    ?.click()
                }
              >
                <Upload className="w-4 h-4 mr-2" />
                UPLOAD FILE
              </Button>
            </label>
          </div>

          <Textarea
            value={resumeContent}
            onChange={(e) => setResumeContent(e.target.value)}
            placeholder="PASTE RESUME CONTENT HERE..."
            className="retro-input bg-black border-2 border-neon-magenta text-neon-green font-mono text-sm min-h-[400px]"
            disabled={isProcessing}
          />

          {resumeContent && (
            <Alert className="retro-alert border-2 border-neon-green bg-black">
              <CheckCircle className="h-4 w-4 text-neon-green" />
              <AlertDescription className="font-press-start text-neon-green text-[8px]">
                RESUME LOADED: {filename}
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
              disabled={!resumeContent.trim()}
              className="flex-1 retro-button bg-neon-magenta text-black hover:bg-neon-cyan font-press-start text-sm py-6 touch-target"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              CONTINUE
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
