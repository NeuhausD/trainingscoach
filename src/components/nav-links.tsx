"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Übersicht" },
  { href: "/sports", label: "Sportarten" },
  { href: "/equipment", label: "Geräte" },
];

export function NavLinks({ bottom = false }: { bottom?: boolean }) {
  const pathname = usePathname();
  return (
    <ul className={bottom ? "grid grid-cols-3" : "flex gap-1"}>
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href} className="min-w-0">
            <Link
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={
                bottom
                  ? `block truncate px-2 py-3 text-center text-sm font-medium transition-colors duration-150 ${
                      active ? "text-moss shadow-[inset_0_3px_0_0_var(--moss)]" : "text-stone hover:text-ink"
                    }`
                  : `block rounded-control px-3 py-1.5 text-sm font-medium transition-colors duration-150 ${
                      active ? "bg-moss text-moss-ink" : "text-stone hover:bg-mist/60 hover:text-ink"
                    }`
              }
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
