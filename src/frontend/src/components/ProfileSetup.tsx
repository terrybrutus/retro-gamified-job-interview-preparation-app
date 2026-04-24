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
import { useSaveCallerUserProfile } from "@/hooks/useQueries";
import { Loader2, User } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export function ProfileSetup() {
  const [name, setName] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("PLEASE ENTER YOUR NAME");
      return;
    }

    try {
      await saveProfile.mutateAsync({ name: name.trim() });
      toast.success("PROFILE CREATED!");
    } catch (_error) {
      toast.error("FAILED TO CREATE PROFILE");
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 retro-scanlines">
      <div className="w-full max-w-md">
        <Card className="retro-card border-4 border-neon-magenta bg-black shadow-neon-magenta">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="retro-pixel-border p-4 bg-black">
                <User className="w-16 h-16 text-neon-magenta animate-pulse-slow" />
              </div>
            </div>
            <CardTitle className="font-press-start text-neon-magenta text-xl">
              PLAYER SETUP
            </CardTitle>
            <CardDescription className="font-press-start text-neon-cyan text-xs">
              ENTER YOUR NAME
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="font-press-start text-neon-green text-xs"
                >
                  NAME
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="ENTER NAME"
                  className="retro-input bg-black border-2 border-neon-green text-neon-green font-press-start text-sm"
                  maxLength={50}
                />
              </div>
              <Button
                type="submit"
                disabled={saveProfile.isPending || !name.trim()}
                className="w-full retro-button bg-neon-magenta text-black hover:bg-neon-cyan font-press-start text-sm py-6 touch-target"
              >
                {saveProfile.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    SAVING...
                  </>
                ) : (
                  "START GAME"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
