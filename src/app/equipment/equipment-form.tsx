"use client";

import { useActionState, useState } from "react";
import { EQUIPMENT_KINDS, type EquipmentKind } from "@/db/schema";
import { initialActionState, type ActionState } from "@/components/action-form";
import { SubmitButton } from "@/components/submit-button";
import { errorBox, hint, input, label, panel } from "@/components/ui";
import { formatKgPerLevel } from "@/lib/domain/equipment-settings";
import { KIND_LABELS, type Equipment } from "@/lib/master-data/equipment";

export function EquipmentForm({
  action,
  item,
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  item?: Equipment;
}) {
  const [state, formAction] = useActionState(action, initialActionState);
  const [kind, setKind] = useState<EquipmentKind>(item?.kind ?? "bike_trail");
  const s = item?.settings ?? undefined;

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
          <select
            id="kind"
            name="kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as EquipmentKind)}
            className={input}
          >
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

      {kind === "home_gym" && (
        <section className={`${panel} flex flex-col gap-4`} aria-labelledby="parameter">
          <div>
            <h2 id="parameter" className="text-xl font-semibold">
              Geräteparameter
            </h2>
            <p className={hint}>
              Für Kraftstationen wie das Eisenhorn. Die Widerstandsstufe wird später je Satz erfasst; die Tabelle Stufe
              zu Kilogramm macht daraus Gewichte.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label htmlFor="model" className={label}>
                Modell oder Generation
              </label>
              <input id="model" name="model" autoComplete="off" defaultValue={s?.model ?? ""} placeholder="EISENHORN, ältere Generation…" className={input} />
            </div>
            <div>
              <label htmlFor="piston" className={label}>
                Kolben
              </label>
              <input id="piston" name="piston" autoComplete="off" defaultValue={s?.piston ?? ""} placeholder="16…" className={input} />
            </div>
            <div>
              <label htmlFor="levels" className={label}>
                Anzahl Stufen
              </label>
              <input
                id="levels"
                name="levels"
                type="number"
                inputMode="numeric"
                min={1}
                max={50}
                step={1}
                autoComplete="off"
                defaultValue={s?.levels ?? ""}
                placeholder="10…"
                className={input}
              />
            </div>
          </div>
          <label className="flex items-center gap-3 py-1">
            <input type="checkbox" name="halfSteps" defaultChecked={s?.halfSteps ?? false} className="h-5 w-5 accent-moss" />
            Halbstufen vorhanden
          </label>
          <label className="flex items-center gap-3 py-1">
            <input type="checkbox" name="cablePulley" defaultChecked={s?.cablePulley ?? false} className="h-5 w-5 accent-moss" />
            Seilzug vorhanden
          </label>
          <div>
            <label htmlFor="accessories" className={label}>
              Zubehör
            </label>
            <input
              id="accessories"
              name="accessories"
              autoComplete="off"
              defaultValue={s?.accessories?.join(", ") ?? ""}
              placeholder="Griffstange, Griffband (2x), Blocker…"
              className={input}
            />
            <p className={hint}>Kommagetrennt. Bestimmt, welche Übungen aus dem Katalog ohne Zusatzkauf möglich sind.</p>
          </div>
          <div>
            <label htmlFor="kgPerLevel" className={label}>
              Stufe zu Kilogramm
            </label>
            <textarea
              id="kgPerLevel"
              name="kgPerLevel"
              rows={2}
              autoComplete="off"
              spellCheck={false}
              defaultValue={formatKgPerLevel(s?.kgPerLevel)}
              placeholder="1=6, 2=9, 3=12.5…"
              className={input}
            />
            <p className={hint}>Optional, Einträge «Stufe=kg» mit Komma getrennt, Dezimalpunkt.</p>
          </div>
        </section>
      )}

      <SubmitButton>{item ? "Änderungen speichern" : "Gerät anlegen"}</SubmitButton>
    </form>
  );
}
