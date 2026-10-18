"use client";

import { useActionState } from "react";
import { EQUIPMENT_KINDS } from "@/db/schema";
import { initialActionState, type ActionState } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { card, errorBox, hint, input, label } from "@/components/ui";
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
    <form action={formAction} className="flex flex-col gap-6">
      {item && <input type="hidden" name="id" value={item.id} />}
      {state.error && <p className={errorBox}>{state.error}</p>}

      <section className={`${card} flex flex-col gap-4`}>
        <div>
          <label htmlFor="name" className={label}>
            Name
          </label>
          <input id="name" name="name" required maxLength={80} defaultValue={item?.name ?? ""} className={input} />
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
            defaultValue={item?.stravaGearId ?? ""}
            placeholder="z. B. b1234567"
            className={input}
          />
          <p className={hint}>Optional. Wird ab Phase P3 beim Strava-Import automatisch abgeglichen.</p>
        </div>
        <div>
          <label htmlFor="notes" className={label}>
            Notiz
          </label>
          <textarea id="notes" name="notes" rows={2} defaultValue={item?.notes ?? ""} className={input} />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="retired" defaultChecked={item?.retired ?? false} className="h-4 w-4" />
          Ausgemustert (nicht mehr für neue Aktivitäten)
        </label>
      </section>

      <SubmitButton>{item ? "Speichern" : "Gerät anlegen"}</SubmitButton>
    </form>
  );
}
