"use client";

export interface PlacementSlot {
  id: string;
  x: number;
  y: number;
  label: string;
  adjacent: string[];
  zoneType: "center" | "edge" | "gateway" | "interior" | "any";
}

interface OceanMapProps {
  slots: PlacementSlot[];
  occupiedSlotIds: Set<string>;
}

export default function OceanMap({ slots, occupiedSlotIds }: OceanMapProps) {
  return (
    <div className="map-img-wrap">
      <img
        src="/maps/ocean-depths.png"
        alt="Ocean Depths seafloor map"
        className="map-bg-img"
        draggable={false}
      />
    </div>
  );
}
