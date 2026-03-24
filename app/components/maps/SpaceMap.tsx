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
}

export default function SpaceMap({ slots, occupiedSlotIds }: SpaceMapProps) {
  return (
    <div className="map-img-wrap">
      <img
        src="/maps/deep-space.png"
        alt="Deep Space station map"
        className="map-bg-img"
        draggable={false}
      />
    </div>
  );
}
