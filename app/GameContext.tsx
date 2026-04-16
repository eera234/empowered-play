"use client";

import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from "react";
import { Id } from "../convex/_generated/dataModel";

interface CardData {
  id: number;
  title: string;
  icon: string;
  color: string;
  shape: string;
  shapeHint: string;
  buildTime: number;
  mapRule: string;
  mapClue: string;
  hrNote: string;
  empowermentLevel: "high" | "medium" | "low";
}

interface GameState {
  role: "player" | "facilitator" | null;
  name: string;
  sessionCode: string;
  sessionId: Id<"sessions"> | null;
  playerId: Id<"players"> | null;
  screen: string;
  myCard: CardData | null;
  photo: string | null;
  distName: string;
  scenario: string;
  // New fields for redesigned game (all optional, coexist with old flow)
  myAbility: string | null;         // ability ID or null (citizen)
  architectForId: Id<"players"> | null;  // who I give clues to
  builderForId: Id<"players"> | null;    // who gives clues to me
}

interface GameContextValue extends GameState {
  set: (updates: Partial<GameState>) => void;
  goTo: (screen: string) => void;
}

const STORAGE_KEY = "empowered-play-session";

// Fields to persist (not photo or card — those come from Convex)
interface PersistedData {
  role: "player" | "facilitator" | null;
  name: string;
  sessionCode: string;
  sessionId: string | null;
  playerId: string | null;
  scenario: string;
}

function loadFromStorage(): Partial<GameState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const data: PersistedData = JSON.parse(raw);
    if (!data.sessionCode || !data.playerId) return {};
    return {
      role: data.role,
      name: data.name,
      sessionCode: data.sessionCode,
      sessionId: data.sessionId as Id<"sessions"> | null,
      playerId: data.playerId as Id<"players"> | null,
      scenario: data.scenario || "",
    };
  } catch {
    return {};
  }
}

function saveToStorage(state: GameState) {
  if (typeof window === "undefined") return;
  try {
    if (!state.sessionCode || !state.playerId) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    const data: PersistedData = {
      role: state.role,
      name: state.name,
      sessionCode: state.sessionCode,
      sessionId: state.sessionId,
      playerId: state.playerId,
      scenario: state.scenario,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // localStorage not available
  }
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>({
    role: null,
    name: "",
    sessionCode: "",
    sessionId: null,
    playerId: null,
    screen: "s-entry",
    myCard: null,
    photo: null,
    distName: "",
    scenario: "",
    myAbility: null,
    architectForId: null,
    builderForId: null,
  });

  // Restore from localStorage AFTER hydration to avoid mismatch
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    if (restored) return;
    const persisted = loadFromStorage();
    if (persisted.playerId) {
      setState((prev) => ({
        ...prev,
        role: persisted.role ?? null,
        name: persisted.name ?? "",
        sessionCode: persisted.sessionCode ?? "",
        sessionId: persisted.sessionId ?? null,
        playerId: persisted.playerId ?? null,
        screen: "s-wait",
        scenario: persisted.scenario ?? "",
      }));
    }
    setRestored(true);
  }, [restored]);

  // Persist whenever key fields change
  useEffect(() => {
    saveToStorage(state);
  }, [state.sessionCode, state.playerId, state.role, state.name, state.scenario]);

  const set = useCallback((updates: Partial<GameState>) => {
    setState((prev) => ({ ...prev, ...updates }));
  }, []);

  const goTo = useCallback((screen: string) => {
    setState((prev) => ({ ...prev, screen }));
    window.scrollTo(0, 0);
  }, []);

  return (
    <GameContext.Provider value={{ ...state, set, goTo }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
