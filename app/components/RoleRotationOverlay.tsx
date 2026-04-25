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
        width: "min(420px, 92vw)",
        background: "linear-gradient(180deg, rgba(14,14,37,1), rgba(8,8,22,1))",
        border: "2px solid rgba(90, 200, 250, 0.55)", borderRadius: 16,
        padding: 22, color: "white",
        boxShadow: "0 24px 48px rgba(0,0,0,0.55)",
        animation: "fadeIn .4s ease-out",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1, filter: "drop-shadow(0 0 6px rgba(90,200,250,0.45))" }}>
            {"\u21BB"}
          </span>
          <div style={{
            fontFamily: "'Black Han Sans', sans-serif",
            fontSize: 16, letterSpacing: 2, color: "#5AC8FA",
          }}>
            ROLES HAVE ROTATED
          </div>
        </div>
        <div style={{ fontSize: 13, lineHeight: 1.55, color: "rgba(255,255,255,.78)", marginBottom: 14 }}>
          You were <b style={{ color: "rgba(255,255,255,0.95)" }}>{prev?.label ?? previousRoleId}</b>. Now you are <b style={{ color: "var(--acc1, #FFD700)" }}>{next?.label ?? newRoleId}</b>.
        </div>
        <div style={{
          border: "1px dashed rgba(255,215,0,.45)", borderRadius: 8, padding: 12,
          marginBottom: 14,
        }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--acc1, #FFD700)", marginBottom: 4 }}>
            {next?.label?.toUpperCase() ?? "ROLE"}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)", marginBottom: 8 }}>
            {next?.description}
          </div>
          {next?.descriptionC2 && (
            <>
              <div style={{ fontSize: 11, fontWeight: 800, color: "#5AC8FA", letterSpacing: 2, marginBottom: 4 }}>
                WHEN THE NEXT CRISIS HITS
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.8)", lineHeight: 1.5, marginBottom: 8 }}>
                {next.descriptionC2}
              </div>
            </>
          )}
          <div style={{ fontSize: 12, fontWeight: 800, color: "var(--acc1, #FFD700)", marginBottom: 4 }}>
            POWER: {nextPower?.title?.toUpperCase() ?? nextPowerId}
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,.75)" }}>
            {nextPower?.description}
          </div>
        </div>
        <button
          onClick={onDismiss}
          style={{
            width: "100%", padding: "12px 14px",
            background: "rgba(255,215,0,.22)", border: "1.5px solid rgba(255,215,0,.6)",
            borderRadius: 8, color: "var(--acc1, #FFD700)",
            fontSize: 13, fontWeight: 900, letterSpacing: 1, textTransform: "uppercase",
            cursor: "pointer", fontFamily: "'Nunito', sans-serif",
          }}
        >
          Ready for Crisis 2
        </button>
      </div>
    </div>
  );
}
