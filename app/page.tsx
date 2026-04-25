"use client";

import { useEffect, useRef, useState, ComponentType } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { GameProvider, useGame } from "./GameContext";
import { unlockAudio, playSound } from "../lib/sound";
import { SCENARIOS } from "../lib/constants";
import { SCENARIO_ILLUSTRATIONS } from "./components/EntryScreen";
import EntryScreen from "./components/EntryScreen";
import JoinScreen from "./components/JoinScreen";
import WaitScreen from "./components/WaitScreen";
import FacSetupScreen from "./components/FacSetupScreen";
import CompleteScreen from "./components/CompleteScreen";
// New game screens
import PairBuildScreen from "./components/PairBuildScreen";
import GuessScreen from "./components/GuessScreen";
import StoryMapScreen from "./components/StoryMapScreen";
import VoteScreen from "./components/VoteScreen";
import StuckRecovery from "./components/StuckRecovery";

// New phase → screen mapping (used for both player and facilitator routing)
const NEW_PHASE_TO_SCREEN: Record<string, string> = {
  pair_build: "s-pair-build",
  guess: "s-guess",
  map_ch1: "s-map",
  map_ch2: "s-map",
  map_ch3: "s-map",
  vote: "s-vote",
  complete: "s-complete",
};

const SCREENS: Record<string, ComponentType> = {
  "s-entry": EntryScreen,
  "s-join": JoinScreen,
  "s-wait": WaitScreen,
  "s-complete": CompleteScreen,
  "s-fac-setup": FacSetupScreen,
  "s-pair-build": PairBuildScreen,
  "s-guess": GuessScreen,
  "s-map": StoryMapScreen,
  "s-vote": VoteScreen,
};

function GameShell() {
  const { screen, sessionCode, sessionId, playerId, role, set, goTo, leaveSession } = useGame();
  const session = useQuery(
    api.game.getSession,
    sessionCode ? { code: sessionCode } : "skip"
  );
  const players = useQuery(
    api.game.getPlayers,
    sessionId ? { sessionId } : "skip"
  );
  const prevPhaseRef = useRef<string | null>(null);
  const prevScenarioRef = useRef<string | null>(null);
  const [sessionMissing, setSessionMissing] = useState(false);
  const [scenarioReveal, setScenarioReveal] = useState<string | null>(null);

  // Unlock the Web Audio context on the very first pointer gesture. Modern
  // browsers keep AudioContext suspended until a user interacts; without this
  // hook, auto-triggered sounds (timer warnings, phase transitions) silently
  // no-op until the player happens to tap the mute button.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let done = false;
    const handler = () => {
      if (done) return;
      done = true;
      unlockAudio();
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
    window.addEventListener("pointerdown", handler, { once: false });
    window.addEventListener("keydown", handler, { once: false });
    return () => {
      window.removeEventListener("pointerdown", handler);
      window.removeEventListener("keydown", handler);
    };
  }, []);

  // Silent-leave: clears local state + storage without prompting the user.
  // Used for "session was deleted / I was kicked" paths where a confirm dialog
  // would be confusing ("why is it asking me to leave a session I'm not in?").
  function silentLeave() {
    leaveSession({ confirm: false });
  }

  // If restored playerId no longer exists (player was removed), clear and go to entry
  useEffect(() => {
    if (!playerId || !players) return;
    const stillExists = players.some((p) => p._id === playerId);
    if (!stillExists) {
      silentLeave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playerId, players]);

  // If session code doesn't find a session (deleted/expired), surface a
  // recoverable banner instead of silently clearing state. Silent logout hid
  // the reason the facilitator lost their session and left them unable to
  // rejoin. We keep localStorage intact so a manual "Start over" can clear it.
  useEffect(() => {
    if (!sessionCode) { setSessionMissing(false); return; }
    setSessionMissing(session === null);
  }, [session, sessionCode]);

  // If session is complete, clear saved data so browser can join a new game
  useEffect(() => {
    if (session?.phase === "complete") {
      // Small delay so the complete screen shows before clearing
      const timer = setTimeout(() => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("empowered-play-session");
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [session?.phase]);

  // Keep scenario in sync with session + fire the scenario-win reveal overlay
  // the first time the session.scenario transitions from empty to a value. The
  // ref guard means a rejoin/reload doesn't retrigger the reveal.
  useEffect(() => {
    const current = session?.scenario ?? "";
    if (current && current !== "") {
      set({ scenario: current });
      if (prevScenarioRef.current !== null && prevScenarioRef.current === "" && current) {
        setScenarioReveal(current);
        playSound("complete-fanfare");
      }
    }
    prevScenarioRef.current = current;
  }, [session?.scenario, set]);

  // Auto-dismiss the reveal after 4.5s.
  useEffect(() => {
    if (!scenarioReveal) return;
    const t = setTimeout(() => setScenarioReveal(null), 4500);
    return () => clearTimeout(t);
  }, [scenarioReveal]);

  useEffect(() => {
    if (!session || session.phase === prevPhaseRef.current) return;
    prevPhaseRef.current = session.phase;

    if (session.phase === "waiting") return;

    if (role === "facilitator") {
      if (NEW_PHASE_TO_SCREEN[session.phase]) {
        goTo(NEW_PHASE_TO_SCREEN[session.phase]);
      } else {
        goTo("s-fac-setup");
      }
      return;
    }

    if (NEW_PHASE_TO_SCREEN[session.phase]) {
      goTo(NEW_PHASE_TO_SCREEN[session.phase]);
    }
  }, [session?.phase, role, goTo]);

  const Screen = SCREENS[screen] || EntryScreen;
  // key=screen forces a remount on phase transition, triggering the fade-in animation on the root.
  return (
    <>
      <div key={screen} style={{ animation: "fadeIn .35s ease-out" }}>
        <Screen />
      </div>
      {scenarioReveal && (() => {
        const picked = SCENARIOS.find((s) => s.id === scenarioReveal);
        if (!picked) return null;
        const Illust = SCENARIO_ILLUSTRATIONS[picked.id];
        return (
          <div
            onClick={() => setScenarioReveal(null)}
            style={{
              position: "fixed", inset: 0, background: "rgba(6,6,26,.96)",
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 24, zIndex: 999, cursor: "pointer",
              animation: "fadeIn .4s ease-out",
            }}
          >
            <div style={{ textAlign: "center", maxWidth: 460 }}>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif", fontSize: 11,
                letterSpacing: 3, color: "var(--textd)", marginBottom: 12,
              }}>
                YOUR WORLD IS
              </div>
              {Illust && (
                <div style={{ margin: "0 auto 16px", maxWidth: 360, animation: "fadeIn .8s ease-out" }}>
                  <Illust />
                </div>
              )}
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif", fontSize: 32,
                letterSpacing: 3, color: picked.color,
                textTransform: "uppercase", marginBottom: 8,
              }}>
                {picked.title}
              </div>
              <div style={{ fontSize: 14, color: "white", fontStyle: "italic", marginBottom: 20 }}>
                {picked.tagline}
              </div>
              <div style={{ fontSize: 11, color: "var(--textd)" }}>
                Tap to continue &rarr;
              </div>
            </div>
          </div>
        );
      })()}
      {sessionMissing && (
        <div
          style={{
            position: "fixed", inset: 0, background: "rgba(6,6,26,.85)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20, zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "var(--bg1)", border: "1px solid var(--border)",
              borderRadius: 12, padding: 24, maxWidth: 360, textAlign: "center",
            }}
          >
            <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 16, marginBottom: 8 }}>
              SESSION NOT FOUND
            </div>
            <div style={{ fontSize: 13, color: "var(--textd)", marginBottom: 16 }}>
              This session has ended or the code is wrong. Start a new one or rejoin with a different code.
            </div>
            <button
              className="lb lb-yellow"
              style={{ width: "100%" }}
              onClick={() => { setSessionMissing(false); silentLeave(); }}
            >
              START OVER
            </button>
          </div>
        </div>
      )}
      <StuckRecovery />
    </>
  );
}

export default function Home() {
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  );
}
