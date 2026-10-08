import { Donut } from "@/components/Donut";
import { ConfirmButton } from "@/components/ConfirmButton";
import { formatMoney } from "@/lib/format";
import { deleteGoal } from "../actions";
import type { GoalWithBalance } from "../queries";
import { SavingsMovementForm } from "./SavingsMovementForm";

export function GoalCard({ goal, balance, target, defaultDate }: GoalWithBalance & { defaultDate: string }) {
  const reached = target !== null && balance >= target;

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-surface p-4">
      <div className="flex items-center gap-4">
        {target !== null ? (
          <Donut
            value={balance}
            max={target}
            color={goal.color}
            alertOnOverflow={false}
            label={`${goal.name}: ${formatMoney(balance)} de ${formatMoney(target)}`}
          >
            <span className="text-2xl">{goal.icon}</span>
            <span className="text-sm font-semibold tabular-nums">{Math.min(100, Math.round((balance / target) * 100))}%</span>
          </Donut>
        ) : (
          <span
            className="flex size-14 shrink-0 items-center justify-center rounded-full text-3xl"
            style={{ backgroundColor: `${goal.color}22` }}
          >
            {goal.icon}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{goal.name}</p>
          <p className="text-xl font-semibold tabular-nums">{formatMoney(balance)}</p>
          {target !== null && (
            <p className="text-sm tabular-nums text-muted">
              {reached ? "✓ ¡Meta alcanzada!" : `Faltan ${formatMoney(target - balance)} de ${formatMoney(target)}`}
            </p>
          )}
        </div>
        <form action={deleteGoal.bind(null, goal.id)}>
          <ConfirmButton message={`¿Borrar la meta "${goal.name}" y todo su historial?`} label={`Borrar meta ${goal.name}`} />
        </form>
      </div>
      <SavingsMovementForm goalId={goal.id} defaultDate={defaultDate} />
    </li>
  );
}
