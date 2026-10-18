import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  backHref = "/dashboard",
  backLabel = "Übersicht",
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  backLabel?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="mb-6">
      <Link href={backHref} className="text-sm text-zinc-600 underline dark:text-zinc-400">
        ← {backLabel}
      </Link>
      <div className="mt-2 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle && <p className="text-sm text-zinc-600 dark:text-zinc-400">{subtitle}</p>}
        </div>
        {action}
      </div>
    </header>
  );
}
