"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { useGame } from "../GameContext";
import { SCENARIOS } from "../../lib/constants";
import BrandBar from "./BrandBar";

// ── Full-screen background: colorful LEGO city skyline at night with water ──
function BackgroundSkyline() {
  // Building data: [x, y, width, height, color]
  const buildings: [number,number,number,number,string][] = [
    [0,310,40,90,"#C62828"],[44,290,32,110,"#1565C0"],[80,320,36,80,"#E8A820"],
    [120,275,28,125,"#2E7D32"],[152,305,38,95,"#6A1B9A"],[194,330,30,70,"#E65100"],
    [228,285,34,115,"#00838F"],[266,315,28,85,"#C62828"],[298,270,24,130,"#FFD700"],
    [326,310,36,90,"#1565C0"],[366,335,28,65,"#388E3C"],[398,280,30,120,"#9B59B6"],
    [432,320,26,80,"#E65100"],[462,290,38,110,"#1565C0"],[504,310,32,90,"#C62828"],
    [540,295,28,105,"#E8A820"],[572,325,34,75,"#2E7D32"],[610,285,26,115,"#6A1B9A"],
    [640,305,36,95,"#00ACC1"],[680,330,30,70,"#E65100"],[714,275,28,125,"#1565C0"],
    [746,310,34,90,"#C62828"],[784,295,20,105,"#FFD700"],
  ];
  return (
    <svg className="entry-bg-svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="esky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#020810" />
          <stop offset="45%" stopColor="#061428" />
          <stop offset="100%" stopColor="#0a1e36" />
        </linearGradient>
        <linearGradient id="ewater" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#08203a" />
          <stop offset="100%" stopColor="#030e1c" />
        </linearGradient>
        <radialGradient id="emglow" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="rgba(255,220,120,.15)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="emface" cx=".32" cy=".3" r=".55">
          <stop offset="0%" stopColor="#FFF5E0" />
          <stop offset="100%" stopColor="#D0B868" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="ewglow" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#FFD060" />
          <stop offset="100%" stopColor="#FF9020" stopOpacity="0" />
        </radialGradient>
        <filter id="egl"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      {/* Sky */}
      <rect width="800" height="600" fill="url(#esky)" />

      {/* Stars */}
      {[[40,14],[100,28],[175,10],[260,24],[345,8],[430,20],[520,12],[605,26],[690,6],[770,18],
        [60,40],[155,46],[250,36],[350,48],[450,34],[550,44],[650,38],[745,48],
        [30,58],[200,54],[380,60],[560,52],[720,58]
      ].map(([cx,cy], i) => (
        <circle key={`s${i}`} cx={cx} cy={cy} r={i%7===0?1.2:i%3===0?0.8:0.5}
          fill={i%11===0?"#FFE4B0":i%7===0?"#A0D4FF":"#fff"} opacity={i%5===0?0.45:0.2} />
      ))}

      {/* Moon */}
      <circle cx="690" cy="55" r="45" fill="url(#emglow)" filter="url(#egl)" />
      <circle cx="690" cy="55" r="22" fill="url(#emglow)" opacity=".6" />
      <circle cx="690" cy="55" r="13" fill="url(#emface)" />
      <circle cx="684" cy="50" r="2.2" fill="rgba(160,140,90,.15)" />
      <circle cx="696" cy="58" r="1.6" fill="rgba(160,140,90,.1)" />

      {/* Warm glow behind center */}
      <ellipse cx="400" cy="320" rx="250" ry="80" fill="rgba(255,200,80,.02)" filter="url(#egl)" />

      {/* City skyline: colorful buildings with studs and glowing windows */}
      {buildings.map(([bx,by,bw,bh,color], i) => (
        <g key={`b${i}`} opacity=".55">
          {/* Building body */}
          <rect x={bx} y={by} width={bw} height={bh} rx="1.5" fill={color} />
          {/* Top highlight */}
          <rect x={bx} y={by} width={bw} height="2" fill="rgba(255,255,255,.1)" />
          {/* Side shadow */}
          <rect x={bx+bw-3} y={by} width="3" height={bh} fill="rgba(0,0,0,.15)" />
          {/* Studs on top */}
          {Array.from({ length: Math.floor(bw / 14) }, (_, s) => (
            <circle key={s} cx={bx + 7 + s * 14} cy={by - 2} r="3"
              fill={color} stroke="rgba(255,255,255,.12)" strokeWidth=".5" />
          ))}
          {/* Windows with warm glow */}
          {Array.from({ length: Math.min(5, Math.floor(bh / 18)) }, (_, r) =>
            Array.from({ length: Math.min(2, Math.floor(bw / 16)) }, (_, c) => {
              const wx = bx + 5 + c * (bw - 10) / Math.max(1, Math.min(2, Math.floor(bw / 16)));
              const wy = by + 8 + r * 18;
              const lit = (i + r + c) % 3 !== 0;
              return (
                <g key={`w${r}${c}`}>
                  <rect x={wx} y={wy} width="6" height="7" rx=".5" fill={lit ? "#0a0a14" : "rgba(0,0,0,.3)"} />
                  {lit && <rect x={wx} y={wy} width="6" height="7" rx=".5" fill="url(#ewglow)" opacity={0.3 + ((i+r) % 4) * 0.12} />}
                </g>
              );
            })
          )}
        </g>
      ))}

      {/* Crane */}
      <g opacity=".35">
        <line x1="185" y1="305" x2="185" y2="260" stroke="#8a8a8a" strokeWidth="2" />
        <line x1="185" y1="262" x2="215" y2="272" stroke="#8a8a8a" strokeWidth="1.5" />
        <line x1="210" y1="274" x2="210" y2="290" stroke="#8a8a8a" strokeWidth=".8" />
      </g>

      {/* Ground plane */}
      <rect x="0" y="400" width="800" height="4" fill="rgba(10,20,35,.9)" />

      {/* Water below: reflections */}
      <rect x="0" y="404" width="800" height="196" fill="url(#ewater)" />

      {/* Building reflections: flipped, faded */}
      {buildings.filter((_, i) => i % 2 === 0).map(([bx,,bw,bh,color], i) => (
        <rect key={`rf${i}`} x={bx} y={406} width={bw} height={Math.min(bh * 0.5, 50)}
          fill={color} opacity=".04" />
      ))}

      {/* Water ripple lines */}
      {[410,430,455,485,520,560].map((wy, i) => (
        <path key={`wl${i}`}
          d={`M0 ${wy} Q${80+i*15} ${wy-1.5} ${200+i*10} ${wy+1} Q${400+i*8} ${wy-1} ${600+i*5} ${wy+1} Q${750} ${wy-.5} 800 ${wy}`}
          fill="none" stroke={`rgba(79,195,247,${0.04 - i * 0.005})`} strokeWidth=".6" />
      ))}

      {/* Moon reflection on water */}
      <ellipse cx="690" cy="440" rx="6" ry="20" fill="rgba(255,220,120,.03)" />
      <ellipse cx="690" cy="470" rx="4" ry="15" fill="rgba(255,220,120,.02)" />
    </svg>
  );
}

// ── Player icon: LEGO hard hat + brick ──
function PlayerIcon() {
  return (
    <svg viewBox="0 0 60 60" width="48" height="48">
      {/* LEGO brick being held */}
      <rect x="10" y="30" width="40" height="22" rx="2" fill="#E53935" />
      <rect x="10" y="30" width="40" height="3" fill="#EF5350" opacity=".4" />
      <rect x="46" y="30" width="4" height="22" fill="rgba(0,0,0,.15)" />
      {/* Brick lines */}
      <line x1="10" y1="38" x2="50" y2="38" stroke="rgba(0,0,0,.1)" strokeWidth=".5" />
      <line x1="10" y1="44" x2="50" y2="44" stroke="rgba(0,0,0,.1)" strokeWidth=".5" />
      {/* Studs on brick */}
      {[20,30,40].map(cx => (
        <g key={cx}>
          <circle cx={cx} cy="28" r="4" fill="#D32F2F" />
          <circle cx={cx} cy="28" r="4" fill="none" stroke="#EF5350" strokeWidth=".7" />
          <circle cx={cx-0.5} cy="27.5" r="1.2" fill="#EF5350" opacity=".5" />
        </g>
      ))}
      {/* Hard hat */}
      <path d="M16 18 Q16 6 30 4 Q44 6 44 18 L46 20 L14 20 Z" fill="#FFD700" />
      <rect x="14" y="18" width="32" height="4" rx="1" fill="#E8A820" />
      <circle cx="30" cy="12" r="3" fill="#E8A820" stroke="#FFD700" strokeWidth=".6" />
      {/* Rim highlight */}
      <path d="M16 18 Q16 8 30 6 Q44 8 44 18" fill="none" stroke="#FFF176" strokeWidth=".5" opacity=".4" />
    </svg>
  );
}

// ── Facilitator icon: LEGO control panel / command board ──
function FacilitatorIcon() {
  return (
    <svg viewBox="0 0 60 60" width="48" height="48">
      {/* Screen/monitor body */}
      <rect x="8" y="8" width="44" height="32" rx="3" fill="#1a2a40" />
      <rect x="8" y="8" width="44" height="3" fill="#1565C0" />
      <rect x="8" y="8" width="44" height="32" rx="3" fill="none" stroke="#1E88E5" strokeWidth="1.5" />
      {/* Studs on top edge */}
      {[18,30,42].map(cx => (
        <g key={cx}>
          <circle cx={cx} cy="6" r="3" fill="#0D47A1" />
          <circle cx={cx} cy="6" r="3" fill="none" stroke="#42A5F5" strokeWidth=".6" />
          <circle cx={cx-.4} cy="5.5" r="1" fill="#42A5F5" opacity=".4" />
        </g>
      ))}
      {/* Screen content: grid of player dots */}
      {[0,1,2,3].map(r => [0,1,2,3].map(c => (
        <circle key={`d${r}${c}`} cx={16+c*9} cy={16+r*6} r="2"
          fill={r*4+c < 6 ? ["#E53935","#FFD700","#43A047","#4FC3F7","#AB47BC","#FF9800"][r*4+c] : "rgba(255,255,255,.08)"}
          opacity={r*4+c < 6 ? .7 : 1} />
      )))}
      {/* Connection lines between active dots */}
      <line x1="16" y1="16" x2="25" y2="16" stroke="rgba(105,240,174,.3)" strokeWidth=".8" />
      <line x1="25" y1="16" x2="34" y2="16" stroke="rgba(105,240,174,.3)" strokeWidth=".8" />
      <line x1="16" y1="22" x2="25" y2="22" stroke="rgba(105,240,174,.3)" strokeWidth=".8" />
      <line x1="16" y1="16" x2="16" y2="22" stroke="rgba(105,240,174,.3)" strokeWidth=".8" />
      <line x1="34" y1="16" x2="34" y2="22" stroke="rgba(105,240,174,.3)" strokeWidth=".8" />
      {/* Monitor stand */}
      <rect x="25" y="40" width="10" height="6" rx="1" fill="#546E7A" />
      <rect x="20" y="45" width="20" height="4" rx="1.5" fill="#455A64" />
      {/* Base plate with studs */}
      <rect x="10" y="49" width="40" height="8" rx="2" fill="#4FC3F7" />
      <rect x="10" y="49" width="40" height="2" fill="#81D4FA" opacity=".3" />
      {[18,26,34,42].map(cx => (
        <circle key={`bs${cx}`} cx={cx} cy="53" r="2.2" fill="#039BE5" stroke="#4FC3F7" strokeWidth=".5" />
      ))}
    </svg>
  );
}

// ── Scenario illustrations ──
function CityscapeIllustration() {
  // Building data: [x, y, width, height, color, darkColor]
  const bldgs: [number,number,number,number,string,string][] = [
    [5,62,30,78,"#E3000B","#B00008"],
    [38,48,28,92,"#F47B20","#C05A10"],
    [69,32,26,108,"#FFD700","#C8A800"],
    [98,55,30,85,"#00A650","#007A38"],
    [131,28,32,112,"#006DB7","#004A80"],
    [166,58,28,82,"#00BCD4","#008A9E"],
    [197,42,30,98,"#9B59B6","#7A3D94"],
    [230,65,32,75,"#E53935","#B71C1C"],
  ];
  return (
    <svg viewBox="0 0 280 160" className="sc-illustration">
      <defs>
        <linearGradient id="cs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#050520" />
          <stop offset="60%" stopColor="#0a0a3a" />
          <stop offset="100%" stopColor="#14144a" />
        </linearGradient>
        <radialGradient id="cs-wglow" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#FFD060" />
          <stop offset="100%" stopColor="#FF8800" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cs-lamp" cx=".5" cy=".3" r=".6">
          <stop offset="0%" stopColor="rgba(255,220,100,.6)" />
          <stop offset="100%" stopColor="rgba(255,200,80,0)" />
        </radialGradient>
      </defs>
      {/* Sky */}
      <rect width="280" height="160" fill="url(#cs-sky)" />
      {/* Stars */}
      {[[12,8],[35,18],[58,6],[82,22],[108,10],[140,5],[168,20],[195,8],[218,14],[248,6],[265,22],
        [25,35],[55,42],[90,38],[125,30],[160,40],[200,32],[235,38],[270,10],[45,12],[150,15]
      ].map(([x,y],i)=>(
        <circle key={`st${i}`} cx={x} cy={y} r={i%7===0?1.4:i%3===0?1:0.6}
          fill={i%5===0?"#FFE4B0":i%8===0?"#A0D4FF":"#fff"} opacity={i%4===0?0.7:0.35} />
      ))}
      {/* Road */}
      <rect x="0" y="140" width="280" height="20" fill="#1a1a40" />
      <rect x="0" y="148" width="280" height="2" fill="#2a2a55" />
      {[10,35,60,85,110,135,160,185,210,235,260].map((lx,i)=>(
        <rect key={`ln${i}`} x={lx} y="148.5" width="12" height="1" fill="#FFD700" opacity=".4" />
      ))}
      {/* Buildings */}
      {bldgs.map(([bx,by,bw,bh,col,dk],bi)=>{
        const rows = Math.floor(bh/9);
        const wCols = Math.min(3, Math.floor(bw/10));
        const studs = Math.min(3, Math.floor(bw/12));
        return (
          <g key={`bl${bi}`}>
            {/* Body */}
            <rect x={bx} y={by} width={bw} height={bh} rx="1" fill={col} />
            {/* Brick layer lines */}
            {Array.from({length:rows},(_,r)=>(
              <line key={`br${r}`} x1={bx} y1={by+9+r*9} x2={bx+bw} y2={by+9+r*9} stroke="rgba(0,0,0,.1)" strokeWidth=".5" />
            ))}
            {/* Side shadow */}
            <rect x={bx+bw-4} y={by} width="4" height={bh} fill={dk} opacity=".5" />
            {/* Top highlight */}
            <rect x={bx} y={by} width={bw} height="2" fill="rgba(255,255,255,.18)" />
            {/* Studs on top */}
            {Array.from({length:studs},(_,s)=>{
              const sx = bx + (bw/(studs+1))*(s+1);
              return (
                <g key={`sd${s}`}>
                  <circle cx={sx} cy={by-2.5} r="3.5" fill={col} stroke="rgba(255,255,255,.15)" strokeWidth=".6" />
                  <circle cx={sx-0.6} cy={by-3.2} r="1" fill="rgba(255,255,255,.25)" />
                </g>
              );
            })}
            {/* Windows with amber glow */}
            {Array.from({length:Math.min(5,Math.floor(bh/16))},(_,r)=>
              Array.from({length:wCols},(_,c)=>{
                const wx = bx+4+c*((bw-8)/Math.max(1,wCols-1))-2;
                const wy = by+8+r*16;
                const lit = (bi+r+c)%3!==0;
                return (
                  <g key={`w${r}${c}`}>
                    <rect x={wx} y={wy} width="5" height="7" rx=".5" fill={lit?"#0a0a18":"rgba(0,0,0,.25)"} />
                    {lit && <rect x={wx} y={wy} width="5" height="7" rx=".5" fill="url(#cs-wglow)" opacity={0.4+((bi+r)%3)*0.15} />}
                  </g>
                );
              })
            )}
          </g>
        );
      })}
      {/* Landmark tall building with flag */}
      <g>
        <rect x="131" y="28" width="32" height="112" rx="1" fill="#006DB7" />
        <rect x="159" y="28" width="4" height="112" fill="#004A80" opacity=".5" />
        <rect x="131" y="28" width="32" height="2" fill="rgba(255,255,255,.2)" />
        <line x1="147" y1="28" x2="147" y2="12" stroke="#aaa" strokeWidth="1" />
        <polygon points="147,12 147,18 155,15" fill="#E3000B" />
        {[139,147,155].map((sx,i)=>(
          <g key={`ls${i}`}>
            <circle cx={sx} cy="25.5" r="3.5" fill="#006DB7" stroke="rgba(255,255,255,.15)" strokeWidth=".6" />
            <circle cx={sx-0.5} cy="24.8" r="1" fill="rgba(255,255,255,.25)" />
          </g>
        ))}
      </g>
      {/* Crane silhouette */}
      <g opacity=".35">
        <line x1="268" y1="140" x2="268" y2="45" stroke="#8a8a8a" strokeWidth="1.5" />
        <line x1="268" y1="48" x2="250" y2="48" stroke="#8a8a8a" strokeWidth="1.2" />
        <line x1="252" y1="48" x2="252" y2="62" stroke="#8a8a8a" strokeWidth=".7" />
        <line x1="268" y1="48" x2="275" y2="55" stroke="#8a8a8a" strokeWidth="1" />
      </g>
      {/* Trees */}
      {[[34,135],[196,135]].map(([tx,ty],ti)=>(
        <g key={`tr${ti}`}>
          <rect x={tx-1.5} y={ty-12} width="3" height="12" fill="#6B4226" />
          <ellipse cx={tx} cy={ty-14} rx="7" ry="6" fill="#1B5E20" />
          <ellipse cx={tx-2} cy={ty-16} rx="5" ry="5" fill="#2E7D32" />
          <ellipse cx={tx+2} cy={ty-18} rx="4" ry="4" fill="#388E3C" />
        </g>
      ))}
      {/* Street lamps */}
      {[25,100,175,250].map((lx,i)=>(
        <g key={`sl${i}`}>
          <line x1={lx} y1="140" x2={lx} y2="128" stroke="#777" strokeWidth="1" />
          <circle cx={lx} cy="127" r="1.5" fill="#FFD060" />
          <circle cx={lx} cy="127" r="5" fill="url(#cs-lamp)" />
        </g>
      ))}
    </svg>
  );
}

// Harborside: fishing village with a lighthouse, cottages, seawall, and boats.
// Replaces the old CityscapeIllustration for the rising_tides scenario.
function HarborsideIllustration() {
  return (
    <svg viewBox="0 0 280 160" className="sc-illustration">
      <defs>
        <linearGradient id="hs-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#061028" />
          <stop offset="55%" stopColor="#0f2042" />
          <stop offset="100%" stopColor="#1a3a5a" />
        </linearGradient>
        <linearGradient id="hs-sea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a2a44" />
          <stop offset="100%" stopColor="#041828" />
        </linearGradient>
        <radialGradient id="hs-beacon" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#FFE8A0" stopOpacity=".9" />
          <stop offset="100%" stopColor="#FFC040" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="hs-moon" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#FFF3D0" />
          <stop offset="100%" stopColor="#FFF3D0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Sky + distant moon + stars */}
      <rect width="280" height="160" fill="url(#hs-sky)" />
      <circle cx="225" cy="30" r="14" fill="url(#hs-moon)" />
      <circle cx="225" cy="30" r="7" fill="#FFF3D0" opacity=".9" />
      {[[18,10],[48,22],[92,8],[138,18],[178,12],[205,25],[258,18],[268,6],[30,40],[110,32],[162,38],[240,45]]
        .map(([x,y],i)=>(
          <circle key={`hs-st${i}`} cx={x} cy={y} r={i%4===0?1.3:0.6}
            fill={i%3===0?"#FFF3D0":"#cfe4ff"} opacity={0.35+(i%4)*0.15} />
      ))}

      {/* Sea */}
      <rect x="0" y="108" width="280" height="52" fill="url(#hs-sea)" />
      {[[14,116],[46,120],[92,115],[132,124],[178,118],[220,122],[256,116],[20,140],[70,138],[128,142],[190,140],[244,138]]
        .map(([x,y],i)=>(
          <path key={`hs-wv${i}`} d={`M${x} ${y} q 4 -2 8 0 q 4 2 8 0`} stroke="rgba(180,220,255,.4)" strokeWidth=".8" fill="none" />
      ))}

      {/* Left cliff + lighthouse */}
      <path d="M0 100 L0 108 L55 108 L62 96 L48 88 L30 90 L18 84 L0 90 Z" fill="#1d3040" />
      <path d="M0 90 L18 84 L30 90 L48 88 L62 96 L55 108 L0 108 Z" fill="none" stroke="rgba(255,255,255,.06)" strokeWidth=".5" />
      {/* Grass tuft */}
      <ellipse cx="28" cy="88" rx="8" ry="2" fill="#2d5a3a" opacity=".7" />
      {/* Lighthouse body */}
      <rect x="22" y="52" width="10" height="36" fill="#E8E8E8" />
      {[56,64,72,80].map((sy,i)=>(
        <rect key={`hs-ls${i}`} x="22" y={sy} width="10" height="4" fill="#C43A3A" />
      ))}
      <rect x="22" y="52" width="10" height="2" fill="rgba(255,255,255,.4)" />
      {/* Lantern room + beacon */}
      <rect x="20" y="45" width="14" height="7" fill="#3a3a3a" />
      <rect x="21" y="42" width="12" height="3" fill="#E8E8E8" />
      <polygon points="20,42 27,34 34,42" fill="#C43A3A" />
      <circle cx="27" cy="48" r="12" fill="url(#hs-beacon)" />
      <circle cx="27" cy="48" r="2.5" fill="#FFE8A0" />

      {/* Seawall: curving stone line along the low harbour */}
      <path d="M55 108 L70 106 L90 104 L120 104 L150 105 L185 106 L220 107 L250 108 L280 108 L280 114 L55 114 Z" fill="#3a3a3a" />
      <path d="M55 108 L70 106 L90 104 L120 104 L150 105 L185 106 L220 107 L250 108 L280 108" stroke="rgba(255,255,255,.12)" strokeWidth=".6" fill="none" />
      {[62,78,96,116,138,160,184,208,232,258].map((sx,i)=>(
        <rect key={`hs-sb${i}`} x={sx} y="109" width="10" height="5" fill="none" stroke="rgba(0,0,0,.35)" strokeWidth=".6" />
      ))}

      {/* Fishing cottages clustered inland: each a pitched-roof brick */}
      {[
        { x: 70,  w: 22, roof: "#8C3A2A", wall: "#E8D8B0" },
        { x: 100, w: 26, roof: "#6B4A2A", wall: "#DDBFA0" },
        { x: 135, w: 22, roof: "#8C3A2A", wall: "#D8C28A" },
        { x: 162, w: 28, roof: "#6B4A2A", wall: "#E8D8B0" },
        { x: 198, w: 20, roof: "#8C3A2A", wall: "#DDBFA0" },
      ].map((c, i) => {
        const y = 84, h = 20;
        return (
          <g key={`hs-h${i}`}>
            {/* Wall */}
            <rect x={c.x} y={y} width={c.w} height={h} fill={c.wall} />
            <rect x={c.x} y={y} width={c.w} height="2" fill="rgba(255,255,255,.18)" />
            <rect x={c.x + c.w - 3} y={y} width="3" height={h} fill="rgba(0,0,0,.22)" />
            {/* Roof */}
            <polygon points={`${c.x - 2},${y} ${c.x + c.w + 2},${y} ${c.x + c.w / 2},${y - 9}`} fill={c.roof} />
            <polygon points={`${c.x - 2},${y} ${c.x + c.w / 2},${y - 9} ${c.x + c.w / 2 - 2},${y - 8}`} fill="rgba(255,255,255,.12)" />
            {/* Warm window */}
            <rect x={c.x + c.w / 2 - 2} y={y + 7} width="4" height="5" rx=".4" fill="#FFD070" opacity=".85" />
            {/* Chimney */}
            <rect x={c.x + c.w - 6} y={y - 11} width="3" height="5" fill="#666" />
          </g>
        );
      })}

      {/* Small pier on the right with rowboat tied up */}
      <rect x="232" y="107" width="30" height="2" fill="#5a3c22" />
      {[234,242,250,258].map((px,i)=>(
        <rect key={`hs-pl${i}`} x={px} y="109" width="1.5" height="8" fill="#3a2612" />
      ))}
      <path d="M244 118 q 8 -2 16 0 l -1 4 q -7 1.5 -14 0 Z" fill="#8C4A2A" />
      <path d="M244 118 q 8 -2 16 0" stroke="rgba(255,255,255,.2)" strokeWidth=".6" fill="none" />

      {/* Two sailboats on the sea */}
      <g>
        <path d="M112 118 q 6 -2 12 0 l -1 3 q -5 1 -10 0 Z" fill="#6a4a2a" />
        <line x1="118" y1="118" x2="118" y2="92" stroke="#6a4a2a" strokeWidth=".8" />
        <polygon points="118,92 118,114 128,114" fill="#F5F0E0" />
        <polygon points="118,96 118,112 112,112" fill="#E8DDC0" opacity=".9" />
      </g>
      <g>
        <path d="M168 126 q 7 -2 14 0 l -1 3 q -6 1.5 -12 0 Z" fill="#5a3a22" />
        <line x1="175" y1="126" x2="175" y2="104" stroke="#5a3a22" strokeWidth=".7" />
        <polygon points="175,104 175,122 184,122" fill="#DDCBA0" />
      </g>

      {/* Small rocky islet far right mid-sea (matches map art continuity) */}
      <path d="M260 132 q 4 -4 8 0 q -2 3 -8 2 Z" fill="#2a3a48" />
    </svg>
  );
}

function DeepSpaceIllustration() {
  return (
    <svg viewBox="0 0 280 160" className="sc-illustration">
      <defs>
        <linearGradient id="ds-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06041a" />
          <stop offset="50%" stopColor="#10083a" />
          <stop offset="100%" stopColor="#1a1050" />
        </linearGradient>
        <radialGradient id="ds-nebula" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="rgba(120,60,180,.25)" />
          <stop offset="60%" stopColor="rgba(60,20,120,.1)" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <radialGradient id="ds-planet" cx=".35" cy=".3" r=".65">
          <stop offset="0%" stopColor="#5C3D8F" />
          <stop offset="80%" stopColor="#2A1650" />
          <stop offset="100%" stopColor="#1a0e30" />
        </radialGradient>
        <radialGradient id="ds-vglow" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity=".5" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Background */}
      <rect width="280" height="160" fill="url(#ds-bg)" />
      {/* Nebula */}
      <ellipse cx="220" cy="35" rx="55" ry="35" fill="url(#ds-nebula)" />
      {/* Planet */}
      <circle cx="45" cy="130" r="28" fill="url(#ds-planet)" />
      <ellipse cx="45" cy="130" rx="28" ry="5" fill="none" stroke="rgba(180,140,255,.15)" strokeWidth="1.5" />
      {/* Stars: many, varied sizes and colors */}
      {[[10,8],[28,20],[50,12],[72,5],[95,18],[115,8],[138,22],[155,6],[178,14],[200,5],[225,18],[250,8],[270,20],
        [18,38],[42,45],[68,32],[88,42],[112,36],[145,44],[172,35],[198,42],[228,38],[258,48],
        [8,55],[35,58],[62,65],[85,52],[108,60],[130,55],[158,62],[182,56],[208,65],[235,55],[262,58],
        [22,75],[48,82],[75,78],[100,85],[125,72],[152,80],[175,75],[202,82],[230,78],[255,72],
        [15,95],[40,102],[65,92],[92,98],[118,105],[142,95],[168,102],[192,95],[215,100],[240,92],[265,98]
      ].map(([x,y],i)=>(
        <circle key={`s${i}`} cx={x} cy={y} r={i%11===0?1.6:i%7===0?1.2:i%3===0?0.8:0.5}
          fill={i%13===0?"#B388FF":i%9===0?"#80D8FF":i%5===0?"#E0E0FF":"#fff"}
          opacity={i%6===0?0.8:i%4===0?0.5:0.3} />
      ))}
      {/* Central hub: octagonal shape approximated with a rect + clipped corners */}
      <g>
        <polygon points="120,58 160,58 170,68 170,100 160,110 120,110 110,100 110,68" fill="#7B40A0" />
        <polygon points="120,58 160,58 170,68 170,100 160,110 120,110 110,100 110,68" fill="none" stroke="#B388FF" strokeWidth=".8" />
        {/* Hub panel detail lines */}
        <line x1="112" y1="75" x2="168" y2="75" stroke="rgba(180,140,255,.15)" strokeWidth=".5" />
        <line x1="112" y1="92" x2="168" y2="92" stroke="rgba(180,140,255,.15)" strokeWidth=".5" />
        <line x1="140" y1="60" x2="140" y2="108" stroke="rgba(180,140,255,.1)" strokeWidth=".5" />
        {/* Hub windows: circular with cyan glow */}
        {[125,140,155].map(cx=>(
          <g key={`hw${cx}`}>
            <circle cx={cx} cy="78" r="6" fill="#0a0820" stroke="#00E5FF" strokeWidth="1.2" />
            <circle cx={cx} cy="78" r="4" fill="url(#ds-vglow)" />
            <circle cx={cx-1.5} cy="76.5" r="1" fill="rgba(255,255,255,.3)" />
          </g>
        ))}
        {/* Hub studs on top */}
        {[128,140,152].map(cx=>(
          <g key={`hs${cx}`}>
            <circle cx={cx} cy="55.5" r="3.5" fill="#9B59B6" stroke="#B388FF" strokeWidth=".7" />
            <circle cx={cx-0.5} cy="54.5" r="1" fill="rgba(255,255,255,.3)" />
          </g>
        ))}
        {/* Hub lower detail circles */}
        {[130,140,150].map(cx=>(
          <circle key={`hd${cx}`} cx={cx} cy="98" r="2" fill="#5C2D82" stroke="#B388FF" strokeWidth=".5" />
        ))}
      </g>
      {/* Left arm */}
      <rect x="65" y="80" width="45" height="7" rx="3" fill="#5C2D82" />
      <rect x="65" y="82" width="45" height="1" fill="rgba(180,140,255,.12)" />
      {/* Left module */}
      <g>
        <rect x="32" y="66" width="35" height="38" rx="4" fill="#4A2570" />
        <rect x="32" y="66" width="35" height="2" fill="rgba(180,140,255,.15)" />
        <rect x="63" y="66" width="4" height="38" fill="rgba(0,0,0,.2)" />
        {/* Viewport windows */}
        <circle cx="44" cy="80" r="5" fill="#0a0820" stroke="#00E5FF" strokeWidth="1" />
        <circle cx="44" cy="80" r="3" fill="url(#ds-vglow)" />
        <circle cx="58" cy="80" r="4" fill="#0a0820" stroke="#00E5FF" strokeWidth=".8" />
        <circle cx="58" cy="80" r="2.5" fill="url(#ds-vglow)" />
        {/* Panel lines */}
        <line x1="34" y1="90" x2="65" y2="90" stroke="rgba(180,140,255,.12)" strokeWidth=".5" />
        {/* Studs */}
        {[42,50,58].map(cx=>(
          <g key={`ls${cx}`}>
            <circle cx={cx} cy="63.5" r="2.8" fill="#5C2D82" stroke="#B388FF" strokeWidth=".5" />
            <circle cx={cx-0.4} cy="62.8" r=".8" fill="rgba(255,255,255,.25)" />
          </g>
        ))}
        {/* Satellite dish */}
        <path d="M35,66 Q28,58 35,52" fill="none" stroke="#B388FF" strokeWidth="1" />
        <circle cx="35" cy="52" r="2" fill="#7B40A0" stroke="#B388FF" strokeWidth=".5" />
      </g>
      {/* Right arm */}
      <rect x="170" y="80" width="45" height="7" rx="3" fill="#5C2D82" />
      <rect x="170" y="82" width="45" height="1" fill="rgba(180,140,255,.12)" />
      {/* Right module */}
      <g>
        <rect x="213" y="68" width="38" height="34" rx="4" fill="#4A2570" />
        <rect x="213" y="68" width="38" height="2" fill="rgba(180,140,255,.15)" />
        <rect x="247" y="68" width="4" height="34" fill="rgba(0,0,0,.2)" />
        {/* Viewport windows */}
        <circle cx="226" cy="80" r="5" fill="#0a0820" stroke="#00E5FF" strokeWidth="1" />
        <circle cx="226" cy="80" r="3" fill="url(#ds-vglow)" />
        <circle cx="240" cy="80" r="4" fill="#0a0820" stroke="#00E5FF" strokeWidth=".8" />
        <circle cx="240" cy="80" r="2.5" fill="url(#ds-vglow)" />
        {/* Panel lines */}
        <line x1="215" y1="72" x2="249" y2="72" stroke="rgba(180,140,255,.12)" strokeWidth=".5" />
        <line x1="215" y1="92" x2="249" y2="92" stroke="rgba(180,140,255,.12)" strokeWidth=".5" />
        {/* Portholes */}
        {[222,232,242].map(cx=>(
          <circle key={`rp${cx}`} cx={cx} cy="95" r="1.5" fill="#0a0820" stroke="#B388FF" strokeWidth=".5" />
        ))}
        {/* Studs */}
        {[222,232,242].map(cx=>(
          <g key={`rs${cx}`}>
            <circle cx={cx} cy="65.5" r="2.8" fill="#5C2D82" stroke="#B388FF" strokeWidth=".5" />
            <circle cx={cx-0.4} cy="64.8" r=".8" fill="rgba(255,255,255,.25)" />
          </g>
        ))}
      </g>
      {/* Antenna on top of hub */}
      <line x1="140" y1="58" x2="140" y2="32" stroke="#B388FF" strokeWidth="1.2" />
      <circle cx="140" cy="30" r="2.5" fill="#7B40A0" stroke="#B388FF" strokeWidth=".8" />
      <circle cx="140" cy="30" r="1" fill="#00E5FF" />
      {/* Signal wave arcs */}
      {[8,14,20].map((r,i)=>(
        <path key={`sig${i}`} d={`M${140-r},${30-r/2} A${r},${r/1.5} 0 0,1 ${140+r},${30-r/2}`}
          fill="none" stroke="#00E5FF" strokeWidth=".5" opacity={0.5-i*0.15} />
      ))}
      {/* Floating asteroid fragments */}
      {[[18,50],[25,55],[265,42],[258,48],[85,120],[195,125]].map(([ax,ay],i)=>(
        <polygon key={`ast${i}`}
          points={`${ax},${ay-2} ${ax+3},${ay} ${ax+1},${ay+3} ${ax-2},${ay+2} ${ax-3},${ay}`}
          fill={i%2===0?"#5a4a6a":"#4a3a5a"} stroke="rgba(180,140,255,.2)" strokeWidth=".4" />
      ))}
    </svg>
  );
}

function RainforestIllustration() {
  return (
    <svg viewBox="0 0 280 160" className="sc-illustration">
      <defs>
        <linearGradient id="rf-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#061208" />
          <stop offset="50%" stopColor="#0a1e0e" />
          <stop offset="100%" stopColor="#142818" />
        </linearGradient>
        <radialGradient id="rf-fly" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#C8E6C9" />
          <stop offset="100%" stopColor="#C8E6C9" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Background */}
      <rect width="280" height="160" fill="url(#rf-bg)" />
      {/* Crescent moon */}
      <circle cx="242" cy="22" r="10" fill="#D0D080" opacity=".5" />
      <circle cx="246" cy="19" r="9" fill="#061208" />
      {/* Ground with grass texture */}
      <rect x="0" y="132" width="280" height="28" fill="#1a2e1a" />
      <rect x="0" y="132" width="280" height="2" fill="#2a4a2a" />
      {/* Grass strokes */}
      {Array.from({length:35},(_,i)=>{
        const gx = 4+i*8;
        return (
          <line key={`gr${i}`} x1={gx} y1="132" x2={gx+(i%3-1)*2} y2={128-i%4}
            stroke="#2E7D32" strokeWidth=".8" opacity=".5" />
        );
      })}
      {/* Small stream/path at bottom */}
      <path d="M0,148 Q30,145 60,148 Q90,152 120,147 Q150,143 180,148 Q210,153 240,147 Q260,144 280,148"
        fill="none" stroke="#1565C0" strokeWidth="2" opacity=".3" />
      <path d="M0,150 Q30,147 60,150 Q90,154 120,149 Q150,145 180,150 Q210,155 240,149 Q260,146 280,150"
        fill="none" stroke="#1976D2" strokeWidth="1" opacity=".2" />

      {/* Tree 1: massive wide canopy */}
      <g>
        <rect x="28" y="78" width="14" height="54" rx="3" fill="#6B4226" />
        {/* Bark texture */}
        {[82,90,98,106,114,122].map((ly,i)=>(
          <line key={`bk1${i}`} x1="30" y1={ly} x2="40" y2={ly} stroke="rgba(0,0,0,.15)" strokeWidth=".5" />
        ))}
        <ellipse cx="35" cy="50" rx="38" ry="32" fill="#1B5E20" />
        <ellipse cx="25" cy="44" rx="28" ry="24" fill="#2E7D32" />
        <ellipse cx="48" cy="40" rx="22" ry="20" fill="#388E3C" />
        <ellipse cx="35" cy="36" rx="18" ry="14" fill="#43A047" />
        {/* Foliage studs */}
        {[[20,42],[35,34],[50,38],[28,52],[45,50]].map(([sx,sy],i)=>(
          <g key={`fs1${i}`}>
            <circle cx={sx} cy={sy} r="2.5" fill="#2E7D32" stroke="rgba(255,255,255,.1)" strokeWidth=".4" />
            <circle cx={sx-0.3} cy={sy-0.4} r=".7" fill="rgba(255,255,255,.15)" />
          </g>
        ))}
        {/* Shelf mushrooms on trunk */}
        <ellipse cx="25" cy="95" rx="6" ry="2" fill="#8D6E63" />
        <ellipse cx="25" cy="94.5" rx="5" ry="1.5" fill="#A1887F" />
        <ellipse cx="43" cy="105" rx="5" ry="1.8" fill="#8D6E63" />
        <ellipse cx="43" cy="104.5" rx="4" ry="1.3" fill="#A1887F" />
      </g>

      {/* Tree 2: tall narrow */}
      <g>
        <rect x="92" y="55" width="8" height="77" rx="2" fill="#8D6E63" />
        {[60,68,76,84,92,100,108,116,124].map((ly,i)=>(
          <line key={`bk2${i}`} x1="93" y1={ly} x2="99" y2={ly} stroke="rgba(0,0,0,.12)" strokeWidth=".4" />
        ))}
        <ellipse cx="96" cy="42" rx="16" ry="18" fill="#2E7D32" />
        <ellipse cx="93" cy="38" rx="12" ry="14" fill="#388E3C" />
        <ellipse cx="99" cy="35" rx="10" ry="10" fill="#43A047" />
        {[[90,40],[100,36]].map(([sx,sy],i)=>(
          <g key={`fs2${i}`}>
            <circle cx={sx} cy={sy} r="2" fill="#2E7D32" stroke="rgba(255,255,255,.1)" strokeWidth=".4" />
            <circle cx={sx-0.3} cy={sy-0.3} r=".6" fill="rgba(255,255,255,.15)" />
          </g>
        ))}
      </g>

      {/* Tree 3: mushroom shaped (wide flat cap) */}
      <g>
        <rect x="138" y="68" width="10" height="64" rx="2" fill="#6B4226" />
        {[72,80,88,96,104,112,120].map((ly,i)=>(
          <line key={`bk3${i}`} x1="139" y1={ly} x2="147" y2={ly} stroke="rgba(0,0,0,.12)" strokeWidth=".4" />
        ))}
        <ellipse cx="143" cy="64" rx="32" ry="14" fill="#1B5E20" />
        <ellipse cx="143" cy="60" rx="26" ry="10" fill="#2E7D32" />
        <ellipse cx="143" cy="57" rx="20" ry="7" fill="#388E3C" />
        {[[125,62],[143,56],[160,62],[135,60],[152,58]].map(([sx,sy],i)=>(
          <g key={`fs3${i}`}>
            <circle cx={sx} cy={sy} r="2" fill="#1B5E20" stroke="rgba(255,255,255,.1)" strokeWidth=".4" />
            <circle cx={sx-0.3} cy={sy-0.3} r=".6" fill="rgba(255,255,255,.15)" />
          </g>
        ))}
      </g>

      {/* Tree 4: medium round */}
      <g>
        <rect x="196" y="88" width="8" height="44" rx="2" fill="#8D6E63" />
        {[92,100,108,116,124].map((ly,i)=>(
          <line key={`bk4${i}`} x1="197" y1={ly} x2="203" y2={ly} stroke="rgba(0,0,0,.12)" strokeWidth=".4" />
        ))}
        <circle cx="200" cy="72" r="20" fill="#2E7D32" />
        <circle cx="195" cy="68" r="14" fill="#388E3C" />
        <circle cx="205" cy="65" r="10" fill="#43A047" />
        {[[192,70],[204,64],[200,76]].map(([sx,sy],i)=>(
          <g key={`fs4${i}`}>
            <circle cx={sx} cy={sy} r="2" fill="#2E7D32" stroke="rgba(255,255,255,.1)" strokeWidth=".4" />
            <circle cx={sx-0.3} cy={sy-0.3} r=".6" fill="rgba(255,255,255,.15)" />
          </g>
        ))}
      </g>

      {/* Tree 5: small bush */}
      <g>
        <rect x="240" y="110" width="5" height="22" rx="1.5" fill="#6B4226" />
        <ellipse cx="242" cy="102" rx="14" ry="12" fill="#2E7D32" />
        <ellipse cx="238" cy="98" rx="10" ry="9" fill="#388E3C" />
        <ellipse cx="246" cy="96" rx="8" ry="7" fill="#43A047" />
        {[[236,100],[246,95]].map(([sx,sy],i)=>(
          <g key={`fs5${i}`}>
            <circle cx={sx} cy={sy} r="1.8" fill="#2E7D32" stroke="rgba(255,255,255,.1)" strokeWidth=".3" />
          </g>
        ))}
      </g>

      {/* Tree 6: far right tiny */}
      <g>
        <rect x="265" y="115" width="4" height="17" rx="1" fill="#8D6E63" />
        <ellipse cx="267" cy="108" rx="10" ry="10" fill="#1B5E20" />
        <ellipse cx="265" cy="105" rx="7" ry="7" fill="#2E7D32" />
      </g>

      {/* Vines */}
      <path d="M55,30 Q52,50 58,70 Q54,85 58,100" fill="none" stroke="#2E7D32" strokeWidth="1.2" opacity=".6" />
      <path d="M160,45 Q157,60 162,80 Q158,95 162,110" fill="none" stroke="#388E3C" strokeWidth="1" opacity=".5" />

      {/* Fireflies */}
      {[[75,85],[130,50],[195,65],[240,82],[110,110]].map(([fx,fy],i)=>(
        <g key={`ff${i}`}>
          <circle cx={fx} cy={fy} r="5" fill="url(#rf-fly)" opacity=".4" />
          <circle cx={fx} cy={fy} r="1.5" fill="#C8E6C9" opacity=".8" />
        </g>
      ))}
    </svg>
  );
}

function OceanDepthsIllustration() {
  return (
    <svg viewBox="0 0 280 160" className="sc-illustration">
      <defs>
        <linearGradient id="oc-bg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a2838" />
          <stop offset="50%" stopColor="#061a28" />
          <stop offset="100%" stopColor="#020e18" />
        </linearGradient>
        <radialGradient id="oc-bio" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity=".4" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="oc-wglow" cx=".5" cy=".5" r=".5">
          <stop offset="0%" stopColor="#00E5FF" stopOpacity=".6" />
          <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Background gradient */}
      <rect width="280" height="160" fill="url(#oc-bg)" />

      {/* Bioluminescent dots scattered */}
      {[[15,20,"#00E5FF"],[40,45,"#FF6B9D"],[65,30,"#76FF03"],[90,55,"#B388FF"],
        [120,18,"#00E5FF"],[145,42,"#FF6B9D"],[175,25,"#76FF03"],[200,50,"#B388FF"],
        [225,15,"#00E5FF"],[255,35,"#FF6B9D"],[35,70,"#76FF03"],[80,80,"#00E5FF"],
        [210,72,"#B388FF"],[250,65,"#FF6B9D"],[110,75,"#00E5FF"],[160,68,"#76FF03"],
        [25,95,"#B388FF"],[270,88,"#00E5FF"]
      ].map(([bx,by,col],i)=>(
        <circle key={`bio${i}`} cx={bx as number} cy={by as number} r={i%3===0?1.2:0.7}
          fill={col as string} opacity={0.15+((i%4)*0.08)} />
      ))}

      {/* Seafloor */}
      <path d="M0,138 Q20,132 40,136 Q60,140 80,134 Q100,130 120,136 Q140,142 160,135 Q180,130 200,136 Q220,142 240,134 Q260,130 280,136 L280,160 L0,160 Z"
        fill="#0a2a22" />
      <path d="M0,140 Q20,134 40,138 Q60,142 80,136 Q100,132 120,138 Q140,144 160,137 Q180,132 200,138 Q220,144 240,136 Q260,132 280,138"
        fill="none" stroke="#1a3a2a" strokeWidth=".8" />

      {/* Coral cluster 1: pink/coral */}
      <g>
        <path d="M30,138 L30,112 M30,118 L20,105 M30,118 L40,102 M30,125 L22,115 M30,125 L38,112 M20,105 L15,98 M40,102 L45,95"
          stroke="#FF6B9D" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {[[15,96,3],[20,103,2.8],[22,113,2.5],[30,110,2.8],[38,110,2.5],[40,100,3],[45,93,2.5]].map(([cx,cy,r],i)=>(
          <circle key={`c1${i}`} cx={cx} cy={cy} r={r} fill={i%2===0?"#FF8EB3":"#FF6B9D"} />
        ))}
        {/* Coral studs */}
        {[[15,94],[40,98],[30,108]].map(([sx,sy],i)=>(
          <circle key={`cs1${i}`} cx={sx} cy={sy} r="1.2" fill="#FFB3CC" opacity=".6" />
        ))}
      </g>

      {/* Coral cluster 2 */}
      <g>
        <path d="M230,136 L230,115 M230,120 L222,108 M230,120 L240,105 M222,108 L218,100 M240,105 L245,97"
          stroke="#FF6B9D" strokeWidth="2" strokeLinecap="round" fill="none" />
        {[[218,98,2.5],[222,106,2.5],[230,113,2.8],[240,103,2.8],[245,95,2.5]].map(([cx,cy,r],i)=>(
          <circle key={`c2${i}`} cx={cx} cy={cy} r={r} fill={i%2===0?"#FF8EB3":"#FF6B9D"} />
        ))}
      </g>

      {/* Coral cluster 3: small */}
      <g>
        <path d="M260,136 L260,122 M260,126 L254,118 M260,126 L266,118"
          stroke="#FF8EB3" strokeWidth="1.8" strokeLinecap="round" fill="none" />
        {[[254,116,2],[260,120,2.2],[266,116,2]].map(([cx,cy,r],i)=>(
          <circle key={`c3${i}`} cx={cx} cy={cy} r={r} fill="#FFB3CC" />
        ))}
      </g>

      {/* Seaweed strand 1 */}
      <path d="M70,138 Q65,118 72,100 Q78,85 70,72 Q65,60 70,50"
        fill="none" stroke="#2E7D32" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M70,138 Q65,118 72,100 Q78,85 70,72 Q65,60 70,50"
        fill="none" stroke="#43A047" strokeWidth="1" strokeLinecap="round" opacity=".5" />

      {/* Seaweed strand 2 */}
      <path d="M85,136 Q80,120 86,108 Q92,96 85,82"
        fill="none" stroke="#388E3C" strokeWidth="2" strokeLinecap="round" />

      {/* Seaweed strand 3 */}
      <path d="M195,138 Q190,122 196,108 Q202,95 195,82 Q190,72 195,62"
        fill="none" stroke="#2E7D32" strokeWidth="2.2" strokeLinecap="round" />

      {/* LEGO submarine / diving pod */}
      <g>
        {/* Body: oval */}
        <ellipse cx="140" cy="78" rx="38" ry="20" fill="#2E7D6E" />
        <ellipse cx="140" cy="78" rx="36" ry="18" fill="#37897A" />
        {/* Top highlight */}
        <ellipse cx="140" cy="72" rx="30" ry="8" fill="rgba(255,255,255,.06)" />
        {/* Windows */}
        <circle cx="125" cy="76" r="9" fill="#0a2a25" stroke="#00E5FF" strokeWidth="1.5" />
        <circle cx="125" cy="76" r="6" fill="url(#oc-wglow)" />
        <circle cx="125" cy="73" r="2.5" fill="rgba(255,255,255,.2)" />
        <circle cx="148" cy="76" r="9" fill="#0a2a25" stroke="#00E5FF" strokeWidth="1.5" />
        <circle cx="148" cy="76" r="6" fill="url(#oc-wglow)" />
        <circle cx="148" cy="73" r="2.5" fill="rgba(255,255,255,.2)" />
        {/* Tail section */}
        <rect x="172" y="70" width="18" height="16" rx="3" fill="#2E7D6E" />
        <rect x="186" y="70" width="4" height="16" fill="rgba(0,0,0,.2)" />
        {/* Tail portholes */}
        {[74,80].map(py=>(
          <circle key={`tp${py}`} cx="180" cy={py} r="2.5" fill="#0a2a25" stroke="#00E5FF" strokeWidth=".8" />
        ))}
        {/* Propeller */}
        <rect x="190" y="75" width="6" height="2" rx="1" fill="#546E7A" />
        <ellipse cx="198" cy="76" rx="2" ry="7" fill="#78909C" opacity=".7" />
        <circle cx="198" cy="76" r="1.5" fill="#546E7A" />
        {/* Studs on top of sub */}
        {[128,138,148,158].map(sx=>(
          <g key={`ss${sx}`}>
            <circle cx={sx} cy="57" r="3" fill="#37897A" stroke="rgba(255,255,255,.12)" strokeWidth=".5" />
            <circle cx={sx-0.4} cy="56.2" r=".8" fill="rgba(255,255,255,.2)" />
          </g>
        ))}
        {/* Conning tower / periscope bump */}
        <rect x="133" y="58" width="14" height="6" rx="2" fill="#2E7D6E" />
        <rect x="138" y="52" width="4" height="8" rx="1" fill="#37897A" />
      </g>

      {/* Fish 1: cyan */}
      <g>
        <polygon points="100,40 110,36 110,44" fill="#4FC3F7" />
        <polygon points="110,32 125,38 110,44" fill="#80DEEA" />
        <circle cx="120" cy="37" r="1.5" fill="#0a2030" />
      </g>

      {/* Fish 2: light blue, smaller */}
      <g>
        <polygon points="205,35 212,32 212,38" fill="#81D4FA" />
        <polygon points="212,29 222,34 212,39" fill="#B3E5FC" />
        <circle cx="218" cy="33" r="1.2" fill="#0a2030" />
      </g>

      {/* Bubble streams */}
      {[[108,65,3],[110,55,2],[109,45,1.5],[111,35,1]].map(([bx,by,br],i)=>(
        <circle key={`bb1${i}`} cx={bx} cy={by} r={br} fill="none" stroke="rgba(255,255,255,.15)" strokeWidth=".7" />
      ))}
      {[[165,62,2.5],[167,52,2],[164,42,1.5]].map(([bx,by,br],i)=>(
        <circle key={`bb2${i}`} cx={bx} cy={by} r={br} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth=".6" />
      ))}
      {[[55,55,2],[56,45,1.5],[54,35,1]].map(([bx,by,br],i)=>(
        <circle key={`bb3${i}`} cx={bx} cy={by} r={br} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth=".5" />
      ))}

      {/* Jellyfish */}
      <g opacity=".6">
        <ellipse cx="250" cy="52" rx="8" ry="5" fill="#B388FF" opacity=".4" />
        <ellipse cx="250" cy="52" rx="6" ry="4" fill="#CE93D8" opacity=".5" />
        <circle cx="248" cy="51" r="1" fill="rgba(255,255,255,.2)" />
        <path d="M244,56 Q242,65 244,72" fill="none" stroke="#B388FF" strokeWidth=".6" opacity=".4" />
        <path d="M248,57 Q246,66 248,74" fill="none" stroke="#CE93D8" strokeWidth=".5" opacity=".4" />
        <path d="M252,57 Q254,66 252,74" fill="none" stroke="#B388FF" strokeWidth=".6" opacity=".4" />
        <path d="M256,56 Q258,64 256,70" fill="none" stroke="#CE93D8" strokeWidth=".5" opacity=".4" />
      </g>
    </svg>
  );
}

export const SCENARIO_ILLUSTRATIONS: Record<string, () => React.JSX.Element> = {
  rising_tides: HarborsideIllustration,
  last_orbit: DeepSpaceIllustration,
  deep_current: OceanDepthsIllustration,
  roothold: RainforestIllustration,
};

export default function EntryScreen() {
  const { goTo, set } = useGame();
  const createSession = useMutation(api.game.createSession);
  const joinAsFac = useMutation(api.game.joinSession);
  const [picking, setPicking] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [rejoining, setRejoining] = useState(false);
  const [rejoinCode, setRejoinCode] = useState("");
  const [rejoinError, setRejoinError] = useState("");

  const [loading, setLoading] = useState(false);

  async function handleFacRejoin() {
    setRejoinError("");
    if (rejoinCode.trim().length < 4) {
      setRejoinError("Enter the session code.");
      return;
    }
    setLoading(true);
    try {
      const res = await joinAsFac({
        code: rejoinCode.trim().toUpperCase(),
        name: "Facilitator",
        isFacilitator: true,
      });
      if (!res.success) {
        setRejoinError(res.error || "Could not rejoin.");
        return;
      }
      set({
        role: "facilitator",
        sessionCode: rejoinCode.trim().toUpperCase(),
        sessionId: res.sessionId,
        playerId: res.playerId,
      });
      goTo("s-fac-setup");
    } catch {
      setRejoinError("Connection error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleScenarioSelect(scenarioId: string) {
    setSelected(selected === scenarioId ? null : scenarioId);
  }

  async function handleConfirmScenario() {
    if (!selected || loading) return;
    setLoading(true);
    const res = await createSession({ scenario: selected });
    const joinRes = await joinAsFac({
      code: res.code,
      name: "Facilitator",
      isFacilitator: true,
    });
    set({
      role: "facilitator",
      sessionCode: res.code,
      sessionId: res.sessionId,
      playerId: joinRes.playerId,
      scenario: selected,
    });
    goTo("s-fac-setup");
  }

  if (picking) {
    const selectedScenario = SCENARIOS.find((s) => s.id === selected);
    const bgColor = selectedScenario ? selectedScenario.color : null;
    return (
      <div
        className="screen active"
        id="s-entry"
        style={{
          background: bgColor
            ? `radial-gradient(ellipse at 50% 50%, ${bgColor}30 0%, ${bgColor}18 35%, ${bgColor}08 60%, #06061a 85%)`
            : undefined,
          transition: "background .6s ease",
        }}
      >
        <div className="scenario-picker-wrap">
          <div className="scenario-picker-header">
            <div className="scenario-picker-title">CHOOSE YOUR WORLD</div>
          </div>
          <div className="scenario-grid">
            {SCENARIOS.map((s) => {
              const Illust = SCENARIO_ILLUSTRATIONS[s.id];
              const isSel = selected === s.id;
              return (
                <div
                  key={s.id}
                  className={`scenario-card${isSel ? " selected" : ""}`}
                  style={{ "--sc-color": s.color } as React.CSSProperties}
                  onClick={() => handleScenarioSelect(s.id)}
                >
                  <div className="sc-illustration-wrap">
                    {Illust && <Illust />}
                    {isSel && <div className="sc-selected-badge">SELECTED</div>}
                  </div>
                  <div className="sc-info">
                    <div className="sc-title" style={{ color: s.color }}>{s.title.toUpperCase()}</div>
                    <div className="sc-tagline">{s.tagline}</div>
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 32, alignItems: "center", justifyContent: "space-between", width: "100%" }}>
            <button className="entry-back-btn" onClick={() => { setPicking(false); setSelected(null); }}>
              Back
            </button>
            <button
              className={`lb ${selected ? "lb-yellow" : "lb-ghost"}`}
              disabled={!selected || loading}
              onClick={handleConfirmScenario}
              style={{ padding: "12px 36px", fontSize: 13 }}
            >
              {loading ? "Creating..." : "START SESSION"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (rejoining) {
    return (
      <div className="screen active" id="s-entry">
        <BrandBar />
        <div className="join-wrap">
          <div className="join-card">
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Black Han Sans', sans-serif", fontSize: 20, letterSpacing: 2, marginBottom: 4 }}>
                REJOIN AS FACILITATOR
              </div>
              <div style={{ fontSize: 12, color: "var(--textd)" }}>
                Enter the session code to reconnect.
              </div>
            </div>
            <div>
              <label className="field-lbl">Session code</label>
              <input
                className="linput code-s"
                type="text"
                placeholder="ENTER CODE"
                maxLength={5}
                value={rejoinCode}
                onChange={(e) => setRejoinCode(e.target.value.toUpperCase())}
              />
            </div>
            {rejoinError && <div className="err-msg show">{rejoinError}</div>}
            <button
              className="lb lb-yellow"
              disabled={loading}
              onClick={handleFacRejoin}
              style={{ width: "100%" }}
            >
              {loading ? "Reconnecting\u2026" : "REJOIN \u2192"}
            </button>
            <button
              className="lb lb-ghost"
              onClick={() => { setRejoining(false); setRejoinCode(""); setRejoinError(""); }}
              style={{ width: "100%", fontSize: 11 }}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="screen active" id="s-entry">
      <BackgroundSkyline />
      <div className="entry-inner" style={{ position: "relative", zIndex: 1 }}>
        <div className="game-title">(Em)Powered Play</div>
        <div className="game-sub">A structural team dynamics game</div>
        <div className="mode-row">
          <div className="mode-card" onClick={() => goTo("s-join")}>
            <div className="mc-icon-wrap">
              <PlayerIcon />
            </div>
            <div className="mc-lbl" style={{ color: "#FFD700" }}>PLAYER</div>
            <div className="mc-sub">Join your team&apos;s mission</div>
          </div>
          <div className="mode-card" onClick={async () => {
            if (loading) return;
            setLoading(true);
            try {
              const res = await createSession({ scenario: "" });
              const joinRes = await joinAsFac({ code: res.code, name: "Facilitator", isFacilitator: true });
              set({ role: "facilitator", sessionCode: res.code, sessionId: res.sessionId, playerId: joinRes.playerId, scenario: "" });
              goTo("s-fac-setup");
            } finally { setLoading(false); }
          }}>
            <div className="mc-icon-wrap">
              <FacilitatorIcon />
            </div>
            <div className="mc-lbl" style={{ color: "#4FC3F7" }}>FACILITATOR</div>
            <div className="mc-sub">Set up &amp; run the session</div>
          </div>
        </div>
        <button
          onClick={() => setRejoining(true)}
          style={{
            marginTop: 24,
            background: "transparent",
            border: "none",
            color: "var(--textd)",
            fontSize: 12,
            textDecoration: "underline",
            cursor: "pointer",
          }}
        >
          Already running a session? Rejoin as facilitator &rarr;
        </button>
      </div>
    </div>
  );
}
