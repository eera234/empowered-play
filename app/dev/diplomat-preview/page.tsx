"use client";

import { useEffect, useState } from "react";
import DiplomatUnmuteOverlay from "../../components/DiplomatUnmuteOverlay";
import type { Id } from "../../../convex/_generated/dataModel";

// Standalone preview for the Diplomat unmute mini-game. Mounts the overlay in
// previewMode so it bypasses Convex queries/mutations and runs against local
// mock state.
//
// Hit /dev/diplomat-preview in the browser to use.
export default function DiplomatPreviewPage() {
  const fakeSession = "preview-session" as unknown as Id<"sessions">;
  const fakeDiplomat = "preview-diplomat" as unknown as Id<"players">;
  const players = [
    { _id: "p1" as unknown as Id<"players">, name: "Alex", ability: "anchor" },
    { _id: "p2" as unknown as Id<"players">, name: "Bob",  ability: "scout"  },
    { _id: "p3" as unknown as Id<"players">, name: "Cleo", ability: "citizen"},
    { _id: "p4" as unknown as Id<"players">, name: "Dev",  ability: "mender" },
  ];

  // startedAt only resolves client-side. If we computed Date.now() during
  // render, the server's HTML would render with one timestamp and the client
  // would hydrate with another — mismatching the SVG dasharray and triggering
  // a hydration error.
  const [startedAt, setStartedAt] = useState<number | null>(null);
  useEffect(() => { setStartedAt(Date.now()); }, []);

  return (
    <div style={{ position: "relative", minHeight: "100vh", background: "#06061a" }}>
      <div style={{
        position: "fixed", top: 12, left: 12, zIndex: 9999,
        background: "rgba(255,215,64,.18)", border: "1px solid rgba(255,215,64,.55)",
        color: "#FFD740", padding: "6px 10px", borderRadius: 8,
        fontFamily: "'Nunito', sans-serif", fontSize: 11, letterSpacing: 1,
      }}>
        DEV PREVIEW: Diplomat unmute. Mutations are no-ops.
      </div>
      {startedAt !== null && (
        <DiplomatUnmuteOverlay
          sessionId={fakeSession}
          diplomatId={fakeDiplomat}
          crisisIndex={1}
          startedAt={startedAt}
          scenarioId="rising_tides"
          players={players}
          previewMode
        />
      )}
    </div>
  );
}
