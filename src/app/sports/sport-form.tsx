"use client";

import { useActionState } from "react";
import { SEASONS, SPORT_CATEGORIES, type Season } from "@/db/schema";
import { initialActionState, type ActionState } from "@/components/action-form";
import { SeasonProfile } from "@/components/season-profile";
import { SubmitButton } from "@/components/submit-button";
import { errorBox, hint, input, label, panel } from "@/components/ui";
import { WEIGHT_MAX, WEIGHT_MIN, weightLabel, type SeasonPreference } from "@/lib/domain/preferences";
import { SEASON_LABELS, SEASON_MONTHS } from "@/lib/domain/season";
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
    <form action={formAction} className="flex flex-col gap-8">
      {sport && <input type="hidden" name="id" value={sport.id} />}
      {state.error && (
        <p role="alert" className={errorBox}>
          {state.error}
        </p>
      )}

      <section className={`${panel} flex flex-col gap-4`} aria-labelledby="stammdaten">
        <h2 id="stammdaten" className="text-xl font-semibold">
          Stammdaten
        </h2>
        <div>
          <label htmlFor="name" className={label}>
            Name
          </label>
          <input
            id="name"
            name="name"
            required
            maxLength={80}
            autoComplete="off"
            defaultValue={sport?.name ?? ""}
            className={input}
          />
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
            autoComplete="off"
            spellCheck={false}
            defaultValue={sport?.stravaTypes.join(", ") ?? ""}
            placeholder="MountainBikeRide, Ride…"
            className={input}
          />
          <p className={hint}>
            Kommagetrennt, Schreibweise wie in der Strava-API (Ride, MountainBikeRide, Run, WeightTraining, IceSkate).
            Importierte Aktivitäten werden darüber dieser Sportart zugeordnet.
          </p>
        </div>
        <label className="flex items-center gap-3 py-1">
          <input type="checkbox" name="active" defaultChecked={sport?.active ?? true} className="h-5 w-5 accent-moss" />
          Aktiv, wird bei Vorschlägen berücksichtigt
        </label>
        <label className="flex items-start gap-3 py-1">
          <input type="checkbox" name="selfPlanned" defaultChecked={sport?.selfPlanned ?? false} className="mt-0.5 h-5 w-5 shrink-0 accent-moss" />
          <span>
            Plane ich selbst
            <span className="block text-sm text-stone">Feste Termine wie Eiszeiten. Der Coach schlägt keine Einheiten vor, rechnet die Belastung aber mit.</span>
          </span>
        </label>
      </section>

      <section className="flex flex-col gap-3" aria-labelledby="gewichtung">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 id="gewichtung" className="text-xl font-semibold">
              Saisonale Gewichtung
            </h2>
            <p className={hint}>0 = nie, 10 = Schwerpunkt. Einheiten pro Woche sind optional.</p>
          </div>
          {sport && <SeasonProfile preferences={sport.preferences} currentSeason={currentSeason} size="lg" />}
        </div>
        {SEASONS.map((season) => {
          const p = pref(season);
          const isCurrent = season === currentSeason;
          return (
            <fieldset key={season} className={`${panel} ${isCurrent ? "shadow-[0_0_0_2px_var(--moss)]" : ""}`}>
              <legend className="sr-only">{SEASON_LABELS[season]}</legend>
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-display text-2xl font-semibold">{SEASON_LABELS[season]}</span>
                <span className="text-sm text-stone">
                  {SEASON_MONTHS[season]}
                  {isCurrent && ", jetzt"}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
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
                        {w}, {weightLabel(w)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor={`target_${season}`} className={label}>
                    Einheiten pro Woche
                  </label>
                  <input
                    id={`target_${season}`}
                    name={`target_${season}`}
                    type="number"
                    inputMode="numeric"
                    autoComplete="off"
                    min={0}
                    max={14}
                    step={1}
                    defaultValue={p?.targetSessionsPerWeek ?? ""}
                    placeholder="2…"
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
                    autoComplete="off"
                    defaultValue={p?.notes ?? ""}
                    placeholder="nur bei trockenen Wegen…"
                    className={input}
                  />
                </div>
              </div>
            </fieldset>
          );
        })}
      </section>

      <SubmitButton>{sport ? "Änderungen speichern" : "Sportart anlegen"}</SubmitButton>
    </form>
  );
}
