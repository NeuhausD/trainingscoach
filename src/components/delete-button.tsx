"use client";

import { buttonDanger } from "./ui";

/** Submit-Button mit Rückfrage, für Lösch-Formulare. */
export function DeleteButton({ children, confirmText }: { children: React.ReactNode; confirmText: string }) {
  return (
    <button
      type="submit"
      className={buttonDanger}
      onClick={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
