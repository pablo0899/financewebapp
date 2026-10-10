"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavTab = { href: string; label: string; icon: string };
type NavProps = { tabs: NavTab[]; fabHref: string; fabLabel: string };

/** Navegación inferior con la pestaña activa según la URL. */
export function BottomNav(props: NavProps) {
  return <NavBar {...props} pathname={usePathname()} />;
}

/**
 * La barra en sí: la mitad de las pestañas, el botón "+" al centro y el resto.
 * En rutas dinámicas la URL solo se conoce al pedir la página, así que el
 * layout la muestra sin pestaña activa (pathname="") mientras carga.
 */
export function NavBar({ tabs, fabHref, fabLabel, pathname }: NavProps & { pathname: string }) {
  const half = Math.ceil(tabs.length / 2);
  // La pestaña raíz de la sección (la de href más corto) solo se activa con su URL exacta.
  const root = tabs.reduce((a, b) => (b.href.length < a.href.length ? b : a)).href;
  const isActive = (href: string) =>
    pathname !== fabHref && (href === root ? pathname === href : pathname.startsWith(href));

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
      <div className="mx-auto flex max-w-md items-center px-1">
        {tabs.slice(0, half).map((tab) => (
          <Tab key={tab.href} {...tab} active={isActive(tab.href)} />
        ))}
        <Link
          href={fabHref}
          aria-label={fabLabel}
          className="-mt-6 flex size-14 shrink-0 items-center justify-center rounded-full bg-accent text-3xl text-white shadow-lg"
        >
          +
        </Link>
        {tabs.slice(half).map((tab) => (
          <Tab key={tab.href} {...tab} active={isActive(tab.href)} />
        ))}
      </div>
    </nav>
  );
}

function Tab({ href, label, icon, active }: NavTab & { active: boolean }) {
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
