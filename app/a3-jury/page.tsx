import type { Metadata } from "next";
import A3Deck from "./A3Deck";

export const metadata: Metadata = {
  title: "Empowered Play · A3 Jury",
};

export default function A3JuryPage() {
  return <A3Deck />;
}
