import { Suspense } from "react";
import { BottomNav, NavBar } from "@/components/BottomNav";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 pt-[max(1rem,env(safe-area-inset-top))] pb-28">
        {children}
      </main>
      <Suspense fallback={<NavBar pathname="" />}>
        <BottomNav />
      </Suspense>
    </>
  );
}
