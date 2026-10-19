"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { buttonPrimary, errorBox, hint, input, label, panel, successBox } from "@/components/ui";
import { generatePlanAction, type PlanState } from "./actions";

const initial: PlanState = {};

function Submit({ hasPlan }: { hasPlan: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={buttonPrimary}>
      {pending ? "Plan wird erstellt…" : hasPlan ? "Neu planen" : "Woche planen"}
    </button>
  );
}

export function PlanForm({ hasPlan }: { hasPlan: boolean }) {
  const [state, action] = useActionState<PlanState, FormData>(generatePlanAction, initial);
  return (
    <form action={action} className={`${panel} flex flex-col gap-4`}>
      <div>
        <label htmlFor="constraints" className={label}>
          Hinweise an den Coach
        </label>
        <textarea
          id="constraints"
          name="constraints"
          rows={2}
          maxLength={600}
          aria-describedby="constraints-hint"
          className={input}
          placeholder={"Eine Zeile je Hinweis, z. B.\nDonnerstag kein Training"}
        />
        <p id="constraints-hint" className={hint}>
          Optional. Der Coach nutzt Saison-Gewichtung, Belastung der letzten vier Wochen, Wetter und das Eisenhorn. Dauert etwa eine halbe Minute.
        </p>
      </div>
      {state.error && (
        <p role="alert" className={errorBox}>
          {state.error}
        </p>
      )}
      {state.created !== undefined && !state.error && (
        <p role="status" className={successBox}>
          {state.created} Vorschläge erstellt ({state.modelId}). Offene Vorschläge wurden ersetzt, angenommene bleiben.
        </p>
      )}
      <Submit hasPlan={hasPlan} />
    </form>
  );
}
