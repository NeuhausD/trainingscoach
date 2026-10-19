"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { buttonSecondary, errorBox, hint, input, label } from "@/components/ui";
import { reviewPlanAction, type ReviewState } from "./actions";

const initial: ReviewState = {};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={buttonSecondary}>
      {pending ? "Plan wird geprüft…" : "Plan prüfen lassen"}
    </button>
  );
}

export function ReviewForm() {
  const [state, action] = useActionState<ReviewState, FormData>(reviewPlanAction, initial);
  return (
    <form action={action} className="flex flex-col gap-3">
      <div>
        <label htmlFor="review-constraints" className={label}>
          Hinweise zur Prüfung
        </label>
        <textarea id="review-constraints" name="constraints" rows={2} maxLength={600} aria-describedby="review-hint" className={`${input} mt-1`} placeholder={"Optional, eine Zeile je Hinweis"} />
        <p id="review-hint" className={hint}>
          Der Coach prüft die geplante Woche gegen Belastung, Erholung, Saison und Wetter und schlägt Verbesserungen vor. Dauert etwa eine halbe Minute.
        </p>
      </div>
      {state.error && (
        <p role="alert" className={errorBox}>
          {state.error}
        </p>
      )}
      {state.forecastError && (
        <p role="alert" className={errorBox}>
          Ohne Wettervorhersage geprüft, Open-Meteo war nicht erreichbar: {state.forecastError}
        </p>
      )}
      <Submit />
    </form>
  );
}
