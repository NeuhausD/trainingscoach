"use client";

import { useActionState } from "react";
import { SEASONS, SPORT_CATEGORIES, type Season } from "@/db/schema";
import { initialActionState, type ActionState } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { card, errorBox, hint, input, label } from "@/components/ui";
import { WEIGHT_MAX, WEIGHT_MIN, weightLabel, type SeasonPreference } from "@/lib/domain/preferences";
import { SEASON_LABELS } from "@/lib/domain/season";
import { CATEGORY_LABELS, type SportWithPreferences } from "@/lib/master-data/sports";

const WEIGHTS = Array.from({ length: WEIGHT_MAX - WEIGHT_MIN + 1 }, (_, i) => WEIGHT_MIN + i);

export function SportForm({
  action,
  sport,
  currentSeason,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  sport?: SportWithPreferences;
  currentSeason: Season;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const pref = (season: Season): SeasonPreference | undefined => sport?.preferences.find((p) => p.season === season);

  return (
    <form action={formAction} className="flex flex-col gap-6">
      {sport && <input type="hidden" name="id" value={sport.id} />}
      {state.error && <p className={errorBox}>{state.error}</p>}

      <section className={`${card} flex flex-col gap-4`}>
        <div>
          <label htmlFor="name" className={label}>
            Name
          </label>
          <input id="name" name="name" required maxLength={80} defaultValue={sport?.name ?? ""} className={input} />
        </div>
        <div>
          <label htmlFor="category" className={label}>
            Kategorie
          </label>
          <select id="category" name="category" defaultValue={sport?.category ?? "endurance"} className={input}>
            {SPORT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="stravaTypes" className={label}>
            Strava-Sportarten
          </label>
          <input
            id="stravaTypes"
            name="stravaTypes"
            defaultValue={sport?.stravaTypes.join(", ") ?? ""}
            placeholder="z. B. MountainBikeRide, Ride"
            className={input}
          />
          <p className={hint}>
            Kommagetrennt, Schreibweise wie in der Strava-API (Ride, MountainBikeRide, Run, WeightTraining, IceSkate …).
            Importierte Aktivitäten werden darüber dieser Sportart zugeordnet.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="active" defaultChecked={sport?.active ?? true} className="h-4 w-4" />
          Aktiv (wird bei Vorschlägen berücksichtigt)
        </label>
      </section>

      <section className="flex flex-col gap-3">
        <div>
          <h2 className="font-medium">Saisonale Gewichtung</h2>
          <p className={hint}>0 = nie, 10 = Schwerpunkt. Ziel-Einheiten pro Woche sind optional.</p>
        </div>
        {SEASONS.map((season) => {
          const p = pref(season);
          const isCurrent = season === currentSeason;
          return (
            <fieldset key={season} className={`${card} ${isCurrent ? "ring-2 ring-zinc-400 dark:ring-zinc-600" : ""}`}>
              <legend className="px-1 text-sm font-medium">
                {SEASON_LABELS[season]}
                {isCurrent && <span className="ml-2 text-xs font-normal text-zinc-500">aktuell</span>}
              </legend>
              <div className="mt-2 grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`weight_${season}`} className={label}>
                    Gewichtung
                  </label>
                  <select
                    id={`weight_${season}`}
                    name={`weight_${season}`}
                    defaultValue={p?.weight ?? 5}
                    className={input}
                  >
                    {WEIGHTS.map((w) => (
                      <option key={w} value={w}>
                        {w} · {weightLabel(w)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`target_${season}`} className={label}>
                    Einheiten / Woche
                  </label>
                  <input
                    id={`target_${season}`}
                    name={`target_${season}`}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={14}
                    step={1}
                    defaultValue={p?.targetSessionsPerWeek ?? ""}
                    placeholder="–"
                    className={input}
                  />
                </div>
                <div className="col-span-2">
                  <label htmlFor={`notes_${season}`} className={label}>
                    Notiz
                  </label>
                  <input
                    id={`notes_${season}`}
                    name={`notes_${season}`}
                    defaultValue={p?.notes ?? ""}
                    placeholder="z. B. nur bei trockenen Wegen"
                    className={input}
                  />
                </div>
              </div>
            </fieldset>
          );
        })}
      </section>

      <SubmitButton>{sport ? "Speichern" : "Sportart anlegen"}</SubmitButton>
    </form>
  );
}
