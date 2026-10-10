"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const SECTIONS = [
  { href: "/", label: "👤 Personal" },
  { href: "/prismatix", label: "🔷 Prismatix" },
] as const;

/** Cambia entre finanzas personales y las de Prismatix. */
export function SectionSwitcher() {
  return <SectionTabs pathname={usePathname()} />;
}

export function SectionTabs({ pathname }: { pathname: string }) {
  const inPrismatix = pathname.startsWith("/prismatix");
  return (
    <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1 text-sm">
      {SECTIONS.map((s) => {
        const active = s.href === "/prismatix" ? inPrismatix : pathname !== "" && !inPrismatix;
        return (
          <Link
            key={s.href}
            href={s.href}
            className={`rounded-lg py-1.5 text-center ${active ? "bg-accent font-medium text-white" : "text-muted"}`}
          >
            {s.label}
          </Link>
        );
      })}
    </div>
  );
}
