import { SEASONS, type Season } from "@/db/schema";
import { WEIGHT_MAX, type SeasonPreference } from "@/lib/domain/preferences";
import { SEASON_LABELS } from "@/lib/domain/season";

const SEASON_COLOR: Record<Season, string> = {
  spring: "bg-season-spring",
  summer: "bg-season-summer",
  autumn: "bg-season-autumn",
  winter: "bg-season-winter",
};

/**
 * Saisonprofil: vier Balken für die Gewichtung je Saison (0..10),
 * die aktuelle Saison in ihrer Saisonfarbe. Das Leitelement des Designs.
 */
export function SeasonProfile({
  preferences,
  currentSeason,
  size = "sm",
}: {
  preferences: SeasonPreference[];
  currentSeason: Season;
  size?: "sm" | "lg";
}) {
  const height = size === "lg" ? 56 : 28;
  const width = size === "lg" ? 14 : 7;
  const gap = size === "lg" ? 6 : 3;
  const description = SEASONS.map(
    (s) => `${SEASON_LABELS[s]} ${preferences.find((p) => p.season === s)?.weight ?? 0}`,
  ).join(", ");

  return (
    <div
      role="img"
      aria-label={`Saisonprofil: ${description}`}
      className="flex items-end"
      style={{ height, gap }}
    >
      {SEASONS.map((season) => {
        const weight = preferences.find((p) => p.season === season)?.weight ?? 0;
        const barHeight = Math.max(2, Math.round((weight / WEIGHT_MAX) * height));
        const current = season === currentSeason;
        return (
          <span
            key={season}
            aria-hidden="true"
            className={`block rounded-[2px] ${current ? SEASON_COLOR[season] : weight === 0 ? "bg-mist" : "bg-stone/60"}`}
            style={{ height: barHeight, width }}
          />
        );
      })}
    </div>
  );
}

export const SEASON_TEXT_COLOR: Record<Season, string> = {
  spring: "text-season-spring",
  summer: "text-season-summer",
  autumn: "text-season-autumn",
  winter: "text-season-winter",
};
