"use client";

import { ABILITIES, POWER_CARDS, ROLE_POWER_PAIRINGS, SCENARIOS, getThemedAbility } from "../../lib/constants";

interface Props {
  previousRoleId: string;
  newRoleId: string;
  scenarioId: string;
  onDismiss: () => void;
}

// Shown once on Crisis 2 start after role rotation. Tells the player what
// role+power they now hold.
export default function RoleRotationOverlay({ previousRoleId, newRoleId, scenarioId, onDismiss }: Props) {
  const scenarioObj = SCENARIOS.find(s => s.id === scenarioId);
  const prevBase = ABILITIES.find(a => a.id === previousRoleId);
  const nextBase = ABILITIES.find(a => a.id === newRoleId);
  const prev = prevBase && scenarioObj ? getThemedAbility(prevBase, scenarioObj) : prevBase;
  const next = nextBase && scenarioObj ? getThemedAbility(nextBase, scenarioObj) : nextBase;
  const nextPowerId = ROLE_POWER_PAIRINGS[newRoleId];
  const nextPower = POWER_CARDS.find(p => p.id === nextPowerId);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2600,
      background: "rgba(5,5,15,.94)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{
        width: "min(440px, 92vw)",
        background: "linear-gradient(180deg, rgba(14,14,37,1), rgba(8,8,22,1))",
        border: "1.5px solid rgba(255,215,0,.4)", borderRadius: 16,
        padding: 22, color: "white",
        boxShadow: "0 24px 48px rgba(0,0,0,0.55)",
        animation: "fadeIn .4s ease-out",
        display: "flex", flexDirection: "column", gap: 14,
      }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1, filter: "drop-shadow(0 0 6px rgba(255,215,0,0.45))", color: "var(--acc1, #FFD700)" }}>
            {"↻"}
          </span>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 16, letterSpacing: 2, color: "var(--acc1, #FFD700)",
          }}>
            ROLES HAVE ROTATED
          </div>
        </div>

        {/* Block A — From → To hero */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1.4fr",
          alignItems: "center",
          gap: 12,
          padding: "12px 4px 14px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
        }}>
          <div style={{ opacity: 0.55 }}>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 9, letterSpacing: 1.6, color: "rgba(255,255,255,.55)",
              marginBottom: 2,
            }}>
              PREVIOUS
            </div>
            <div style={{
              fontSize: 12, color: "rgba(255,255,255,.78)",
              textDecoration: "line-through", textDecorationColor: "rgba(255,255,255,.3)",
              lineHeight: 1.2,
            }}>
              {prev?.label ?? previousRoleId}
            </div>
          </div>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 22, color: "var(--acc1, #FFD700)",
            lineHeight: 1, padding: "0 2px",
          }}>
            {"→"}
          </div>
          <div>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 9, letterSpacing: 1.8, color: "var(--acc1, #FFD700)",
              marginBottom: 3,
            }}>
              YOUR NEW ROLE
            </div>
            <div style={{
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 18, letterSpacing: 1.2, color: "white",
              lineHeight: 1.1,
            }}>
              {(next?.label ?? newRoleId).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Block B — Role identity */}
        {next?.description && (
          <div style={{
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 10,
            padding: "12px 14px",
            background: "rgba(255,255,255,.02)",
          }}>
            <div style={{
              display: "inline-block",
              fontFamily: "'Black Han Sans', sans-serif",
              fontSize: 9.5, letterSpacing: 1.6,
              color: "var(--acc1, #FFD700)",
              background: "rgba(255,215,0,.1)",
              border: "1px solid rgba(255,215,0,.3)",
              borderRadius: 999,
              padding: "3px 9px",
              marginBottom: 8,
            }}>
              {(next.label ?? "").toUpperCase()}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,.88)", lineHeight: 1.55 }}>
              {next.description}
            </div>
          </div>
        )}

        {/* Block C — Crisis briefing */}
        {next?.descriptionC2 && (
          <div style={{
            display: "flex",
            gap: 10,
            paddingLeft: 2,
          }}>
            <div style={{
              width: 3, alignSelf: "stretch",
              background: "var(--acc1, #FFD700)",
              borderRadius: 2,
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 10.5, letterSpacing: 1.8,
                color: "var(--acc1, #FFD700)",
                marginBottom: 4,
              }}>
                WHEN CRISIS HITS
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,.86)", lineHeight: 1.5 }}>
                {next.descriptionC2}
              </div>
            </div>
          </div>
        )}

        {/* Block D — Power chip */}
        {nextPower && (
          <div style={{
            background: "rgba(255,255,255,.04)",
            borderRadius: 10,
            padding: "11px 13px",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 4,
            }}>
              <span style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 9, letterSpacing: 1.8,
                color: "var(--acc1, #FFD700)",
                background: "rgba(255,215,0,.14)",
                padding: "2px 7px",
                borderRadius: 4,
              }}>
                POWER
              </span>
              <span style={{
                fontFamily: "'Black Han Sans', sans-serif",
                fontSize: 13, letterSpacing: 1.2,
                color: "white",
                textTransform: "uppercase",
              }}>
                {nextPower.title}
              </span>
            </div>
            <div style={{ fontSize: 12.5, color: "rgba(255,255,255,.78)", lineHeight: 1.5 }}>
              {nextPower.description}
            </div>
          </div>
        )}

        <button
          onClick={onDismiss}
          style={{
            width: "100%", padding: "13px 14px",
            background: "rgba(255,215,0,.22)", border: "2px solid rgba(255,215,0,.6)",
            borderRadius: 8, color: "var(--acc1, #FFD700)",
            fontSize: 13, fontWeight: 900, letterSpacing: 1.2, textTransform: "uppercase",
            cursor: "pointer", fontFamily: "'Nunito', sans-serif",
            transition: "transform .15s ease, box-shadow .15s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 16px rgba(255,215,0,.25)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          Ready for Crisis 2
        </button>
      </div>
    </div>
  );
}
