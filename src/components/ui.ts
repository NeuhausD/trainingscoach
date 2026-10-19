// Gemeinsame Tailwind-Klassen auf Basis der Design-Tokens (docs/07-design.md).
export const panel = "rounded-lg bg-paper-raised p-4 shadow-[0_0_0_1px_var(--mist)]";
export const input =
  "w-full rounded-control border border-mist bg-paper-raised px-3 py-2 text-base text-ink placeholder:text-stone/70 hover:border-stone focus-visible:border-moss";
export const label = "block text-sm font-medium";
export const hint = "mt-1 text-sm text-stone";
export const buttonPrimary =
  "inline-flex w-full items-center justify-center rounded-control bg-moss px-4 py-2.5 text-sm font-semibold text-moss-ink transition-colors duration-150 hover:bg-ink hover:text-paper disabled:opacity-60 sm:w-auto";
export const buttonSecondary =
  "inline-flex w-full items-center justify-center rounded-control border border-stone/50 px-4 py-2.5 text-sm font-semibold text-ink transition-colors duration-150 hover:border-ink hover:bg-paper-raised disabled:opacity-60 sm:w-auto";
export const buttonDanger =
  "inline-flex w-full items-center justify-center rounded-control border border-danger/50 px-4 py-2.5 text-sm font-semibold text-danger transition-colors duration-150 hover:bg-danger hover:text-paper disabled:opacity-60 sm:w-auto";
export const errorBox = "rounded-control border border-danger/40 bg-paper-raised p-3 text-sm text-danger";
export const successBox = "rounded-control border border-moss/40 bg-paper-raised p-3 text-sm text-moss";
