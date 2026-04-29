# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Empowered Play — a hybrid LEGO team-building game for corporate teams. Players build physical LEGO districts under secret constraint cards, upload photos, then collaboratively place them on a shared digital city map. Designed to shift workplace power dynamics by giving junior employees structurally essential roles.

## Commands

```bash
npx convex dev          # Start Convex backend (run first, generates types)
npm run dev             # Start Next.js dev server
npx tsc --noEmit        # Type-check
```

### After Making Changes

Always run these commands after completing changes:
```bash
npx convex codegen   # Only when convex/ folder was changed — generates types so lint/tsc see new exports
npm run lint         # Check for linting errors
npx tsc --noEmit     # Type check
```

*Never run build commands or the dev server* — the user will do this manually.

## Architecture

**SPA on Next.js App Router** — Single page at `app/page.tsx`. No file-based routing. `GameContext.screen` determines which component renders via a `SCREENS` lookup map.

**Convex for everything server-side** — Real-time queries (`useQuery`) auto-re-render components. Mutations (`useMutation`) replace all writes. No REST APIs, no polling.

**State split** — Local UI state in `GameContext` (React Context). Server game state in Convex (sessions, players, messages). Components read both.

### Game Phase Flow

```
waiting → card_reveal → building → uploading → city_map → debrief → constraint_reveal → complete
```

Key: `debrief` comes BEFORE `constraint_reveal`. Players answer reflective questions first, THEN cards are revealed.

**Auto-advancing phases**: `building` → `uploading` (on first upload) → `city_map` (when all upload) happen automatically via the `uploadDistrict` mutation. The facilitator only manually advances: `card_reveal` → `building` and `city_map` → `debrief`.

### Phase → Screen Routing (in page.tsx)

Players navigate based on session phase. Facilitators go to `s-fac-live` except during `debrief` (goes to `s-fac-debrief`) and `constraint_reveal` (goes to `s-reveal` with players).

### Card System

8 constraint cards defined in `lib/constants.ts`. Each has:
- `icon` (string ID like "tower") — rendered by `CardIcon.tsx` as colored SVG
- `shape` / `shapeHint` — physical LEGO build constraint
- `mapRule` (HR sees this) — clear placement rule
- `mapClue` (players see this) — cryptic hint, not direct instruction
- `buildTime` — 10, 13, or 15 minutes (max 15)
- `zoneType` validation — Beacon=center, Sprawl=edge, Arch=gateway, etc.
- `empowermentLevel` — high/medium/low for HR assignment strategy

**Per-scenario theming**: Scenarios can override card titles, icons, shapeHints, and mapClues via `cardOverrides` in the Scenario definition. Use `getThemedCard(card, scenario)` to get the themed version. CardIcon renders different SVGs per theme (e.g., "tower" for city, "antenna" for space).

### Scenarios

4 scenarios with different themes, terminology, and map images:
- **Cityscape** (water) — districts, zones, city map. Map: `public/maps/rising-tides.png`
- **Deep Space** (space) — modules, bays, station. Map: `public/maps/deep-space.png`
- **Ocean Depths** (ocean) — sectors, zones, seafloor
- **Rainforest** (forest) — outposts, clearings, canopy

Each scenario defines `terminology` (`{ district, zone, map }`) for themed UI text.

### Map Placement

`CityMapScreen.tsx` defines `PLACEMENT_SLOTS` per theme — 9 zones with percentage-based positions, adjacency lists, and zone types. Districts snap to nearest valid zone on drag-end. Card map rules are enforced (`isValidPlacement` function).

Map backgrounds are AI-generated images per scenario. Map components: `WaterMap.tsx`, `SpaceMap.tsx`.

### LEGO Detection

`app/api/detect-lego/route.ts` — Next.js API route that uses Gemini 2.0 Flash Lite (via Vercel AI SDK + @ai-sdk/google) to verify uploaded photos contain LEGO. Called after camera capture, before allowing upload submission.

### Facilitator vs Player

Facilitator joins as a player with `isFacilitator: true`. Gets different screens: `FacSetupScreen` (card assignment), `FacLiveScreen` (dashboard + map view tabs), `FacDebriefScreen` (observation prompts with options + notes).

## Key Files

| File | What it does |
|---|---|
| `app/page.tsx` | SPA shell, phase auto-navigation, screen routing |
| `app/GameContext.tsx` | Local state: role, screen, sessionId, playerId, myCard, scenario |
| `lib/constants.ts` | Cards (8), Scenarios (4), Win Conditions, getThemedCard(), LEGO Kit |
| `convex/schema.ts` | DB tables: sessions, players, messages, debrief_answers |
| `convex/game.ts` | All queries + mutations. Upload mutation auto-advances phases |
| `app/components/CityMapScreen.tsx` | Largest component. Map, zones, drag-drop, chat, scoring, validation |
| `app/components/FacSetupScreen.tsx` | Card assignment UI. Tap card → tap player → send. Uses themedCards |
| `app/components/CardIcon.tsx` | SVG icons per card. Supports city + space themes |
| `app/components/maps/WaterMap.tsx` | Cityscape map background (image-based) |
| `app/components/maps/SpaceMap.tsx` | Deep Space map background (image-based) |
| `app/api/detect-lego/route.ts` | Gemini vision API for LEGO detection in uploads |

## Patterns to Follow

- **Themed cards**: Always use `getThemedCard(card, scenario)` when displaying card info to players. Never show base card data directly in themed contexts.
- **Card icons**: Use `<CardIcon icon={card.icon} size={N} />` — never render `card.icon` as text (it's a string ID, not an emoji)
- **Convex queries**: Always use `"skip"` pattern: `useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip")`
- **Phase navigation**: Don't manually navigate players between phases. Update session phase via `advancePhase` mutation and let `page.tsx` auto-navigate
- **Percentage positioning**: Map slots use `x`/`y` as percentages (0-100). Convert with `slotToPixel()` for drag operations
- **SSR guard**: `providers.tsx` returns `<>{children}</>` when `NEXT_PUBLIC_CONVEX_URL` is missing (Vercel build-time)

## Visual Style

- Dark theme (--bg0: #06061a). LEGO-inspired but professional, not childish
- Illustrated SVG art for scenario cards (detailed, colorful, character-rich)
- AI-generated map images for game backgrounds
- Card icons are colored SVGs that contrast against their card's background color (never white, never same as background)
- HR insights: short, factual, no labels like "quiet" or "junior" — describe mechanics not people
- Player-facing map clues: cryptic/poetic, not direct placement instructions
- No em dashes in user-facing text

## Environment Variables

- `NEXT_PUBLIC_CONVEX_URL` — Required. Must be in Vercel env vars AND `.env.local`
- `CONVEX_DEPLOYMENT` — Set automatically by `npx convex dev`
- `GOOGLE_GENERATIVE_AI_API_KEY` — Gemini API key for LEGO detection. Must be in Vercel env vars AND `.env.local`

<!-- convex-ai-start -->
When working on Convex code, **always read `convex/_generated/ai/guidelines.md` first** for important guidelines on how to correctly use Convex APIs and patterns. The file contains rules that override what you may have learned about Convex from training data.

Convex agent skills for common tasks can be installed by running `npx convex ai-files install`.
<!-- convex-ai-end -->
