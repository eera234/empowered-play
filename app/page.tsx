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

const SCREENS: Record<string, ComponentType> = {
  "s-entry": EntryScreen,
  "s-join": JoinScreen,
  "s-wait": WaitScreen,
  "s-fac-setup": FacSetupScreen,
  "s-fac-live": FacLiveScreen,
  "s-fac-debrief": FacDebriefScreen,
  "s-card": CardRevealScreen,
  "s-build": BuildScreen,
  "s-upload": UploadScreen,
  "s-city": CityMapScreen,
  "s-reveal": RevealScreen,
  "s-debrief": DebriefScreen,
  "s-complete": CompleteScreen,
};

function GameShell() {
  const { screen, sessionCode, sessionId, playerId, role, set, goTo } = useGame();
  const session = useQuery(
    api.game.getSession,
    sessionCode ? { code: sessionCode } : "skip"
  );
  const players = useQuery(
    api.game.getPlayers,
    sessionId ? { sessionId } : "skip"
  );
  const prevPhaseRef = useRef<string | null>(null);

  // If restored playerId no longer exists (player was removed), clear and go to entry
  useEffect(() => {
    if (!playerId || !players) return;
    const stillExists = players.some((p) => p._id === playerId);
    if (!stillExists) {
      set({ role: null, name: "", sessionCode: "", sessionId: null, playerId: null, scenario: "", screen: "s-entry" });
    }
  }, [playerId, players, set]);

  // Keep scenario in sync with session (for players who didn't set it locally)
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
      if (session.phase === "debrief") {
        goTo("s-fac-debrief");
      } else if (session.phase === "constraint_reveal") {
        goTo("s-reveal");
      } else {
        goTo("s-fac-live");
      }
      return;
    }

    const phaseToScreen: Record<string, string> = {
      card_reveal: "s-card",
      building: "s-build",
      uploading: "s-upload",
      city_map: "s-city",
      debrief: "s-debrief",
      constraint_reveal: "s-reveal",
      complete: "s-complete",
    };
    if (phaseToScreen[session.phase]) {
      goTo(phaseToScreen[session.phase]);
    }
  }, [session?.phase, role, goTo]);

  const Screen = SCREENS[screen] || EntryScreen;
  return <Screen />;
}

export default function Home() {
  return (
    <GameProvider>
      <GameShell />
    </GameProvider>
  );
}
