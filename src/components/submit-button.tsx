"use client";

import { useFormStatus } from "react-dom";
import { buttonPrimary } from "./ui";

export function SubmitButton({ children, className = buttonPrimary }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className={className}>
      {pending ? "Wird gespeichert…" : children}
    </button>
  );
}
