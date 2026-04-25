"use client";

import React from "react";
import BrandBar from "./BrandBar";

type PlayerSlim = {
  _id: string;
  name: string;
  ch3Ready?: boolean;
};

interface Props {
  nonFac: PlayerSlim[];
  readyCount: number;
  patternName: string | null;
  // Pass #18: player-view variant (someone who has readied, waiting for rest).
  forPlayer?: boolean;
}

// Facilitator waiting screen for Ch3. Shown until every non-fac player has
// dismissed the Ch3 intro overlay. No map, no controls. Mirrors the shape of
// Ch2FacWaitScreen; differs in copy to name the pattern and what comes next.
export function Ch3FacWaitScreen({ nonFac, readyCount, patternName, forPlayer = false }: Props) {
  const total = nonFac.length;
  const pct = total > 0 ? Math.round((readyCount / total) * 100) : 0;

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg0)",
        color: "white",
      }}
    >
      <BrandBar badge={forPlayer ? undefined : "FACILITATOR"} />

      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 20px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 480,
            background: "linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
            padding: "28px 24px 24px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.45)",
            animation: "fadeIn 260ms ease-out",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
            <span
              aria-hidden="true"
              style={{
                fontSize: 18,
                lineHeight: 1,
                filter: "drop-shadow(0 0 6px rgba(255,215,0,0.35))",
              }}
            >
              {"\u25C7"}
            </span>
            <div
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 11,
                letterSpacing: 3,
                color: "var(--acc1, #FFD700)",
                textTransform: "uppercase",
              }}
            >
              Chapter 3 {"\u00B7"} Ready Gate
            </div>
          </div>

          <h2
            style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 24,
              lineHeight: 1.15,
              margin: "6px 0 14px",
              letterSpacing: 0.5,
            }}
          >
            {forPlayer ? "Waiting for your teammates." : "Players are reading the recovery brief."}
          </h2>

          <p
            style={{
              fontSize: 13,
              lineHeight: 1.6,
              color: "rgba(255,255,255,0.78)",
              margin: "0 0 20px",
            }}
          >
            {patternName
              ? <>The <strong style={{ color: "white" }}>{patternName}</strong> appears as soon as every player taps ready.</>
              : <>The pattern appears as soon as every player taps ready.</>}
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <span
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 10,
                letterSpacing: 2,
                color: "var(--textdd)",
                textTransform: "uppercase",
              }}
            >
              Ready
            </span>
            <span
              style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 18,
                color: "white",
                letterSpacing: 1,
              }}
            >
              {readyCount}
              <span style={{ color: "var(--textdd)", fontSize: 14 }}>
                {" / "}
                {total}
              </span>
            </span>
          </div>

          <div
            style={{
              height: 8,
              borderRadius: 999,
              background: "rgba(255,255,255,0.08)",
              overflow: "hidden",
              marginBottom: 20,
            }}
          >
            <div
              style={{
                width: `${pct}%`,
                height: "100%",
                background:
                  "linear-gradient(90deg, var(--acc1, #FFD700), #FFA726)",
                transition: "width 300ms ease-out",
              }}
            />
          </div>

          <ul
            style={{
              listStyle: "none",
              padding: 0,
              margin: 0,
              display: "grid",
              gap: 6,
            }}
          >
            {nonFac.map((p) => {
              const ready = !!p.ch3Ready;
              return (
                <li
                  key={p._id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "10px 12px",
                    borderRadius: 10,
                    background: ready
                      ? "rgba(255,215,0,0.08)"
                      : "rgba(255,255,255,0.03)",
                    border: ready
                      ? "1px solid rgba(255,215,0,0.25)"
                      : "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      color: ready ? "white" : "rgba(255,255,255,0.7)",
                      fontWeight: ready ? 600 : 400,
                    }}
                  >
                    {p.name}
                  </span>
                  <span
                    style={{
                      fontFamily: "'Black Han Sans', sans-serif",
                      fontSize: 9,
                      letterSpacing: 1.5,
                      textTransform: "uppercase",
                      padding: "3px 8px",
                      borderRadius: 999,
                      color: ready ? "#1a1300" : "var(--textdd)",
                      background: ready
                        ? "var(--acc1, #FFD700)"
                        : "rgba(255,255,255,0.06)",
                    }}
                  >
                    {ready ? "Ready" : "Reading"}
                  </span>
                </li>
              );
            })}
          </ul>

          <div
            style={{
              marginTop: 20,
              fontSize: 11,
              color: "var(--textdd)",
              textAlign: "center",
              lineHeight: 1.5,
            }}
          >
            Waiting on players to finish reading the Chapter 3 brief.
          </div>
        </div>
      </div>
    </div>
  );
}
