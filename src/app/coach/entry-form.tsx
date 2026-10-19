"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { buttonPrimary, errorBox, hint, input, label, successBox } from "@/components/ui";
import { INTENSITY_LABELS } from "@/lib/domain/intensity";
import { addEntryAction, type EntryState } from "./actions";

const initial: EntryState = {};
const PRESETS = [30, 45, 60, 90, 120];
const chip =
  "cursor-pointer rounded-control border border-mist bg-paper-raised px-3 py-2 text-sm font-medium transition-colors duration-150 hover:border-stone peer-checked:border-moss peer-checked:bg-moss peer-checked:text-moss-ink peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-moss";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={buttonPrimary}>
      {pending ? "Wird gespeichert…" : "Einheit planen"}
    </button>
  );
}

export function EntryForm({ sports, defaultDate }: { sports: { id: string; name: string; selfPlanned: boolean }[]; defaultDate: string }) {
  const [state, action] = useActionState<EntryState, FormData>(addEntryAction, initial);
  return (
    <form action={action} className="flex flex-col gap-4">
      <fieldset>
        <legend className={label}>Sportart</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {sports.map((s) => (
            <label key={s.id} className="contents">
              <input type="radio" name="sportId" value={s.id} required className="peer sr-only" />
              <span className={chip}>{s.name}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="entry-date" className={label}>
            Tag
          </label>
          <input id="entry-date" name="date" type="date" required defaultValue={defaultDate} className={`${input} mt-1`} />
        </div>
        <div>
          <label htmlFor="entry-duration" className={label}>
            Dauer in Minuten
          </label>
          <input id="entry-duration" name="durationMin" type="number" inputMode="numeric" min={5} max={480} step={1} required defaultValue={60} list="entry-presets" className={`${input} mt-1`} />
          <datalist id="entry-presets">
            {PRESETS.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="entry-intensity" className={label}>
            Intensität
          </label>
          <select id="entry-intensity" name="intensity" required defaultValue="endurance" className={`${input} mt-1`}>
            {Object.entries(INTENSITY_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="entry-title" className={label}>
            Titel
          </label>
          <input id="entry-title" name="title" type="text" maxLength={80} placeholder="z. B. Plausch-Match" className={`${input} mt-1`} />
        </div>
        <div className="col-span-2">
          <label htmlFor="entry-description" className={label}>
            Ablauf
          </label>
          <textarea id="entry-description" name="description" rows={2} maxLength={2000} className={`${input} mt-1`} placeholder="Optional: Aufwärmen, Hauptteil, Ausfahren" />
          <p className={hint}>Eigene Einheiten gelten als angenommen und bleiben beim nächsten Coach-Plan stehen.</p>
        </div>
      </div>
      {state.error && (
        <p role="alert" className={errorBox}>
          {state.error}
        </p>
      )}
      {state.created && !state.error && (
        <p role="status" className={successBox}>
          Geplant: {state.created}.
        </p>
      )}
      <Submit />
    </form>
  );
}
