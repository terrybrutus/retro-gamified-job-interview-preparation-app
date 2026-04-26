import { useCallback, useEffect, useRef, useState } from "react";

type Direction = "up" | "down" | "left" | "right";

interface ButtonState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

const TUTORIAL_KEY = "careerCityTutorialSeen";

function dispatch(direction: Direction, pressed: boolean) {
  window.dispatchEvent(
    new CustomEvent("game:move", { detail: { direction, pressed } }),
  );
}

function dispatchInteract() {
  window.dispatchEvent(new CustomEvent("game:interact"));
}

/** Invisible touch swipe layer for mobile movement — no visible buttons */
function TouchSwipeLayer() {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const activeDir = useRef<Direction | null>(null);

  const releaseActive = useCallback(() => {
    if (activeDir.current) {
      dispatch(activeDir.current, false);
      activeDir.current = null;
    }
  }, []);

  useEffect(() => {
    const handleStart = (e: TouchEvent) => {
      const t = e.touches[0];
      touchStart.current = { x: t.clientX, y: t.clientY };
    };

    const handleMove = (e: TouchEvent) => {
      if (!touchStart.current) return;
      const t = e.touches[0];
      const dx = t.clientX - touchStart.current.x;
      const dy = t.clientY - touchStart.current.y;
      const thresh = 18;

      let newDir: Direction | null = null;
      if (Math.abs(dx) > thresh || Math.abs(dy) > thresh) {
        if (Math.abs(dx) > Math.abs(dy)) {
          newDir = dx > 0 ? "right" : "left";
        } else {
          newDir = dy > 0 ? "down" : "up";
        }
      }

      if (newDir !== activeDir.current) {
        releaseActive();
        if (newDir) {
          dispatch(newDir, true);
          activeDir.current = newDir;
        }
      }
    };

    const handleEnd = () => {
      releaseActive();
      touchStart.current = null;
    };

    document.addEventListener("touchstart", handleStart, { passive: true });
    document.addEventListener("touchmove", handleMove, { passive: true });
    document.addEventListener("touchend", handleEnd);
    document.addEventListener("touchcancel", handleEnd);

    return () => {
      document.removeEventListener("touchstart", handleStart);
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("touchend", handleEnd);
      document.removeEventListener("touchcancel", handleEnd);
    };
  }, [releaseActive]);

  useEffect(() => {
    const releaseAll = () => {
      const dirs: Direction[] = ["up", "down", "left", "right"];
      for (const dir of dirs) dispatch(dir, false);
      activeDir.current = null;
    };
    window.addEventListener("blur", releaseAll);
    return () => window.removeEventListener("blur", releaseAll);
  }, []);

  // Double-tap to interact
  const lastTap = useRef(0);
  const handleTouchTap = useCallback((e: React.TouchEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      e.preventDefault();
      dispatchInteract();
    }
    lastTap.current = now;
  }, []);

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 10,
        pointerEvents: "none",
      }}
      onTouchEnd={handleTouchTap}
      aria-hidden="true"
    />
  );
}

export function TouchControls() {
  const btnState = useRef<ButtonState>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const [showTutorial, setShowTutorial] = useState(false);

  // First-visit tutorial
  useEffect(() => {
    const seen = localStorage.getItem(TUTORIAL_KEY);
    if (!seen) {
      const t = window.setTimeout(() => setShowTutorial(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const dismissTutorial = useCallback(() => {
    localStorage.setItem(TUTORIAL_KEY, "1");
    setShowTutorial(false);
  }, []);

  // Release all on blur
  useEffect(() => {
    const releaseAll = () => {
      const dirs: Direction[] = ["up", "down", "left", "right"];
      for (const dir of dirs) {
        if (btnState.current[dir]) {
          btnState.current[dir] = false;
          dispatch(dir, false);
        }
      }
    };
    window.addEventListener("blur", releaseAll);
    return () => window.removeEventListener("blur", releaseAll);
  }, []);

  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 400,
    background: "rgba(0,0,0,0.82)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };

  const panelStyle: React.CSSProperties = {
    background: "#000",
    border: "3px solid #ffbf00",
    boxShadow: "0 0 40px #ffbf0044",
    padding: "28px 32px",
    maxWidth: "420px",
    width: "90vw",
    fontFamily: "Orbitron, sans-serif",
  };

  return (
    <>
      {/* Invisible swipe layer for mobile movement */}
      <TouchSwipeLayer />

      {/* First-visit tutorial overlay */}
      {showTutorial && (
        <dialog
          open
          style={{
            ...overlayStyle,
            background: "rgba(0,0,0,0.82)",
            border: "none",
            margin: 0,
            padding: 0,
            maxWidth: "none",
            maxHeight: "none",
            width: "100%",
            height: "100%",
          }}
          aria-label="Welcome tutorial"
          data-ocid="tutorial.dialog"
        >
          <div style={panelStyle}>
            <h2
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "1.05em",
                color: "#ffbf00",
                marginBottom: "20px",
                letterSpacing: "0.05em",
                fontWeight: 700,
              }}
            >
              ⭐ WELCOME TO CAREER CITY
            </h2>
            <p
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "0.75em",
                color: "#cccccc",
                lineHeight: 1.8,
                marginBottom: "16px",
              }}
            >
              Job hunting is a grind. We made it a game.
            </p>
            <p
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "0.7em",
                color: "#888",
                lineHeight: 1.8,
                marginBottom: "20px",
              }}
            >
              Walk around Career City and visit the agent buildings to tailor
              your resume, build cover letters, prep for interviews, and analyze
              job descriptions. Earn XP as you go. The robots are judging you —
              might as well look good.
            </p>
            <div style={{ marginBottom: "20px" }}>
              {[
                { icon: "⌨️", text: "WASD or Arrow Keys to move" },
                { icon: "🖱️", text: "Click and drag to pan the map" },
                { icon: "🎮", text: "E / Space to interact with NPCs" },
                { icon: "🗺️", text: "[ MAP ] button for fast travel" },
                { icon: "📱", text: "Swipe on mobile to move" },
              ].map((tip) => (
                <div
                  key={tip.text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    marginBottom: "8px",
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "0.7em",
                    color: "#aaaaaa",
                  }}
                >
                  <span style={{ fontSize: "1.1em", flexShrink: 0 }}>
                    {tip.icon}
                  </span>
                  <span>{tip.text}</span>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={dismissTutorial}
              data-ocid="tutorial.start_button"
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "0.75em",
                color: "#000",
                background: "#ffbf00",
                border: "none",
                padding: "12px 28px",
                cursor: "pointer",
                fontWeight: 700,
                letterSpacing: "0.05em",
                width: "100%",
              }}
            >
              ▶ START MY QUEST
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
