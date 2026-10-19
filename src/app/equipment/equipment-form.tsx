"use client";

import { useActionState } from "react";
import { EQUIPMENT_KINDS } from "@/db/schema";
import { initialActionState, type ActionState } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { errorBox, hint, input, label, panel } from "@/components/ui";
import { KIND_LABELS, type Equipment } from "@/lib/master-data/equipment";

export function EquipmentForm({
  action,
  item,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  item?: Equipment;
}) {
  const [state, formAction] = useActionState(action, initialActionState);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      {item && <input type="hidden" name="id" value={item.id} />}
      {state.error && (
        <p role="alert" className={errorBox}>
          {state.error}
        </p>
      )}

      <section className={`${panel} flex flex-col gap-4`}>
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
            defaultValue={item?.name ?? ""}
            placeholder="Trail-Bike…"
            className={input}
          />
        </div>
        <div>
          <label htmlFor="kind" className={label}>
            Typ
          </label>
          <select id="kind" name="kind" defaultValue={item?.kind ?? "bike_trail"} className={input}>
            {EQUIPMENT_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_LABELS[k]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="stravaGearId" className={label}>
            Strava-Gear-ID
          </label>
          <input
            id="stravaGearId"
            name="stravaGearId"
            autoComplete="off"
            spellCheck={false}
            defaultValue={item?.stravaGearId ?? ""}
            placeholder="b1234567…"
            className={input}
          />
          <p className={hint}>Optional. Ab Phase P3 gleicht der Strava-Import Aktivitäten darüber dem Gerät zu.</p>
        </div>
        <div>
          <label htmlFor="notes" className={label}>
            Notiz
          </label>
          <textarea id="notes" name="notes" rows={2} autoComplete="off" defaultValue={item?.notes ?? ""} className={input} />
        </div>
        <label className="flex items-center gap-3 py-1">
          <input type="checkbox" name="retired" defaultChecked={item?.retired ?? false} className="h-5 w-5 accent-moss" />
          Ausgemustert, nicht mehr für neue Aktivitäten
        </label>
      </section>

      <SubmitButton>{item ? "Änderungen speichern" : "Gerät anlegen"}</SubmitButton>
    </form>
  );
}
