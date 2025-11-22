import { supabase } from "@/supabase/supabaseClient";

export type FinanceCategory = "Entertainment" | "Groceries & Shopping" | "Eating Out";
export type TransactionKind = "income" | "expense";

export const CATEGORY_SPLITS: Record<FinanceCategory, number> = {
  "Entertainment": 0.14285714,
  "Groceries & Shopping": 0.57142857,
  "Eating Out": 0.28571429,
};

export type FinanceBudget = {
  id?: string;
  user_id: string;
  base_amount: number;
  month: number;
  year: number;
  entertainment_amount: number;
  groceries_shopping_amount: number;
  eating_out_amount: number;
};

export type FinanceTransaction = {
  id: string;
  user_id: string;
  payee: string;
  amount: number;
  category: FinanceCategory | "Income";
  kind: TransactionKind;
  transaction_date: string;
  notes?: string | null;
};

export type FinanceBill = {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  category: string;
  status: string;
  autopay_source?: string | null;
  days_until_due?: number;
};

export type FinanceGoal = {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  color?: string;
};

export type FinanceOverviewResponse = {
  budget: FinanceBudget;
  transactions: FinanceTransaction[];
  bills: FinanceBill[];
  goals: FinanceGoal[];
  totals: {
    income: number;
    spent: number;
    category_spend: Record<FinanceCategory, number>;
  };
  insights: Array<{
    type: "warning" | "tip" | "goal";
    message: string;
    action: string;
  }>;
};

const getMonthBounds = (month?: number, year?: number) => {
  const now = new Date();
  const targetMonth = month ?? now.getMonth() + 1;
  const targetYear = year ?? now.getFullYear();
  const start = new Date(targetYear, targetMonth - 1, 1);
  const end = new Date(targetYear, targetMonth, 1);
  return {
    month: targetMonth,
    year: targetYear,
    start: start.toISOString(),
    end: end.toISOString(),
  };
};

const summarizeTransactions = (rows: FinanceTransaction[]) => {
  const summary: Record<FinanceCategory, number> = {
    "Entertainment": 0,
    "Groceries & Shopping": 0,
    "Eating Out": 0,
  };
  let spent = 0;
  let income = 0;

  rows.forEach((row) => {
    if (row.kind === "income") {
      income += row.amount;
    } else {
      const amount = Math.abs(row.amount);
      spent += amount;
      if (row.category in summary) {
        summary[row.category as FinanceCategory] += amount;
      }
    }
  });

  return { spent, income, categories: summary };
};

const buildInsights = (
  budget: FinanceBudget | null,
  totals: ReturnType<typeof summarizeTransactions>,
  bills: FinanceBill[],
) => {
  const insights: FinanceOverviewResponse["insights"] = [];
  const baseAmount = budget?.base_amount ?? 0;
  const spent = totals.spent;

  if (baseAmount > 0) {
    const percentUsed = spent / baseAmount;
    if (percentUsed >= 0.9) {
      insights.push({
        type: "warning",
        message: "You've used 90% of this month's budget. Consider pausing non-essential spend.",
        action: "Create a guardrail",
      });
    } else if (percentUsed >= 0.75) {
      insights.push({
        type: "tip",
        message: "Spending is trending high. We can trim recurring charges automatically.",
        action: "Review subscriptions",
      });
    }
  }

  if (budget) {
    (Object.keys(CATEGORY_SPLITS) as FinanceCategory[]).forEach((category) => {
      const planKey = `${category.toLowerCase().replace(/ & /g, "_").replace(/\s+/g, "_")}_amount` as keyof FinanceBudget;
      const allocated = Number(budget[planKey]) || 0;
      const actual = totals.categories[category] || 0;
      if (allocated > 0 && actual > allocated * 1.15) {
        const percentOver = Math.round(((actual / allocated) - 1) * 100);
        insights.push({
          type: "warning",
          message: `${category} is ${percentOver}% over the plan.`,
          action: "Adjust allocation",
        });
      }
    });
  }

  const dueSoon = bills.filter((bill) => (bill.days_until_due ?? 99) <= 3);
  if (dueSoon.length) {
    insights.push({
      type: "goal",
      message: `${dueSoon.length} bill(s) due within 3 days. Glow can auto-schedule them.`,
      action: "Enable autopay",
    });
  }

  if (!insights.length) {
    insights.push({
      type: "goal",
      message: "All systems nominal. You're pacing on budget and bills.",
      action: "Optimize cash cushion",
    });
  }

  return insights;
};

export const fetchFinanceOverview = async (userId: string, month?: number, year?: number) => {
  const bounds = getMonthBounds(month, year);
  const today = new Date().toISOString().split("T")[0]!;

  const [{ data: budgetRows, error: budgetError }, { data: txRows, error: txError }] =
    await Promise.all([
      supabase
        .from("finance_budgets")
        .select("*")
        .eq("user_id", userId)
        .eq("month", bounds.month)
        .eq("year", bounds.year)
        .limit(1),
      supabase
        .from("finance_transactions")
        .select("*")
        .eq("user_id", userId)
        .gte("transaction_date", bounds.start)
        .lt("transaction_date", bounds.end)
        .order("transaction_date", { ascending: false }),
    ]);

  if (budgetError) throw budgetError;
  if (txError) throw txError;

  const budget = (budgetRows?.[0] as FinanceBudget | undefined) ?? null;
  const transactions = (txRows as FinanceTransaction[]) || [];

  const [{ data: billsRows, error: billsError }, { data: goalsRows, error: goalsError }] =
    await Promise.all([
      supabase
        .from("finance_bills")
        .select("*")
        .eq("user_id", userId)
        .gte("due_date", today)
        .order("due_date", { ascending: true }),
      supabase
        .from("finance_goals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true }),
    ]);

  if (billsError) throw billsError;
  if (goalsError) throw goalsError;

  const bills = (billsRows as FinanceBill[])?.map((bill) => {
    const daysUntil =
      Math.ceil(
        (new Date(bill.due_date).getTime() - new Date().setHours(0, 0, 0, 0)) /
          (1000 * 60 * 60 * 24),
      ) || 0;
    return { ...bill, days_until_due: daysUntil };
  }) ?? [];

  const goals = (goalsRows as FinanceGoal[]) || [];
  const totals = summarizeTransactions(transactions);

  const resolvedBudget =
    budget ??
    {
      user_id: userId,
      base_amount: 0,
      month: bounds.month,
      year: bounds.year,
      entertainment_amount: 0,
      groceries_shopping_amount: 0,
      eating_out_amount: 0,
    };

  return {
    budget: resolvedBudget,
    transactions,
    bills,
    goals,
    totals: {
      income: totals.income,
      spent: totals.spent,
      category_spend: totals.categories,
    },
    insights: buildInsights(budget, totals, bills),
  };
};

export const saveBudget = async (userId: string, amount: number, month?: number, year?: number) => {
  const bounds = getMonthBounds(month, year);
  const splits = (Object.keys(CATEGORY_SPLITS) as FinanceCategory[]).reduce(
    (acc, category) => {
      const key = `${category.toLowerCase().replace(/ & /g, "_").replace(/\s+/g, "_")}_amount`;
      return { ...acc, [key]: Number((amount * CATEGORY_SPLITS[category]).toFixed(2)) };
    },
    {} as Record<string, number>,
  );

  const payload = {
    user_id: userId,
    base_amount: amount,
    month: bounds.month,
    year: bounds.year,
    ...splits,
  };

  const { error } = await supabase
    .from("finance_budgets")
    .upsert(payload, { onConflict: "user_id,month,year" });
  if (error) throw error;
  return payload;
};

export type TransactionPayload = {
  user_id: string;
  payee: string;
  amount: number;
  category: FinanceCategory | "Income";
  kind: TransactionKind;
  transaction_date: string;
  notes?: string;
};

export const createTransaction = async (payload: TransactionPayload) => {
  const { error, data } = await supabase.from("finance_transactions").insert(payload).select().single();
  if (error) throw error;
  return data as FinanceTransaction;
};

export type BillPayload = {
  user_id: string;
  name: string;
  amount: number;
  due_date: string;
  category?: string;
  autopay_source?: string;
  status?: string;
};

export const createBill = async (payload: BillPayload) => {
  const { error, data } = await supabase.from("finance_bills").insert(payload).select().single();
  if (error) throw error;
  return data as FinanceBill;
};

export type GoalPayload = {
  user_id: string;
  name: string;
  target_amount: number;
  current_amount?: number;
  color?: string;
};

export const createGoal = async (payload: GoalPayload) => {
  const { error, data } = await supabase.from("finance_goals").insert(payload).select().single();
  if (error) throw error;
  return data as FinanceGoal;
};

export const updateGoal = async (goalId: string, payload: Partial<GoalPayload>) => {
  const { error, data } = await supabase
    .from("finance_goals")
    .update(payload)
    .eq("id", goalId)
    .select()
    .single();
  if (error) throw error;
  return data as FinanceGoal;
};
