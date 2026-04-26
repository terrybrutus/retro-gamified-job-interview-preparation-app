import { useState } from "react";

interface AdviceItem {
  id: string;
  category: string;
  title: string;
  content: string;
}

const ADVICE_LIBRARY: AdviceItem[] = [
  {
    id: "1",
    category: "Mindset",
    title: "They're just people",
    content:
      "Deep breaths. Your interviewer is stressed, overworked, and hoping you're the one who makes their life easier. Walk in like you already belong there.",
  },
  {
    id: "2",
    category: "Research",
    title: "Know the job description cold",
    content:
      "Read every line. Understand what they actually need vs. what they wrote. Map your experience to their problems. The interview is a conversation, not a quiz.",
  },
  {
    id: "3",
    category: "Questions to Ask",
    title: "Ask smart questions",
    content:
      '"What does success look like in the first 90 days?" and "What are the biggest challenges the team faces?" — these show you\'re thinking about the job, not just getting the job.',
  },
  {
    id: "4",
    category: "Behavioral",
    title: "STAR method for stories",
    content:
      'Situation → Task → Action → Result. Keep it under 2 minutes. End with a quantifiable result. "We reduced onboarding time by 40%" beats "we improved things."',
  },
  {
    id: "5",
    category: "Instructional Design",
    title: "Talk about impact, not process",
    content:
      'Don\'t just list tools (Articulate, Lectora, etc). Talk about what your training accomplished. "Learners went from X to Y" is more compelling than "I built an e-learning module."',
  },
  {
    id: "6",
    category: "Closing",
    title: "End strong",
    content:
      '"Based on everything we discussed, I believe I can contribute to [specific thing]. What are the next steps?" — claim the role. Then shut up and let them respond.',
  },
];

export function InterviewAdviceGenerator() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  const categories = ["all", ...new Set(ADVICE_LIBRARY.map((a) => a.category))];
  const filtered =
    selectedCategory === "all"
      ? ADVICE_LIBRARY
      : ADVICE_LIBRARY.filter((a) => a.category === selectedCategory);

  return (
    <div style={{ padding: "20px", fontFamily: '"Press Start 2P", monospace' }}>
      <h2 style={{ color: "#ffbf00", fontSize: "0.85em", marginBottom: "8px" }}>
        🎤 INTERVIEW ADVICE
      </h2>
      <p
        style={{
          color: "#666",
          fontSize: "0.55em",
          marginBottom: "20px",
          lineHeight: "1.8",
        }}
      >
        Direct. No sugarcoating. You've got this.
      </p>

      {/* Category filter */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            data-ocid={`interview_advice.filter.${cat}`}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "0.55em",
              color: selectedCategory === cat ? "#000" : "#ffbf00",
              background: selectedCategory === cat ? "#ffbf00" : "transparent",
              border: "2px solid #ffbf00",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Advice items */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {filtered.map((item, i) => (
          <div
            key={item.id}
            style={{
              background: "#0a0a0a",
              border: `2px solid ${expanded === item.id ? "#ffbf00" : "#333"}`,
              padding: "12px 16px",
              cursor: "pointer",
            }}
            data-ocid={`interview_advice.item.${i + 1}`}
          >
            <button
              type="button"
              onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              style={{
                background: "transparent",
                border: "none",
                cursor: "pointer",
                width: "100%",
                textAlign: "left",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: 0,
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: "0.5em",
                    color: "#ffbf00",
                    display: "block",
                    marginBottom: "4px",
                  }}
                >
                  {item.category.toUpperCase()}
                </span>
                <span
                  style={{
                    fontSize: "0.65em",
                    color: "#ccc",
                    fontFamily: '"Press Start 2P", monospace',
                  }}
                >
                  {item.title}
                </span>
              </div>
              <span style={{ color: "#ffbf00", fontSize: "0.7em" }}>
                {expanded === item.id ? "▲" : "▼"}
              </span>
            </button>
            {expanded === item.id && (
              <p
                style={{
                  fontSize: "0.6em",
                  color: "#aaa",
                  lineHeight: "1.8",
                  marginTop: "12px",
                  borderTop: "1px solid #222",
                  paddingTop: "12px",
                }}
              >
                {item.content}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
