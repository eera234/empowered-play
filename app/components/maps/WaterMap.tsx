"use client";

export interface PlacementSlot {
  id: string;
  x: number;
  y: number;
  label: string;
  adjacent: string[];
  zoneType: "center" | "edge" | "gateway" | "interior" | "any";
}

interface WaterMapProps {
  slots: PlacementSlot[];
  occupiedSlotIds: Set<string>;
  rebuilt?: boolean;
}

export default function WaterMap({ slots, occupiedSlotIds, rebuilt }: WaterMapProps) {
  return (
    <div className="map-img-wrap">
      {/* Damaged version: always rendered as base */}
      <img
        src="/maps/rising-tides-damaged.png"
        alt="Damaged city map"
        className="map-bg-img"
        draggable={false}
        style={{
          opacity: rebuilt ? 0 : 1,
          transition: "opacity 2s ease-in-out",
        }}
      />
      {/* Rebuilt version: fades in on top */}
      <img
        src="/maps/rising-tides-rebuilt.png"
        alt="Rebuilt city map"
        className="map-bg-img"
        draggable={false}
        style={{
          position: "absolute",
          inset: 0,
          opacity: rebuilt ? 1 : 0,
          transition: "opacity 2s ease-in-out",
        }}
      />
    </div>
  );
}
