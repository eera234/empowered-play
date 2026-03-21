"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Id } from "../convex/_generated/dataModel";

interface CardData {
  id: number;
  title: string;
  icon: string;
  color: string;
  rule: string;
  hrNote: string;
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
}

interface GameContextValue extends GameState {
  set: (updates: Partial<GameState>) => void;
  goTo: (screen: string) => void;
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
  });

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
