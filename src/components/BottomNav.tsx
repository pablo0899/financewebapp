"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/movimientos", label: "Movimientos", icon: "📋" },
  { href: "/presupuestos", label: "Presupuestos", icon: "🎯" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {TABS.slice(0, 2).map((tab) => (
          <Tab key={tab.href} {...tab} active={isActive(pathname, tab.href)} />
        ))}
        <Link
          href="/movimientos/nuevo"
          aria-label="Nuevo movimiento"
          className="-mt-6 flex size-14 items-center justify-center rounded-full bg-accent text-3xl text-white shadow-lg"
        >
          +
        </Link>
        {TABS.slice(2).map((tab) => (
          <Tab key={tab.href} {...tab} active={isActive(pathname, tab.href)} />
        ))}
      </div>
    </nav>
  );
}

function isActive(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href) && pathname !== "/movimientos/nuevo";
}

function Tab({ href, label, icon, active }: { href: string; label: string; icon: string; active: boolean }) {
  return (
    <Link
      href={href}
      className={`flex w-24 flex-col items-center gap-0.5 py-2 text-xs ${active ? "text-accent font-medium" : "text-muted"}`}
    >
      <span className="text-xl">{icon}</span>
      {label}
    </Link>
  );
}
