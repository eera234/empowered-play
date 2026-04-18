"use client";

export interface PlacementSlot {
  id: string;
  x: number;
  y: number;
  label: string;
  adjacent: string[];
  zoneType: "center" | "edge" | "gateway" | "interior" | "any";
}

interface SpaceMapProps {
  slots: PlacementSlot[];
  occupiedSlotIds: Set<string>;
  rebuilt?: boolean;
}

export default function SpaceMap({ rebuilt }: SpaceMapProps) {
  return (
    <div className="map-img-wrap">
      <img
        src="/maps/deep-space.png"
        alt="Deep Space station map"
        className="map-bg-img"
        draggable={false}
        style={{
          filter: rebuilt ? "hue-rotate(90deg) brightness(1.1) saturate(1.2)" : undefined,
          transition: "filter 2s ease-in-out",
        }}
      />
    </div>
  );
}
