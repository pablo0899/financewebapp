"use client";

import type { ReactNode } from "react";

/**
 * Botón de envío que pide confirmación antes de mandar el formulario.
 * Por defecto es un ✕; con `children` muestra ese contenido.
 */
export function ConfirmButton({
  message,
  label,
  children = "✕",
  className = "px-1 text-muted",
}: {
  message: string;
  label: string;
  children?: ReactNode;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
