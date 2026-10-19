"use client";

import { useActionState, useState } from "react";
import { initialActionState, type ActionState } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { buttonSecondary, errorBox, hint, input, label, panel } from "@/components/ui";
import { MUSCLE_LABELS } from "@/lib/domain/eisenhorn-catalog";

export type ExerciseOption = { id: string; name: string; source: string; primaryMuscles: string[] };

export function SetForm({
  action,
  activityId,
  exercises,
  defaultExerciseId,
  useLevels,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  activityId: string;
  exercises: ExerciseOption[];
  defaultExerciseId: string | null;
  /** Eisenhorn: Widerstand als Stufe statt kg */
  useLevels: boolean;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const [newExercise, setNewExercise] = useState(false);
  const groups: [string, ExerciseOption[]][] = [
    ["Eisenhorn", exercises.filter((e) => e.source === "eisenhorn")],
    ["Studio", exercises.filter((e) => e.source === "free-exercise-db")],
    ["Eigene", exercises.filter((e) => e.source === "manual")],
  ];

  return (
    <form action={formAction} className={`${panel} flex flex-col gap-3`}>
      <input type="hidden" name="activityId" value={activityId} />
      {state.error && (
        <p role="alert" className={errorBox}>
          {state.error}
        </p>
      )}
      <div>
        <div className="flex items-baseline justify-between gap-3">
          <label htmlFor={newExercise ? "newExercise" : "exerciseId"} className={label}>
            Übung
          </label>
          <button type="button" onClick={() => setNewExercise((v) => !v)} className="text-sm font-medium text-moss hover:underline">
            {newExercise ? "Aus Katalog wählen" : "Neue Übung"}
          </button>
        </div>
        {newExercise ? (
          <input id="newExercise" name="newExercise" required autoComplete="off" maxLength={80} placeholder="Name der Übung…" className={input} />
        ) : (
          <select id="exerciseId" name="exerciseId" required defaultValue={defaultExerciseId ?? ""} className={input}>
            <option value="" disabled>
              Übung wählen…
            </option>
            {groups
              .filter(([, list]) => list.length > 0)
              .map(([group, list]) => (
                <optgroup key={group} label={group}>
                  {list.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name}
                      {e.primaryMuscles.length ? ` (${e.primaryMuscles.map((m) => MUSCLE_LABELS[m] ?? m).join(", ")})` : ""}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>
        )}
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor="reps" className={label}>
            Wdh.
          </label>
          <input id="reps" name="reps" type="number" inputMode="numeric" min={1} max={500} step={1} autoComplete="off" className={input} />
        </div>
        {useLevels ? (
          <div>
            <label htmlFor="level" className={label}>
              Stufe
            </label>
            <input id="level" name="level" type="number" inputMode="decimal" min={0.5} max={50} step={0.5} autoComplete="off" className={input} />
          </div>
        ) : (
          <div>
            <label htmlFor="weightKg" className={label}>
              kg
            </label>
            <input id="weightKg" name="weightKg" type="number" inputMode="decimal" min={0} max={1000} step={0.5} autoComplete="off" className={input} />
          </div>
        )}
        <div>
          <label htmlFor="setRpe" className={label}>
            RPE
          </label>
          <input id="setRpe" name="setRpe" type="number" inputMode="numeric" min={1} max={10} step={1} autoComplete="off" className={input} />
        </div>
      </div>
      {useLevels && <p className={hint}>Widerstandsstufe am Horn; Kilogramm folgen aus der Tabelle in den Geräteparametern.</p>}
      <div className="flex gap-2">
        <SubmitButton className={buttonSecondary}>Satz hinzufügen</SubmitButton>
      </div>
    </form>
  );
}
