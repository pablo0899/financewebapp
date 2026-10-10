import { Suspense } from "react";
import { BottomNav, NavBar, type NavTab } from "@/components/BottomNav";

const TABS: NavTab[] = [
  { href: "/", label: "Inicio", icon: "🏠" },
  { href: "/movimientos", label: "Movimientos", icon: "📋" },
  { href: "/cuentas", label: "Cuentas", icon: "💳" },
  { href: "/presupuestos", label: "Presupuestos", icon: "🎯" },
];
const FAB = { fabHref: "/movimientos/nuevo", fabLabel: "Nuevo movimiento" };

export default function PersonalLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {children}
      <Suspense fallback={<NavBar tabs={TABS} {...FAB} pathname="" />}>
        <BottomNav tabs={TABS} {...FAB} />
      </Suspense>
    </>
  );
}
