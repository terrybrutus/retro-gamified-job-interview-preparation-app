import { useEffect, useRef } from "react";

type Direction = "up" | "down" | "left" | "right";

interface ButtonState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
}

function dispatch(direction: Direction, pressed: boolean) {
  window.dispatchEvent(
    new CustomEvent("game:move", { detail: { direction, pressed } }),
  );
}

function dispatchInteract() {
  window.dispatchEvent(new CustomEvent("game:interact"));
}

export function TouchControls() {
  const btnState = useRef<ButtonState>({
    up: false,
    down: false,
    left: false,
    right: false,
  });

  const handleTouchStart =
    (dir: Direction) => (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      if (!btnState.current[dir]) {
        btnState.current[dir] = true;
        dispatch(dir, true);
      }
    };

  const handleTouchEnd =
    (dir: Direction) => (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      btnState.current[dir] = false;
      dispatch(dir, false);
    };

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

  const btnStyle = (color = "#39ff14"): React.CSSProperties => ({
    width: "48px",
    height: "48px",
    background: "#000",
    border: `3px solid ${color}`,
    color,
    fontFamily: '"Press Start 2P", monospace',
    fontSize: "14px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    WebkitTapHighlightColor: "transparent",
    userSelect: "none",
    touchAction: "none",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: "80px",
        left: "16px",
        zIndex: 200,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
      }}
      className="md:hidden"
      data-ocid="touch_controls"
    >
      <button
        type="button"
        style={btnStyle("#00ffff")}
        onMouseDown={handleTouchStart("up")}
        onMouseUp={handleTouchEnd("up")}
        onMouseLeave={handleTouchEnd("up")}
        onTouchStart={handleTouchStart("up")}
        onTouchEnd={handleTouchEnd("up")}
        data-ocid="touch_controls.up"
        aria-label="Move up"
      >
        ▲
      </button>

      <div style={{ display: "flex", gap: "4px" }}>
        <button
          type="button"
          style={btnStyle("#ff00ff")}
          onMouseDown={handleTouchStart("left")}
          onMouseUp={handleTouchEnd("left")}
          onMouseLeave={handleTouchEnd("left")}
          onTouchStart={handleTouchStart("left")}
          onTouchEnd={handleTouchEnd("left")}
          data-ocid="touch_controls.left"
          aria-label="Move left"
        >
          ◀
        </button>
        <button
          type="button"
          style={{
            ...btnStyle("#000"),
            border: "3px solid #333",
            color: "#39ff14",
            fontSize: "7px",
          }}
          onClick={dispatchInteract}
          onTouchEnd={(e) => {
            e.preventDefault();
            dispatchInteract();
          }}
          data-ocid="touch_controls.interact"
          aria-label="Interact"
        >
          E
        </button>
        <button
          type="button"
          style={btnStyle("#ff00ff")}
          onMouseDown={handleTouchStart("right")}
          onMouseUp={handleTouchEnd("right")}
          onMouseLeave={handleTouchEnd("right")}
          onTouchStart={handleTouchStart("right")}
          onTouchEnd={handleTouchEnd("right")}
          data-ocid="touch_controls.right"
          aria-label="Move right"
        >
          ▶
        </button>
      </div>

      <button
        type="button"
        style={btnStyle("#00ffff")}
        onMouseDown={handleTouchStart("down")}
        onMouseUp={handleTouchEnd("down")}
        onMouseLeave={handleTouchEnd("down")}
        onTouchStart={handleTouchStart("down")}
        onTouchEnd={handleTouchEnd("down")}
        data-ocid="touch_controls.down"
        aria-label="Move down"
      >
        ▼
      </button>
    </div>
  );
}
