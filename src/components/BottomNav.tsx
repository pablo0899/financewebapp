"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/movimientos", label: "Movimientos", icon: "📋" },
  { href: "/cuentas", label: "Cuentas", icon: "💳" },
  { href: "/presupuestos", label: "Presupuestos", icon: "🎯" },
] as const;

/** Navegación inferior con la pestaña activa según la URL. */
export function BottomNav() {
  return <NavBar pathname={usePathname()} />;
}

/**
 * La barra en sí. En rutas dinámicas la URL solo se conoce al pedir la página,
 * así que el layout la muestra sin pestaña activa (pathname="") mientras carga.
 */
export function NavBar({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-center px-1">
        {TABS.slice(0, 2).map((tab) => (
          <Tab key={tab.href} {...tab} active={isActive(pathname, tab.href)} />
        ))}
        <Link
          href="/movimientos/nuevo"
          aria-label="Nuevo movimiento"
          className="-mt-6 flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-3xl text-white shadow-lg"
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
      className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[11px] ${active ? "text-accent font-medium" : "text-muted"}`}
    >
      <span className="text-xl">{icon}</span>
      {label}
    </Link>
  );
}
