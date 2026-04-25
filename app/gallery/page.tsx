"use client";

// Internal review gallery. Renders every illustration family in one place so
// the designer can scan the full art set without playing a session through.
// Not linked from the main app. Visit /gallery directly.

import Link from "next/link";
import { useState } from "react";
import {
  SCENARIOS,
  CLUE_CARDS,
  CRISIS_CARDS,
  POWER_CARDS,
  VOTE_CATEGORIES,
  ABILITIES,
  CONNECTION_TYPES,
  DISTRICT_BANNED_WORDS,
} from "../../lib/constants";
import { getClueIllustration } from "../components/ClueIllustrations";
import { getCrisisIllustration } from "../components/CrisisIllustrations";
import { getPowerIllustration } from "../components/PowerIllustrations";
import { getVoteCategoryIllustration } from "../components/VoteCategoryIllustrations";
import { getDistrictIllustration } from "../components/DistrictIllustrations";
import AbilityBadge from "../components/AbilityBadge";
import ConnectionTypeArt, { type ConnectionTypeKind } from "../components/ConnectionTypeArt";
import {
  TapGlyph,
  BrickGlyph,
  CameraGlyph,
  PatternGlyph,
  RepairGlyph,
  ShieldGlyph,
} from "../components/Glyphs";

const THEMES: Array<{ id: "water" | "space" | "ocean" | "forest"; label: string }> = [
  { id: "water", label: "Cityscape" },
  { id: "space", label: "Deep Space" },
  { id: "ocean", label: "Ocean Depths" },
  { id: "forest", label: "Rainforest" },
];

// Pass #19: mirrors the stroke/dash/glow logic inside StoryMapScreen's
// connection line render so the gallery preview stays visually accurate.
const LINE_STYLES: Array<{
  themeId: "water" | "space" | "ocean" | "forest";
  label: string;
  stroke: string;
  dash?: string;
  glow?: boolean;
}> = [
  { themeId: "water",  label: "Cityscape",    stroke: "rgba(79,195,247,.95)"  },
  { themeId: "space",  label: "Deep Space",   stroke: "rgba(255,183,77,.95)", glow: true },
  { themeId: "ocean",  label: "Ocean Depths", stroke: "rgba(38,166,154,.95)", dash: "10 4" },
  { themeId: "forest", label: "Rainforest",   stroke: "rgba(102,187,106,.95)", dash: "8 3" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <h2
        style={{
          fontFamily: "'Black Han Sans', sans-serif",
          fontSize: 18,
          letterSpacing: 2.5,
          color: "var(--acc1)",
          textTransform: "uppercase",
          marginBottom: 14,
          paddingBottom: 8,
          borderBottom: "1px solid var(--border)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function Tile({
  label,
  subLabel,
  children,
}: {
  label: string;
  subLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: 10,
        padding: 14,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ flexShrink: 0 }}>{children}</div>
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 11,
            letterSpacing: 1.2,
            color: "white",
          }}
        >
          {label}
        </div>
        {subLabel && (
          <div style={{ fontSize: 9, color: "var(--textdd)", marginTop: 3, letterSpacing: 0.5 }}>
            {subLabel}
          </div>
        )}
      </div>
    </div>
  );
}

const gridBase: React.CSSProperties = {
  display: "grid",
  gap: 12,
};

export default function GalleryPage() {
  const [activeScenario, setActiveScenario] = useState<string>(SCENARIOS[0].id);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--bg0)",
        color: "white",
        padding: "32px 24px 80px",
        maxWidth: 1200,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <header style={{ marginBottom: 32, display: "flex", justifyContent: "space-between", alignItems: "baseline", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 28,
              letterSpacing: 3,
              color: "white",
              textTransform: "uppercase",
            }}
          >
            Art Gallery
          </h1>
          <p style={{ fontSize: 13, color: "var(--textd)", marginTop: 4 }}>
            Every illustration that ships in the game. Use this page for review.
          </p>
        </div>
        <Link
          href="/"
          style={{
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            padding: "8px 14px",
            borderRadius: 8,
            fontSize: 12,
            color: "var(--textd)",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          {"\u2190"} Back to game
        </Link>
      </header>

      {/* Scenario picker for district illustrations */}
      <Section title="District Illustrations">
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {SCENARIOS.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveScenario(s.id)}
              style={{
                background: activeScenario === s.id ? s.color : "var(--bg2)",
                border: `1.5px solid ${activeScenario === s.id ? s.color : "var(--border)"}`,
                color: activeScenario === s.id ? "#0a0a14" : "white",
                padding: "8px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 800,
                cursor: "pointer",
                letterSpacing: 1,
              }}
            >
              {s.title}
            </button>
          ))}
        </div>
        {(() => {
          const s = SCENARIOS.find((x) => x.id === activeScenario) ?? SCENARIOS[0];
          const names = Object.values(s.districtNames);
          return (
            <div style={{ ...gridBase, gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
              {names.map((name) => {
                const Art = getDistrictIllustration(s.id, name);
                return (
                  <Tile key={name} label={name} subLabel={s.title}>
                    <Art size={140} />
                  </Tile>
                );
              })}
            </div>
          );
        })()}
      </Section>

      <Section title="Clue Cards (18)">
        <div style={{ fontSize: 11, color: "var(--textdd)", marginBottom: 14, lineHeight: 1.45 }}>
          Each clue is assigned to an architect in pair-build. The clueText is what the architect must convey without using any of the banned words.
        </div>
        <div style={{ ...gridBase, gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))" }}>
          {CLUE_CARDS.map((c) => {
            const Art = getClueIllustration(c.id);
            const catColor = c.category === "shape"
              ? "#4FC3F7"
              : c.category === "feel"
                ? "#FFD740"
                : "#B388FF";
            return (
              <div
                key={c.id}
                style={{
                  background: "var(--bg2)",
                  border: `1px solid ${catColor}44`,
                  borderLeft: `4px solid ${catColor}`,
                  borderRadius: 10,
                  padding: 14,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                  <div style={{ flexShrink: 0 }}>
                    <Art size={72} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: "'Black Han Sans', sans-serif",
                      fontSize: 14, letterSpacing: 1.2, color: "white",
                    }}>
                      {c.label.toUpperCase()}
                    </div>
                    <span style={{
                      display: "inline-block", marginTop: 5,
                      fontSize: 9, fontWeight: 900, letterSpacing: 1,
                      padding: "2px 7px", borderRadius: 999,
                      background: `${catColor}22`,
                      color: catColor,
                      border: `1px solid ${catColor}55`,
                      textTransform: "uppercase",
                    }}>
                      {c.category}
                    </span>
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: catColor, letterSpacing: 1, fontSize: 9, marginBottom: 2 }}>
                    CLUE TEXT
                  </div>
                  <div style={{ fontSize: 11, lineHeight: 1.5, color: "rgba(255,255,255,0.82)" }}>
                    {c.clueText}
                  </div>
                </div>
                <div>
                  <div style={{ fontWeight: 900, color: "#FF8A80", letterSpacing: 1, fontSize: 9, marginBottom: 4 }}>
                    BANNED WORDS ({c.bannedWords.length})
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {c.bannedWords.map((w) => (
                      <span
                        key={w}
                        style={{
                          fontSize: 10, fontWeight: 800,
                          padding: "3px 8px",
                          borderRadius: 999,
                          background: "rgba(244,67,54,0.12)",
                          color: "#FFB3AD",
                          border: "1px solid rgba(244,67,54,0.4)",
                          letterSpacing: 0.3,
                        }}
                      >
                        {w}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Crisis Cards (4)">
        <div style={{ ...gridBase, gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
          {CRISIS_CARDS.map((c) => {
            const Art = getCrisisIllustration(c.id);
            return (
              <Tile key={c.id} label={c.title} subLabel="CRISIS">
                <Art size={130} />
              </Tile>
            );
          })}
        </div>
      </Section>

      {/* Pass #17: the banned-words list per district. These are the taboo
          words players cannot say when giving clues about their district. */}
      <Section title="District Taboo Words">
        <div style={{ fontSize: 11, color: "var(--textdd)", marginBottom: 14, lineHeight: 1.45 }}>
          When a player gives a clue about their district, these words are off-limits. Listed per scenario, per district.
        </div>
        {SCENARIOS.map((s) => {
          const names = Object.values(s.districtNames);
          return (
            <div key={s.id} style={{ marginBottom: 22 }}>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 12, letterSpacing: 2,
                color: s.color, textTransform: "uppercase",
                marginBottom: 10,
              }}>
                {s.title}
              </div>
              <div style={{ ...gridBase, gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {names.map((name) => {
                  const banned = DISTRICT_BANNED_WORDS[name] ?? [];
                  return (
                    <div
                      key={name}
                      style={{
                        background: "var(--bg2)",
                        border: "1px solid var(--border)",
                        borderRadius: 10,
                        padding: 12,
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                      }}
                    >
                      <div style={{
                        fontFamily: "'Black Han Sans', sans-serif",
                        fontSize: 12, letterSpacing: 1.2, color: "white",
                      }}>
                        {name.toUpperCase()}
                      </div>
                      {banned.length === 0 ? (
                        <div style={{ fontSize: 10, color: "var(--textdd)", fontStyle: "italic" }}>
                          No banned words defined.
                        </div>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                          {banned.map((w) => (
                            <span
                              key={w}
                              style={{
                                fontSize: 10, fontWeight: 800,
                                padding: "3px 8px",
                                borderRadius: 999,
                                background: "rgba(244,67,54,0.12)",
                                color: "#FFB3AD",
                                border: "1px solid rgba(244,67,54,0.4)",
                                letterSpacing: 0.3,
                              }}
                            >
                              {w}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </Section>

      <Section title="Power Cards (5)">
        <div style={{ ...gridBase, gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
          {POWER_CARDS.map((c) => {
            const Art = getPowerIllustration(c.id);
            return (
              <Tile key={c.id} label={c.title} subLabel="POWER">
                <Art size={130} />
              </Tile>
            );
          })}
        </div>
      </Section>

      <Section title="Vote Categories (4)">
        <div style={{ ...gridBase, gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
          {VOTE_CATEGORIES.map((c) => {
            const Art = getVoteCategoryIllustration(c.id);
            return (
              <Tile key={c.id} label={c.label} subLabel="VOTE">
                <Art size={130} />
              </Tile>
            );
          })}
        </div>
      </Section>

      {/* Pass #16: Connection-type art per theme (16 total). One row per theme. */}
      <Section title="Connection Types (4 types \u00D7 4 themes)">
        {THEMES.map((theme) => {
          const types = CONNECTION_TYPES[theme.id] ?? CONNECTION_TYPES.water;
          return (
            <div key={theme.id} style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontFamily: "'Black Han Sans', sans-serif",
                  fontSize: 11,
                  letterSpacing: 2,
                  color: "var(--textd)",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {theme.label}
              </div>
              <div
                style={{
                  ...gridBase,
                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
                }}
              >
                {types.map((t) => (
                  <Tile key={t.id} label={t.label} subLabel={t.hint}>
                    <ConnectionTypeArt
                      type={t.id as ConnectionTypeKind}
                      theme={theme.id}
                      size={110}
                    />
                  </Tile>
                ))}
              </div>
            </div>
          );
        })}
      </Section>

      {/* Pass #19: map connection-line styles per theme. Previews the exact
          stroke color + dash used by StoryMapScreen when rendering a completed
          connection on the map, so all four scenarios can be compared. */}
      <Section title="Connection Line Styles (on the map)">
        <div
          style={{
            fontSize: 12,
            color: "var(--textd)",
            marginBottom: 10,
            lineHeight: 1.5,
          }}
        >
          This is how a completed connection is drawn between two districts on the map, one style per scenario.
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {LINE_STYLES.map((ls) => (
            <div
              key={ls.themeId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "10px 12px",
                background: "rgba(255,255,255,.03)",
                border: "1px solid rgba(255,255,255,.08)",
                borderRadius: 10,
              }}
            >
              <div
                style={{
                  fontFamily: "'Black Han Sans', sans-serif",
                  fontSize: 11,
                  letterSpacing: 2,
                  color: "var(--textd)",
                  textTransform: "uppercase",
                  width: 120,
                  flexShrink: 0,
                }}
              >
                {ls.label}
              </div>
              <svg width="240" height="28" viewBox="0 0 240 28" style={{ flex: 1 }}>
                <line
                  x1="6"
                  y1="14"
                  x2="234"
                  y2="14"
                  stroke={ls.stroke}
                  strokeWidth={4}
                  strokeLinecap="round"
                  strokeDasharray={ls.dash || undefined}
                  style={ls.glow ? { filter: "drop-shadow(0 0 4px rgba(255,183,77,.6))" } : undefined}
                />
              </svg>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--textdd)",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  width: 120,
                  flexShrink: 0,
                  textAlign: "right",
                }}
              >
                {ls.stroke}
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Pass #16: instructional glyphs factored out of MapOnboardingOverlay
          so they can be reviewed in isolation here. */}
      <Section title="Onboarding Glyphs (6)">
        <div
          style={{
            ...gridBase,
            gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",
          }}
        >
          <Tile label="Tap" subLabel="Pick a partner">
            <TapGlyph />
          </Tile>
          <Tile label="Brick" subLabel="Build in real LEGO">
            <BrickGlyph />
          </Tile>
          <Tile label="Camera" subLabel="Photograph the bridge">
            <CameraGlyph />
          </Tile>
          <Tile label="Pattern" subLabel="Recovery shape">
            <PatternGlyph />
          </Tile>
          <Tile label="Repair" subLabel="Mender + rebuild">
            <RepairGlyph />
          </Tile>
          <Tile label="Shield" subLabel="Protection banner">
            <ShieldGlyph />
          </Tile>
        </div>
      </Section>

      <Section title="Ability Badges (6)">
        <div style={{ ...gridBase, gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}>
          {ABILITIES.map((a) => (
            <Tile key={a.id} label={a.label} subLabel="ABILITY">
              <AbilityBadge ability={a} size={110} />
            </Tile>
          ))}
          <Tile label="Citizen" subLabel="DEFAULT">
            <AbilityBadge ability={null} size={110} />
          </Tile>
        </div>
      </Section>

      <Section title={`Role Cards (${ABILITIES.length})`}>
        <div style={{ fontSize: 11, color: "var(--textd)", marginBottom: 14, letterSpacing: 0.5 }}>
          Full text of each role card. Facilitator reviews these during role assignment after the scenario vote.
        </div>
        <div
          style={{
            display: "grid",
            gap: 14,
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
          }}
        >
          {ABILITIES.map((a) => {
            const colors: Record<string, string> = {
              mender: "#4FC3F7", scout: "#B388FF", engineer: "#FF7043",
              anchor: "#66BB6A", diplomat: "#FFD740", citizen: "#EC407A",
            };
            const color = colors[a.id] || "#B388FF";
            return (
              <div
                key={a.id}
                style={{
                  background: "var(--bg2)",
                  border: `1px solid ${color}44`,
                  borderLeft: `4px solid ${color}`,
                  borderRadius: 10,
                  padding: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <AbilityBadge ability={a} size={64} />
                  <div>
                    <div
                      style={{
                        fontFamily: "'Black Han Sans', sans-serif",
                        fontSize: 18,
                        letterSpacing: 1.5,
                        color,
                      }}
                    >
                      {a.label}
                    </div>
                    <div style={{ fontSize: 10, color: "var(--textdd)", letterSpacing: 1 }}>ROLE CARD</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: "var(--text)", lineHeight: 1.5 }}>
                  {a.description}
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--acc2)", letterSpacing: 1, marginBottom: 4 }}>CRISIS 1</div>
                  <div style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.5 }}>{a.descriptionC1}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--acc2)", letterSpacing: 1, marginBottom: 4 }}>CRISIS 2</div>
                  <div style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.5 }}>{a.descriptionC2}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--acc1)", letterSpacing: 1, marginBottom: 4 }}>GAME MECHANIC</div>
                  <div style={{ fontSize: 11, color: "var(--textd)", lineHeight: 1.5 }}>{a.mechanic}</div>
                </div>
                <div
                  style={{
                    background: "rgba(255,255,255,.03)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    padding: 10,
                  }}
                >
                  <div style={{ fontSize: 9, color: "#FFB74D", letterSpacing: 1, marginBottom: 4 }}>FACILITATOR INSIGHT</div>
                  <div style={{ fontSize: 11, color: "var(--text)", lineHeight: 1.5, fontStyle: "italic" }}>
                    {a.hrNote}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </div>
  );
}
