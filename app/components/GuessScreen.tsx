"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { SCENARIOS } from "../../lib/constants";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import { getDistrictIllustration } from "./DistrictIllustrations";

// ══════════════════════════════
//  GUESS SCREEN
//  Phase: guess
//  Anonymous photo gallery where players assign district names
//  to photos. Skip own photo + the one they gave clues for.
//  When all players finish, auto-transitions to reveal mode.
// ══════════════════════════════

export default function GuessScreen() {
  const { sessionId, sessionCode, playerId, role } = useGame();
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const buildPhotos = useQuery(api.pairBuild.getBuildPhotos, sessionId ? { sessionId } : "skip");
  const guesses = useQuery(api.voting.getGuesses, sessionId ? { sessionId } : "skip");
  const submitGuess = useMutation(api.voting.submitGuess);
  const advanceNewPhase = useMutation(api.game.advanceNewPhase);

  const [pickerPhotoId, setPickerPhotoId] = useState<Id<"players"> | null>(null);
  const [revealedIndex, setRevealedIndex] = useState(-1); // for staggered reveal animation

  const scenario = session?.scenario || "";
  const scenarioData = SCENARIOS.find((s) => s.id === scenario) || SCENARIOS[0];
  const nonFac = useMemo(() => (players ?? []).filter((p) => !p.isFacilitator), [players]);
  const me = players?.find((p) => p._id === playerId);
  const isFac = role === "facilitator";

  // Get latest photo per player (highest round number)
  const photoByPlayer = useMemo(() => {
    const map = new Map<Id<"players">, { round: number; url: string }>();
    (buildPhotos ?? []).forEach((p) => {
      const existing = map.get(p.playerId);
      if (!existing || p.round > existing.round) {
        map.set(p.playerId, { round: p.round, url: p.photoDataUrl });
      }
    });
    return map;
  }, [buildPhotos]);

  // My guesses keyed by target
  const myGuessByTarget = useMemo(() => {
    const map = new Map<Id<"players">, string>();
    (guesses ?? [])
      .filter((g) => g.guesserId === playerId)
      .forEach((g) => map.set(g.targetPlayerId, g.guessedName));
    return map;
  }, [guesses, playerId]);

  // Who I should guess about: everyone except me and my architectFor
  const skipIds = useMemo(() => {
    const set = new Set<Id<"players">>();
    if (me) set.add(me._id);
    if (me?.architectFor) set.add(me.architectFor);
    return set;
  }, [me]);
  const targetsToGuess = useMemo(
    () => nonFac.filter((p) => !skipIds.has(p._id)),
    [nonFac, skipIds]
  );

  // District names pool: all nonFac players' district names
  const allDistrictNames = useMemo(
    () => nonFac.map((p) => p.districtName).filter(Boolean) as string[],
    [nonFac]
  );
  // Names I've already used in my guesses
  const usedByMe = new Set(Array.from(myGuessByTarget.values()));

  // Pass #17: only require present players to finish guessing. A ghost who
  // left during the guess phase must not block the reveal animation forever.
  const presentNonFac = nonFac.filter((p) => p.isPresent !== false);
  // Player done + all done detection
  function guessesNeededForPlayer(p: (typeof nonFac)[number]): number {
    const skip = new Set<Id<"players">>([p._id]);
    if (p.architectFor) skip.add(p.architectFor);
    return nonFac.filter((x) => !skip.has(x._id)).length;
  }
  const myGuessCount = targetsToGuess.filter((t) => myGuessByTarget.has(t._id)).length;
  const amDone = !isFac && targetsToGuess.length > 0 && myGuessCount === targetsToGuess.length;
  const allPlayersDone = presentNonFac.length >= 2 && presentNonFac.every((p) => {
    const needed = guessesNeededForPlayer(p);
    if (needed === 0) return true; // edge case: 2-player
    const count = (guesses ?? []).filter((g) => g.guesserId === p._id).length;
    return count >= needed;
  });

  const revealMode = allPlayersDone;

  // Trigger staggered reveal animation
  useEffect(() => {
    if (!revealMode) return;
    if (revealedIndex >= nonFac.length - 1) return;
    const t = setTimeout(() => setRevealedIndex((prev) => Math.min(prev + 1, nonFac.length - 1)), 350);
    return () => clearTimeout(t);
  }, [revealMode, revealedIndex, nonFac.length]);

  // Reset reveal animation when we re-enter reveal mode
  useEffect(() => {
    if (!revealMode) setRevealedIndex(-1);
    else if (revealedIndex < 0) setRevealedIndex(0);
  }, [revealMode, revealedIndex]);

  // Auto-advance to Story Map after reveal animation completes + reading time.
  // Ref gate ensures we only call advance once per session even as Convex
  // re-renders. Facilitator's manual button stays as an early-exit.
  const autoAdvancedRef = useRef(false);
  useEffect(() => {
    if (!revealMode || nonFac.length < 3 || !sessionId) return;
    if (autoAdvancedRef.current) return;
    const delay = 350 * nonFac.length + 4500;
    const t = setTimeout(() => {
      if (autoAdvancedRef.current) return;
      autoAdvancedRef.current = true;
      advanceNewPhase({ sessionId, fromPhase: "guess" }).catch(() => {
        autoAdvancedRef.current = false;
      });
    }, delay);
    return () => clearTimeout(t);
  }, [revealMode, nonFac.length, sessionId, advanceNewPhase]);

  async function handleAssign(targetId: Id<"players">, name: string) {
    if (!sessionId || !playerId) return;
    try {
      await submitGuess({ sessionId, guesserId: playerId, targetPlayerId: targetId, guessedName: name });
      setPickerPhotoId(null);
    } catch {
      toast("Could not save guess. Try again.");
    }
  }

  async function handleAdvance() {
    if (!sessionId) return;
    await advanceNewPhase({ sessionId, fromPhase: "guess" });
  }

  // Score calc (reveal mode): my correct guesses
  const myScore = Array.from(myGuessByTarget.entries()).filter(([targetId, guessedName]) => {
    const target = nonFac.find((p) => p._id === targetId);
    return target?.districtName === guessedName;
  }).length;

  // Picker photo data
  const pickerPhoto = pickerPhotoId ? photoByPlayer.get(pickerPhotoId) : null;
  const pickerCurrentGuess = pickerPhotoId ? myGuessByTarget.get(pickerPhotoId) : null;
  // Names available in picker: all unused names + current guess (to allow seeing what's assigned)
  const pickerAvailableNames = allDistrictNames.filter(
    (n) => !usedByMe.has(n) || n === pickerCurrentGuess
  );

  const isLoading = players === undefined || buildPhotos === undefined || guesses === undefined;
  if (isLoading) {
    return (
      <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white" }}>
        <BrandBar badge={isFac ? "FACILITATOR" : undefined} />
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "var(--textd)" }}>
          Loading builds{"\u2026"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg0)", color: "white" }}>
      <BrandBar badge={isFac ? "FACILITATOR" : undefined} />

      {/* Picker modal */}
      {pickerPhotoId && pickerPhoto && (
        <div className="card-modal-overlay" onClick={() => setPickerPhotoId(null)}>
          <div className="card-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <div className="card-modal-studs">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="lego-stud-3d" style={{ width: 16, height: 16 }} />
              ))}
            </div>
            <div className="card-modal-accent" style={{ background: scenarioData.color }} />
            <div className="card-modal-body">
              <div style={{ textAlign: "center", marginBottom: 12 }}>
                <img
                  src={pickerPhoto.url}
                  alt="Build"
                  style={{
                    width: 200, height: 150, objectFit: "cover",
                    borderRadius: 8, border: "2px solid var(--border)",
                    margin: "0 auto",
                  }}
                />
              </div>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif", fontSize: 18,
                letterSpacing: 2, textAlign: "center", marginBottom: 6,
                color: scenarioData.color,
              }}>
                WHICH {scenarioData.terminology.district.toUpperCase()}?
              </div>
              {pickerCurrentGuess && (
                <div style={{ textAlign: "center", fontSize: 11, color: "var(--textd)", marginBottom: 12 }}>
                  Currently guessed: <span style={{ color: "var(--acc1)" }}>{pickerCurrentGuess}</span>
                </div>
              )}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                {pickerAvailableNames.map((name) => {
                  const isCurrent = name === pickerCurrentGuess;
                  return (
                    <button
                      key={name}
                      onClick={() => handleAssign(pickerPhotoId, name)}
                      style={{
                        padding: "12px 16px",
                        borderRadius: "var(--brick-radius)",
                        border: `2px solid ${isCurrent ? scenarioData.color : "var(--border)"}`,
                        background: isCurrent ? `${scenarioData.color}15` : "rgba(255,255,255,.04)",
                        color: isCurrent ? scenarioData.color : "white",
                        fontSize: 14, fontWeight: 800,
                        cursor: "pointer", textAlign: "left",
                        transition: "all .15s",
                        fontFamily: "inherit",
                      }}
                      onMouseOver={(e) => { if (!isCurrent) (e.currentTarget as HTMLElement).style.borderColor = "var(--textd)"; }}
                      onMouseOut={(e) => { if (!isCurrent) (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; }}
                    >
                      {name}
                      {isCurrent && <span style={{ float: "right", fontSize: 10 }}>{"\u2713 CURRENT"}</span>}
                    </button>
                  );
                })}
                {pickerAvailableNames.length === 0 && (
                  <div style={{ textAlign: "center", padding: "16px 0", color: "var(--textd)", fontSize: 13 }}>
                    No names available. All assigned.
                  </div>
                )}
              </div>
            </div>
            <button className="card-modal-close" onClick={() => setPickerPhotoId(null)}>CLOSE</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{
        textAlign: "center", padding: "14px 16px",
        borderBottom: "1px solid var(--border)", background: "rgba(255,255,255,.02)",
      }}>
        <div style={{
          fontFamily: "'Black Han Sans', sans-serif", fontSize: 11,
          letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 4,
        }}>
          {revealMode ? "The Reveal" : "The Guess"}
        </div>
        <div style={{ fontSize: 13, color: "white" }}>
          {revealMode
            ? (isFac
                ? `See how the team did, then advance to the Story Map.`
                : targetsToGuess.length > 0
                  ? `You got ${myScore} of ${targetsToGuess.length} correct!`
                  : `No guesses to reveal: only your pair played this round.`)
            : (isFac
                ? `Players are matching ${scenarioData.terminology.district} names to anonymous photos.`
                : targetsToGuess.length === 0
                  ? `Only your pair in this session: no one else to guess.`
                  : amDone
                    ? `All guesses submitted. Waiting for others...`
                    : `Tap a photo to assign a ${scenarioData.terminology.district} name.`)
          }
        </div>
        {isFac && !revealMode && (
          <button
            onClick={handleAdvance}
            style={{
              marginTop: 10,
              padding: "8px 16px",
              fontSize: 11,
              fontWeight: 900,
              letterSpacing: 1.5,
              textTransform: "uppercase",
              background: "rgba(255,215,0,.18)",
              border: "1.5px solid rgba(255,215,0,.55)",
              borderRadius: 6,
              color: "#FFD740",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
            }}
            title="Skip guessing and go straight to the Story Map"
          >
            SKIP TO STORY MAP {"\u2192"}
          </button>
        )}
      </div>

      {/* 2-player compare reveal. Guessing makes no sense with one partner, so
          each player (and the facilitator) sees their build photo side by side
          with the illustrated district they were meant to construct. CONTINUE
          advances to the Story Map. */}
      {nonFac.length < 3 && !revealMode && (
        <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          <div style={{ textAlign: "center", marginBottom: 16 }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 14, letterSpacing: 2,
              color: "var(--acc1)", textTransform: "uppercase", marginBottom: 6,
            }}>
              BIG REVEAL
            </div>
            <div style={{ fontSize: 12, color: "var(--textd)", maxWidth: 420, margin: "0 auto", lineHeight: 1.5 }}>
              With two players, there is no cross-guessing. Compare what each of you built against what the card wanted.
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {nonFac.map((p) => {
              const photo = photoByPlayer.get(p._id);
              const DistrictArt = getDistrictIllustration(scenario, p.districtName ?? null);
              const isMe = me && p._id === me._id;
              return (
                <div key={p._id} style={{
                  background: "rgba(255,255,255,.04)",
                  border: `2px solid ${isMe ? scenarioData.color : "var(--border)"}`,
                  borderRadius: "var(--brick-radius)", padding: 14,
                }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--textd)", fontFamily: "'Black Han Sans', sans-serif", textTransform: "uppercase", marginBottom: 8 }}>
                    {isMe ? "YOU" : p.name.toUpperCase()} {p.districtName ? "\u00B7 " + p.districtName : ""}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: "var(--acc2)", marginBottom: 6 }}>
                        WHAT WAS BUILT
                      </div>
                      {photo ? (
                        <img src={photo.url} alt="" style={{
                          width: "100%", aspectRatio: "4 / 3", objectFit: "cover",
                          borderRadius: 8, border: "1px solid var(--border)",
                        }} />
                      ) : (
                        <div style={{
                          width: "100%", aspectRatio: "4 / 3",
                          background: "rgba(255,255,255,.04)", border: "1px solid var(--border)",
                          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                          color: "var(--textdd)", fontSize: 24,
                        }}>{"\u{1F4F7}"}</div>
                      )}
                    </div>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: 1, color: "var(--acc1)", marginBottom: 6 }}>
                        WHAT THE CARD WANTED
                      </div>
                      <div style={{
                        width: "100%", aspectRatio: "4 / 3", overflow: "hidden",
                        borderRadius: 8, border: "1px solid var(--border)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: "rgba(0,0,0,.25)",
                      }}>
                        <DistrictArt size={160} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div style={{ marginTop: 16 }}>
            {isFac ? (
              <button
                className="lb lb-yellow"
                style={{ width: "100%", fontSize: 13, padding: "12px 0" }}
                onClick={handleAdvance}
              >
                ADVANCE TO STORY MAP {"\u2192"}
              </button>
            ) : (
              <div style={{ textAlign: "center", fontSize: 12, color: "var(--textd)", padding: "10px 0" }}>
                Waiting for the facilitator to advance to the Story Map.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Content (3+ players only, or reveal mode). 2-player uses the
          compare-reveal block above. */}
      {(nonFac.length >= 3 || revealMode) && (
      <div style={{ flex: 1, overflowY: "auto", padding: 16 }}>

        {/* Photo grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
          gap: 12,
          marginBottom: 20,
        }}>
          {nonFac.map((player, idx) => {
            const photo = photoByPlayer.get(player._id);
            const isMine = me && player._id === me._id;
            const isMyArchitectFor = me && me.architectFor === player._id;
            const skip = isMine || isMyArchitectFor;
            const myGuess = myGuessByTarget.get(player._id);
            const revealed = revealMode && idx <= revealedIndex;
            const correct = revealed && myGuess === player.districtName;
            // Only reveal the district illustration in reveal mode, since
            // before then the district name itself is the secret the guesser
            // is trying to figure out.
            const DistrictArt = revealed && player.districtName ? getDistrictIllustration(scenario, player.districtName) : null;

            return (
              <div
                key={player._id}
                onClick={() => {
                  if (revealMode) return;
                  if (skip) return;
                  if (!photo) return;
                  if (isFac) return;
                  setPickerPhotoId(player._id);
                }}
                style={{
                  background: "rgba(255,255,255,.04)",
                  border: `2px solid ${
                    revealMode
                      ? (isMine ? scenarioData.color : correct ? "#69F0AE" : myGuess ? "#FF5252" : "var(--border)")
                      : (skip ? "var(--border)" : myGuess ? scenarioData.color : "var(--border)")
                  }`,
                  borderRadius: "var(--brick-radius)",
                  overflow: "hidden",
                  cursor: revealMode || skip || !photo || isFac ? "default" : "pointer",
                  opacity: skip && !revealMode ? 0.55 : 1,
                  boxShadow: myGuess && !revealMode ? `0 0 12px ${scenarioData.color}30` : "var(--brick-shadow)",
                  transition: "all .25s",
                  transform: revealed ? "scale(1)" : "scale(1)",
                }}
              >
                {/* Photo area */}
                <div style={{ position: "relative", width: "100%", paddingTop: "75%" }}>
                  {photo ? (
                    <img
                      src={photo.url}
                      alt=""
                      style={{
                        position: "absolute", inset: 0,
                        width: "100%", height: "100%", objectFit: "cover",
                        filter: revealed && !correct && !isMine ? "grayscale(.4)" : "none",
                      }}
                    />
                  ) : (
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(255,255,255,.02)", color: "var(--textdd)",
                      fontSize: 32,
                    }}>
                      {"\u{1F4F7}"}
                    </div>
                  )}

                  {/* Badges overlay */}
                  {!revealMode && isMine && (
                    <div style={{
                      position: "absolute", top: 6, right: 6,
                      background: `${scenarioData.color}dd`, color: "#0a0a12",
                      fontSize: 9, fontWeight: 900, letterSpacing: 1,
                      padding: "3px 8px", borderRadius: 4,
                    }}>
                      YOUR BUILD
                    </div>
                  )}
                  {!revealMode && isMyArchitectFor && (
                    <div style={{
                      position: "absolute", top: 6, right: 6,
                      background: "rgba(255,215,0,.85)", color: "#0a0a12",
                      fontSize: 9, fontWeight: 900, letterSpacing: 1,
                      padding: "3px 8px", borderRadius: 4,
                    }}>
                      YOU LED THIS
                    </div>
                  )}
                  {revealMode && correct && (
                    <div style={{
                      position: "absolute", top: 6, right: 6,
                      background: "#69F0AE", color: "#0a0a12",
                      fontSize: 9, fontWeight: 900, letterSpacing: 1,
                      padding: "3px 10px", borderRadius: 4,
                    }}>
                      {"\u2713"} CORRECT
                    </div>
                  )}
                  {revealMode && myGuess && !correct && !isMine && (
                    <div style={{
                      position: "absolute", top: 6, right: 6,
                      background: "#FF5252", color: "white",
                      fontSize: 9, fontWeight: 900, letterSpacing: 1,
                      padding: "3px 10px", borderRadius: 4,
                    }}>
                      {"\u2715"} MISSED
                    </div>
                  )}
                  {!revealMode && !skip && !myGuess && !isFac && (
                    <div style={{
                      position: "absolute", inset: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background: "rgba(0,0,0,.35)",
                      fontFamily: "'Black Han Sans', sans-serif", fontSize: 32,
                      color: "rgba(255,255,255,.5)", letterSpacing: 2,
                    }}>
                      ?
                    </div>
                  )}
                </div>

                {/* Label area */}
                <div style={{ padding: "8px 10px", minHeight: 52 }}>
                  {revealMode ? (
                    <div style={{
                      opacity: revealed ? 1 : 0,
                      transform: revealed ? "translateY(0)" : "translateY(4px)",
                      transition: "opacity .4s, transform .4s",
                      display: "flex", gap: 10, alignItems: "center",
                    }}>
                      {DistrictArt && (
                        <div style={{
                          width: 48, height: 48, borderRadius: 6, overflow: "hidden",
                          border: "1px solid var(--border)", flexShrink: 0,
                        }}>
                          <DistrictArt size={48} />
                        </div>
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: "white" }}>
                        {player.districtName || "Unnamed"}
                      </div>
                      <div style={{ fontSize: 10, color: "var(--textd)", marginTop: 2 }}>
                        built by {player.name}
                      </div>
                      {myGuess && myGuess !== player.districtName && !isMine && (
                        <div style={{ fontSize: 10, color: "#FF5252", marginTop: 2, fontStyle: "italic" }}>
                          you guessed: {myGuess}
                        </div>
                      )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {skip ? (
                        <div style={{ fontSize: 11, color: "var(--textd)", fontStyle: "italic" }}>
                          {isMine ? "This is your photo" : "You gave the clues for this build"}
                        </div>
                      ) : myGuess ? (
                        <div>
                          <div style={{
                            fontSize: 9, fontWeight: 900, letterSpacing: 1,
                            color: "var(--textd)", textTransform: "uppercase",
                          }}>
                            You guessed
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: scenarioData.color, marginTop: 2 }}>
                            {myGuess}
                          </div>
                        </div>
                      ) : (
                        <div style={{
                          fontSize: 11, color: "var(--textdd)",
                          fontFamily: "'Black Han Sans', sans-serif",
                          letterSpacing: 1,
                        }}>
                          TAP TO GUESS
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Guessing progress + unused names (not in reveal mode) */}
        {!revealMode && !isFac && targetsToGuess.length > 0 && (
          <>
            {/* Progress */}
            <div style={{
              background: "rgba(255,255,255,.03)", border: "1px solid var(--border)",
              borderRadius: "var(--brick-radius)", padding: "12px 16px", marginBottom: 12,
            }}>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase",
              }}>
                Progress
              </div>
              <div style={{
                marginTop: 6, height: 8, borderRadius: 4,
                background: "rgba(255,255,255,.06)", overflow: "hidden",
              }}>
                <div style={{
                  height: "100%",
                  width: `${(myGuessCount / targetsToGuess.length) * 100}%`,
                  background: myGuessCount === targetsToGuess.length ? "#69F0AE" : scenarioData.color,
                  transition: "width .3s",
                }} />
              </div>
              <div style={{ fontSize: 11, color: "var(--textd)", marginTop: 6 }}>
                {myGuessCount} of {targetsToGuess.length} guessed
              </div>
            </div>

            {/* Unused names */}
            {allDistrictNames.length > 0 && (
              <div style={{
                background: "rgba(255,255,255,.03)", border: "1px solid var(--border)",
                borderRadius: "var(--brick-radius)", padding: "12px 16px",
              }}>
                <div style={{
                  fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
                  letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 8,
                }}>
                  Unassigned names
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {allDistrictNames.map((n) => {
                    const used = usedByMe.has(n);
                    return (
                      <span key={n} style={{
                        padding: "5px 10px", borderRadius: 14, fontSize: 12,
                        fontWeight: 700,
                        background: used ? "rgba(255,255,255,.03)" : `${scenarioData.color}15`,
                        border: `1px solid ${used ? "var(--border)" : `${scenarioData.color}44`}`,
                        color: used ? "var(--textdd)" : scenarioData.color,
                        textDecoration: used ? "line-through" : "none",
                      }}>
                        {n}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Facilitator progress tracker */}
        {isFac && !revealMode && (
          <div style={{
            background: "rgba(255,255,255,.03)", border: "1px solid var(--border)",
            borderRadius: "var(--brick-radius)", padding: "12px 16px",
          }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 10,
              letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 10,
            }}>
              Player Progress
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {nonFac.map((p) => {
                const needed = guessesNeededForPlayer(p);
                const count = (guesses ?? []).filter((g) => g.guesserId === p._id).length;
                const done = count >= needed;
                return (
                  <div key={p._id} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "6px 10px", borderRadius: 6,
                    background: done ? "rgba(105,240,174,.08)" : "rgba(255,255,255,.02)",
                    border: `1px solid ${done ? "rgba(105,240,174,.2)" : "var(--border)"}`,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 700 }}>{p.name}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 800,
                      color: done ? "var(--acc4)" : "var(--textd)",
                    }}>
                      {count}/{needed} {done ? "\u2713" : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Score badge (reveal mode, player) */}
        {revealMode && !isFac && targetsToGuess.length > 0 && (
          <div style={{
            textAlign: "center", padding: 20,
            background: `linear-gradient(135deg, ${scenarioData.color}20 0%, ${scenarioData.color}08 100%)`,
            border: `2px solid ${scenarioData.color}44`,
            borderRadius: "var(--brick-radius)",
          }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 11,
              letterSpacing: 2, color: "var(--textd)", textTransform: "uppercase", marginBottom: 4,
            }}>
              YOUR SCORE
            </div>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif", fontSize: 42,
              color: scenarioData.color, letterSpacing: 2,
            }}>
              {myScore} / {targetsToGuess.length}
            </div>
            <div style={{ fontSize: 12, color: "var(--textd)", marginTop: 4 }}>
              {myScore === targetsToGuess.length ? "Perfect!" :
                myScore > targetsToGuess.length / 2 ? "Nice work." :
                  myScore > 0 ? "Good effort." :
                    "Hard round!"}
            </div>
          </div>
        )}
      </div>
      )}

      {/* Facilitator advance button (bottom bar, reveal mode) */}
      {isFac && revealMode && (
        <div style={{
          borderTop: "1px solid var(--border)", padding: 12,
          background: "rgba(255,255,255,.02)",
        }}>
          <button
            className="lb lb-yellow"
            style={{ width: "100%", fontSize: 13, padding: "12px 0" }}
            onClick={handleAdvance}
          >
            ADVANCE TO STORY MAP {"\u2192"}
          </button>
        </div>
      )}

      {/* Player waiting state (bottom) */}
      {!isFac && amDone && !revealMode && (
        <div style={{
          borderTop: "1px solid var(--border)", padding: "12px 16px",
          background: "rgba(105,240,174,.06)",
          fontSize: 12, color: "var(--acc4)",
          textAlign: "center", fontWeight: 800,
        }}>
          {"\u2713"} All guesses locked in. Waiting for others...
        </div>
      )}
    </div>
  );
}
