import { LoginScreen } from "@/components/LoginScreen";
import { GameContainer } from "@/game/GameContainer";
import { useInternetIdentity } from "@/hooks/useInternetIdentity";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { Toaster } from "sonner";

function AppContent() {
  const { identity, loginStatus, isInitializing } = useInternetIdentity();

  const isAuthenticated = !!identity;

  // Suppress unused variable — loginStatus used to ensure hook runs
  void loginStatus;

  if (isInitializing) {
    return (
      <div
        className="min-h-screen bg-black flex items-center justify-center"
        data-ocid="app.loading_state"
      >
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-neon-green mx-auto" />
          <p className="text-neon-green font-press-start text-sm">LOADING...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  return <GameContainer />;
}

function App() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      forcedTheme="dark"
    >
      <AppContent />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#000000",
            color: "#39FF14",
            border: "2px solid #39FF14",
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "0.7em",
          },
        }}
      />
    </ThemeProvider>
  );
}

export default App;
