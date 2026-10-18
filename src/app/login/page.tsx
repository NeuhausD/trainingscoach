import { signIn } from "@/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const { callbackUrl, error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold">Trainingscoach</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">Anmeldung mit deinem Microsoft-365-Konto.</p>
      </div>
      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          Anmeldung fehlgeschlagen ({error}). Ist deine E-Mail-Adresse freigeschaltet?
        </p>
      )}
      <form
        action={async () => {
          "use server";
          await signIn("microsoft-entra-id", { redirectTo: callbackUrl ?? "/dashboard" });
        }}
      >
        <button
          type="submit"
          className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900"
        >
          Mit Microsoft anmelden
        </button>
      </form>
    </main>
  );
}
