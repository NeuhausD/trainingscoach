import { PageHeader } from "@/components/page-header";
import { requireUser } from "@/lib/users";
import { UploadForm } from "./upload-form";

export const metadata = { title: "FIT hochladen" };
export const maxDuration = 60;

export default async function UploadPage() {
  await requireUser();
  return (
    <>
      <PageHeader
        title="FIT hochladen"
        subtitle="Garmin-Werte ergänzen: Training Effect, Garmin-Belastung, Kalorien, VO2max. Eine Einheit, die schon aus Strava da ist, wird erkannt und ergänzt."
        backHref="/activities"
        backLabel="Aktivitäten"
      />
      <UploadForm />
    </>
  );
}
