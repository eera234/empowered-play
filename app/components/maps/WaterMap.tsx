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
}

export default function WaterMap({ slots, occupiedSlotIds }: WaterMapProps) {
  return (
    <div className="map-img-wrap">
      <img
        src="/maps/rising-tides.png"
        alt="Rising Tides city map"
        className="map-bg-img"
        draggable={false}
      />
    </div>
  );
}
