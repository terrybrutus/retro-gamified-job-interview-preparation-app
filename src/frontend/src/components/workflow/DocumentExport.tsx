import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowLeft,
  CheckCircle,
  Download,
  FileText,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AgentResults } from "./AgentWorkflow";

interface DocumentExportProps {
  agentResults: AgentResults;
  onBack: () => void;
}

export function DocumentExport({ agentResults, onBack }: DocumentExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportDocument = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      // Export all documents
      if (agentResults.resumeTailor) {
        exportDocument(agentResults.resumeTailor, "resume-branded.txt");
      }
      if (agentResults.coverLetterBuilder) {
        exportDocument(
          agentResults.coverLetterBuilder,
          "cover-letter-branded.txt",
        );
      }
      if (agentResults.brandQualityFinisher) {
        exportDocument(
          agentResults.brandQualityFinisher,
          "documents-final.txt",
        );
      }

      toast.success("DOCUMENTS EXPORTED!");
    } catch (_error) {
      toast.error("EXPORT FAILED");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="retro-card border-4 border-neon-green bg-black shadow-neon-green">
      <CardHeader>
        <CardTitle className="font-press-start text-neon-green text-lg">
          STAGE 5: DOCUMENT EXPORT
        </CardTitle>
        <CardDescription className="font-press-start text-neon-cyan text-[0.6em] mt-2">
          DOWNLOAD YOUR COMPLETED DOCUMENTS
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="retro-alert border-2 border-neon-green bg-black">
          <CheckCircle className="h-4 w-4 text-neon-green" />
          <AlertDescription className="font-press-start text-neon-green text-[0.6em] leading-relaxed">
            ALL AGENTS COMPLETE! DOCUMENTS READY FOR EXPORT
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="retro-pixel-border p-4 bg-black border-neon-green">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/assets/generated/resume-document-icon.dim_32x32.png"
                alt="Resume"
                className="w-8 h-8 pixelated"
              />
              <h3 className="font-press-start text-neon-green text-xs">
                BRANDED RESUME
              </h3>
            </div>
            <Button
              onClick={() =>
                agentResults.resumeTailor &&
                exportDocument(agentResults.resumeTailor, "resume-branded.txt")
              }
              disabled={!agentResults.resumeTailor}
              className="w-full retro-button bg-neon-green text-black hover:bg-neon-cyan font-press-start text-[0.6em] py-3"
            >
              <Download className="w-3 h-3 mr-2" />
              DOWNLOAD
            </Button>
          </div>

          <div className="retro-pixel-border p-4 bg-black border-neon-magenta">
            <div className="flex items-center gap-3 mb-3">
              <img
                src="/assets/generated/cover-letter-document-icon.dim_32x32.png"
                alt="Cover Letter"
                className="w-8 h-8 pixelated"
              />
              <h3 className="font-press-start text-neon-magenta text-xs">
                COVER LETTER
              </h3>
            </div>
            <Button
              onClick={() =>
                agentResults.coverLetterBuilder &&
                exportDocument(
                  agentResults.coverLetterBuilder,
                  "cover-letter-branded.txt",
                )
              }
              disabled={!agentResults.coverLetterBuilder}
              className="w-full retro-button bg-neon-magenta text-black hover:bg-neon-cyan font-press-start text-[0.6em] py-3"
            >
              <Download className="w-3 h-3 mr-2" />
              DOWNLOAD
            </Button>
          </div>

          <div className="retro-pixel-border p-4 bg-black border-neon-cyan">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="w-8 h-8 text-neon-cyan" />
              <h3 className="font-press-start text-neon-cyan text-xs">
                FINAL PACKAGE
              </h3>
            </div>
            <Button
              onClick={() =>
                agentResults.brandQualityFinisher &&
                exportDocument(
                  agentResults.brandQualityFinisher,
                  "documents-final.txt",
                )
              }
              disabled={!agentResults.brandQualityFinisher}
              className="w-full retro-button bg-neon-cyan text-black hover:bg-neon-amber font-press-start text-[0.6em] py-3"
            >
              <Download className="w-3 h-3 mr-2" />
              DOWNLOAD
            </Button>
          </div>

          <div className="retro-pixel-border p-4 bg-black border-neon-amber">
            <div className="flex items-center gap-3 mb-3">
              <Download className="w-8 h-8 text-neon-amber" />
              <h3 className="font-press-start text-neon-amber text-xs">
                ALL DOCUMENTS
              </h3>
            </div>
            <Button
              onClick={handleExportAll}
              disabled={isExporting}
              className="w-full retro-button bg-neon-amber text-black hover:bg-neon-green font-press-start text-[0.6em] py-3"
            >
              {isExporting ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  EXPORTING...
                </>
              ) : (
                <>
                  <Download className="w-3 h-3 mr-2" />
                  EXPORT ALL
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="flex gap-4">
          <Button
            onClick={onBack}
            variant="outline"
            className="retro-button bg-black border-2 border-neon-amber text-neon-amber hover:bg-neon-amber hover:text-black font-press-start text-xs py-4 touch-target"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK TO AGENTS
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
