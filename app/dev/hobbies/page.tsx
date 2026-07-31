"use client";

// Scratch harness for looking at the hobby objects. Not linked from anywhere.
//
// The real ones live four screens into the piece, behind an intro that plays
// itself, a door and a light switch. Iterating on a drawing through all of that
// is not iterating.

import { HOBBIES } from "@/lib/content";
import { SWARM } from "@/lib/palette";
import HobbyRoll from "@/components/experience/HobbyRoll";

export default function DevHobbies() {
  return (
    <div style={{ minHeight: "100dvh", background: "#0d0b0a", padding: 28 }}>
      {/* Sized to fit the whole set on one screen. Judging seven drawings one
          at a time is how you end up with seven drawings that do not sit
          together. */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 24 }}>
        {HOBBIES.map((h, i) => (
          <div key={h.key} style={{ textAlign: "center" }}>
            <HobbyRoll
              color={SWARM[i % SWARM.length]}
              size={150}
              phase={i}
            />
            <span
              style={{
                display: "block",
                marginTop: 6,
                color: "#6b6257",
                font: "10px/1.4 system-ui, sans-serif",
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {h.title}
            </span>
          </div>
        ))}
      </div>

      {/* and again at half, because a drawing that only works big is no use
          here: on a phone these land at about this size */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
        {HOBBIES.map((h, i) => (
          <HobbyRoll
            key={h.key}
            color={SWARM[i % SWARM.length]}
            size={82}
            phase={i}
          />
        ))}
      </div>
    </div>
  );
}
