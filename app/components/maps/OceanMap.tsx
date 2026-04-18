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
  rebuilt?: boolean;
}

export default function OceanMap({ rebuilt }: OceanMapProps) {
  return (
    <div className="map-img-wrap">
      <img
        src="/maps/ocean-depths.png"
        alt="Ocean Depths seafloor map"
        className="map-bg-img"
        draggable={false}
        style={{
          filter: rebuilt ? "brightness(1.3) saturate(1.3) contrast(1.1)" : undefined,
          transition: "filter 2s ease-in-out",
        }}
      />
    </div>
  );
}
