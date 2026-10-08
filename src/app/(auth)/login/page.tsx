import { LoginForm } from "@/features/auth/components/LoginForm";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center gap-6 px-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-accent text-3xl font-bold text-white">
          $
        </div>
        <h1 className="text-2xl font-semibold">Mis finanzas</h1>
        <p className="text-muted">Entra con tu correo, sin contraseña.</p>
      </div>
      <LoginForm />
    </main>
  );
}
