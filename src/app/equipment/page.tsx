import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buttonSecondary, card } from "@/components/ui";
import { KIND_LABELS, listEquipment } from "@/lib/master-data/equipment";
import { requireUser } from "@/lib/users";

export const metadata = { title: "Sportgeräte – Trainingscoach" };

export default async function EquipmentPage() {
  const user = await requireUser();
  const items = await listEquipment(user.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Sportgeräte"
        subtitle="Bikes, Laufschuhe, Heimtraining; Abgleich mit Strava-Gear ab P3"
        action={
          <Link href="/equipment/new" className={buttonSecondary}>
            Neu
          </Link>
        }
      />

      {items.length === 0 ? (
        <p className={`${card} text-sm text-zinc-600 dark:text-zinc-400`}>
          Noch keine Geräte. Lege ein Gerät an oder nutze auf der Seite{" "}
          <Link href="/sports" className="underline">
            Sportarten
          </Link>{" "}
          «Stammdaten anlegen» für die beiden Bikes.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li key={item.id}>
              <Link
                href={`/equipment/${item.id}`}
                className={`${card} flex items-center justify-between gap-3 hover:border-zinc-400 dark:hover:border-zinc-600 ${item.retired ? "opacity-60" : ""}`}
              >
                <div>
                  <h2 className="font-medium">
                    {item.name}
                    {item.retired && <span className="ml-2 text-xs text-zinc-500">ausgemustert</span>}
                  </h2>
                  {item.notes && <p className="text-sm text-zinc-600 dark:text-zinc-400">{item.notes}</p>}
                </div>
                <div className="text-right text-xs text-zinc-500">
                  <div>{KIND_LABELS[item.kind]}</div>
                  {item.stravaGearId && <div className="font-mono">{item.stravaGearId}</div>}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
