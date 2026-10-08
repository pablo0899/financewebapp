"use client";

/** Botón ✕ de envío que pide confirmación antes de mandar el formulario. */
export function ConfirmButton({ message, label }: { message: string; label: string }) {
  return (
    <button
      aria-label={label}
      className="px-1 text-muted"
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      ✕
    </button>
  );
}
