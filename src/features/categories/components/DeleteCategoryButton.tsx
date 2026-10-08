import { ConfirmButton } from "@/components/ConfirmButton";
import { deleteCategory } from "../actions";

export function DeleteCategoryButton({ id, name }: { id: string; name: string }) {
  return (
    <form action={deleteCategory.bind(null, id)}>
      <ConfirmButton
        message={`¿Borrar la categoría "${name}"? Sus movimientos se conservan como "Sin categoría".`}
        label={`Borrar categoría ${name}`}
      />
    </form>
  );
}
