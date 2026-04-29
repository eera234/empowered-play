"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import Ch2IntroOverlay from "./Ch2IntroOverlay";
import RebuildPromptOverlay from "./RebuildPromptOverlay";
import RoleRotationOverlay from "./RoleRotationOverlay";
import {
  ScoutC1Modal, ScoutC2Modal,
  EngineerC2Modal, MenderModal,
  AnchorModal, CitizenVoteModal,
} from "./CrisisKitOverlay";
import { SCENARIOS, ABILITIES, getThemedAbility } from "../../lib/constants";

interface Props {
  sessionId: Id<"sessions">;
  sessionCode: string;
  playerId: Id<"players"> | null;
  isFacilitator: boolean;
}

export default function Ch2Pass13Overlays({ sessionId, sessionCode, playerId, isFacilitator }: Props) {
  const session = useQuery(api.game.getSession, { code: sessionCode });
  const players = useQuery(api.game.getPlayers, { sessionId });
  const connections = useQuery(api.mapPhase.getConnections, { sessionId });
  const checkClearance = useMutation(api.mapPhase.checkCrisisClearance);
  const markRotationReady = useMutation(api.mapPhase.markRotationReady);

  const me = (players ?? []).find(p => p._id === playerId);
  const phase = session?.phase;
  const isCh2 = phase === "map_ch2";

  // Ch2 intro gate — show overlay until markCh2Ready fires.
  const [introDismissedLocal, setIntroDismissedLocal] = useState(false);

  // Role rotation overlay — show once per C2 entry
  const [rotationShown, setRotationShown] = useState(false);
  const prevAbility = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (!me) return;
    if (prevAbility.current && me.ability && prevAbility.current !== me.ability) {
      setRotationShown(false);
    }
    prevAbility.current = me.ability;
  }, [me?.ability, me]);

  // Poll clearance once per second during active crisis — server-side will
  // transition the ch2State when all actions + rebuilds are done.
  useEffect(() => {
    if (!isCh2) return;
    if (session?.ch2State !== "CH2_CRISIS_ACTIVE") return;
    const id = setInterval(() => {
      void checkClearance({ sessionId });
    }, 1500);
    return () => clearInterval(id);
  }, [isCh2, session?.ch2State, sessionId, checkClearance]);

  if (!isCh2 || !session || !playerId || !me) return null;
  if (isFacilitator) return null;

  const scenario = SCENARIOS.find(s => s.id === session.scenario);
  const theme = (scenario?.mapTheme ?? "water") as "water" | "space" | "ocean" | "forest";
  // Themed role label for crisis modal titles (e.g., "Lookout" not "scout").
  const baseRoleDoc = me.ability ? ABILITIES.find(a => a.id === me.ability) : null;
  const themedRole = baseRoleDoc && scenario ? getThemedAbility(baseRoleDoc, scenario) : baseRoleDoc;
  const roleLabel = (themedRole?.label ?? me.ability ?? "role").toUpperCase();
  const crisisActive = session.ch2State === "CH2_CRISIS_ACTIVE";
  const crisisIndex = session.crisisIndex ?? 0;
  const damageResolved = session.damageResolved === true;
  const damagedPairs = (session.currentCrisisDamagedPairs ?? []) as Array<{
    aPlayerId: Id<"players">;
    bPlayerId: Id<"players">;
    originalType: string;
    newType?: string;
  }>;
  // Pre-resolution preview (used by Scout C1 to choose DM target).
  const damagePreview = (session.damagePreview ?? []) as Array<{
    aPlayerId: Id<"players">;
    bPlayerId: Id<"players">;
    originalType: string;
  }>;

  // ─── Ch2 intro gate ───
  if (!me.ch2Ready && !introDismissedLocal && me.ability) {
    return (
      <Ch2IntroOverlay
        sessionId={sessionId}
        playerId={playerId}
        roleId={me.ability}
        theme={theme}
        scenarioId={session.scenario}
        onDone={() => setIntroDismissedLocal(true)}
      />
    );
  }

  // ─── Role rotation modal: show the moment ch2State enters READY_FOR_CRISIS2
  // (after HR rotates) so players see their new role before Crisis 2 fires.
  // Also show during C2 itself if they never dismissed it, as a safety net. ───
  const rotationReady = session.ch2State === "CH2_READY_FOR_CRISIS2";
  const rotatedThisGame = me.originalAbility && me.originalAbility !== me.ability;
  // Pass #16: gate C2 on ch2RotationReady. The overlay stays up until the
  // server confirms the ready flag. HR's DEAL CRISIS is disabled until every
  // non-fac player's flag flips true. A player who already flipped it stops
  // seeing the overlay immediately (me.ch2RotationReady === true).
  const needsRotationAck = rotatedThisGame && me.ch2RotationReady !== true;
  if (needsRotationAck && !rotationShown && (rotationReady || (crisisActive && crisisIndex === 2))) {
    return (
      <RoleRotationOverlay
        previousRoleId={me.originalAbility ?? ""}
        newRoleId={me.ability ?? ""}
        scenarioId={session.scenario}
        onDismiss={async () => {
          try {
            await markRotationReady({ playerId });
          } catch {
            // Network blip: still let them dismiss locally so they are not
            // stuck; the server gate will catch it.
          }
          setRotationShown(true);
        }}
      />
    );
  }

  // ─── Role-specific crisis kit modal ───
  if (crisisActive && me.crisisContribution !== "done") {
    const role = me.ability;
    if (role === "scout" && crisisIndex === 1) {
      // Use preview during pre-resolution; fall back to actual list after resolve.
      const scoutPairs = damageResolved ? damagedPairs : damagePreview;
      return (
        <ScoutC1Modal
          sessionId={sessionId}
          scoutId={playerId}
          damagedPairs={scoutPairs}
          roleLabel={roleLabel}
          onDone={() => void checkClearance({ sessionId })}
        />
      );
    }
    if (role === "scout" && crisisIndex === 2) {
      return (
        <ScoutC2Modal
          sessionId={sessionId}
          scoutId={playerId}
          roleLabel={roleLabel}
          onDone={() => void checkClearance({ sessionId })}
        />
      );
    }
    // Pass #24: diplomat case removed. The canonical mini-game is rendered by
    // DiplomatUnmuteOverlay in StoryMapScreen (server-synced timer, gated on
    // session.diplomatUnmuteStartedAt). Mounting it here too would stack two
    // overlays with diverging local/server timers.
    if (role === "engineer") {
      // Post-resolution in both crises: wait for damage list, then pick a
      // rebuild type per damaged dyad.
      if (!damageResolved) return <WaitingForResolution label="Waiting for pre-resolution actions…" />;
      return (
        <EngineerC2Modal
          sessionId={sessionId}
          engineerId={playerId}
          damagedPairs={damagedPairs}
          theme={theme}
          roleLabel={roleLabel}
          onDone={() => void checkClearance({ sessionId })}
        />
      );
    }
    if (role === "mender") {
      if (!damageResolved) return <WaitingForResolution label="Waiting for pre-resolution actions…" />;
      return (
        <MenderModal
          sessionId={sessionId}
          menderId={playerId}
          damagedPairs={damagedPairs}
          roleLabel={roleLabel}
          onDone={() => void checkClearance({ sessionId })}
        />
      );
    }
    if (role === "anchor") {
      return (
        <AnchorModal
          sessionId={sessionId}
          anchorId={playerId}
          roleLabel={roleLabel}
          onDone={() => void checkClearance({ sessionId })}
        />
      );
    }
    if (role === "citizen") {
      return (
        <CitizenVoteModal
          sessionId={sessionId}
          citizenId={playerId}
          roleLabel={roleLabel}
          onDone={() => void checkClearance({ sessionId })}
        />
      );
    }
  }

  // ─── Rebuild prompt: show ONLY to the damaged side of a broken connection ───
  // Pass #20: gate on connection.damagedSidePlayerId, NOT on me.districtDamaged
  // (which clears as soon as the player completes DamageRepairOverlay's district
  // re-upload). damagedSidePlayerId persists until the connection rebuild lands.
  if (crisisActive && damageResolved && me.crisisContribution === "done") {
    const myConn = (connections ?? []).find(c =>
      c.destroyedByCrisisIndex === crisisIndex &&
      !c.rebuildValidatedByHR &&
      c.damagedSidePlayerId === playerId
    );
    if (myConn) {
      // Engineer picks rebuildNewType post-damage in both crises. Don't reveal
      // destruction to the victim until their type is set, otherwise they
      // would see a stale fallback to the OLD type and start rebuilding wrong.
      if (!myConn.rebuildNewType) {
        const baseEngineer = ABILITIES.find((a) => a.id === "engineer");
        const themedEngineer = baseEngineer && scenario ? getThemedAbility(baseEngineer, scenario) : baseEngineer;
        const engineerLabel = themedEngineer?.label ?? "Engineer";
        return <WaitingForResolution label={`Standby. ${engineerLabel} is choosing your rebuild type…`} />;
      }
      const isA = myConn.fromSlotId === playerId;
      const partnerId = isA ? myConn.toSlotId : myConn.fromSlotId;
      const partner = (players ?? []).find(p => p._id === partnerId);
      const alreadyUploaded = !!(isA ? myConn.rebuildPhotoA : myConn.rebuildPhotoB);
      const newType = myConn.rebuildNewType ?? myConn.connectionType ?? "bridge";
      return (
        <RebuildPromptOverlay
          sessionId={sessionId}
          playerId={playerId}
          partnerName={partner?.name ?? "partner"}
          connectionId={myConn._id}
          newType={newType}
          originalType={myConn.connectionType ?? "bridge"}
          theme={theme}
          alreadyUploadedByMe={alreadyUploaded}
          rebuildDeadline={session?.rebuildDeadline}
        />
      );
    }
  }

  return null;
}

// Lightweight overlay shown while post-resolution roles wait for pre-resolution
// actions (Scout/Anchor/Citizen) to finish.
function WaitingForResolution({ label }: { label: string }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2400,
      background: "rgba(5,5,15,.78)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{
        width: "min(360px, 90vw)", background: "var(--bg1, #0e0e25)",
        border: "1.5px solid rgba(255,215,0,.35)", borderRadius: 12,
        padding: 18, color: "white", textAlign: "center",
      }}>
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif",
          fontSize: 14, letterSpacing: 2, color: "var(--acc1, #FFD700)",
          marginBottom: 6,
        }}>
          STANDBY
        </div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", lineHeight: 1.5 }}>
          {label}
        </div>
      </div>
    </div>
  );
}
