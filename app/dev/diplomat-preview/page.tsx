"use client";

import DiplomatUnmuteOverlay from "../../components/DiplomatUnmuteOverlay";
import type { Id } from "../../../convex/_generated/dataModel";

// Pass #30: standalone preview for the Diplomat unmute mini-game. Mounts the
// overlay with mock IDs so the visual layout + 15s countdown render without a
// live Convex session. The mute-state query and tap mutations will return
// empty / error silently, which is expected for a UI review.
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
      <DiplomatUnmuteOverlay
        sessionId={fakeSession}
        diplomatId={fakeDiplomat}
        crisisIndex={1}
        startedAt={Date.now()}
        players={players}
      />
    </div>
  );
}
