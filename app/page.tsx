"use client";

import { useEffect, useRef, ComponentType } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { GameProvider, useGame } from "./GameContext";
import EntryScreen from "./components/EntryScreen";
import JoinScreen from "./components/JoinScreen";
import WaitScreen from "./components/WaitScreen";
import FacSetupScreen from "./components/FacSetupScreen";
import FacLiveScreen from "./components/FacLiveScreen";
import CardRevealScreen from "./components/CardRevealScreen";
import BuildScreen from "./components/BuildScreen";
import UploadScreen from "./components/UploadScreen";
import CityMapScreen from "./components/CityMapScreen";
import RevealScreen from "./components/RevealScreen";
import DebriefScreen from "./components/DebriefScreen";
import CompleteScreen from "./components/CompleteScreen";
import FacDebriefScreen from "./components/FacDebriefScreen";
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
};

const SCREENS: Record<string, ComponentType> = {
  // Shared screens
  "s-entry": EntryScreen,
  "s-join": JoinScreen,
  "s-wait": WaitScreen,
  "s-complete": CompleteScreen,
  // Old game flow screens (still active)
  "s-fac-setup": FacSetupScreen,
  "s-fac-live": FacLiveScreen,
  "s-fac-debrief": FacDebriefScreen,
  "s-card": CardRevealScreen,
  "s-build": BuildScreen,
  "s-upload": UploadScreen,
  "s-city": CityMapScreen,
  "s-reveal": RevealScreen,
  "s-debrief": DebriefScreen,
  // New game flow screens
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

  // If session code doesn't find a session (deleted/expired), clear saved data.
  // session is null when query returns no result, undefined when still loading.
  useEffect(() => {
    if (!sessionCode) return;
    if (session === null) {
      silentLeave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Keep scenario in sync with session
  useEffect(() => {
    if (session?.scenario && session.scenario !== "") {
      set({ scenario: session.scenario });
    }
  }, [session?.scenario, set]);

  useEffect(() => {
    if (!session || session.phase === prevPhaseRef.current) return;
    prevPhaseRef.current = session.phase;

    if (session.phase === "waiting") return;

    if (role === "facilitator") {
      // Old flow facilitator routing
      if (session.phase === "debrief") {
        goTo("s-fac-debrief");
      } else if (session.phase === "constraint_reveal") {
        goTo("s-reveal");
      }
      // New flow: facilitator sees same screens as players (with facilitator controls layered in)
      else if (NEW_PHASE_TO_SCREEN[session.phase]) {
        goTo(NEW_PHASE_TO_SCREEN[session.phase]);
      }
      // Old flow fallback
      else {
        goTo("s-fac-live");
      }
      return;
    }

    // Player routing — check new phases first, then old phases
    const phaseToScreen: Record<string, string> = {
      // Old game flow
      card_reveal: "s-card",
      building: "s-build",
      uploading: "s-upload",
      city_map: "s-city",
      debrief: "s-debrief",
      constraint_reveal: "s-reveal",
      complete: "s-complete",
      // New game flow
      ...NEW_PHASE_TO_SCREEN,
    };
    if (phaseToScreen[session.phase]) {
      goTo(phaseToScreen[session.phase]);
    }
  }, [session?.phase, role, goTo]);

  const Screen = SCREENS[screen] || EntryScreen;
  // key=screen forces a remount on phase transition, triggering the fade-in animation on the root.
  return (
    <>
      <div key={screen} style={{ animation: "fadeIn .35s ease-out" }}>
        <Screen />
      </div>
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
