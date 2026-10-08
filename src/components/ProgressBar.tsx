export function ProgressBar({ value, max, color }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = value > max;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-border">
      <div
        className={`h-full rounded-full ${over ? "bg-expense" : ""}`}
        style={{ width: `${pct}%`, backgroundColor: over ? undefined : (color ?? "var(--accent)") }}
      />
    </div>
  );
}
