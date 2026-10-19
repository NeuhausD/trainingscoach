import type { INTENSITIES } from "@/db/schema";

export type Intensity = (typeof INTENSITIES)[number];

export const INTENSITY_LABELS: Record<Intensity, string> = {
  recovery: "Erholung",
  endurance: "Grundlage",
  tempo: "Tempo",
  threshold: "Schwelle",
  vo2max: "VO2max",
  strength: "Kraft",
  power: "Schnellkraft",
};
