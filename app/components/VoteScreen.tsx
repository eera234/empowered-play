"use client";

import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { VOTE_CATEGORIES } from "../../lib/constants";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";

export default function VoteScreen() {
  const { sessionId } = useGame();
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const votes = useQuery(api.voting.getVotes, sessionId ? { sessionId } : "skip");

  const nonFac = (players ?? []).filter((p) => !p.isFacilitator);
  const voteCount = votes?.length ?? 0;

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--bg0)] text-white">
      <BrandBar />
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Vote + Celebrate</h1>
          <p className="text-white/60 text-sm">
            {voteCount} votes cast
          </p>
        </div>

        <div className="w-full max-w-md space-y-3">
          {VOTE_CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className="bg-white/5 rounded-xl p-4 border border-white/10 flex items-center gap-3"
            >
              <span className="text-2xl">{cat.icon}</span>
              <div>
                <p className="font-medium">{cat.label}</p>
                <p className="text-white/50 text-sm">{cat.question}</p>
              </div>
            </div>
          ))}
        </div>

        <p className="text-white/30 text-xs mt-8">
          Full vote UI coming in Step 10
        </p>
      </div>
    </div>
  );
}
