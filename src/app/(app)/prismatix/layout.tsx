import { Suspense } from "react";
import { BottomNav, NavBar, type NavTab } from "@/components/BottomNav";

const TABS: NavTab[] = [
  { href: "/prismatix", label: "Resumen", icon: "📊" },
  { href: "/prismatix/movimientos", label: "Movimientos", icon: "📋" },
  { href: "/prismatix/catalogo", label: "Catálogo", icon: "🔷" },
  { href: "/prismatix/socios", label: "Socios", icon: "🤝" },
];
const FAB = { fabHref: "/prismatix/nuevo", fabLabel: "Nuevo gasto o venta" };

export default function PrismatixLayout({ children }: LayoutProps<"/prismatix">) {
  return (
    <>
      {children}
      <Suspense fallback={<NavBar tabs={TABS} {...FAB} pathname="" />}>
        <BottomNav tabs={TABS} {...FAB} />
      </Suspense>
    </>
  );
}
