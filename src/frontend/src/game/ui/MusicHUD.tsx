import { useEffect, useState } from "react";

interface TrackInfo {
  name: string;
  key: string;
  muted: boolean;
}

export function MusicHUD() {
  const [track, setTrack] = useState<TrackInfo>({
    name: "",
    key: "",
    muted: false,
  });
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<TrackInfo>).detail;
      setTrack({ name: detail.name, key: detail.key, muted: detail.muted });
    };
    window.addEventListener("music:trackChanged", handler);
    return () => window.removeEventListener("music:trackChanged", handler);
  }, []);

  const handleToggleMute = async () => {
    const { musicManager } = await import("../managers/MusicManager");
    musicManager.resumeAudioContextAndPlay();
    const nowMuted = musicManager.toggleMute();
    setTrack((prev) => ({ ...prev, muted: nowMuted }));
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "relative",
        zIndex: 0,
        display: "flex",
        alignItems: "center",
        gap: "8px",
        background: "rgba(0,0,0,0.88)",
        border: "2px solid #ffbf00",
        boxShadow: "0 0 12px #ffbf0044",
        padding: "6px 10px",
        minWidth: "160px",
        maxWidth: "220px",
        fontFamily: "Orbitron, sans-serif",
        borderRadius: "2px",
        cursor: "pointer",
      }}
      data-ocid="music_hud.panel"
      aria-label="Music player"
    >
      <span
        style={{
          fontSize: "1em",
          animation:
            track.muted || !track.name ? "none" : "notePulse 1.2s infinite",
          display: "inline-block",
          flexShrink: 0,
          color: track.muted ? "#555" : "#ffbf00",
        }}
        aria-hidden="true"
      >
        ♪
      </span>
      <span
        style={{
          fontSize: "0.6em",
          color: track.muted ? "#666" : "#ffbf00",
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.4,
          fontFamily: "Orbitron, sans-serif",
        }}
        title={track.name || "Click to start music"}
      >
        {track.name || (track.muted ? "MUTED" : "♪ CLICK TO PLAY")}
      </span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          void handleToggleMute();
        }}
        data-ocid="music_hud.mute_button"
        aria-label={track.muted ? "Unmute music" : "Mute music"}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "1em",
          padding: "0",
          lineHeight: 1,
          flexShrink: 0,
          color: track.muted ? "#555" : "#ffbf00",
          transition: "color 0.2s",
        }}
      >
        {track.muted ? "🔇" : "🔊"}
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
        }}
        aria-label="Hide music player"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontSize: "0.7em",
          padding: "0",
          lineHeight: 1,
          flexShrink: 0,
          color: "#555",
        }}
      >
        ✕
      </button>
      <style>{`
        @keyframes notePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.35); }
        }
      `}</style>
    </div>
  );
}
