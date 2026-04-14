"use client";

import { useState, useRef, useEffect, useCallback, MouseEvent, TouchEvent } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { CARDS, SCENARIOS, WIN_CONDITIONS, getThemedCard } from "../../lib/constants";
import { toast } from "sonner";
import { useGame } from "../GameContext";
import BrandBar from "./BrandBar";
import VoiceRecorder from "./VoiceRecorder";
import WaterMap from "./maps/WaterMap";
import SpaceMap from "./maps/SpaceMap";
import OceanMap from "./maps/OceanMap";

interface DragState {
  el: HTMLElement | null;
  off: { x: number; y: number };
  playerId: Id<"players"> | null;
}

// ── Placement zone definitions per theme ──
// Zones are neighborhoods on the map. Players drag districts into zones.
// x,y are percentages (0-100) of the map area for responsive positioning.
// zoneType determines which card map rules are valid here.
interface PlacementSlot {
  id: string;
  x: number;        // percentage left
  y: number;        // percentage top
  label: string;
  adjacent: string[];
  zoneType: "center" | "edge" | "gateway" | "interior" | "any";
}

const PLACEMENT_SLOTS: Record<string, PlacementSlot[]> = {
  water: [
    // North of river — positioned on the cleared lots visible in the map image
    { id: "west-commercial",  x: 15, y: 30, label: "West Market",     adjacent: ["center", "north-residential", "south-bridge"], zoneType: "edge" },
    { id: "north-residential",x: 33, y: 14, label: "North Quarter",   adjacent: ["west-commercial", "center", "east-district", "park"], zoneType: "interior" },
    { id: "center",           x: 45, y: 33, label: "Town Square",     adjacent: ["north-residential", "west-commercial", "east-district", "south-bridge"], zoneType: "center" },
    { id: "east-district",    x: 62, y: 18, label: "East Side",       adjacent: ["center", "north-residential", "park", "harbor"], zoneType: "interior" },
    { id: "park",             x: 83, y: 12, label: "Green Park",      adjacent: ["north-residential", "east-district"], zoneType: "edge" },
    // South of river
    { id: "south-bridge",     x: 28, y: 55, label: "Bridge District", adjacent: ["center", "west-commercial", "construction", "industrial"], zoneType: "gateway" },
    { id: "construction",     x: 10, y: 68, label: "Build Zone",      adjacent: ["south-bridge", "industrial"], zoneType: "edge" },
    { id: "industrial",       x: 48, y: 72, label: "South Works",     adjacent: ["south-bridge", "construction", "harbor"], zoneType: "interior" },
    { id: "harbor",           x: 75, y: 62, label: "Harbor",          adjacent: ["east-district", "industrial"], zoneType: "gateway" },
  ],
  // Other themes reuse same layout for now
  space: [
    { id: "west-commercial",  x: 8,  y: 20, label: "Port Module",    adjacent: ["center", "north-residential", "south-bridge"], zoneType: "edge" },
    { id: "north-residential",x: 30, y: 8,  label: "Crew Quarters",   adjacent: ["west-commercial", "center", "east-district", "park"], zoneType: "interior" },
    { id: "center",           x: 50, y: 38, label: "Command Hub",     adjacent: ["north-residential", "west-commercial", "east-district", "south-bridge"], zoneType: "center" },
    { id: "east-district",    x: 65, y: 15, label: "Science Wing",    adjacent: ["center", "north-residential", "park", "harbor"], zoneType: "interior" },
    { id: "park",             x: 85, y: 8,  label: "Bio Dome",        adjacent: ["north-residential", "east-district"], zoneType: "edge" },
    { id: "south-bridge",     x: 28, y: 55, label: "Docking Bridge",  adjacent: ["center", "west-commercial", "construction", "industrial"], zoneType: "gateway" },
    { id: "construction",     x: 10, y: 68, label: "Assembly Bay",    adjacent: ["south-bridge", "industrial"], zoneType: "edge" },
    { id: "industrial",       x: 48, y: 70, label: "Engine Room",     adjacent: ["south-bridge", "construction", "harbor"], zoneType: "interior" },
    { id: "harbor",           x: 78, y: 65, label: "Airlock",         adjacent: ["east-district", "industrial"], zoneType: "gateway" },
  ],
  ocean: [
    { id: "west-commercial",  x: 8,  y: 18, label: "Kelp Farm",      adjacent: ["center", "north-residential", "south-bridge"], zoneType: "edge" },
    { id: "north-residential",x: 28, y: 10, label: "Shallow Pods",    adjacent: ["west-commercial", "center", "east-district", "park"], zoneType: "interior" },
    { id: "center",           x: 48, y: 30, label: "Thermal Core",    adjacent: ["north-residential", "west-commercial", "east-district", "south-bridge"], zoneType: "center" },
    { id: "east-district",    x: 65, y: 12, label: "Coral Ridge",     adjacent: ["center", "north-residential", "park", "harbor"], zoneType: "interior" },
    { id: "park",             x: 88, y: 15, label: "Bio Garden",      adjacent: ["north-residential", "east-district"], zoneType: "edge" },
    { id: "south-bridge",     x: 28, y: 52, label: "Current Channel", adjacent: ["center", "west-commercial", "construction", "industrial"], zoneType: "gateway" },
    { id: "construction",     x: 10, y: 68, label: "Pressure Lab",    adjacent: ["south-bridge", "industrial"], zoneType: "edge" },
    { id: "industrial",       x: 42, y: 72, label: "Deep Works",      adjacent: ["south-bridge", "construction", "harbor"], zoneType: "interior" },
    { id: "harbor",           x: 75, y: 65, label: "Submarine Bay",   adjacent: ["east-district", "industrial"], zoneType: "gateway" },
  ],
  forest: [
    { id: "west-commercial",  x: 8,  y: 25, label: "Mushroom Market", adjacent: ["center", "north-residential"], zoneType: "edge" },
    { id: "north-residential",x: 30, y: 10, label: "Canopy Homes",    adjacent: ["west-commercial", "center", "park"], zoneType: "interior" },
    { id: "center",           x: 45, y: 30, label: "Great Trunk",     adjacent: ["north-residential", "west-commercial", "east-district", "south-bridge"], zoneType: "center" },
    { id: "east-district",    x: 62, y: 18, label: "Sun Glade",       adjacent: ["center", "park", "harbor"], zoneType: "interior" },
    { id: "park",             x: 82, y: 8,  label: "Sacred Grove",    adjacent: ["north-residential", "east-district"], zoneType: "edge" },
    { id: "south-bridge",     x: 35, y: 55, label: "Vine Bridge",     adjacent: ["center", "construction", "industrial"], zoneType: "gateway" },
    { id: "construction",     x: 10, y: 65, label: "Root Workshop",   adjacent: ["south-bridge", "industrial"], zoneType: "edge" },
    { id: "industrial",       x: 45, y: 72, label: "Undergrowth",     adjacent: ["south-bridge", "construction", "harbor"], zoneType: "interior" },
    { id: "harbor",           x: 75, y: 65, label: "River Mouth",     adjacent: ["east-district", "industrial"], zoneType: "gateway" },
  ],
};

// ── Map background SVG per theme ──
function MapBackdrop({ theme }: { theme: string }) {

  // ── Water / Rising Tides ──
  if (theme === "water") {
    return (
      <svg className="map-backdrop" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="w-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#04081a" />
            <stop offset="40%" stopColor="#071430" />
            <stop offset="100%" stopColor="#0a1828" />
          </linearGradient>
          <linearGradient id="w-river" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#0d3b5c" />
            <stop offset="50%" stopColor="#125e78" />
            <stop offset="100%" stopColor="#0d3b5c" />
          </linearGradient>
          <linearGradient id="w-island" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1a3a2a" />
            <stop offset="100%" stopColor="#0e2218" />
          </linearGradient>
          <radialGradient id="w-mist" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="rgba(79,195,247,.06)" />
            <stop offset="100%" stopColor="rgba(79,195,247,0)" />
          </radialGradient>
          <filter id="w-glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id="w-stud" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="11" cy="11" r="1.2" fill="rgba(79,195,247,.04)" />
          </pattern>
          <pattern id="w-waves" x="0" y="0" width="60" height="12" patternUnits="userSpaceOnUse">
            <path d="M0 6 Q15 0 30 6 Q45 12 60 6" fill="none" stroke="rgba(79,195,247,.08)" strokeWidth="1" />
          </pattern>
          <pattern id="w-rain" x="0" y="0" width="40" height="50" patternUnits="userSpaceOnUse">
            <line x1="10" y1="0" x2="8" y2="12" stroke="rgba(140,200,255,.04)" strokeWidth="0.5" />
            <line x1="30" y1="20" x2="28" y2="32" stroke="rgba(140,200,255,.03)" strokeWidth="0.5" />
            <line x1="20" y1="35" x2="18" y2="47" stroke="rgba(140,200,255,.03)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="w-zone-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(79,195,247,.25)" />
            <stop offset="100%" stopColor="rgba(79,195,247,.08)" />
          </linearGradient>
        </defs>

        {/* Base sky */}
        <rect width="800" height="600" fill="url(#w-sky)" />

        {/* Water body fill */}
        <rect width="800" height="600" fill="url(#w-waves)" />

        {/* Elevated terrain islands with contour lines */}
        <ellipse cx="400" cy="300" rx="130" ry="100" fill="url(#w-island)" opacity=".5" />
        <ellipse cx="400" cy="300" rx="110" ry="80" fill="none" stroke="rgba(79,195,247,.06)" strokeWidth="0.5" />
        <ellipse cx="400" cy="300" rx="90" ry="65" fill="none" stroke="rgba(79,195,247,.05)" strokeWidth="0.5" />
        <ellipse cx="400" cy="300" rx="70" ry="50" fill="none" stroke="rgba(79,195,247,.04)" strokeWidth="0.5" />

        <ellipse cx="140" cy="280" rx="100" ry="130" fill="url(#w-island)" opacity=".4" />
        <ellipse cx="140" cy="280" rx="80" ry="110" fill="none" stroke="rgba(79,195,247,.05)" strokeWidth="0.5" />
        <ellipse cx="140" cy="280" rx="60" ry="90" fill="none" stroke="rgba(79,195,247,.04)" strokeWidth="0.5" />

        <ellipse cx="660" cy="300" rx="110" ry="140" fill="url(#w-island)" opacity=".4" />
        <ellipse cx="660" cy="300" rx="90" ry="120" fill="none" stroke="rgba(79,195,247,.05)" strokeWidth="0.5" />
        <ellipse cx="660" cy="300" rx="70" ry="100" fill="none" stroke="rgba(79,195,247,.04)" strokeWidth="0.5" />

        <ellipse cx="400" cy="100" rx="220" ry="70" fill="url(#w-island)" opacity=".35" />
        <ellipse cx="400" cy="100" rx="200" ry="55" fill="none" stroke="rgba(79,195,247,.04)" strokeWidth="0.5" />

        <ellipse cx="400" cy="500" rx="220" ry="70" fill="url(#w-island)" opacity=".35" />
        <ellipse cx="400" cy="500" rx="200" ry="55" fill="none" stroke="rgba(79,195,247,.04)" strokeWidth="0.5" />

        {/* Winding river */}
        <path d="M0 200 Q100 180 200 220 Q300 260 400 200 Q500 140 600 180 Q700 220 800 200"
          fill="none" stroke="url(#w-river)" strokeWidth="28" opacity=".5" strokeLinecap="round" />
        <path d="M0 200 Q100 180 200 220 Q300 260 400 200 Q500 140 600 180 Q700 220 800 200"
          fill="none" stroke="rgba(79,195,247,.1)" strokeWidth="32" opacity=".3" filter="url(#w-glow)" />

        {/* Secondary water channels */}
        <path d="M200 0 Q220 100 180 200 Q140 300 200 400 Q260 500 220 600"
          fill="none" stroke="rgba(13,59,92,.6)" strokeWidth="16" opacity=".4" />
        <path d="M580 0 Q560 80 600 180 Q640 280 600 380 Q560 480 580 600"
          fill="none" stroke="rgba(13,59,92,.6)" strokeWidth="16" opacity=".4" />

        {/* Wave patterns along water edges */}
        <path d="M0 188 Q50 182 100 188 Q150 194 200 188 Q250 182 300 188 Q350 194 400 188 Q450 182 500 188 Q550 194 600 188 Q650 182 700 188 Q750 194 800 188"
          fill="none" stroke="rgba(79,195,247,.12)" strokeWidth="1" />
        <path d="M0 214 Q50 220 100 214 Q150 208 200 214 Q250 220 300 214 Q350 208 400 214 Q450 220 500 214 Q550 208 600 214 Q650 220 700 214 Q750 208 800 214"
          fill="none" stroke="rgba(79,195,247,.1)" strokeWidth="1" />

        {/* Broken bridge remnants */}
        <rect x="245" y="196" width="40" height="6" rx="1" fill="rgba(120,90,60,.25)" transform="rotate(-5 265 199)" />
        <rect x="310" y="202" width="8" height="18" rx="1" fill="rgba(120,90,60,.2)" />
        <rect x="330" y="198" width="8" height="22" rx="1" fill="rgba(120,90,60,.15)" transform="rotate(12 334 209)" />
        <rect x="500" y="192" width="35" height="6" rx="1" fill="rgba(120,90,60,.25)" transform="rotate(3 517 195)" />
        <rect x="475" y="190" width="8" height="20" rx="1" fill="rgba(120,90,60,.2)" />

        {/* Rain overlay */}
        <rect width="800" height="600" fill="url(#w-rain)" />

        {/* Mist overlay */}
        <rect width="800" height="600" fill="url(#w-mist)" />

        {/* Stud grid overlay */}
        <rect width="800" height="600" fill="url(#w-stud)" />

        {/* Center crosshair - compass rose style */}
        <g opacity=".35">
          <circle cx="400" cy="300" r="50" fill="none" stroke="rgba(79,195,247,.2)" strokeWidth="1" strokeDasharray="3 6" />
          <circle cx="400" cy="300" r="30" fill="none" stroke="rgba(79,195,247,.15)" strokeWidth="0.5" />
          <line x1="400" y1="245" x2="400" y2="265" stroke="rgba(79,195,247,.3)" strokeWidth="1" />
          <line x1="400" y1="335" x2="400" y2="355" stroke="rgba(79,195,247,.3)" strokeWidth="1" />
          <line x1="345" y1="300" x2="365" y2="300" stroke="rgba(79,195,247,.3)" strokeWidth="1" />
          <line x1="435" y1="300" x2="455" y2="300" stroke="rgba(79,195,247,.3)" strokeWidth="1" />
          <polygon points="400,248 396,260 404,260" fill="rgba(79,195,247,.25)" />
          <circle cx="400" cy="300" r="2" fill="rgba(79,195,247,.4)" />
        </g>

      </svg>
    );
  }

  // ── Space / Last Orbit ──
  if (theme === "space") {
    // Generate deterministic star positions
    const stars: { x: number; y: number; r: number; o: number }[] = [];
    for (let i = 0; i < 120; i++) {
      const seed = (i * 7919 + 1013) % 10000;
      stars.push({
        x: (seed * 3 + i * 47) % 800,
        y: (seed * 7 + i * 31) % 600,
        r: (i % 5 === 0) ? 1.8 : (i % 3 === 0) ? 1.2 : 0.6,
        o: 0.3 + (seed % 7) / 10,
      });
    }
    // Asteroid debris
    const asteroids: { x: number; y: number; r: number; rot: number }[] = [
      { x: 120, y: 80, r: 5, rot: 30 }, { x: 700, y: 520, r: 7, rot: -15 },
      { x: 50, y: 450, r: 4, rot: 45 }, { x: 750, y: 150, r: 6, rot: 60 },
      { x: 320, y: 30, r: 3, rot: 10 }, { x: 480, y: 570, r: 4, rot: -40 },
      { x: 30, y: 300, r: 3, rot: 22 }, { x: 770, y: 350, r: 5, rot: -55 },
    ];
    return (
      <svg className="map-backdrop" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="s-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#03030f" />
            <stop offset="50%" stopColor="#0a0820" />
            <stop offset="100%" stopColor="#06041a" />
          </linearGradient>
          <radialGradient id="s-nebula1" cx="20%" cy="30%" r="35%">
            <stop offset="0%" stopColor="rgba(120,60,180,.08)" />
            <stop offset="60%" stopColor="rgba(60,30,120,.04)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id="s-nebula2" cx="75%" cy="65%" r="30%">
            <stop offset="0%" stopColor="rgba(40,80,200,.06)" />
            <stop offset="60%" stopColor="rgba(30,40,120,.03)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id="s-sun" cx="0%" cy="50%" r="25%">
            <stop offset="0%" stopColor="rgba(255,200,50,.12)" />
            <stop offset="40%" stopColor="rgba(255,150,30,.06)" />
            <stop offset="100%" stopColor="rgba(255,100,0,0)" />
          </radialGradient>
          <radialGradient id="s-starglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(200,180,255,.6)" />
            <stop offset="100%" stopColor="rgba(200,180,255,0)" />
          </radialGradient>
          <filter id="s-blur">
            <feGaussianBlur stdDeviation="4" />
          </filter>
          <filter id="s-glow-sm">
            <feGaussianBlur stdDeviation="2" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <pattern id="s-stud" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="11" cy="11" r="1.2" fill="rgba(179,136,255,.03)" />
          </pattern>
          <pattern id="s-hex" x="0" y="0" width="50" height="44" patternUnits="userSpaceOnUse">
            <path d="M25 0 L50 12 L50 32 L25 44 L0 32 L0 12 Z" fill="none" stroke="rgba(179,136,255,.04)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="s-zone-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(179,136,255,.25)" />
            <stop offset="100%" stopColor="rgba(179,136,255,.08)" />
          </linearGradient>
        </defs>

        {/* Deep space background */}
        <rect width="800" height="600" fill="url(#s-bg)" />

        {/* Nebula clouds */}
        <rect width="800" height="600" fill="url(#s-nebula1)" />
        <rect width="800" height="600" fill="url(#s-nebula2)" />
        <ellipse cx="160" cy="180" rx="150" ry="100" fill="rgba(100,50,160,.04)" filter="url(#s-blur)" />
        <ellipse cx="620" cy="420" rx="120" ry="80" fill="rgba(40,70,180,.04)" filter="url(#s-blur)" />

        {/* Solar flare on left edge */}
        <rect width="800" height="600" fill="url(#s-sun)" />
        <ellipse cx="-10" cy="300" rx="40" ry="80" fill="rgba(255,180,50,.06)" filter="url(#s-blur)" />

        {/* Star field */}
        {stars.map((s, i) => (
          <g key={i}>
            <circle cx={s.x} cy={s.y} r={s.r} fill={`rgba(220,210,255,${s.o})`} />
            {s.r > 1.5 && (
              <circle cx={s.x} cy={s.y} r={s.r * 3} fill="url(#s-starglow)" opacity=".3" />
            )}
          </g>
        ))}

        {/* Station hex grid */}
        <rect width="800" height="600" fill="url(#s-hex)" />

        {/* Orbital path curves */}
        <ellipse cx="400" cy="300" rx="350" ry="180" fill="none" stroke="rgba(179,136,255,.06)" strokeWidth="1" strokeDasharray="8 12" />
        <ellipse cx="400" cy="300" rx="250" ry="130" fill="none" stroke="rgba(179,136,255,.05)" strokeWidth="0.7" strokeDasharray="6 10" />
        <ellipse cx="400" cy="300" rx="150" ry="80" fill="none" stroke="rgba(179,136,255,.04)" strokeWidth="0.5" strokeDasharray="4 8" />

        {/* Asteroid debris */}
        {asteroids.map((a, i) => (
          <polygon key={i} points={`${a.x},${a.y - a.r} ${a.x + a.r * 0.8},${a.y - a.r * 0.3} ${a.x + a.r * 0.6},${a.y + a.r * 0.7} ${a.x - a.r * 0.5},${a.y + a.r * 0.5} ${a.x - a.r * 0.9},${a.y - a.r * 0.2}`}
            fill="rgba(100,90,80,.3)" stroke="rgba(140,130,110,.15)" strokeWidth="0.5"
            transform={`rotate(${a.rot} ${a.x} ${a.y})`} />
        ))}

        {/* Stud grid */}
        <rect width="800" height="600" fill="url(#s-stud)" />

        {/* Center crosshair - targeting reticle style */}
        <g opacity=".35">
          <polygon points="400,250 395,265 405,265" fill="rgba(179,136,255,.3)" />
          <polygon points="400,350 395,335 405,335" fill="rgba(179,136,255,.2)" />
          <polygon points="350,300 365,295 365,305" fill="rgba(179,136,255,.2)" />
          <polygon points="450,300 435,295 435,305" fill="rgba(179,136,255,.2)" />
          <circle cx="400" cy="300" r="45" fill="none" stroke="rgba(179,136,255,.2)" strokeWidth="1" />
          <circle cx="400" cy="300" r="25" fill="none" stroke="rgba(179,136,255,.15)" strokeWidth="0.5" strokeDasharray="4 4" />
          <line x1="400" y1="250" x2="400" y2="272" stroke="rgba(179,136,255,.25)" strokeWidth="1" />
          <line x1="400" y1="328" x2="400" y2="350" stroke="rgba(179,136,255,.25)" strokeWidth="1" />
          <line x1="350" y1="300" x2="372" y2="300" stroke="rgba(179,136,255,.25)" strokeWidth="1" />
          <line x1="428" y1="300" x2="450" y2="300" stroke="rgba(179,136,255,.25)" strokeWidth="1" />
          <circle cx="400" cy="300" r="2" fill="rgba(179,136,255,.5)" />
        </g>

      </svg>
    );
  }

  // ── Ocean / Deep Current ──
  if (theme === "ocean") {
    // Bioluminescent particles
    const particles: { x: number; y: number; r: number; color: string }[] = [];
    const bioColors = ["rgba(0,255,200,.3)", "rgba(100,200,255,.25)", "rgba(180,100,255,.2)", "rgba(0,255,150,.25)", "rgba(50,220,255,.2)"];
    for (let i = 0; i < 60; i++) {
      const seed = (i * 6271 + 503) % 10000;
      particles.push({
        x: (seed * 3 + i * 53) % 800,
        y: (seed * 7 + i * 37) % 600,
        r: 0.8 + (seed % 5) / 4,
        color: bioColors[i % bioColors.length],
      });
    }
    return (
      <svg className="map-backdrop" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="o-depth" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#051a28" />
            <stop offset="40%" stopColor="#041220" />
            <stop offset="70%" stopColor="#030c18" />
            <stop offset="100%" stopColor="#010610" />
          </linearGradient>
          <linearGradient id="o-pressure" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(0,188,212,0)" />
            <stop offset="100%" stopColor="rgba(0,50,80,.15)" />
          </linearGradient>
          <radialGradient id="o-vent" cx="50%" cy="70%" r="30%">
            <stop offset="0%" stopColor="rgba(255,100,30,.06)" />
            <stop offset="60%" stopColor="rgba(255,50,0,.02)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <filter id="o-glow">
            <feGaussianBlur stdDeviation="3" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="o-blur">
            <feGaussianBlur stdDeviation="5" />
          </filter>
          <pattern id="o-stud" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="11" cy="11" r="1.2" fill="rgba(0,188,212,.03)" />
          </pattern>
          <linearGradient id="o-zone-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(0,188,212,.25)" />
            <stop offset="100%" stopColor="rgba(0,188,212,.08)" />
          </linearGradient>
          <linearGradient id="o-kelp" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(20,80,40,.4)" />
            <stop offset="100%" stopColor="rgba(30,120,60,.15)" />
          </linearGradient>
          <linearGradient id="o-coral1" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(180,60,80,.2)" />
            <stop offset="100%" stopColor="rgba(200,80,100,.1)" />
          </linearGradient>
          <linearGradient id="o-coral2" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="rgba(200,120,50,.2)" />
            <stop offset="100%" stopColor="rgba(220,150,70,.1)" />
          </linearGradient>
        </defs>

        {/* Deep ocean gradient */}
        <rect width="800" height="600" fill="url(#o-depth)" />

        {/* Pressure gradient visualization */}
        <rect width="800" height="600" fill="url(#o-pressure)" />

        {/* Thermal vent glow */}
        <rect width="800" height="600" fill="url(#o-vent)" />

        {/* Submarine terrain ridges at bottom */}
        <path d="M0 560 Q80 530 160 550 Q240 570 320 540 Q400 520 480 545 Q560 570 640 535 Q720 510 800 540 L800 600 L0 600 Z"
          fill="rgba(10,25,35,.8)" />
        <path d="M0 570 Q100 550 200 565 Q300 580 400 555 Q500 535 600 560 Q700 580 800 555 L800 600 L0 600 Z"
          fill="rgba(8,20,28,.9)" />
        <path d="M0 585 Q120 575 240 580 Q360 590 480 575 Q600 565 720 580 L800 600 L0 600 Z"
          fill="rgba(5,14,22,.95)" />
        {/* Ridge texture lines */}
        <path d="M0 558 Q150 540 300 555 Q450 538 600 550 Q750 530 800 548"
          fill="none" stroke="rgba(0,188,212,.04)" strokeWidth="0.5" />
        <path d="M0 568 Q200 555 400 562 Q600 548 800 558"
          fill="none" stroke="rgba(0,188,212,.03)" strokeWidth="0.5" />

        {/* Coral formations */}
        {/* Branching coral 1 */}
        <g opacity=".6">
          <path d="M580 540 L580 500 L565 475 M580 500 L595 480 M580 510 L570 490 L560 470 M580 510 L590 495 L600 475"
            fill="none" stroke="url(#o-coral1)" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M620 550 L620 515 L608 495 M620 515 L632 498 M620 525 L612 505"
            fill="none" stroke="url(#o-coral2)" strokeWidth="2" strokeLinecap="round" />
        </g>
        {/* Branching coral 2 */}
        <g opacity=".5">
          <path d="M160 545 L160 510 L148 490 M160 510 L172 492 M160 520 L150 500 L142 482 M160 520 L170 505"
            fill="none" stroke="url(#o-coral1)" strokeWidth="2" strokeLinecap="round" />
          <path d="M200 555 L200 525 L190 508 M200 525 L210 510"
            fill="none" stroke="url(#o-coral2)" strokeWidth="1.5" strokeLinecap="round" />
        </g>
        {/* Coral cluster 3 */}
        <g opacity=".4">
          <path d="M720 555 L720 530 L710 515 M720 530 L730 518"
            fill="none" stroke="url(#o-coral1)" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Kelp strands */}
        <path d="M80 600 Q85 550 78 500 Q72 450 80 400 Q88 360 82 320"
          fill="none" stroke="url(#o-kelp)" strokeWidth="3" strokeLinecap="round" />
        <path d="M95 600 Q100 560 93 520 Q87 480 95 440 Q103 400 97 370"
          fill="none" stroke="url(#o-kelp)" strokeWidth="2.5" strokeLinecap="round" opacity=".7" />
        <path d="M700 600 Q695 555 702 510 Q708 465 700 420 Q692 385 698 350"
          fill="none" stroke="url(#o-kelp)" strokeWidth="3" strokeLinecap="round" />
        <path d="M715 600 Q720 565 713 530 Q707 495 715 460 Q723 430 718 400"
          fill="none" stroke="url(#o-kelp)" strokeWidth="2" strokeLinecap="round" opacity=".6" />
        <path d="M380 600 Q375 570 382 540 Q388 510 380 480"
          fill="none" stroke="url(#o-kelp)" strokeWidth="2" strokeLinecap="round" opacity=".4" />

        {/* Bubble streams */}
        {[150, 400, 650].map((bx, bi) => (
          <g key={bi} opacity=".2">
            {[0, 1, 2, 3, 4, 5, 6].map((j) => (
              <circle key={j} cx={bx + (j % 2 === 0 ? 3 : -3)} cy={550 - j * 50 - (bi * 15)}
                r={1 + j * 0.3} fill="none" stroke="rgba(150,220,255,.4)" strokeWidth="0.5" />
            ))}
          </g>
        ))}

        {/* Bioluminescent particles */}
        {particles.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r={p.r} fill={p.color} />
            {p.r > 1.2 && <circle cx={p.x} cy={p.y} r={p.r * 3} fill={p.color.replace(/[\d.]+\)$/, "0.08)")} />}
          </g>
        ))}

        {/* Stud grid */}
        <rect width="800" height="600" fill="url(#o-stud)" />

        {/* Center crosshair - sonar ping style */}
        <g opacity=".3">
          <circle cx="400" cy="300" r="55" fill="none" stroke="rgba(0,188,212,.15)" strokeWidth="1" />
          <circle cx="400" cy="300" r="40" fill="none" stroke="rgba(0,188,212,.12)" strokeWidth="0.7" strokeDasharray="2 4" />
          <circle cx="400" cy="300" r="25" fill="none" stroke="rgba(0,188,212,.1)" strokeWidth="0.5" strokeDasharray="2 4" />
          {/* Sonar sweep lines */}
          <line x1="400" y1="245" x2="400" y2="270" stroke="rgba(0,188,212,.25)" strokeWidth="1" />
          <line x1="400" y1="330" x2="400" y2="355" stroke="rgba(0,188,212,.25)" strokeWidth="1" />
          <line x1="345" y1="300" x2="370" y2="300" stroke="rgba(0,188,212,.25)" strokeWidth="1" />
          <line x1="430" y1="300" x2="455" y2="300" stroke="rgba(0,188,212,.25)" strokeWidth="1" />
          <circle cx="400" cy="300" r="2" fill="rgba(0,188,212,.5)" />
          {/* Diagonal ticks */}
          <line x1="420" y1="280" x2="427" y2="273" stroke="rgba(0,188,212,.15)" strokeWidth="0.5" />
          <line x1="380" y1="320" x2="373" y2="327" stroke="rgba(0,188,212,.15)" strokeWidth="0.5" />
          <line x1="420" y1="320" x2="427" y2="327" stroke="rgba(0,188,212,.15)" strokeWidth="0.5" />
          <line x1="380" y1="280" x2="373" y2="273" stroke="rgba(0,188,212,.15)" strokeWidth="0.5" />
        </g>

      </svg>
    );
  }

  // ── Forest / Roothold ──
  if (theme === "forest") {
    // Firefly particles
    const fireflies: { x: number; y: number; r: number; o: number }[] = [];
    for (let i = 0; i < 40; i++) {
      const seed = (i * 4919 + 701) % 10000;
      fireflies.push({
        x: 50 + (seed * 3 + i * 47) % 700,
        y: 60 + (seed * 7 + i * 31) % 480,
        r: 0.8 + (seed % 4) / 4,
        o: 0.15 + (seed % 6) / 20,
      });
    }
    return (
      <svg className="map-backdrop" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="f-bg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#040a06" />
            <stop offset="50%" stopColor="#081408" />
            <stop offset="100%" stopColor="#061006" />
          </linearGradient>
          <radialGradient id="f-light1" cx="35%" cy="10%" r="40%">
            <stop offset="0%" stopColor="rgba(180,220,100,.06)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <radialGradient id="f-light2" cx="65%" cy="15%" r="30%">
            <stop offset="0%" stopColor="rgba(200,230,120,.04)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </radialGradient>
          <linearGradient id="f-trunk" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(60,35,15,.6)" />
            <stop offset="50%" stopColor="rgba(50,30,12,.5)" />
            <stop offset="100%" stopColor="rgba(40,25,10,.6)" />
          </linearGradient>
          <linearGradient id="f-canopy" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(20,50,15,.7)" />
            <stop offset="100%" stopColor="rgba(15,35,10,.3)" />
          </linearGradient>
          <linearGradient id="f-root" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(55,30,12,.3)" />
            <stop offset="100%" stopColor="rgba(40,22,8,.5)" />
          </linearGradient>
          <filter id="f-glow">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="f-blur">
            <feGaussianBlur stdDeviation="6" />
          </filter>
          <pattern id="f-stud" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
            <circle cx="11" cy="11" r="1.2" fill="rgba(102,187,106,.03)" />
          </pattern>
          <linearGradient id="f-zone-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="rgba(102,187,106,.25)" />
            <stop offset="100%" stopColor="rgba(102,187,106,.08)" />
          </linearGradient>
          <radialGradient id="f-firefly-g" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(200,255,100,.5)" />
            <stop offset="100%" stopColor="rgba(200,255,100,0)" />
          </radialGradient>
        </defs>

        {/* Base forest dark */}
        <rect width="800" height="600" fill="url(#f-bg)" />

        {/* Dappled light filtering through */}
        <rect width="800" height="600" fill="url(#f-light1)" />
        <rect width="800" height="600" fill="url(#f-light2)" />
        {/* Light shafts */}
        <polygon points="280,0 320,0 380,300 240,300" fill="rgba(180,220,80,.015)" />
        <polygon points="500,0 530,0 570,250 460,250" fill="rgba(180,220,80,.012)" />
        <polygon points="150,0 170,0 210,200 120,200" fill="rgba(160,200,60,.01)" />

        {/* Massive tree trunks on sides */}
        {/* Left trunk */}
        <path d="M0 100 Q30 100 40 120 Q50 200 45 350 Q40 480 50 600 L0 600 Z"
          fill="url(#f-trunk)" />
        <path d="M40 120 Q42 200 40 280" fill="none" stroke="rgba(80,50,20,.2)" strokeWidth="1" />
        <path d="M35 180 Q38 250 35 320" fill="none" stroke="rgba(80,50,20,.15)" strokeWidth="0.5" />
        {/* Bark texture lines */}
        <path d="M15 130 L15 180" fill="none" stroke="rgba(30,15,5,.3)" strokeWidth="2" />
        <path d="M25 160 L25 220" fill="none" stroke="rgba(30,15,5,.25)" strokeWidth="1.5" />
        <path d="M10 250 L10 310" fill="none" stroke="rgba(30,15,5,.3)" strokeWidth="2" />
        <path d="M30 300 L30 360" fill="none" stroke="rgba(30,15,5,.2)" strokeWidth="1.5" />

        {/* Right trunk */}
        <path d="M800 80 Q770 80 755 110 Q745 200 750 350 Q755 480 745 600 L800 600 Z"
          fill="url(#f-trunk)" />
        <path d="M755 110 Q753 200 755 280" fill="none" stroke="rgba(80,50,20,.2)" strokeWidth="1" />
        <path d="M770 120 L770 190" fill="none" stroke="rgba(30,15,5,.3)" strokeWidth="2" />
        <path d="M780 200 L780 270" fill="none" stroke="rgba(30,15,5,.25)" strokeWidth="1.5" />
        <path d="M765 300 L765 370" fill="none" stroke="rgba(30,15,5,.2)" strokeWidth="2" />

        {/* Dense canopy at top */}
        <ellipse cx="100" cy="-10" rx="140" ry="60" fill="url(#f-canopy)" />
        <ellipse cx="250" cy="5" rx="160" ry="55" fill="url(#f-canopy)" />
        <ellipse cx="420" cy="-5" rx="180" ry="65" fill="url(#f-canopy)" />
        <ellipse cx="580" cy="0" rx="150" ry="55" fill="url(#f-canopy)" />
        <ellipse cx="720" cy="-8" rx="130" ry="50" fill="url(#f-canopy)" />
        {/* Leaf detail shapes */}
        <ellipse cx="180" cy="20" rx="50" ry="20" fill="rgba(25,60,18,.5)" />
        <ellipse cx="340" cy="15" rx="60" ry="22" fill="rgba(22,55,16,.4)" />
        <ellipse cx="500" cy="22" rx="55" ry="18" fill="rgba(28,65,20,.45)" />
        <ellipse cx="650" cy="18" rx="45" ry="16" fill="rgba(22,52,15,.4)" />
        <ellipse cx="80" cy="35" rx="40" ry="15" fill="rgba(20,48,14,.35)" />
        <ellipse cx="750" cy="30" rx="35" ry="14" fill="rgba(20,48,14,.35)" />

        {/* Root network at bottom */}
        <path d="M50 600 Q80 560 120 540 Q200 510 300 530 Q380 545 400 520 Q420 545 500 530 Q600 510 680 540 Q720 560 750 600"
          fill="url(#f-root)" />
        {/* Root tendrils */}
        <path d="M50 580 Q100 550 180 560 Q260 530 350 545"
          fill="none" stroke="rgba(55,30,12,.3)" strokeWidth="3" strokeLinecap="round" />
        <path d="M400 520 Q380 500 350 510 Q300 530 260 510 Q220 495 180 510"
          fill="none" stroke="rgba(55,30,12,.25)" strokeWidth="2" strokeLinecap="round" />
        <path d="M400 520 Q420 500 460 510 Q520 530 560 510 Q600 495 640 510"
          fill="none" stroke="rgba(55,30,12,.25)" strokeWidth="2" strokeLinecap="round" />
        <path d="M450 545 Q500 530 560 550 Q640 560 720 580 L750 600"
          fill="none" stroke="rgba(55,30,12,.3)" strokeWidth="3" strokeLinecap="round" />
        {/* Smaller root details */}
        <path d="M100 570 Q120 560 150 565" fill="none" stroke="rgba(55,30,12,.2)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M600 565 Q630 555 660 560" fill="none" stroke="rgba(55,30,12,.2)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Mushroom / fungal shapes */}
        <g opacity=".4">
          {/* Mushroom 1 */}
          <rect x="118" y="530" width="4" height="15" rx="1" fill="rgba(180,160,130,.3)" />
          <ellipse cx="120" cy="530" rx="10" ry="5" fill="rgba(160,80,80,.2)" />
          <ellipse cx="120" cy="530" rx="6" ry="3" fill="rgba(200,100,100,.1)" />
          {/* Mushroom 2 */}
          <rect x="678" y="535" width="3" height="12" rx="1" fill="rgba(180,160,130,.3)" />
          <ellipse cx="680" cy="535" rx="8" ry="4" fill="rgba(120,100,160,.2)" />
          {/* Mushroom 3 */}
          <rect x="358" y="540" width="3" height="10" rx="1" fill="rgba(180,160,130,.25)" />
          <ellipse cx="360" cy="540" rx="7" ry="3.5" fill="rgba(180,160,80,.2)" />
          {/* Small shelf fungi on trunks */}
          <ellipse cx="42" cy="250" rx="8" ry="3" fill="rgba(140,100,60,.2)" />
          <ellipse cx="40" cy="320" rx="6" ry="2.5" fill="rgba(140,100,60,.15)" />
          <ellipse cx="758" cy="280" rx="7" ry="3" fill="rgba(140,100,60,.2)" />
        </g>

        {/* Vine patterns connecting areas */}
        <path d="M50 130 Q100 140 180 120 Q260 100 340 130 Q400 150 400 200"
          fill="none" stroke="rgba(40,90,30,.15)" strokeWidth="2" strokeLinecap="round" />
        <path d="M750 120 Q700 130 620 115 Q540 100 460 125 Q400 145 400 200"
          fill="none" stroke="rgba(40,90,30,.12)" strokeWidth="2" strokeLinecap="round" />
        <path d="M45 350 Q80 340 120 360 Q180 380 240 360"
          fill="none" stroke="rgba(40,90,30,.1)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M755 360 Q720 345 680 365 Q620 385 560 360"
          fill="none" stroke="rgba(40,90,30,.1)" strokeWidth="1.5" strokeLinecap="round" />

        {/* Firefly particles */}
        {fireflies.map((f, i) => (
          <g key={i}>
            <circle cx={f.x} cy={f.y} r={f.r} fill={`rgba(200,255,100,${f.o})`} />
            <circle cx={f.x} cy={f.y} r={f.r * 4} fill="url(#f-firefly-g)" opacity={f.o * 0.5} />
          </g>
        ))}

        {/* Stud grid */}
        <rect width="800" height="600" fill="url(#f-stud)" />

        {/* Center crosshair - tree ring / growth ring style */}
        <g opacity=".3">
          <ellipse cx="400" cy="300" rx="50" ry="45" fill="none" stroke="rgba(102,187,106,.15)" strokeWidth="1" />
          <ellipse cx="400" cy="300" rx="38" ry="34" fill="none" stroke="rgba(102,187,106,.12)" strokeWidth="0.7" />
          <ellipse cx="400" cy="300" rx="26" ry="23" fill="none" stroke="rgba(102,187,106,.1)" strokeWidth="0.5" />
          <ellipse cx="400" cy="300" rx="14" ry="12" fill="none" stroke="rgba(102,187,106,.08)" strokeWidth="0.5" />
          {/* Cardinal directions as leaf shapes */}
          <path d="M400 248 Q404 258 400 268 Q396 258 400 248" fill="rgba(102,187,106,.25)" />
          <path d="M400 332 Q404 342 400 352 Q396 342 400 332" fill="rgba(102,187,106,.2)" />
          <path d="M348 300 Q358 304 368 300 Q358 296 348 300" fill="rgba(102,187,106,.2)" />
          <path d="M432 300 Q442 304 452 300 Q442 296 432 300" fill="rgba(102,187,106,.2)" />
          <circle cx="400" cy="300" r="2" fill="rgba(102,187,106,.4)" />
        </g>

      </svg>
    );
  }

  // ── Fallback (uses water theme colors) ──
  return (
    <svg className="map-backdrop" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="fb-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06061a" />
          <stop offset="60%" stopColor="#0a0830" />
          <stop offset="100%" stopColor="#0a0620" />
        </linearGradient>
        <pattern id="fb-stud" x="0" y="0" width="22" height="22" patternUnits="userSpaceOnUse">
          <circle cx="11" cy="11" r="1.2" fill="rgba(79,195,247,.04)" />
        </pattern>
      </defs>
      <rect width="800" height="600" fill="url(#fb-sky)" />
      <rect width="800" height="600" fill="url(#fb-stud)" />
      <circle cx="400" cy="300" r="50" fill="none" stroke="rgba(79,195,247,.15)" strokeWidth="1" strokeDasharray="4 4" />
      <circle cx="400" cy="300" r="2" fill="rgba(79,195,247,.4)" />
    </svg>
  );
}

// ── Win condition scoring (slot-based adjacency) ──
function calcWinConditions(
  players: { _id: string; slotId?: string; uploaded: boolean; cardIndex?: number }[],
  slots: PlacementSlot[]
) {
  const placed = players.filter((p) => p.slotId && p.uploaded);
  if (placed.length < 2) return { connectivity: 0, synergy: 0, total: 0 };

  // Build a set of occupied slot IDs
  const occupiedSlots = new Set(placed.map((p) => p.slotId!));

  // Connectivity: % of placed districts that are adjacent to at least one other placed district
  let connectedCount = 0;
  for (const p of placed) {
    const slot = slots.find((s) => s.id === p.slotId);
    if (slot && slot.adjacent.some((adjId) => occupiedSlots.has(adjId))) {
      connectedCount++;
    }
  }
  const connectivity = Math.round((connectedCount / placed.length) * 100);

  // Synergy: count of adjacent pairs (unique) / max possible adjacent pairs
  let synergyPairs = 0;
  for (let i = 0; i < placed.length; i++) {
    for (let j = i + 1; j < placed.length; j++) {
      const slotA = slots.find((s) => s.id === placed[i].slotId);
      if (slotA && slotA.adjacent.includes(placed[j].slotId!)) {
        synergyPairs++;
      }
    }
  }
  // Max possible unique adjacent edges in the slot graph that could be occupied
  const totalPairs = (placed.length * (placed.length - 1)) / 2;
  const maxSynergy = Math.max(1, Math.min(placed.length - 1, totalPairs));
  const synergy = Math.round((synergyPairs / maxSynergy) * 100);

  const total = Math.round(connectivity * 0.6 + synergy * 0.4);
  return { connectivity, synergy, total };
}

export default function CityMapScreen() {
  const { playerId, sessionId, sessionCode, name, role, scenario, goTo } = useGame();
  const players = useQuery(api.game.getPlayers, sessionId ? { sessionId } : "skip");
  const session = useQuery(api.game.getSession, sessionCode ? { code: sessionCode } : "skip");
  const messages = useQuery(api.game.getMessages, sessionId ? { sessionId } : "skip");
  const moveDistrict = useMutation(api.game.moveDistrict);
  const sendMessage = useMutation(api.game.sendMessage);
  const prevMsgCountRef = useRef(0);
  const chatMsgsRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  // No dragRef needed — drag state is captured in startDrag closure
  const [chatInput, setChatInput] = useState("");
  const [showConditions, setShowConditions] = useState(false);
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null);

  const scenarioData = SCENARIOS.find((s) => s.id === (scenario || session?.scenario)) || SCENARIOS[0];
  const mapTheme = scenarioData.mapTheme;
  const slots = PLACEMENT_SLOTS[mapTheme] || PLACEMENT_SLOTS.water;

  const nonFac = (players || []).filter((p) => !p.isFacilitator && p.uploaded);

  // Set of slot IDs occupied by other players
  const occupiedSlotIds = new Set(
    nonFac.filter((p) => p.slotId && p._id !== playerId).map((p) => p.slotId!)
  );

  // Scroll chat on new messages
  useEffect(() => {
    if (messages && messages.length > prevMsgCountRef.current && chatMsgsRef.current) {
      chatMsgsRef.current.scrollTop = chatMsgsRef.current.scrollHeight;
    }
    prevMsgCountRef.current = messages?.length || 0;
  }, [messages?.length]);

  // Win conditions
  const scores = calcWinConditions(
    nonFac.map((p) => ({ _id: p._id, slotId: p.slotId, uploaded: p.uploaded, cardIndex: p.cardIndex })),
    slots
  );

  // Drag handlers — all positions in percentages
  // Handlers are defined INSIDE startDrag so document listeners point to stable references
  function startDrag(e: MouseEvent | TouchEvent, pId: Id<"players">) {
    if (pId !== playerId) return;
    e.preventDefault();
    e.stopPropagation();
    const mapEl = mapRef.current;
    if (!mapEl) return;
    const mapRect = mapEl.getBoundingClientRect();
    const touch = "touches" in e ? e.touches[0] : e;
    const mousePctX = ((touch.clientX - mapRect.left) / mapRect.width) * 100;
    const mousePctY = ((touch.clientY - mapRect.top) / mapRect.height) * 100;
    const player = nonFac.find((p) => p._id === pId);
    const slot = player?.slotId ? slots.find((s) => s.id === player.slotId) : null;
    const cardPctX = slot ? slot.x : (player?.x ?? 50);
    const cardPctY = slot ? slot.y : (player?.y ?? 50);
    const offX = mousePctX - cardPctX;
    const offY = mousePctY - cardPctY;

    setDragPos({ id: pId, x: cardPctX, y: cardPctY });

    let rafId = 0;
    let lastPx = cardPctX;
    let lastPy = cardPctY;

    function move(ev: globalThis.MouseEvent | globalThis.TouchEvent) {
      if ("touches" in ev) ev.preventDefault();
      const t = "touches" in ev ? ev.touches[0] : ev;
      const mr = mapEl!.getBoundingClientRect();
      lastPx = Math.max(2, Math.min(95, ((t.clientX - mr.left) / mr.width) * 100 - offX));
      lastPy = Math.max(2, Math.min(92, ((t.clientY - mr.top) / mr.height) * 100 - offY));
      if (!rafId) {
        rafId = requestAnimationFrame(() => {
          setDragPos({ id: pId, x: lastPx, y: lastPy });
          rafId = 0;
        });
      }
    }

    function up() {
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.removeEventListener("touchmove", move);
      document.removeEventListener("touchend", up);
      handleDrop(pId, lastPx, lastPy);
      setDragPos(null);
    }

    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    document.addEventListener("touchmove", move, { passive: false });
    document.addEventListener("touchend", up);
  }

  // Handle drop — find nearest valid slot and save to Convex
  function handleDrop(pId: Id<"players">, dropX: number, dropY: number) {
    const me = nonFac.find((p) => p._id === pId);
    const myCard = me?.cardIndex != null ? CARDS[me.cardIndex] : null;
    const placedCount = nonFac.filter((p) => p.slotId && p._id !== pId).length;
    const currentOccupied = new Set(
      nonFac.filter((p) => p.slotId && p._id !== pId).map((p) => p.slotId!)
    );
    const availableSlots = slots.filter((s) => !currentOccupied.has(s.id));

    // Sort by distance
    const sorted = availableSlots
      .map((slot) => ({ slot, dist: Math.sqrt((dropX - slot.x) ** 2 + (dropY - slot.y) ** 2) }))
      .sort((a, b) => a.dist - b.dist);

    // Find first valid slot
    let bestSlot: PlacementSlot | null = null;
    for (const { slot } of sorted) {
      const check = isValidPlacement(myCard, slot, placedCount);
      if (check.valid) { bestSlot = slot; break; }
    }

    if (!bestSlot && sorted.length > 0) {
      const check = isValidPlacement(myCard, sorted[0].slot, placedCount);
      toast(check.reason || "No valid zone available");
    }

    if (bestSlot) {
      moveDistrict({ playerId: pId, x: bestSlot.x, y: bestSlot.y, slotId: bestSlot.id });
    } else {
      moveDistrict({ playerId: pId, x: Math.round(dropX), y: Math.round(dropY) });
    }
  }

  // Check if a card's map rule allows placement in a zone
  function isValidPlacement(card: typeof CARDS[number] | null, slot: PlacementSlot, placedCount: number): { valid: boolean; reason?: string } {
    if (!card) return { valid: true };
    const rule = card.mapRule.toLowerCase();

    // Beacon: must be center
    if (card.title === "The Beacon" && slot.zoneType !== "center") {
      return { valid: false, reason: "Your card requires a center zone" };
    }
    // Sprawl: must be edge
    if (card.title === "The Sprawl" && slot.zoneType !== "edge") {
      return { valid: false, reason: "Your card requires an edge zone" };
    }
    // Arch: must be gateway
    if (card.title === "The Arch" && slot.zoneType !== "gateway") {
      return { valid: false, reason: "Your card requires a gateway zone" };
    }
    // Vault: can only place after 4+ others
    if (card.title === "The Vault" && placedCount < 4) {
      return { valid: false, reason: `Your card requires 4+ districts placed first (${placedCount} placed)` };
    }
    // Fortress: must end up adjacent to 2+ (we check if there are 2+ occupied adjacent zones)
    if (card.title === "The Fortress") {
      const occupiedAdj = slot.adjacent.filter((adjId) =>
        nonFac.some((p) => p.slotId === adjId && p._id !== playerId)
      ).length;
      if (occupiedAdj < 2) {
        return { valid: false, reason: `Your card needs 2+ adjacent neighbors (${occupiedAdj} currently)` };
      }
    }
    // Commons: must be adjacent to 3+
    if (card.title === "The Commons") {
      const occupiedAdj = slot.adjacent.filter((adjId) =>
        nonFac.some((p) => p.slotId === adjId && p._id !== playerId)
      ).length;
      if (occupiedAdj < 3) {
        return { valid: false, reason: `Your card needs 3+ adjacent neighbors (${occupiedAdj} currently)` };
      }
    }
    return { valid: true };
  }

  // onDragEnd is no longer needed — cleanup happens inside startDrag's up() function

  async function handleSendChat() {
    if (!sessionId) return;
    const txt = chatInput.trim();
    if (!txt) return;
    setChatInput("");
    await sendMessage({
      sessionId,
      sender: role === "facilitator" ? "Facilitator" : name,
      text: txt,
      isFacilitator: role === "facilitator",
    });
  }

  async function handleVoiceNote(audioDataUrl: string) {
    if (!sessionId) return;
    await sendMessage({
      sessionId,
      sender: role === "facilitator" ? "Facilitator" : name,
      text: "\u{1F3A4} Voice note",
      isFacilitator: role === "facilitator",
      audioDataUrl,
    });
  }

  const cityComplete = scores.total >= 75;

  return (
    <div className="screen active" id="s-city">
      <div className="city-left">
        <div className="map-toolbar">
          <div className="map-title">{scenarioData.icon} {scenarioData.title.toUpperCase()}</div>
          <div className="map-scores">
            <div className="map-score-pill" title="Connectivity">
              <span className="msp-icon">{WIN_CONDITIONS[0].icon}</span>
              <span className="msp-val" style={{ color: scores.connectivity >= 70 ? "var(--acc4)" : "var(--textd)" }}>
                {scores.connectivity}%
              </span>
            </div>
            <div className="map-score-pill" title="Synergy">
              <span className="msp-icon">{WIN_CONDITIONS[3].icon}</span>
              <span className="msp-val" style={{ color: scores.synergy >= 70 ? "var(--acc4)" : "var(--textd)" }}>
                {scores.synergy}%
              </span>
            </div>
            <div className={`map-city-score${cityComplete ? " complete" : ""}`}>
              <span className="mcs-lbl">CITY</span>
              <span className="mcs-val">{scores.total}%</span>
            </div>
          </div>
          <button
            className="map-info-btn"
            onClick={() => setShowConditions(!showConditions)}
          >
            ?
          </button>
        </div>

        {/* Win conditions panel */}
        {showConditions && (
          <div className="map-conditions">
            <div className="mc-title">WIN CONDITIONS</div>
            <div className="mc-grid">
              {WIN_CONDITIONS.map((wc) => (
                <div key={wc.id} className="mc-item">
                  <div className="mc-item-icon">{wc.icon}</div>
                  <div>
                    <div className="mc-item-label">{wc.label}</div>
                    <div className="mc-item-desc">{wc.description}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="map-hint">
          <strong>Drag your district</strong> onto a city block slot. Districts snap into place and connect to adjacent blocks.
          Aim for {">"}75% city score to complete the map.
        </div>

        <div className="map-area" ref={mapRef}>
          {mapTheme === "water" && <WaterMap slots={slots} occupiedSlotIds={occupiedSlotIds} rebuilt={cityComplete} />}
          {mapTheme === "space" && <SpaceMap slots={slots} occupiedSlotIds={occupiedSlotIds} />}
          {mapTheme === "ocean" && <OceanMap slots={slots} occupiedSlotIds={occupiedSlotIds} />}
          {mapTheme !== "water" && mapTheme !== "space" && mapTheme !== "ocean" && <MapBackdrop theme={mapTheme} />}

          {/* Slot indicators — show available zones */}
          {slots.map((slot) => {
            const isOccupied = nonFac.some((p) => p.slotId === slot.id);
            if (isOccupied) return null;
            return (
              <div
                key={slot.id}
                className="slot-indicator"
                style={{
                  left: slot.x + "%",
                  top: slot.y + "%",
                }}
              >
                <div className="slot-label">{slot.label}</div>
              </div>
            );
          })}

          {/* Connection lines between occupied adjacent zones */}
          <svg className="map-connections" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}>
            {nonFac.map((a, i) =>
              nonFac.slice(i + 1).map((b) => {
                if (!a.slotId || !b.slotId) return null;
                const slotA = slots.find((s) => s.id === a.slotId);
                const slotB = slots.find((s) => s.id === b.slotId);
                if (!slotA || !slotB || !slotA.adjacent.includes(b.slotId)) return null;
                return (
                  <line
                    key={`${a._id}-${b._id}`}
                    x1={slotA.x + "%"}
                    y1={slotA.y + "%"}
                    x2={slotB.x + "%"}
                    y2={slotB.y + "%"}
                    stroke="rgba(105,240,174,.4)"
                    strokeWidth="2"
                    strokeDasharray="8 4"
                  />
                );
              })
            )}
          </svg>

          {nonFac.map((p) => {
            const isMe = p._id === playerId;
            const card = p.cardIndex != null ? CARDS[p.cardIndex] : null;
            const distName = card ? scenarioData.districtNames[card.id] : p.districtName;
            const isDragging = dragPos?.id === p._id;
            const slotData = p.slotId ? slots.find((s) => s.id === p.slotId) : null;

            // Position: if being dragged use dragPos, else use slot or stored x/y
            const pctX = isDragging ? dragPos.x : (slotData ? slotData.x : (p.x ?? 50));
            const pctY = isDragging ? dragPos.y : (slotData ? slotData.y : (p.y ?? 50));

            return (
              <div
                key={p._id}
                className={`dist-card${isMe ? " mine" : ""}${isDragging ? " dragging" : ""}`}
                style={{
                  left: pctX + "%",
                  top: pctY + "%",
                  borderColor: card ? card.color + "66" : undefined,
                  zIndex: isDragging ? 100 : 10,
                }}
                onMouseDown={(e) => startDrag(e, p._id)}
                onTouchStart={(e) => startDrag(e, p._id)}
              >
                <div style={{ pointerEvents: "none" }}>
                  {p.photoDataUrl ? (
                    <img className="dc-photo" src={p.photoDataUrl} alt="" draggable={false} />
                  ) : (
                    <div className="dc-placeholder">{card?.icon || "\u{1F3D9}\uFE0F"}</div>
                  )}
                  <div className="dc-name">{distName || p.districtName || p.name}</div>
                  <div className="dc-tag" style={isMe ? { color: "var(--acc1)" } : {}}>
                    {isMe ? "YOUR DISTRICT" : p.name}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="map-bottom-bar">
          <div className="map-bottom-status">
            {nonFac.length} district{nonFac.length !== 1 ? "s" : ""} placed
          </div>
          {role === "facilitator" ? (
            <div style={{ fontSize: 11, color: "var(--textd)" }}>
              Use the dashboard tab to advance when ready
            </div>
          ) : (
            <div style={{ fontSize: 11, color: "var(--textd)" }}>
              {cityComplete ? "City complete. Waiting for facilitator to start debrief." : "Collaborate with your team to place all districts."}
            </div>
          )}
        </div>
      </div>

      <div className="city-right">
        <div className="chat-panel">
          <div className="chat-hdr">
            <div className="chat-hdr-lbl">TEAM CHAT</div>
            <div className="chat-hdr-sub">Coordinate placement with your team</div>
          </div>
          <div className="chat-msgs" ref={chatMsgsRef}>
            {(messages || []).map((msg) => {
              const isMe = msg.sender === name || (role === "facilitator" && msg.sender === "Facilitator");
              const bubbleClass = msg.isFacilitator ? "fac" : isMe ? "mine" : "";
              return (
                <div key={msg._id} className="cm">
                  <div className="cm-name">{msg.sender}{msg.isFacilitator ? " \u{1F3AF}" : ""}</div>
                  <div className={`cm-bubble ${bubbleClass}`}>
                    {msg.audioDataUrl ? (
                      <div className="cm-voice">
                        <audio src={msg.audioDataUrl} controls preload="none" className="cm-audio" />
                      </div>
                    ) : (
                      msg.text
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="chat-input-row">
            <input
              className="chat-input"
              type="text"
              placeholder="Say something&#8230;"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
            />
            <VoiceRecorder onRecorded={handleVoiceNote} />
            <button className="chat-send" onClick={handleSendChat}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 7h12M7 1l6 6-6 6" stroke="#0a0a12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* District legend */}
        <div className="map-legend">
          <div className="ml-title">DISTRICTS</div>
          {nonFac.map((p) => {
            const card = p.cardIndex != null ? CARDS[p.cardIndex] : null;
            const distName = card ? scenarioData.districtNames[card.id] : p.districtName;
            return (
              <div key={p._id} className="ml-item">
                <div className="ml-dot" style={{ background: card?.color || "var(--textd)" }} />
                <div className="ml-name">{distName || p.name}</div>
                <div className="ml-player">{p.name}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
