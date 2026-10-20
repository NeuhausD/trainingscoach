"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Übersicht" },
  { href: "/activities", label: "Training" },
  { href: "/coach", label: "Coach" },
  { href: "/progress", label: "Fortschritt" },
  { href: "/sports", label: "Sportarten" },
];

/**
 * Tab-Reihe unter der Kopfzeile, auf allen Breiten. Am Handy fünf gleich
 * breite Tabs mit Unterstrich, ab `sm` Pillen. Bewusst nicht am unteren Rand:
 * dort liegt auf dem iPhone die Wischgeste zum Home-Bildschirm.
 */
export function NavLinks() {
  const pathname = usePathname();
  return (
    <ul className="grid grid-cols-5 sm:flex sm:gap-1">
      {items.map((item) => {
        const active =
          pathname === item.href ||
          pathname.startsWith(`${item.href}/`) ||
          (item.href === "/progress" && pathname.startsWith("/metrics")) ||
          (item.href === "/sports" && pathname.startsWith("/equipment"));
        return (
          <li key={item.href} className="min-w-0">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`block truncate px-1 py-2.5 text-center text-[13px] font-medium transition-colors duration-150 sm:rounded-control sm:px-3 sm:py-1.5 sm:text-sm ${
                active
                  ? "text-moss shadow-[inset_0_-3px_0_0_var(--moss)] sm:bg-moss sm:text-moss-ink sm:shadow-none"
                  : "text-stone hover:text-ink sm:hover:bg-mist/60"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
