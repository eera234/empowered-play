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
}

interface GameContextValue extends GameState {
  set: (updates: Partial<GameState>) => void;
  goTo: (screen: string) => void;
  leaveSession: (opts?: { confirm?: boolean; reload?: boolean }) => void;
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

function clearStorage() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Defensive: wipe any stale session-related keys that may have been set by older builds
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith("empowered-play")) localStorage.removeItem(key);
    }
  } catch {
    // storage unavailable (Safari private browsing, etc.)
  }
}

// If the URL has ?reset=1, wipe storage and strip the query param before React hydrates state.
// This is the escape hatch for "I'm stuck on Safari" — user just appends ?reset=1 to the URL.
function consumeResetParam(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("reset") === "1") {
      clearStorage();
      url.searchParams.delete("reset");
      window.history.replaceState({}, "", url.pathname + (url.search ? url.search : "") + url.hash);
      return true;
    }
  } catch {
    // noop
  }
  return false;
}

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
  });

  // Restore from localStorage AFTER hydration to avoid mismatch.
  // Honors ?reset=1 as a hard escape — clears storage and skips restore.
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    if (restored) return;
    const wasReset = consumeResetParam();
    if (!wasReset) {
      const persisted = loadFromStorage();
      if (persisted.playerId) {
        // Facilitators land on their setup screen while waiting; players wait.
        // The phase-based routing effect in page.tsx will override this as soon
        // as the session query resolves (e.g. to s-map for mid-game rejoin).
        const initialScreen = persisted.role === "facilitator" ? "s-fac-setup" : "s-wait";
        setState((prev) => ({
          ...prev,
          role: persisted.role ?? null,
          name: persisted.name ?? "",
          sessionCode: persisted.sessionCode ?? "",
          sessionId: persisted.sessionId ?? null,
          playerId: persisted.playerId ?? null,
          screen: initialScreen,
          scenario: persisted.scenario ?? "",
        }));
      }
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
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  // Leave the current session — clears local state + localStorage.
  // The server-side session is untouched; user can rejoin with the same code.
  // reload=true forces a full page reload as a last resort against stuck UI state.
  const leaveSession = useCallback((opts?: { confirm?: boolean; reload?: boolean }) => {
    const needsConfirm = opts?.confirm !== false;
    if (needsConfirm && typeof window !== "undefined") {
      const ok = window.confirm(
        "Leave this game?\n\nYou can rejoin with the same session code and name. This just resets this device."
      );
      if (!ok) return;
    }
    clearStorage();
    setState({
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
    });
    if (opts?.reload && typeof window !== "undefined") {
      // Hard reload — blows away any in-memory Convex subscriptions and component trees
      window.location.href = window.location.pathname;
    }
  }, []);

  return (
    <GameContext.Provider value={{ ...state, set, goTo, leaveSession }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
