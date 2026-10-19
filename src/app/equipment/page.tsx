import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buttonSecondary } from "@/components/ui";
import { describeSettings } from "@/lib/domain/equipment-settings";
import { KIND_LABELS, listEquipment } from "@/lib/master-data/equipment";
import { requireUser } from "@/lib/users";

export const metadata = { title: "Geräte" };

export default async function EquipmentPage() {
  const user = await requireUser();
  const items = await listEquipment(user.id);

  return (
    <>
      <PageHeader
        title="Geräte"
        subtitle="Bikes, Laufschuhe, Heimtraining. Abgleich mit Strava-Gear ab Phase P3."
        action={
          <Link href="/equipment/new" className={buttonSecondary}>
            Neues Gerät
          </Link>
        }
      />

      {items.length === 0 ? (
        <p className="text-stone">
          Noch keine Geräte.{" "}
          <Link href="/equipment/new" className="font-medium text-moss hover:underline">
            Erstes Gerät anlegen
          </Link>{" "}
          oder auf der Seite{" "}
          <Link href="/sports" className="font-medium text-moss hover:underline">
            Sportarten
          </Link>{" "}
          die Stammdaten mit beiden Bikes anlegen.
        </p>
      ) : (
        <ul className="divide-y divide-mist">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/equipment/${item.id}`}
                className={`flex items-center justify-between gap-4 py-4 hover:text-moss ${item.retired ? "text-stone" : ""}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-lg font-semibold">
                    {item.name}
                    {item.retired && <span className="ml-2 text-sm font-normal text-stone">ausgemustert</span>}
                  </span>
                  <span className="block text-sm text-stone">
                    {[KIND_LABELS[item.kind], describeSettings(item.settings), item.notes].filter(Boolean).join(", ")}
                  </span>
                </span>
                {item.stravaGearId && (
                  <span className="shrink-0 text-sm text-stone tabular-nums" translate="no">
                    {item.stravaGearId}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
