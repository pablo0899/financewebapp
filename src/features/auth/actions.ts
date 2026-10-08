"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { step: "email" | "code"; email?: string; error?: string };

// Login sin contraseña con código de 6 dígitos por correo. Se usa código en
// vez de magic link porque en iOS el link abre Safari y no la PWA instalada.
export async function login(prev: LoginState, formData: FormData): Promise<LoginState> {
  return formData.has("token") ? verifyCode(prev, formData) : sendCode(prev, formData);
}

async function sendCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!email.includes("@")) return { step: "email", error: "Correo inválido." };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) return { step: "email", email, error: error.message };
  return { step: "code", email };
}

async function verifyCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "");
  const token = String(formData.get("token") ?? "").trim();

  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: "email" });
  if (error) return { step: "code", email, error: "Código incorrecto o expirado." };
  redirect("/");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
