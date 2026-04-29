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
  VOTE_CATEGORIES,
  ABILITIES,
  getThemedAbility,
  CONNECTION_TYPES,
  DISTRICT_BANNED_WORDS,
} from "../../lib/constants";
import { getClueIllustration } from "../components/ClueIllustrations";
import { getCrisisIllustration } from "../components/CrisisIllustrations";
import { getVoteCategoryIllustration } from "../components/VoteCategoryIllustrations";
import { getDistrictIllustration } from "../components/DistrictIllustrations";
import AbilityBadge from "../components/AbilityBadge";
import ConnectionTypeArt, { type ConnectionTypeKind } from "../components/ConnectionTypeArt";
import RoleDetailModal from "../components/RoleDetailModal";
import {
  TapGlyph,
  BrickGlyph,
  CameraGlyph,
  PatternGlyph,
  RepairGlyph,
  ShieldGlyph,
  ClueCardPickGlyph,
  SwapRolesGlyph,
  RiddleGlyph,
  DragToZoneGlyph,
  TimerLockGlyph,
  CrisisIncomingGlyph,
  BridgeSceneGlyph,
  LastDropGlyph,
  NewPositionsGlyph,
  TapPartnerGlyph,
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

interface IntroPanelMock {
  glyph: React.ReactNode;
  headline: string;
  body: string;
  riddle?: string;     // only used by Ch1 panel 1
  roleLabel?: string;  // only used by Ch2 "YOUR KIT" panel
}

function ChapterIntroPreview({
  title,
  subtitle,
  panels,
}: {
  title: string;
  subtitle?: string;
  panels: IntroPanelMock[];
}) {
  return (
    <div style={{ marginBottom: 24 }}>
      <div
        style={{
          fontFamily: "'Black Han Sans', sans-serif",
          fontSize: 13,
          letterSpacing: 1.5,
          color: "white",
          textTransform: "uppercase",
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 11, color: "var(--textdd)", marginBottom: 10, lineHeight: 1.5 }}>
          {subtitle}
        </div>
      )}
      <div style={{ ...gridBase, gridTemplateColumns: `repeat(${panels.length}, minmax(180px, 1fr))` }}>
        {panels.map((p, i) => (
          <div
            key={i}
            style={{
              background: "linear-gradient(180deg, rgba(14,14,37,1), rgba(8,8,22,1))",
              border: "2px solid rgba(255,215,0,.45)",
              borderRadius: 14,
              padding: 18,
              minHeight: 280,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "flex-start",
              textAlign: "center",
              boxShadow: "0 12px 28px rgba(0,0,0,.4)",
            }}
          >
            <div style={{ fontSize: 9, letterSpacing: 1.5, color: "var(--textdd)", marginBottom: 8 }}>
              PANEL {i + 1}
            </div>
            <div style={{ marginBottom: 10 }}>{p.glyph}</div>
            <div
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 16,
                letterSpacing: 2,
                color: "var(--acc1, #FFD700)",
                marginBottom: 6,
              }}
            >
              {p.headline}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.85)", lineHeight: 1.5, maxWidth: 220 }}>
              {p.body}
            </div>
            {p.riddle && (
              <div
                style={{
                  marginTop: 10,
                  background: "rgba(255,215,0,.08)",
                  border: "1px solid rgba(255,215,0,.35)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 11,
                  fontStyle: "italic",
                  color: "white",
                  lineHeight: 1.5,
                  maxWidth: 220,
                }}
              >
                &ldquo;{p.riddle}&rdquo;
              </div>
            )}
            {p.roleLabel && (
              <div
                style={{
                  marginTop: 10,
                  padding: "6px 12px",
                  border: "1px solid rgba(255,215,0,.4)",
                  borderRadius: 8,
                  background: "rgba(255,215,0,.08)",
                  fontFamily: "'Black Han Sans', sans-serif",
                  fontSize: 12,
                  letterSpacing: 1.5,
                  color: "var(--acc1, #FFD700)",
                }}
              >
                {p.roleLabel}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const [activeScenario, setActiveScenario] = useState<string>(SCENARIOS[0].id);
  const [galleryDetailAbilityId, setGalleryDetailAbilityId] = useState<string | null>(null);

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
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Link
            href="/a3-jury"
            style={{
              background: "var(--lego-yellow)",
              border: "1px solid var(--lego-yellow)",
              padding: "8px 14px",
              borderRadius: 8,
              fontSize: 12,
              color: "#0a0a14",
              textDecoration: "none",
              fontWeight: 900,
              letterSpacing: 1,
              fontFamily: "'Black Han Sans', sans-serif",
              textTransform: "uppercase",
            }}
          >
            A3 Jury Deck {"\u2192"}
          </Link>
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
        </div>
      </header>

      <Section title="A3 Jury Presentation">
        <div
          style={{
            display: "flex",
            gap: 16,
            alignItems: "center",
            padding: 18,
            background: "var(--bg2)",
            border: "1px solid var(--border)",
            borderLeft: "4px solid var(--lego-yellow)",
            borderRadius: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 16,
                letterSpacing: 1.5,
                color: "white",
                marginBottom: 4,
              }}
            >
              20-Slide Deck for Review
            </div>
            <div style={{ fontSize: 12, color: "var(--textd)", lineHeight: 1.5 }}>
              Step through the slides with arrow keys. Click <strong>Download as PPTX</strong> on the deck page to export an editable Keynote/PowerPoint file.
            </div>
          </div>
          <Link
            href="/a3-jury"
            style={{
              background: "var(--lego-yellow)",
              color: "#0a0a14",
              padding: "10px 18px",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: "'Black Han Sans', sans-serif",
              letterSpacing: 1.5,
              textDecoration: "none",
              fontWeight: 900,
              textTransform: "uppercase",
              flexShrink: 0,
            }}
          >
            Open Deck {"\u2192"}
          </Link>
        </div>
      </Section>

      <Section title="Chapter Intros (Player-Facing Onboarding)">
        <div style={{ fontSize: 11, color: "var(--textdd)", marginBottom: 14, lineHeight: 1.5 }}>
          The four blocking intro overlays players see before each chapter. Each row is one intro&apos;s carousel panels in order.
          Glyphs are bespoke per panel and copy is calibrated for ~25-40 words each.
        </div>
        <ChapterIntroPreview
          title="Pair-build intro"
          subtitle="Shown once per session, before the clue-card loop starts."
          panels={[
            { glyph: <ClueCardPickGlyph size={120} />, headline: "PICK A CLUE",            body: "You get six clue cards. Each round, pick one and send it to your partner. They will use only your clue to build with LEGO." },
            { glyph: <BrickGlyph size={120} />,        headline: "YOUR PARTNER'S TURN",    body: "At the same time, your partner sends you a clue. Build with LEGO from their clue. When you finish, take a photo and send it back." },
            { glyph: <SwapRolesGlyph size={120} />,    headline: "THREE ROUNDS, ONE BUILD", body: "There are three rounds with the same partner. You keep adding to the same build each round. Each new clue adds a little more detail, so by the end your build matches what your partner imagined." },
          ]}
        />
        <ChapterIntroPreview
          title="Ch1 briefing"
          subtitle="Shown when Chapter 1 (place your district) begins. Private clue, if any, appears on panel 1."
          panels={[
            { glyph: <RiddleGlyph size={120} />,    headline: "YOUR PRIVATE CLUE", body: "You get a private clue. It hints at one spot on the harbor. Only you can see it. Read it carefully and figure out where it points.", riddle: "I stand watch where the harbor meets the open sea." },
            { glyph: <DragToZoneGlyph size={120} />, headline: "DRAG YOUR DISTRICT", body: "Drag your district onto the spot you think your clue means. You can move it as many times as you like before the timer ends." },
            { glyph: <TimerLockGlyph size={120} />,  headline: "TWO MINUTES",       body: "You have two minutes to place your district. When the timer ends, your final position locks in." },
          ]}
        />
        <ChapterIntroPreview
          title="Ch2 intro"
          subtitle="Shown when Chapter 2 begins. Three panels: tap to pair up, kinds of connections (themed), build and photograph. No crisis warning, no role panel."
          panels={[
            { glyph: <TapPartnerGlyph size={120} />, headline: "TAP TO PAIR UP",    body: "Tap your own district first. Then tap a teammate's district to send them a connection request." },
            {
              glyph: (
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6,
                  width: 180,
                }}>
                  {CONNECTION_TYPES.water.map(t => (
                    <div key={t.id} style={{
                      background: "rgba(255,255,255,.04)",
                      border: "1px solid rgba(255,215,0,.25)",
                      borderRadius: 8, padding: "4px 4px 2px",
                      display: "flex", flexDirection: "column", alignItems: "center",
                    }}>
                      <ConnectionTypeArt type={t.id as ConnectionTypeKind} theme="water" size={64} />
                      <div style={{
                        marginTop: 2,
                        fontFamily: "'Black Han Sans', sans-serif",
                        fontSize: 9, letterSpacing: 1, color: "var(--acc1, #FFD700)",
                      }}>
                        {t.label}
                      </div>
                    </div>
                  ))}
                </div>
              ),
              headline: "KINDS OF CONNECTIONS",
              body: "When you pair up, the game gives you one of these to build with LEGO together.",
            },
            { glyph: <BridgeSceneGlyph size={120} />, headline: "BUILD AND PHOTOGRAPH", body: "Build the connection in real life between your two districts. Both of you take a photo and upload it when it's done." },
          ]}
        />
        <ChapterIntroPreview
          title="Ch3 intro"
          subtitle="Shown when Chapter 3 (pattern placement) begins. The shape is never pre-revealed."
          panels={[
            { glyph: <NewPositionsGlyph size={120} />, headline: "A PATTERN APPEARS",   body: "A pattern will appear on the harbor. Every district has its own spot in it. Rearrange yourselves into the pattern." },
            { glyph: <DragToZoneGlyph size={120} />,   headline: "DRAG INTO YOUR SPOT", body: "Your district glows on the spot you belong in. Drag it into the glowing space." },
            { glyph: <LastDropGlyph size={120} />,     headline: "EVERYONE IN PLACE",   body: "When every district is in its spot, the round is complete." },
          ]}
        />
      </Section>

      <Section title="Intro Glyphs (Bespoke)">
        <div style={{ fontSize: 11, color: "var(--textdd)", marginBottom: 14, lineHeight: 1.5 }}>
          Bespoke glyphs created for the chapter intros above. All drawn in the existing house style
          (200x200 viewBox, isometric LEGO). Compare against the original glyphs in the next section for consistency.
        </div>
        <div style={{ ...gridBase, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          <Tile label="ClueCardPickGlyph" subLabel="Pair-build P1"><ClueCardPickGlyph size={120} /></Tile>
          <Tile label="SwapRolesGlyph" subLabel="Pair-build P3"><SwapRolesGlyph size={120} /></Tile>
          <Tile label="RiddleGlyph" subLabel="Ch1 P1"><RiddleGlyph size={120} /></Tile>
          <Tile label="DragToZoneGlyph" subLabel="Ch1 P2 + Ch3 P2"><DragToZoneGlyph size={120} /></Tile>
          <Tile label="TimerLockGlyph" subLabel="Ch1 P3"><TimerLockGlyph size={120} /></Tile>
          <Tile label="TapPartnerGlyph" subLabel="Ch2 P1"><TapPartnerGlyph size={120} /></Tile>
          <Tile label="BridgeSceneGlyph" subLabel="Ch2 P3"><BridgeSceneGlyph size={120} /></Tile>
          <Tile label="NewPositionsGlyph" subLabel="Ch3 P1"><NewPositionsGlyph size={120} /></Tile>
          <Tile label="LastDropGlyph" subLabel="Ch3 P3"><LastDropGlyph size={120} /></Tile>
          <Tile label="CrisisIncomingGlyph" subLabel="Unused (kept for future use)"><CrisisIncomingGlyph size={120} /></Tile>
        </div>
      </Section>

      <Section title="Original Glyphs (Pre-existing)">
        <div style={{ fontSize: 11, color: "var(--textdd)", marginBottom: 14, lineHeight: 1.5 }}>
          The six original instructional glyphs. Reference set for the new ones above to match in style.
        </div>
        <div style={{ ...gridBase, gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))" }}>
          <Tile label="TapGlyph"><TapGlyph size={120} /></Tile>
          <Tile label="BrickGlyph" subLabel="Reused: pair-build P2"><BrickGlyph size={120} /></Tile>
          <Tile label="CameraGlyph"><CameraGlyph size={120} /></Tile>
          <Tile label="PatternGlyph" subLabel="Reused: Ch3 P1"><PatternGlyph size={120} /></Tile>
          <Tile label="RepairGlyph"><RepairGlyph size={120} /></Tile>
          <Tile label="ShieldGlyph"><ShieldGlyph size={120} /></Tile>
        </div>
      </Section>

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
          Mirrors the facilitator&apos;s role-assignment grid: badge, themed label, and one-line assignment hint. Theming follows the active scenario above.
        </div>
        {(() => {
          const s = SCENARIOS.find((x) => x.id === activeScenario) ?? SCENARIOS[0];
          return (
            <div
              style={{
                display: "grid",
                gap: 14,
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
              }}
            >
              {ABILITIES.map((a) => {
                const themed = getThemedAbility(a, s);
                return (
                  <div
                    key={a.id}
                    style={{
                      background: "var(--bg2)",
                      border: "1px solid var(--border)",
                      borderRadius: 10,
                      padding: 14,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      gap: 10,
                    }}
                  >
                    <AbilityBadge ability={themed} size={72} />
                    <div
                      style={{
                        fontFamily: "'Black Han Sans', sans-serif",
                        fontSize: 14,
                        letterSpacing: 1.4,
                        color: "white",
                      }}
                    >
                      {themed.label}
                    </div>
                    <div style={{ fontSize: 11, color: "var(--textd)", lineHeight: 1.5 }}>
                      {themed.assignmentHint || a.description}
                    </div>
                    <button
                      type="button"
                      onClick={() => setGalleryDetailAbilityId(a.id)}
                      style={{
                        marginTop: 4,
                        background: "transparent",
                        border: "1.5px solid var(--border)",
                        color: "var(--textd)",
                        fontFamily: "'Nunito', sans-serif",
                        fontSize: 10,
                        fontWeight: 800,
                        letterSpacing: 0.5,
                        borderRadius: 6,
                        padding: "5px 10px",
                        cursor: "pointer",
                        textTransform: "uppercase",
                      }}
                    >
                      View details
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })()}
      </Section>

      {galleryDetailAbilityId && (() => {
        const baseA = ABILITIES.find((x) => x.id === galleryDetailAbilityId);
        if (!baseA) return null;
        const s = SCENARIOS.find((x) => x.id === activeScenario) ?? SCENARIOS[0];
        const colors: Record<string, string> = {
          mender: "#4FC3F7", scout: "#B388FF", engineer: "#FF7043",
          anchor: "#66BB6A", diplomat: "#FFD740", citizen: "#EC407A",
        };
        return (
          <RoleDetailModal
            ability={baseA}
            scenario={s}
            color={colors[baseA.id] || "#B388FF"}
            onClose={() => setGalleryDetailAbilityId(null)}
          />
        );
      })()}
    </div>
  );
}
