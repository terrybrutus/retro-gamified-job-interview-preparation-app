import { useState } from "react";

interface Note {
  id: string;
  content: string;
  timestamp: number;
  tag: string;
}

const TAGS = ["general", "resume", "cover-letter", "interview", "research"];

export function NotesManager() {
  const [notes, setNotes] = useState<Note[]>([
    {
      id: "1",
      content:
        "Always tailor the resume to the specific job description. ATS optimization is not optional.",
      timestamp: Date.now() - 86400000,
      tag: "resume",
    },
    {
      id: "2",
      content:
        "Cover letter rule: no company name in the body. First person throughout. Portfolio link always included.",
      timestamp: Date.now() - 43200000,
      tag: "cover-letter",
    },
  ]);
  const [newNote, setNewNote] = useState("");
  const [newTag, setNewTag] = useState("general");
  const [filterTag, setFilterTag] = useState("all");

  const addNote = () => {
    if (!newNote.trim()) return;
    const note: Note = {
      id: Date.now().toString(),
      content: newNote.trim(),
      timestamp: Date.now(),
      tag: newTag,
    };
    setNotes((prev) => [note, ...prev]);
    setNewNote("");
  };

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered =
    filterTag === "all" ? notes : notes.filter((n) => n.tag === filterTag);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  return (
    <div style={{ padding: "20px", fontFamily: '"Press Start 2P", monospace' }}>
      <h2 style={{ color: "#00ffff", fontSize: "12px", marginBottom: "8px" }}>
        📝 NOTES
      </h2>
      <p style={{ color: "#666", fontSize: "7px", marginBottom: "20px" }}>
        Your thoughts. Don't lose them.
      </p>

      {/* Add note */}
      <div
        style={{
          background: "#0a0a0a",
          border: "2px solid #00ffff",
          padding: "16px",
          marginBottom: "20px",
        }}
      >
        <textarea
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="TYPE YOUR NOTE..."
          data-ocid="notes.textarea"
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            color: "#ccc",
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "8px",
            lineHeight: "1.8",
            resize: "vertical",
            minHeight: "80px",
            outline: "none",
          }}
        />
        <div
          style={{
            display: "flex",
            gap: "8px",
            alignItems: "center",
            marginTop: "12px",
            flexWrap: "wrap",
          }}
        >
          <select
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            data-ocid="notes.tag_select"
            style={{
              background: "#111",
              border: "2px solid #00ffff",
              color: "#00ffff",
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "7px",
              padding: "4px 8px",
            }}
          >
            {TAGS.map((t) => (
              <option key={t} value={t}>
                {t.toUpperCase()}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addNote}
            data-ocid="notes.add_button"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "8px",
              color: "#000",
              background: "#00ffff",
              border: "2px solid #00ffff",
              padding: "6px 16px",
              cursor: "pointer",
            }}
          >
            + ADD NOTE
          </button>
        </div>
      </div>

      {/* Filter */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "16px",
        }}
      >
        {["all", ...TAGS].map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setFilterTag(tag)}
            data-ocid={`notes.filter.${tag}`}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "6px",
              color: filterTag === tag ? "#000" : "#00ffff",
              background: filterTag === tag ? "#00ffff" : "transparent",
              border: "1px solid #00ffff",
              padding: "3px 8px",
              cursor: "pointer",
            }}
          >
            {tag.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Notes list */}
      {filtered.length === 0 ? (
        <div
          data-ocid="notes.empty_state"
          style={{
            textAlign: "center",
            color: "#444",
            fontSize: "8px",
            padding: "40px",
          }}
        >
          NO NOTES YET. ADD ONE ABOVE.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((note, i) => (
            <div
              key={note.id}
              data-ocid={`notes.item.${i + 1}`}
              style={{
                background: "#0a0a0a",
                border: "2px solid #222",
                padding: "12px 16px",
                position: "relative",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span style={{ fontSize: "6px", color: "#00ffff" }}>
                  {note.tag.toUpperCase()}
                </span>
                <span style={{ fontSize: "6px", color: "#444" }}>
                  {formatDate(note.timestamp)}
                </span>
              </div>
              <p
                style={{
                  fontSize: "8px",
                  color: "#bbb",
                  lineHeight: "1.8",
                  marginBottom: "8px",
                }}
              >
                {note.content}
              </p>
              <button
                type="button"
                onClick={() => deleteNote(note.id)}
                data-ocid={`notes.delete_button.${i + 1}`}
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: "6px",
                  color: "#ff4444",
                  background: "transparent",
                  border: "1px solid #ff4444",
                  padding: "2px 8px",
                  cursor: "pointer",
                }}
              >
                DELETE
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
