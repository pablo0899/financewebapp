import "server-only";
import { monthRange } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";

/** Metas con su saldo acumulado, total ahorrado y lo ahorrado (neto) en `month`. */
export async function getSavings(month: string) {
  const { supabase } = await requireUser();
  const [goals, movements] = await Promise.all([
    supabase.from("savings_goals").select("*").order("created_at"),
    supabase
      .from("savings_movements")
      .select("*, goal:savings_goals(name, icon)")
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (goals.error) throw goals.error;
  if (movements.error) throw movements.error;

  const { start, end } = monthRange(month);
  const balances = new Map<string, number>();
  let savedThisMonth = 0;
  for (const m of movements.data) {
    const amount = Number(m.amount);
    balances.set(m.goal_id, (balances.get(m.goal_id) ?? 0) + amount);
    if (m.occurred_on >= start && m.occurred_on < end) savedThisMonth += amount;
  }

  const goalsWithBalance = goals.data.map((goal) => ({
    goal,
    balance: balances.get(goal.id) ?? 0,
    target: goal.target === null ? null : Number(goal.target),
  }));

  return {
    goals: goalsWithBalance,
    total: goalsWithBalance.reduce((s, g) => s + g.balance, 0),
    savedThisMonth,
    recent: movements.data.slice(0, 10),
  };
}

/** Solo lo ahorrado (neto) en el mes, para el resumen del inicio. */
export async function getMonthSavings(month: string) {
  const { supabase } = await requireUser();
  const { start, end } = monthRange(month);
  const { data, error } = await supabase
    .from("savings_movements")
    .select("amount")
    .gte("occurred_on", start)
    .lt("occurred_on", end);
  if (error) throw error;
  return data.reduce((s, m) => s + Number(m.amount), 0);
}

export type GoalWithBalance = Awaited<ReturnType<typeof getSavings>>["goals"][number];
export type SavingsMovementWithGoal = Awaited<ReturnType<typeof getSavings>>["recent"][number];
