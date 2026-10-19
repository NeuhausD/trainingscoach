import { signIn } from "@/auth";
import { buttonPrimary, errorBox } from "@/components/ui";

export const metadata = { title: "Anmelden" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  return (
    <div className="flex min-h-[60vh] max-w-sm flex-col justify-center gap-6">
      <div>
        <h1 className="text-5xl font-bold leading-none tracking-tight">Dein Training, deine Saison.</h1>
        <p className="mt-3 text-stone">Anmeldung mit deinem Microsoft-365-Konto.</p>
      </div>
      {error && (
        <p role="alert" className={errorBox}>
          Anmeldung fehlgeschlagen ({error}). Prüfe, ob deine E-Mail-Adresse freigeschaltet ist.
        </p>
      )}
      <form
        action={async () => {
          "use server";
          await signIn("microsoft-entra-id", { redirectTo: callbackUrl ?? "/dashboard" });
        }}
      >
        <button type="submit" className={buttonPrimary}>
          Mit Microsoft anmelden
        </button>
      </form>
    </div>
  );
}
