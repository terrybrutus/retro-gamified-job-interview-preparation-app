import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface PasteTextInputProps {
  title: string;
  description: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSave?: (content: string) => void;
  autosaveKey: string;
  maxLength?: number;
  className?: string;
}

export function PasteTextInput({
  title,
  description,
  placeholder,
  value,
  onChange,
  onSave,
  autosaveKey,
  maxLength = 10000,
  className = "",
}: PasteTextInputProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<number>(0);
  const [lastInputTime, setLastInputTime] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Simple autosave functionality using localStorage
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentional partial deps for autosave timing
  useEffect(() => {
    if (value.trim()) {
      const now = Date.now();
      setLastInputTime(now);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const timeSinceLastSave = now - lastSaveTime;

      // If it's been more than 20 seconds since last save, save immediately
      if (timeSinceLastSave >= 20000) {
        performAutosave();
      } else {
        // Otherwise, wait for user to pause typing (3 seconds of inactivity)
        timeoutRef.current = setTimeout(() => {
          const currentTime = Date.now();
          const timeSinceLastInput = currentTime - lastInputTime;

          // Only save if user has actually paused typing for 3 seconds
          if (timeSinceLastInput >= 3000) {
            performAutosave();
          }
        }, 3000);
      }
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

  // Force save every 20 seconds if there's content and user is actively typing
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const timeSinceLastSave = now - lastSaveTime;
      const timeSinceLastInput = now - lastInputTime;

      // If user has been typing and it's been 20+ seconds since last save
      if (
        value.trim() &&
        timeSinceLastSave >= 20000 &&
        timeSinceLastInput < 5000
      ) {
        performAutosave();
      }
    }, 20000);

    return () => clearInterval(interval);
  }, [value, lastSaveTime, lastInputTime]);

  const performAutosave = async () => {
    if (!value.trim()) return;

    try {
      // Save to localStorage as fallback
      localStorage.setItem(`autosave-${autosaveKey}`, value);
      localStorage.setItem(
        `autosave-${autosaveKey}-timestamp`,
        Date.now().toString(),
      );
      setLastSaveTime(Date.now());
    } catch (error) {
      console.error("Autosave failed:", error);
    }
  };

  const handleSave = async () => {
    if (!onSave || !value.trim()) return;

    setIsSaving(true);
    try {
      await onSave(value);
      toast.success("Content saved successfully!");
    } catch (_error) {
      toast.error("Failed to save content");
    } finally {
      setIsSaving(false);
    }
  };

  const characterCount = value.length;
  const isNearLimit = characterCount > maxLength * 0.8;
  const isOverLimit = characterCount > maxLength;

  return (
    <Card className={className}>
      {title && (
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            {title}
          </CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      )}
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor={`paste-${autosaveKey}`}>Content</Label>
            <Badge
              variant={
                isOverLimit
                  ? "destructive"
                  : isNearLimit
                    ? "outline"
                    : "secondary"
              }
              className="text-xs"
            >
              {characterCount.toLocaleString()} / {maxLength.toLocaleString()}{" "}
              characters
            </Badge>
          </div>
          <Textarea
            id={`paste-${autosaveKey}`}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`min-h-[200px] resize-none ${isOverLimit ? "border-destructive" : ""}`}
            maxLength={maxLength}
          />
          {isOverLimit && (
            <p className="text-sm text-destructive">
              Content exceeds maximum length. Please reduce by{" "}
              {(characterCount - maxLength).toLocaleString()} characters.
            </p>
          )}
        </div>

        {onSave && (
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving || !value.trim() || isOverLimit}
              className="flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Content
                </>
              )}
            </Button>
          </div>
        )}

        <div className="text-xs text-muted-foreground">
          Auto-saving to local storage...
        </div>
      </CardContent>
    </Card>
  );
}
