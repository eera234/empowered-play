"use client";

const LEGO_RED = "#E3000B";
const LEGO_YELLOW = "#FFD700";
const LEGO_BLUE = "#006DB7";
const LEGO_GREEN = "#00A650";
const BG0 = "#06061a";
const BG2 = "#14143a";

const PLAY_LETTERS: Array<{ ch: string; color: string; ink: string }> = [
  { ch: "P", color: LEGO_RED,    ink: "#fff" },
  { ch: "L", color: LEGO_YELLOW, ink: "#fff" },
  { ch: "A", color: LEGO_BLUE,   ink: "#fff" },
  { ch: "Y", color: LEGO_GREEN,  ink: "#fff" },
];

export default function BannerPage() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        background: BG0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        fontFamily: "'Nunito', sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Page-wide stud-grid texture */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle, rgba(255,255,255,0.04) 1.5px, transparent 1.6px)",
          backgroundSize: "22px 22px",
          pointerEvents: "none",
        }}
      />

      <section
        style={{
          position: "relative",
          width: "min(1200px, 96vw)",
          aspectRatio: "16 / 9",
          background: BG2,
          border: "2px solid rgba(255,255,255,0.08)",
          borderRadius: 18,
          boxShadow:
            "0 6px 0 rgba(0,0,0,0.4), 0 24px 60px rgba(0,0,0,0.55)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Four-color hairline — softer than a full bar */}
        <div
          style={{
            display: "flex",
            height: 4,
            opacity: 0.85,
          }}
        >
          <ColorStripe color={LEGO_RED} />
          <ColorStripe color={LEGO_YELLOW} />
          <ColorStripe color={LEGO_BLUE} />
          <ColorStripe color={LEGO_GREEN} />
        </div>

        {/* Hero region */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "4% 6%",
            position: "relative",
            gap: "2vw",
          }}
        >
          {/* Inner stud texture */}
          <div
            aria-hidden
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle, rgba(255,255,255,0.03) 1.5px, transparent 1.6px)",
              backgroundSize: "16px 16px",
              pointerEvents: "none",
            }}
          />

          {/* Eyebrow */}
          <div
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: "clamp(11px, 1.1vw, 14px)",
              letterSpacing: "0.5em",
              color: LEGO_YELLOW,
              textTransform: "uppercase",
              textAlign: "center",
              paddingLeft: "0.5em",
              textShadow: "0 1px 6px rgba(0,0,0,0.8)",
              position: "relative",
              zIndex: 1,
              marginBottom: "0.4vw",
            }}
          >
            A Hybrid LEGO Team Game
          </div>

          {/* "EMPOWERED" — yellow stamped wordmark */}
          <div
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: "clamp(46px, 9.2vw, 124px)",
              letterSpacing: "0.08em",
              color: LEGO_YELLOW,
              lineHeight: 1,
              textAlign: "center",
              textShadow: "0 3px 0 rgba(0,0,0,0.45)",
              position: "relative",
              zIndex: 1,
            }}
          >
            EMPOWERED
          </div>

          {/* "PLAY" — four LEGO letter-bricks in R/Y/B/G */}
          <div
            style={{
              display: "flex",
              gap: "1.2vw",
              position: "relative",
              zIndex: 1,
            }}
          >
            {PLAY_LETTERS.map((l) => (
              <LetterBrick
                key={l.ch}
                ch={l.ch}
                color={l.color}
                ink={l.ink}
              />
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 0; }
          html, body { background: ${BG0} !important; }
        }
      `}</style>
    </main>
  );
}

// ── A single colored stripe in the brand bar ──
function ColorStripe({ color }: { color: string }) {
  return (
    <div
      style={{
        flex: 1,
        background: color,
        boxShadow: "inset 0 -3px 0 rgba(0,0,0,0.18)",
      }}
    />
  );
}

// ── A LEGO brick with one letter on it ──
function LetterBrick({
  ch,
  color,
  ink,
}: {
  ch: string;
  color: string;
  ink: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Studs sit on top of the brick body, slightly overlapping */}
      <div
        style={{
          display: "flex",
          gap: "0.85vw",
          marginBottom: "-0.55vw",
          position: "relative",
          zIndex: 2,
        }}
      >
        <BrickStud color={color} />
        <BrickStud color={color} />
      </div>
      {/* The brick itself */}
      <div
        style={{
          background: color,
          color: ink,
          fontFamily: "'Black Han Sans', sans-serif",
          fontSize: "clamp(40px, 7.6vw, 100px)",
          letterSpacing: "0.02em",
          width: "clamp(64px, 9vw, 128px)",
          height: "clamp(72px, 10vw, 142px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          boxShadow:
            "0 4px 0 rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.16), inset 0 -2px 0 rgba(0,0,0,0.18)",
          lineHeight: 1,
        }}
      >
        {ch}
      </div>
    </div>
  );
}

function BrickStud({ color }: { color: string }) {
  return (
    <span
      aria-hidden
      style={{
        width: "1.6vw",
        height: "1.6vw",
        minWidth: 16,
        minHeight: 16,
        borderRadius: "50%",
        background: color,
        boxShadow:
          "inset 0 1px 0 rgba(255,255,255,0.32), inset 0 -1px 0 rgba(0,0,0,0.22), 0 1px 0 rgba(0,0,0,0.28)",
        display: "inline-block",
      }}
    />
  );
}
