import { Suspense } from "react";
import { SectionSwitcher } from "@/components/SectionSwitcher";
import { allowedSections } from "@/lib/access";
import { createClient } from "@/lib/supabase/server";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
      <Suspense fallback={<div className="h-9" />}>
        <Switcher />
      </Suspense>
      {children}
    </main>
  );
}

/** El selector Personal / Prismatix solo aparece si el usuario tiene ambas secciones. */
async function Switcher() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (allowedSections(data?.claims).length < 2) return null;
  return <SectionSwitcher />;
}
