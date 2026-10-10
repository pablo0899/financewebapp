import { Suspense } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Skeleton } from "@/components/Skeleton";
import { deleteBizCategory, deleteBizChannel, toggleBizItem, updateBizItemPrice } from "@/features/business/actions";
import { BizCategoryForm, ChannelForm, ItemForm } from "@/features/business/components/CatalogForms";
import { NoBusiness } from "@/features/business/components/NoBusiness";
import { getBizLookups, getBusiness } from "@/features/business/queries";

export default function CatalogoPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Catálogo</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Catalogo />
      </Suspense>
    </>
  );
}

async function Catalogo() {
  const biz = await getBusiness();
  if (!biz) return <NoBusiness />;
  const { items, categories, channels } = await getBizLookups(biz.id);

  return (
    <>
      <section className="flex flex-col gap-3 rounded-xl bg-surface p-4">
        <h2 className="font-medium">Artículos</h2>
        <p className="-mt-2 text-sm text-muted">El precio sugerido se usa para llenar el monto al registrar una venta.</p>
        <ul className="flex flex-col divide-y divide-border">
          {items.map((i) => (
            <li key={i.id} className={`flex items-center gap-2 py-2 ${i.active ? "" : "opacity-50"}`}>
              <span className="text-xl">{i.icon}</span>
              <span className="min-w-0 flex-1 truncate">{i.name}</span>
              <form action={updateBizItemPrice} className="flex items-center gap-1">
                <input type="hidden" name="id" value={i.id} />
                <input
                  name="price"
                  inputMode="decimal"
                  defaultValue={i.price ?? ""}
                  placeholder="Precio"
                  aria-label={`Precio de ${i.name}`}
                  className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-right tabular-nums outline-none focus:border-accent"
                />
                <button className="text-sm text-accent">OK</button>
              </form>
              <form action={toggleBizItem.bind(null, i.id, !i.active)}>
                <button className="text-xs text-muted" aria-label={i.active ? `Ocultar ${i.name}` : `Activar ${i.name}`}>
                  {i.active ? "Ocultar" : "Activar"}
                </button>
              </form>
            </li>
          ))}
        </ul>
        <ItemForm />
      </section>

      <section className="flex flex-col gap-3 rounded-xl bg-surface p-4">
        <h2 className="font-medium">Categorías de gasto</h2>
        <ul className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center gap-1 rounded-full border border-border py-1 pr-1 pl-3 text-sm">
              {c.icon} {c.name}
              <form action={deleteBizCategory.bind(null, c.id)}>
                <ConfirmButton message={`¿Borrar la categoría "${c.name}"? Sus gastos quedan sin categoría.`} label={`Borrar ${c.name}`} />
              </form>
            </li>
          ))}
        </ul>
        <BizCategoryForm />
      </section>

      <section className="flex flex-col gap-3 rounded-xl bg-surface p-4">
        <h2 className="font-medium">Canales de venta</h2>
        <ul className="flex flex-wrap gap-2">
          {channels.map((c) => (
            <li key={c.id} className="flex items-center gap-1 rounded-full border border-border py-1 pr-1 pl-3 text-sm">
              {c.name}
              <form action={deleteBizChannel.bind(null, c.id)}>
                <ConfirmButton message={`¿Borrar el canal "${c.name}"? Sus ventas quedan sin canal.`} label={`Borrar ${c.name}`} />
              </form>
            </li>
          ))}
        </ul>
        <ChannelForm />
      </section>
    </>
  );
}
