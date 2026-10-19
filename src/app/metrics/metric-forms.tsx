"use client";

import { useActionState } from "react";
import { PERFORMANCE_METRICS } from "@/db/schema";
import { initialActionState, type ActionState } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { buttonSecondary, errorBox, hint, input, label, panel } from "@/components/ui";
import { METRIC_INFO } from "@/lib/domain/metrics";

type Action = (prev: ActionState, formData: FormData) => Promise<ActionState>;

export function BodyMetricForm({ action, today }: { action: Action; today: string }) {
  const [state, formAction] = useActionState(action, initialActionState);
  return (
    <form action={formAction} className={`${panel} flex flex-col gap-3`}>
      {state.error && (
        <p role="alert" className={errorBox}>
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor="weightKg" className={label}>
            Gewicht kg
          </label>
          <input id="weightKg" name="weightKg" type="number" inputMode="decimal" min={30} max={250} step={0.1} autoComplete="off" placeholder="78.4" className={input} />
        </div>
        <div>
          <label htmlFor="restingHr" className={label}>
            Ruhepuls
          </label>
          <input id="restingHr" name="restingHr" type="number" inputMode="numeric" min={25} max={120} step={1} autoComplete="off" placeholder="52" className={input} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="bodyDate" className={label}>
            Datum
          </label>
          <input id="bodyDate" name="date" type="date" required defaultValue={today} className={input} />
        </div>
      </div>
      <SubmitButton className={buttonSecondary}>Körperwerte speichern</SubmitButton>
    </form>
  );
}

export function PerformanceMetricForm({ action, today }: { action: Action; today: string }) {
  const [state, formAction] = useActionState(action, initialActionState);
  return (
    <form action={formAction} className={`${panel} flex flex-col gap-3`}>
      {state.error && (
        <p role="alert" className={errorBox}>
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-3 sm:col-span-1">
          <label htmlFor="metric" className={label}>
            Kennzahl
          </label>
          <select id="metric" name="metric" defaultValue="ftp_w" className={input}>
            {PERFORMANCE_METRICS.map((m) => (
              <option key={m} value={m}>
                {METRIC_INFO[m].label} ({METRIC_INFO[m].unit})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="value" className={label}>
            Wert
          </label>
          <input id="value" name="value" type="number" inputMode="decimal" min={0} step={0.1} required autoComplete="off" className={input} />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label htmlFor="perfDate" className={label}>
            Datum
          </label>
          <input id="perfDate" name="date" type="date" required defaultValue={today} className={input} />
        </div>
        <div className="col-span-3">
          <label htmlFor="perfNotes" className={label}>
            Notiz
          </label>
          <input id="perfNotes" name="notes" autoComplete="off" maxLength={200} placeholder="20-min-Test auf der Rolle…" className={input} />
        </div>
      </div>
      <p className={hint}>Geschätzte Werte sind erlaubt; die Notiz hält fest, wie gemessen wurde.</p>
      <SubmitButton className={buttonSecondary}>Leistungswert speichern</SubmitButton>
    </form>
  );
}
