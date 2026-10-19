import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  backHref,
  backLabel,
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
      {backHref && backLabel && (
        <Link href={backHref} className="text-sm font-medium text-stone hover:text-moss">
          ‹ {backLabel}
        </Link>
      )}
      <div className="mt-1 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-4xl font-semibold leading-none tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-stone">{subtitle}</p>}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </header>
  );
}
