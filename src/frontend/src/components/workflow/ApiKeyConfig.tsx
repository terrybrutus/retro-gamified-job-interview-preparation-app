import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSaveApiKey } from "@/hooks/useQueries";
import {
  AlertTriangle,
  CheckCircle,
  Key,
  Loader2,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ApiKeyConfigProps {
  onComplete: (apiKey: string, models: string[]) => void;
  savedApiKey?: string;
}

export function ApiKeyConfig({ onComplete, savedApiKey }: ApiKeyConfigProps) {
  const [apiKey, setApiKey] = useState(savedApiKey || "");
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const saveApiKey = useSaveApiKey();

  const validateApiKey = async () => {
    if (!apiKey.trim()) {
      toast.error("ENTER API KEY");
      return;
    }

    setIsValidating(true);
    setValidationError(null);

    try {
      // Test API key with ListModels endpoint
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey.trim()}`,
        { method: "GET" },
      );

      if (!response.ok) {
        throw new Error("INVALID API KEY");
      }

      const data = await response.json();
      const models = data.models?.map((m: any) => m.name) || [];

      if (models.length === 0) {
        throw new Error("NO MODELS AVAILABLE");
      }

      setAvailableModels(models);

      // Save to backend
      await saveApiKey.mutateAsync(apiKey.trim());

      toast.success("API KEY VALIDATED!");
      onComplete(apiKey.trim(), models);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "VALIDATION FAILED";
      setValidationError(message);
      toast.error(message);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card className="retro-card border-4 border-neon-green bg-black shadow-neon-green">
      <CardHeader>
        <div className="flex items-center gap-4">
          <div className="retro-pixel-border p-3 bg-black">
            <Key className="w-8 h-8 text-neon-green animate-pulse-slow" />
          </div>
          <div>
            <CardTitle className="font-press-start text-neon-green text-lg">
              STAGE 1: API KEY CONFIG
            </CardTitle>
            <CardDescription className="font-press-start text-neon-cyan text-[0.6em] mt-2">
              CONFIGURE GEMINI API ACCESS
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="retro-alert border-2 border-neon-cyan bg-black">
          <Sparkles className="h-4 w-4 text-neon-cyan" />
          <AlertDescription className="font-press-start text-neon-cyan text-[0.6em] leading-relaxed">
            ENTER YOUR GEMINI API KEY TO POWER THE AI AGENTS
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label
              htmlFor="api-key"
              className="font-press-start text-neon-green text-xs"
            >
              GEMINI API KEY
            </Label>
            <Input
              id="api-key"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="ENTER API KEY"
              className="retro-input bg-black border-2 border-neon-green text-neon-green font-mono text-sm"
              disabled={isValidating}
            />
          </div>

          {validationError && (
            <Alert className="retro-alert border-2 border-neon-magenta bg-black">
              <AlertTriangle className="h-4 w-4 text-neon-magenta" />
              <AlertDescription className="font-press-start text-neon-magenta text-[0.6em]">
                {validationError}
              </AlertDescription>
            </Alert>
          )}

          {availableModels.length > 0 && (
            <Alert className="retro-alert border-2 border-neon-green bg-black">
              <CheckCircle className="h-4 w-4 text-neon-green" />
              <AlertDescription className="font-press-start text-neon-green text-[0.6em]">
                {availableModels.length} MODELS DETECTED
              </AlertDescription>
            </Alert>
          )}

          <Button
            onClick={validateApiKey}
            disabled={isValidating || !apiKey.trim()}
            className="w-full retro-button bg-neon-green text-black hover:bg-neon-cyan font-press-start text-sm py-6 touch-target"
          >
            {isValidating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                VALIDATING...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                VALIDATE & CONTINUE
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
