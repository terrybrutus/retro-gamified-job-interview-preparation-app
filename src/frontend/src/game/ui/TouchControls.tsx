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

    // Only bind on mobile canvas area
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
    // Only trigger if minimal movement (a tap, not a swipe)
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
        pointerEvents: "none", // pass-through for keyboard/mouse; touch events via document listeners
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

  const [menuOpen, setMenuOpen] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // First-visit tutorial
  useEffect(() => {
    const seen = localStorage.getItem(TUTORIAL_KEY);
    if (!seen) {
      // Small delay so the game can load first
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
    border: "3px solid #39ff14",
    boxShadow: "0 0 40px #39ff1444",
    padding: "28px 32px",
    maxWidth: "420px",
    width: "90vw",
    fontFamily: "Orbitron, sans-serif",
  };

  const h2Style: React.CSSProperties = {
    fontFamily: "Orbitron, sans-serif",
    fontSize: "15px",
    color: "#39ff14",
    marginBottom: "20px",
    letterSpacing: "0.05em",
    fontWeight: 700,
  };

  const controlsRows = [
    { keys: "WASD / Arrow Keys", action: "Move around Career City" },
    { keys: "E / Space / Enter", action: "Interact with NPCs" },
    { keys: "ESC", action: "Exit building / Close dialogue" },
    { keys: "Swipe (mobile)", action: "Move character" },
    { keys: "Double-tap (mobile)", action: "Interact" },
  ];

  return (
    <>
      {/* Invisible swipe layer for mobile movement */}
      <TouchSwipeLayer />

      {/* Hamburger menu button — top-left, out of the way */}
      <button
        type="button"
        onClick={() => setMenuOpen(true)}
        aria-label="Open instructions menu"
        data-ocid="game_menu.open_button"
        style={{
          position: "absolute",
          top: "12px",
          left: "12px",
          zIndex: 300,
          width: "44px",
          height: "44px",
          background: "rgba(0,0,0,0.88)",
          border: "2px solid #39ff14",
          boxShadow: "0 0 10px #39ff1444",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "5px",
          borderRadius: "2px",
        }}
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: "block",
              width: "18px",
              height: "2px",
              background: "#39ff14",
              borderRadius: "1px",
            }}
          />
        ))}
      </button>

      {/* Instructions menu overlay */}
      {menuOpen && (
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
          aria-label="Instructions"
          data-ocid="game_menu.dialog"
        >
          <div
            style={panelStyle}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h2 style={h2Style}>☰ HOW TO PLAY</h2>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "24px",
              }}
            >
              <tbody>
                {controlsRows.map((row) => (
                  <tr key={row.keys}>
                    <td
                      style={{
                        fontFamily: "Orbitron, sans-serif",
                        fontSize: "10px",
                        color: "#00ffff",
                        padding: "6px 12px 6px 0",
                        whiteSpace: "nowrap",
                        fontWeight: 700,
                        borderBottom: "1px solid #1a1a1a",
                      }}
                    >
                      {row.keys}
                    </td>
                    <td
                      style={{
                        fontFamily: "Orbitron, sans-serif",
                        fontSize: "10px",
                        color: "#aaaaaa",
                        padding: "6px 0",
                        borderBottom: "1px solid #1a1a1a",
                      }}
                    >
                      {row.action}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "10px",
                color: "#555",
                marginBottom: "20px",
                lineHeight: 1.7,
              }}
            >
              Walk up to any NPC building and press E to enter.
              <br />
              Open the <span style={{ color: "#00ffff" }}>[ MAP ]</span> to
              fast-travel anywhere.
            </p>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              data-ocid="game_menu.close_button"
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "11px",
                color: "#000",
                background: "#39ff14",
                border: "none",
                padding: "10px 24px",
                cursor: "pointer",
                fontWeight: 700,
                letterSpacing: "0.05em",
              }}
            >
              ▶ GOT IT
            </button>
          </div>
        </dialog>
      )}

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
          <div
            style={{
              ...panelStyle,
              border: "3px solid #ffbf00",
              boxShadow: "0 0 40px #ffbf0044",
            }}
          >
            <h2 style={{ ...h2Style, color: "#ffbf00" }}>
              ⭐ WELCOME TO CAREER CITY
            </h2>
            <p
              style={{
                fontFamily: "Orbitron, sans-serif",
                fontSize: "11px",
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
                fontSize: "10px",
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
                    fontSize: "10px",
                    color: "#aaaaaa",
                  }}
                >
                  <span style={{ fontSize: "16px", flexShrink: 0 }}>
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
                fontSize: "11px",
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
