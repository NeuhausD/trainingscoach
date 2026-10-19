"use server";

import { revalidatePath } from "next/cache";
import { importFitFile, type FitImportResult } from "@/lib/fit/import";
import { MAX_FIT_BYTES } from "@/lib/fit/parse";
import { requireUser } from "@/lib/users";

export type UploadState = { results: FitImportResult[]; error?: string };

const MAX_FILES = 10;

export async function uploadFitAction(_prev: UploadState, formData: FormData): Promise<UploadState> {
  const user = await requireUser();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return { results: [], error: "Bitte mindestens eine FIT-Datei auswählen." };
  if (files.length > MAX_FILES) return { results: [], error: `Höchstens ${MAX_FILES} Dateien auf einmal.` };

  const results: FitImportResult[] = [];
  for (const file of files) {
    if (file.size > MAX_FIT_BYTES) {
      results.push({ fileName: file.name, status: "error", message: "Datei ist grösser als 4 MB und wurde übersprungen." });
      continue;
    }
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      results.push(await importFitFile(user.id, file.name, bytes));
    } catch (e) {
      results.push({ fileName: file.name, status: "error", message: e instanceof Error ? e.message : "Import fehlgeschlagen." });
    }
  }
  revalidatePath("/activities");
  revalidatePath("/dashboard");
  revalidatePath("/progress");
  revalidatePath("/metrics");
  return { results };
}
