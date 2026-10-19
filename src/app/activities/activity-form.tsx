"use client";

import { useActionState, useState } from "react";
import { initialActionState, type ActionState } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { errorBox, hint, input, label, panel } from "@/components/ui";
import { DURATION_PRESETS } from "@/lib/domain/activity-input";
import { RPE_LABELS, RPE_VALUES } from "@/lib/domain/rpe";

export type ActivityFormDefaults = {
  id?: string;
  sportId: string;
  equipmentId: string | null;
  date: string;
  time: string;
  durationMin: number;
  rpe: number | null;
  title: string;
  notes: string;
  distanceKm: string;
  elevationM: string;
  avgHr: string;
  maxHr: string;
};

export type SportOption = { id: string; name: string; category: string };
export type EquipmentOption = { id: string; name: string; kind: string };

const chip =
  "cursor-pointer rounded-control border border-mist bg-paper-raised px-3 py-2 text-sm font-medium transition-colors duration-150 hover:border-stone peer-checked:border-moss peer-checked:bg-moss peer-checked:text-moss-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-moss";

export function ActivityForm({
  action,
  defaults,
  sports,
  equipment,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  defaults: ActivityFormDefaults;
  sports: SportOption[];
  equipment: EquipmentOption[];
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const [duration, setDuration] = useState<string>(String(defaults.durationMin));
  const hasExtras = !!(defaults.distanceKm || defaults.elevationM || defaults.avgHr || defaults.maxHr || defaults.notes);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {defaults.id && <input type="hidden" name="id" value={defaults.id} />}
      {state.error && (
        <p role="alert" className={errorBox}>
          {state.error}
        </p>
      )}

      <fieldset>
        <legend className={label}>Sportart</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {sports.map((s) => (
            <label key={s.id} className="contents">
              <input type="radio" name="sportId" value={s.id} defaultChecked={s.id === defaults.sportId} required className="peer sr-only" />
              <span className={chip}>{s.name}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <section className={`${panel} grid grid-cols-2 gap-3`}>
        <div>
          <label htmlFor="date" className={label}>
            Datum
          </label>
          <input id="date" name="date" type="date" required defaultValue={defaults.date} className={input} />
        </div>
        <div>
          <label htmlFor="time" className={label}>
            Start
          </label>
          <input id="time" name="time" type="time" required defaultValue={defaults.time} className={input} />
        </div>
        <div className="col-span-2">
          <label htmlFor="durationMin" className={label}>
            Dauer in Minuten
          </label>
          <input
            id="durationMin"
            name="durationMin"
            type="number"
            inputMode="numeric"
            min={1}
            max={1440}
            step={1}
            required
            autoComplete="off"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            className={input}
          />
          <div className="mt-2 flex flex-wrap gap-2" aria-label="Schnellauswahl Dauer">
            {DURATION_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setDuration(String(m))}
                aria-pressed={duration === String(m)}
                className="rounded-control border border-mist px-3 py-1.5 text-sm font-medium transition-colors duration-150 hover:border-stone aria-pressed:border-moss aria-pressed:text-moss"
              >
                {m} min
              </button>
            ))}
          </div>
        </div>
        <div className="col-span-2">
          <label htmlFor="equipmentId" className={label}>
            Gerät
          </label>
          <select id="equipmentId" name="equipmentId" defaultValue={defaults.equipmentId ?? ""} className={input}>
            <option value="">Kein Gerät</option>
            {equipment.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name}
              </option>
            ))}
          </select>
        </div>
      </section>

      <fieldset>
        <legend className={label}>Anstrengung (RPE)</legend>
        <p className={hint}>Wie hart war die Einheit insgesamt? 1 = sehr leicht, 10 = maximal.</p>
        <div className="mt-2 grid grid-cols-5 gap-2">
          {RPE_VALUES.map((v) => (
            <label key={v} className="contents">
              <input type="radio" name="rpe" value={v} defaultChecked={defaults.rpe === v} className="peer sr-only" />
              <span className="flex cursor-pointer flex-col items-center rounded-control border border-mist bg-paper-raised py-2 transition-colors duration-150 hover:border-stone peer-checked:border-moss peer-checked:bg-moss peer-checked:text-moss-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-moss">
                <span className="font-display text-2xl font-semibold leading-none">{v}</span>
                <span className="mt-1 text-[11px] leading-tight">{RPE_LABELS[v]}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <details open={hasExtras} className={panel}>
        <summary className="cursor-pointer font-semibold">Mehr Angaben</summary>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="col-span-2">
            <label htmlFor="title" className={label}>
              Titel
            </label>
            <input id="title" name="title" autoComplete="off" maxLength={120} defaultValue={defaults.title} placeholder="Feierabendrunde…" className={input} />
          </div>
          <div>
            <label htmlFor="distanceKm" className={label}>
              Distanz in km
            </label>
            <input id="distanceKm" name="distanceKm" type="number" inputMode="decimal" min={0} max={1000} step={0.1} autoComplete="off" defaultValue={defaults.distanceKm} className={input} />
          </div>
          <div>
            <label htmlFor="elevationM" className={label}>
              Höhenmeter
            </label>
            <input id="elevationM" name="elevationM" type="number" inputMode="numeric" min={0} max={20000} step={1} autoComplete="off" defaultValue={defaults.elevationM} className={input} />
          </div>
          <div>
            <label htmlFor="avgHr" className={label}>
              Puls Ø
            </label>
            <input id="avgHr" name="avgHr" type="number" inputMode="numeric" min={30} max={240} step={1} autoComplete="off" defaultValue={defaults.avgHr} className={input} />
          </div>
          <div>
            <label htmlFor="maxHr" className={label}>
              Puls max.
            </label>
            <input id="maxHr" name="maxHr" type="number" inputMode="numeric" min={30} max={240} step={1} autoComplete="off" defaultValue={defaults.maxHr} className={input} />
          </div>
          <div className="col-span-2">
            <label htmlFor="notes" className={label}>
              Notiz
            </label>
            <textarea id="notes" name="notes" rows={2} autoComplete="off" defaultValue={defaults.notes} className={input} />
          </div>
        </div>
      </details>

      <SubmitButton>{defaults.id ? "Änderungen speichern" : "Training speichern"}</SubmitButton>
    </form>
  );
}
