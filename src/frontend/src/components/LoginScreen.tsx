import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { Gamepad2, Loader2 } from "lucide-react";

export function LoginScreen() {
  const { login, loginStatus } = useInternetIdentity();

  const isLoggingIn = loginStatus === "logging-in";

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 retro-scanlines">
      <div className="w-full max-w-md">
        <Card className="retro-card border-4 border-neon-green bg-black shadow-neon-green">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="retro-pixel-border p-4 bg-black">
                <Gamepad2 className="w-16 h-16 text-neon-green animate-pulse-slow" />
              </div>
            </div>
            <CardTitle className="font-press-start text-neon-green text-xl">
              JOB QUEST
            </CardTitle>
            <CardDescription className="font-press-start text-neon-cyan text-xs">
              RETRO INTERVIEW PREP
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <p className="font-press-start text-neon-magenta text-xs leading-relaxed">
                PRESS START TO BEGIN YOUR JOURNEY
              </p>
              <Button
                onClick={login}
                disabled={isLoggingIn}
                className="w-full retro-button bg-neon-green text-black hover:bg-neon-cyan font-press-start text-sm py-6 touch-target"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    CONNECTING...
                  </>
                ) : (
                  "PRESS START"
                )}
              </Button>
            </div>
            <div className="text-center">
              <p className="font-press-start text-neon-amber text-[0.6em] leading-relaxed">
                POWERED BY INTERNET IDENTITY
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
