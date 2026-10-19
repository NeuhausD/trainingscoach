"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { buttonPrimary, errorBox, hint, label, panel } from "@/components/ui";
import type { FitImportResult } from "@/lib/fit/import";
import { uploadFitAction, type UploadState } from "./actions";

const initialUploadState: UploadState = { results: [] };

const STATUS_LABEL: Record<FitImportResult["status"], string> = {
  created: "Neu",
  merged: "Ergänzt",
  updated: "Aktualisiert",
  error: "Fehler",
};

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={buttonPrimary}>
      {pending ? "Wird ausgewertet…" : "Hochladen"}
    </button>
  );
}

export function UploadForm() {
  const [state, action] = useActionState<UploadState, FormData>(uploadFitAction, initialUploadState);
  const ok = state.results.filter((r) => r.status !== "error").length;

  return (
    <div className="flex flex-col gap-6">
      <form action={action} className={`${panel} flex flex-col gap-4`}>
        <div>
          <label htmlFor="files" className={label}>
            FIT-Dateien
          </label>
          <input
            id="files"
            name="files"
            type="file"
            accept=".fit,application/octet-stream"
            multiple
            required
            aria-describedby="files-hint"
            className="mt-1 block w-full text-sm text-ink file:mr-3 file:rounded-control file:border file:border-stone/50 file:bg-paper-raised file:px-3 file:py-2 file:text-sm file:font-semibold file:text-ink hover:file:border-ink"
          />
          <p id="files-hint" className={hint}>Bis zu 10 Dateien, je höchstens 4 MB. Export in Garmin Connect: Aktivität → Zahnrad → «Original exportieren», ZIP entpacken.</p>
        </div>
        {state.error && (
          <p role="alert" className={errorBox}>
            {state.error}
          </p>
        )}
        <Submit />
      </form>

      {state.results.length > 0 && (
        <section aria-labelledby="ergebnis" aria-live="polite">
          <h2 id="ergebnis" className="text-2xl font-semibold">
            Ergebnis
          </h2>
          <p className="text-sm text-stone">
            {ok} von {state.results.length} Dateien übernommen.
          </p>
          <ul className="mt-3 divide-y divide-mist">
            {state.results.map((r, i) => (
              <li key={`${r.fileName}-${i}`} className="flex items-start gap-3 py-3">
                <span
                  className={`mt-0.5 shrink-0 rounded-control px-2 py-0.5 text-xs font-semibold ${
                    r.status === "error" ? "bg-danger/10 text-danger" : "bg-moss/10 text-moss"
                  }`}
                >
                  {STATUS_LABEL[r.status]}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{r.fileName}</span>
                  <span className="block text-sm text-stone">
                    {r.message}
                    {r.vo2max ? ` VO2max ${r.vo2max} übernommen.` : ""}
                  </span>
                </span>
                {r.activityId && (
                  <Link href={`/activities/${r.activityId}`} className="shrink-0 text-sm font-medium text-moss hover:underline">
                    Öffnen
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
