import { useState } from "react";
import { GAME_EVENTS, XP_REWARDS } from "../game/utils/Constants";

interface Flashcard {
  id: string;
  question: string;
  answer: string;
  category: string;
}

const SAMPLE_FLASHCARDS: Flashcard[] = [
  {
    id: "1",
    question: "What is the STAR method?",
    answer:
      "Situation, Task, Action, Result — a structured way to answer behavioral interview questions.",
    category: "Interview Technique",
  },
  {
    id: "2",
    question: "What is ATS?",
    answer:
      "Applicant Tracking System — software used by employers to filter resumes. Use keywords from the job description.",
    category: "Job Search",
  },
  {
    id: "3",
    question: "Tell me about yourself",
    answer:
      "Past (relevant experience) → Present (current role/skills) → Future (why this role). Keep it to 2 minutes.",
    category: "Common Questions",
  },
  {
    id: "4",
    question: "Why do you want to leave your current job?",
    answer:
      'Focus on growth opportunities, not negatives. "I\'m looking for new challenges that align with X" not "my boss is terrible."',
    category: "Common Questions",
  },
  {
    id: "5",
    question: "What is instructional design?",
    answer:
      "The systematic process of creating educational experiences using learning theory, needs analysis, and evaluation.",
    category: "Field Knowledge",
  },
  {
    id: "6",
    question: "What is a learning objective?",
    answer:
      "A measurable statement describing what learners will be able to do after training. Uses action verbs (analyze, create, evaluate).",
    category: "Field Knowledge",
  },
];

export function FlashcardLibrary() {
  const [cards] = useState<Flashcard[]>(SAMPLE_FLASHCARDS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [filter, setFilter] = useState("all");
  const [xpEarned, setXpEarned] = useState(false);

  const categories = ["all", ...new Set(cards.map((c) => c.category))];
  const filtered =
    filter === "all" ? cards : cards.filter((c) => c.category === filter);
  const current = filtered[currentIndex % filtered.length];

  const handleNext = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i + 1) % filtered.length);
    if (!xpEarned) {
      window.dispatchEvent(
        new CustomEvent(GAME_EVENTS.XP_GAINED, {
          detail: {
            amount: XP_REWARDS.VIEW_STUDY,
            reason: "Studied Flashcard",
          },
        }),
      );
      setXpEarned(true);
    }
  };

  const handlePrev = () => {
    setFlipped(false);
    setCurrentIndex((i) => (i - 1 + filtered.length) % filtered.length);
  };

  if (!current) return null;

  return (
    <div style={{ padding: "20px", fontFamily: '"Press Start 2P", monospace' }}>
      <h2 style={{ color: "#39ff14", fontSize: "12px", marginBottom: "20px" }}>
        📚 FLASHCARDS
      </h2>

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
            onClick={() => {
              setFilter(cat);
              setCurrentIndex(0);
              setFlipped(false);
            }}
            data-ocid={`flashcard.filter.${cat}`}
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: "7px",
              color: filter === cat ? "#000" : "#39ff14",
              background: filter === cat ? "#39ff14" : "transparent",
              border: "2px solid #39ff14",
              padding: "4px 8px",
              cursor: "pointer",
            }}
          >
            {cat.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Progress */}
      <p style={{ color: "#666", fontSize: "7px", marginBottom: "16px" }}>
        CARD {(currentIndex % filtered.length) + 1} / {filtered.length}
      </p>

      {/* Flashcard */}
      <button
        type="button"
        onClick={() => setFlipped(!flipped)}
        data-ocid="flashcard.card"
        style={{
          background: flipped ? "#0a0a2a" : "#0a2a0a",
          border: `4px solid ${flipped ? "#00ffff" : "#39ff14"}`,
          boxShadow: `0 0 20px ${flipped ? "#00ffff44" : "#39ff1444"}`,
          padding: "24px",
          minHeight: "150px",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          marginBottom: "16px",
          transition: "all 0.2s",
          textAlign: "left",
          width: "100%",
        }}
      >
        <p
          style={{
            fontSize: "7px",
            color: flipped ? "#00ffff" : "#39ff14",
            marginBottom: "8px",
          }}
        >
          {flipped ? "▶ ANSWER" : "? QUESTION"}
        </p>
        <p
          style={{
            fontSize: "9px",
            color: flipped ? "#aaffff" : "#aaffaa",
            lineHeight: "1.8",
          }}
        >
          {flipped ? current.answer : current.question}
        </p>
        <p style={{ fontSize: "6px", color: "#555", marginTop: "12px" }}>
          {current.category.toUpperCase()}
        </p>
      </button>

      <p
        style={{
          fontSize: "7px",
          color: "#444",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        CLICK CARD TO FLIP
      </p>

      {/* Navigation */}
      <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
        <button
          type="button"
          onClick={handlePrev}
          data-ocid="flashcard.prev"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "8px",
            color: "#ff00ff",
            background: "transparent",
            border: "2px solid #ff00ff",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          ◀ PREV
        </button>
        <button
          type="button"
          onClick={handleNext}
          data-ocid="flashcard.next"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            fontSize: "8px",
            color: "#39ff14",
            background: "transparent",
            border: "2px solid #39ff14",
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          NEXT ▶
        </button>
      </div>
    </div>
  );
}
