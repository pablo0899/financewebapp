// Secciones de la app que puede usar cada usuario. Se guardan en el
// app_metadata del usuario de Supabase (solo editable desde el servidor):
//   { "sections": ["prismatix"] }  → solo ve Prismatix (ej. Ximena)
// Sin el campo, el usuario ve todo.

export type Section = "personal" | "prismatix";
const ALL: Section[] = ["personal", "prismatix"];

export function allowedSections(claims: { app_metadata?: Record<string, unknown> } | null | undefined): Section[] {
  const sections = claims?.app_metadata?.sections;
  if (!Array.isArray(sections)) return ALL;
  return ALL.filter((s) => sections.includes(s));
}

export function sectionForPath(pathname: string): Section {
  return pathname === "/prismatix" || pathname.startsWith("/prismatix/") ? "prismatix" : "personal";
}

/** Primera página de la primera sección permitida. */
export function homeFor(sections: Section[]) {
  return sections[0] === "prismatix" ? "/prismatix" : "/";
}
