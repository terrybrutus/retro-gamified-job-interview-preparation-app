import { Button } from "@/components/ui/button";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { useGetCallerUserProfile } from "@/hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, User } from "lucide-react";
import { toast } from "sonner";

export function RetroHeader() {
  const { clear } = useInternetIdentity();
  const { data: userProfile } = useGetCallerUserProfile();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    await clear();
    queryClient.clear();
    toast.success("LOGGED OUT");
  };

  return (
    <header className="border-b-4 border-neon-green bg-black sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="retro-pixel-border p-2 bg-black">
              <User className="w-6 h-6 text-neon-green" />
            </div>
            <div>
              <h1 className="font-press-start text-neon-green text-sm">
                JOB QUEST
              </h1>
              {userProfile &&
                (userProfile.name ||
                  userProfile.displayName ||
                  userProfile.username) && (
                  <p className="font-press-start text-neon-cyan text-[8px] mt-1">
                    PLAYER:{" "}
                    {(
                      userProfile.name ||
                      userProfile.displayName ||
                      userProfile.username ||
                      ""
                    ).toUpperCase()}
                  </p>
                )}
            </div>
          </div>

          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="retro-button bg-black border-2 border-neon-magenta text-neon-magenta hover:bg-neon-magenta hover:text-black font-press-start text-[8px] touch-target"
          >
            <LogOut className="w-3 h-3 mr-2" />
            LOGOUT
          </Button>
        </div>
      </div>
    </header>
  );
}
