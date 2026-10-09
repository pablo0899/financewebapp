import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/supabase/server";
import type { CategoryKind } from "@/lib/supabase/database.types";

export const getCategories = cache(async (kind?: CategoryKind) => {
  const { supabase } = await requireUser();
  let query = supabase.from("categories").select("*").order("name");
  if (kind) query = query.eq("kind", kind);
  const { data, error } = await query;
  if (error) throw error;
  return data;
});
