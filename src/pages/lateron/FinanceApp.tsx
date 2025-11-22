import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  FormEvent,
  ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Receipt,
  CreditCard,
  PiggyBank,
  Target,
  Calendar,
  Bell,
  Plus,
  X,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Clock,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
  Sparkles,
  Brain,
} from "lucide-react";
import { supabase } from "@/supabase/supabaseClient";
import {
  CATEGORY_SPLITS,
  fetchFinanceOverview,
  saveBudget,
  createTransaction,
  createBill,
  createGoal,
  updateGoal,
} from "@/services/finance";
import { toast } from "sonner";
import { HexColorPicker } from "react-colorful";
import type {
  FinanceCategory,
  FinanceGoal,
  FinanceOverviewResponse,
  FinanceTransaction,
  TransactionKind,
} from "@/services/finance";

const DEFAULT_CATEGORY_COLORS: Record<FinanceCategory, string> = {
  Entertainment: "#a855f7",
  "Groceries & Shopping": "#3b82f6",
  "Eating Out": "#ef4444",
};

const BILL_CATEGORY_OPTIONS = [
  "Housing",
  "Utilities",
  "Insurance",
  "Entertainment",
  "Other",
];

const AUTOPAY_SOURCES = ["Glow Checking", "Glow Savings", "Visa 1234"];

const expenseCategories = Object.keys(CATEGORY_SPLITS) as FinanceCategory[];

const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const modalContentVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 24 },
  visible: { opacity: 1, scale: 1, y: 0 },
};

type GoalModalState = { mode: "create" | "update"; goal?: FinanceGoal };

const nowDateString = () => new Date().toISOString().split("T")[0];

const createTransactionForm = () => ({
  payee: "",
  amount: "",
  category: expenseCategories[0],
  kind: "expense" as TransactionKind,
  date: nowDateString(),
  notes: "",
});

const createBillForm = () => ({
  name: "",
  amount: "",
  dueDate: nowDateString(),
  category: BILL_CATEGORY_OPTIONS[0],
  autopaySource: AUTOPAY_SOURCES[0],
});

const createGoalForm = () => ({
  name: "",
  target: "",
  current: "",
  color: "#22c55e",
});

type PlannerIncome = { id: string; source: string; amount: string };
type PlannerBill = {
  id: string;
  name: string;
  amount: string;
  dueDate: string;
  category: string;
};

const plannerIncomeRow = (): PlannerIncome => ({
  id: Math.random().toString(36).slice(2, 9),
  source: "",
  amount: "",
});

const plannerBillRow = (): PlannerBill => ({
  id: Math.random().toString(36).slice(2, 9),
  name: "",
  amount: "",
  dueDate: nowDateString(),
  category: BILL_CATEGORY_OPTIONS[0],
});

export default function MoneyCopilot() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showAddBill, setShowAddBill] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [overview, setOverview] = useState<FinanceOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [budgetInput, setBudgetInput] = useState("");
  const [isSavingBudget, setIsSavingBudget] = useState(false);

  const [transactionForm, setTransactionForm] = useState(createTransactionForm);
  const [transactionSubmitting, setTransactionSubmitting] = useState(false);

  const [billForm, setBillForm] = useState(createBillForm);
  const [billSubmitting, setBillSubmitting] = useState(false);

  const [goalModal, setGoalModal] = useState<GoalModalState | null>(null);
  const [goalForm, setGoalForm] = useState(createGoalForm);
  const [goalSubmitting, setGoalSubmitting] = useState(false);
  const [categoryModal, setCategoryModal] = useState<FinanceCategory | null>(null);

  const [showBudgetPlanner, setShowBudgetPlanner] = useState(false);
  const [plannerStep, setPlannerStep] = useState<1 | 2 | 3>(1);
  const [plannerIncomes, setPlannerIncomes] = useState<PlannerIncome[]>([plannerIncomeRow()]);
  const [plannerBills, setPlannerBills] = useState<PlannerBill[]>([plannerBillRow()]);
  const [plannerSaving, setPlannerSaving] = useState(false);

  const [theme, setTheme] = useState({
    primary: "#0f172a",
    accent: "#14b8a6",
    surface: "#ffffff",
    surfaceAlt: "#f8fafc",
    ringBackground: "#e5e7eb",
  });
  const [showThemeEditor, setShowThemeEditor] = useState(false);
  const [categoryColors, setCategoryColors] =
    useState<Record<FinanceCategory, string>>(DEFAULT_CATEGORY_COLORS);
  const anyModalOpen =
    showAddTransaction ||
    showAddBill ||
    showAIInsights ||
    Boolean(goalModal) ||
    showBudgetPlanner ||
    Boolean(categoryModal);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = anyModalOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [anyModalOpen]);

  const openTransactionModal = (category?: FinanceCategory) => {
    setTransactionForm((prev) => ({
      ...prev,
      kind: category ? "expense" : prev.kind,
      category: category ?? prev.category,
    }));
    setShowAddTransaction(true);
    if (category) {
      setCategoryModal(null);
    }
  };

  const handleCategoryModalOpen = (category: FinanceCategory) => {
    setCategoryModal(category);
  };

  const handleCategoryModalClose = () => setCategoryModal(null);

  const resetPlanner = () => {
    setPlannerStep(1);
    setPlannerIncomes([plannerIncomeRow()]);
    setPlannerBills([plannerBillRow()]);
  };

  const openBudgetPlannerModal = () => {
    resetPlanner();
    setShowBudgetPlanner(true);
  };

  const closeBudgetPlannerModal = () => {
    setShowBudgetPlanner(false);
    setPlannerSaving(false);
    resetPlanner();
  };

  const handlePlannerIncomeChange = (
    id: string,
    field: keyof PlannerIncome,
    value: string,
  ) => {
    setPlannerIncomes((prev) =>
      prev.map((income) => (income.id === id ? { ...income, [field]: value } : income)),
    );
  };

  const addPlannerIncomeRow = () => {
    setPlannerIncomes((prev) => [...prev, plannerIncomeRow()]);
  };

  const removePlannerIncomeRow = (id: string) => {
    setPlannerIncomes((prev) => (prev.length === 1 ? prev : prev.filter((income) => income.id !== id)));
  };

  const handlePlannerBillChange = (id: string, field: keyof PlannerBill, value: string) => {
    setPlannerBills((prev) =>
      prev.map((bill) => (bill.id === id ? { ...bill, [field]: value } : bill)),
    );
  };

  const addPlannerBillRow = () => {
    setPlannerBills((prev) => [...prev, plannerBillRow()]);
  };

  const removePlannerBillRow = (id: string) => {
    setPlannerBills((prev) => (prev.length === 1 ? prev : prev.filter((bill) => bill.id !== id)));
  };

  const refreshOverview = useCallback(
    async (targetUserId: string, opts?: { showSpinner?: boolean }) => {
      if (!targetUserId) return;
      if (opts?.showSpinner) {
        setLoading(true);
      } else {
        setIsSyncing(true);
      }
      try {
        const response = await fetchFinanceOverview(targetUserId);
        setOverview(response);
        setError(null);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load financial overview",
        );
      } finally {
        if (opts?.showSpinner) {
          setLoading(false);
        } else {
          setIsSyncing(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const { data, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        const id = data?.user?.id ?? "demo-user";
        if (!mounted) return;
        setUserId(id);
        await refreshOverview(id, { showSpinner: true });
      } catch (err) {
        console.error(err);
        if (mounted) {
          setUserId("demo-user");
          await refreshOverview("demo-user", { showSpinner: true });
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshOverview]);

  const monthlyBudget = overview?.budget?.base_amount ?? 0;
  const spent = overview?.totals?.spent ?? 0;
  const income = overview?.totals?.income ?? 0;
  const remaining = Math.max(monthlyBudget - spent, 0);
  const spentPercentage = monthlyBudget
    ? Math.min((spent / monthlyBudget) * 100, 100)
    : 0;

  const transactions = overview?.transactions ?? [];
  const upcomingBills = overview?.bills ?? [];

  const savingsGoals = useMemo(
    () =>
      (overview?.goals ?? []).map((goal) => ({
        ...goal,
        target: goal.target_amount,
        current: goal.current_amount,
        color: goal.color ?? "#22c55e",
      })),
    [overview?.goals],
  );

  const aiInsights = overview?.insights ?? [];

  const categorySpending = useMemo(() => {
    const totals = overview?.totals?.category_spend ?? {};
    return expenseCategories.map((category) => {
      const amount = totals[category] ?? 0;
      const percentage = spent ? Math.round((amount / spent) * 100) : 0;
      return {
        name: category,
        amount,
        color: categoryColors[category],
        percentage,
      };
    });
  }, [overview?.totals?.category_spend, spent, categoryColors]);

  const splitPreview = useMemo(() => {
    const parsed = parseFloat(budgetInput);
    const base = !Number.isNaN(parsed) && parsed > 0 ? parsed : monthlyBudget;
    return expenseCategories.map((category) => ({
      name: category,
      amount: Number((base * CATEGORY_SPLITS[category]).toFixed(2)),
    }));
  }, [budgetInput, monthlyBudget]);

  const splitPreviewRecord = useMemo(() => {
    return splitPreview.reduce((acc, item) => {
      acc[item.name as FinanceCategory] = item.amount;
      return acc;
    }, {} as Record<FinanceCategory, number>);
  }, [splitPreview]);

  const allocatedBudget = useMemo(() => {
    if (!overview?.budget) {
      return expenseCategories.reduce(
        (acc, category) => ({ ...acc, [category]: 0 }),
        {} as Record<FinanceCategory, number>,
      );
    }
    return {
      Entertainment: overview.budget.entertainment_amount,
      "Groceries & Shopping": overview.budget.groceries_shopping_amount,
      "Eating Out": overview.budget.eating_out_amount,
    };
  }, [overview?.budget]);

  const categoryMetrics = useMemo(() => {
    return expenseCategories.reduce((acc, category) => {
      const allocated = allocatedBudget[category] ?? 0;
      const spentInCategory = overview?.totals?.category_spend?.[category] ?? 0;
      const remainingCategory = Math.max(allocated - spentInCategory, 0);
      const plannedAmount = splitPreviewRecord[category] ?? allocated;
      const progress = allocated ? Math.min(spentInCategory / allocated, 1) : 0;
      acc[category] = {
        allocated,
        spent: spentInCategory,
        remaining: remainingCategory,
        planned: plannedAmount,
        progress,
      };
      return acc;
    }, {} as Record<FinanceCategory, { allocated: number; spent: number; remaining: number; planned: number; progress: number }>);
  }, [allocatedBudget, overview?.totals?.category_spend, splitPreviewRecord]);

  const plannerTotals = useMemo(() => {
    const incomeTotal = plannerIncomes.reduce(
      (sum, income) => sum + (parseFloat(income.amount) || 0),
      0,
    );
    const billTotal = plannerBills.reduce(
      (sum, bill) => sum + (parseFloat(bill.amount) || 0),
      0,
    );
    const remainder = Math.max(incomeTotal - billTotal, 0);
    const split = expenseCategories.reduce((acc, category) => {
      acc[category] = Number(
        (remainder * CATEGORY_SPLITS[category]).toFixed(2),
      );
      return acc;
    }, {} as Record<FinanceCategory, number>);
    return { incomeTotal, billTotal, remainder, split };
  }, [plannerIncomes, plannerBills]);

  const categoryTransactions = useMemo<FinanceTransaction[]>(() => {
    if (!categoryModal || !overview) return [];
    return overview.transactions.filter(
      (transaction) =>
        transaction.kind !== "income" &&
        transaction.category === categoryModal,
    );
  }, [categoryModal, overview]);

  const activeCategorySummary = categoryModal ? categoryMetrics[categoryModal] : null;

  const handleBudgetSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    const amount = parseFloat(budgetInput);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Enter a positive monthly amount");
      return;
    }
    setIsSavingBudget(true);
    try {
      await saveBudget(userId, amount);
      setBudgetInput("");
      await refreshOverview(userId);
      toast.success("Monthly budget updated");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to save monthly budget",
      );
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleTransactionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    const amount = parseFloat(transactionForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Enter a valid transaction amount");
      return;
    }
    setTransactionSubmitting(true);
    try {
      await createTransaction({
        user_id: userId,
        payee: transactionForm.payee,
        amount,
        category:
          transactionForm.kind === "income"
            ? "Income"
            : (transactionForm.category as FinanceCategory),
        kind: transactionForm.kind,
        transaction_date: new Date(transactionForm.date).toISOString(),
        notes: transactionForm.notes || undefined,
      });
      setTransactionForm(createTransactionForm());
      setShowAddTransaction(false);
      await refreshOverview(userId);
      toast.success("Transaction saved");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error ? err.message : "Failed to add transaction",
      );
    } finally {
      setTransactionSubmitting(false);
    }
  };

  const handleBillSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    const amount = parseFloat(billForm.amount);
    if (Number.isNaN(amount) || amount <= 0) {
      setError("Enter a valid bill amount");
      return;
    }
    setBillSubmitting(true);
    try {
      await createBill({
        user_id: userId,
        name: billForm.name,
        amount,
        due_date: billForm.dueDate,
        category: billForm.category,
        autopay_source: billForm.autopaySource,
      });
      setBillForm(createBillForm());
      setShowAddBill(false);
      await refreshOverview(userId);
      toast.success("Bill scheduled");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to add bill");
    } finally {
      setBillSubmitting(false);
    }
  };

  const handleGoalSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !goalModal) return;
    const target = parseFloat(goalForm.target);
    const current = parseFloat(goalForm.current || "0");
    if (Number.isNaN(target) || target <= 0) {
      setError("Enter a valid target amount");
      return;
    }

    setGoalSubmitting(true);
    try {
      if (goalModal.mode === "create") {
        await createGoal({
          user_id: userId,
          name: goalForm.name,
          target_amount: target,
          current_amount: Number.isNaN(current) ? 0 : current,
          color: goalForm.color,
        });
      } else if (goalModal.goal) {
        await updateGoal(goalModal.goal.id, {
          name: goalForm.name,
          target_amount: target,
          current_amount: Number.isNaN(current) ? 0 : current,
          color: goalForm.color,
        });
      }
      setGoalModal(null);
      setGoalForm(createGoalForm());
      await refreshOverview(userId);
      toast.success(
        goalModal.mode === "create" ? "Goal added" : "Goal updated",
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Failed to save goal");
    } finally {
      setGoalSubmitting(false);
    }
  };

  const handleBudgetPlannerNext = () => {
    setPlannerStep((prev) => (prev < 3 ? ((prev + 1) as 1 | 2 | 3) : prev));
  };

  const handleBudgetPlannerBack = () => {
    setPlannerStep((prev) => (prev > 1 ? ((prev - 1) as 1 | 2 | 3) : prev));
  };

  const handleBudgetPlannerSave = async () => {
    if (!userId) return;
    setPlannerSaving(true);
    try {
      const validIncomes = plannerIncomes.filter(
        (income) =>
          income.source.trim() && !Number.isNaN(parseFloat(income.amount)) && parseFloat(income.amount) > 0,
      );
      const validBills = plannerBills.filter(
        (bill) =>
          bill.name.trim() && !Number.isNaN(parseFloat(bill.amount)) && parseFloat(bill.amount) > 0,
      );

      const incomePromises = validIncomes.map((income) =>
        createTransaction({
          user_id: userId,
          payee: income.source,
          amount: parseFloat(income.amount),
          category: "Income",
          kind: "income",
          transaction_date: new Date().toISOString(),
        }),
      );

      const billPromises = validBills.map((bill) =>
        createBill({
          user_id: userId,
          name: bill.name,
          amount: parseFloat(bill.amount),
          due_date: bill.dueDate,
          category: bill.category,
          status: "upcoming",
        }),
      );

      const now = new Date();
      const budgetAmount = Math.max(plannerTotals.remainder, 0);

      await Promise.all([
        ...incomePromises,
        ...billPromises,
        saveBudget(userId, budgetAmount, now.getMonth() + 1, now.getFullYear()),
      ]);

      await refreshOverview(userId);
      closeBudgetPlannerModal();
      toast.success("Budget planner applied");
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to apply budget planner results",
      );
    } finally {
      setPlannerSaving(false);
    }
  };

  const openGoalModal = (mode: "create" | "update", goal?: FinanceGoal) => {
    setGoalModal({ mode, goal });
    setGoalForm({
      name: goal?.name ?? "",
      target: goal ? String(goal.target_amount) : "",
      current: goal ? String(goal.current_amount) : "",
      color: goal?.color ?? "#22c55e",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafafa] text-sm text-gray-500">
        Loading your Money Copilot...
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: theme.surfaceAlt, color: theme.primary }}
    >
      <div
        className="border-b border-gray-200"
        style={{ backgroundColor: theme.surface }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg"
              style={{
                background: `linear-gradient(135deg, ${theme.accent}, ${theme.primary})`,
              }}
            >
              <DollarSign className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Money Copilot</h1>
              <p className="text-xs text-gray-500">
                Powered by Glow finance stack
              </p>
            </div>
          </div>
            <div className="flex items-center gap-3">
              {isSyncing && (
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="h-3.5 w-3.5" />
                  Syncing live data...
                </div>
              )}
              <button
                onClick={() => setShowAIInsights(true)}
              className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50"
            >
              <Brain className="h-4 w-4" />
              AI Insights
            </button>
              <button className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-gray-100">
                <Bell className="h-4 w-4" />
              </button>
              <button
                onClick={() => setShowThemeEditor(true)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-1.5 text-sm transition-colors hover:bg-gray-50"
              >
                <Sparkles className="h-4 w-4" />
                Personalize
              </button>
            </div>
          </div>
        </div>

      <div className="border-b border-gray-200" style={{ backgroundColor: theme.surface }}>
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex gap-1">
            {["overview", "transactions", "bills", "savings", "insights"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`relative px-4 py-2.5 text-sm font-medium capitalize transition-colors ${
                    activeTab === tab
                      ? "text-black"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {tab}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-black"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-auto mt-4 max-w-4xl rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {error}
        </div>
      )}

      <div className="mx-auto max-w-7xl px-6 py-8">
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <SummaryCard
                  title="Total Income"
                  value={income}
                  icon={<TrendingUp className="h-5 w-5 text-emerald-600" />}
                  accent="bg-emerald-50"
                  background={theme.surface}
                  textColor={theme.primary}
                />
                <SummaryCard
                  title="Total Spent"
                  value={spent}
                  icon={<TrendingDown className="h-5 w-5 text-red-600" />}
                  accent="bg-red-50"
                  background={theme.surface}
                  textColor={theme.primary}
                />
                <SummaryCard
                  title="Remaining Budget"
                  value={remaining}
                  icon={<PiggyBank className="h-5 w-5 text-blue-600" />}
                  accent="bg-blue-50"
                  background={theme.surface}
                  textColor={theme.primary}
                />
              </div>

              <div
                className="rounded-2xl border border-gray-200 p-6"
                style={{ backgroundColor: theme.surface }}
              >
                <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h3 className="font-semibold">Monthly Budget</h3>
                    <div className="text-sm text-gray-500">
                      {spentPercentage.toFixed(0)}% used
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <form
                      onSubmit={handleBudgetSubmit}
                      className="flex flex-col gap-2 sm:flex-row sm:items-center"
                    >
                      <input
                        type="number"
                        min="0"
                        placeholder="Update budget (USD)"
                        value={budgetInput}
                        onChange={(event) => setBudgetInput(event.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none sm:w-48"
                      />
                      <button
                        type="submit"
                        disabled={isSavingBudget}
                        className="flex items-center justify-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
                      >
                        {isSavingBudget ? "Saving..." : "Recalculate Split"}
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={openBudgetPlannerModal}
                      className="w-full rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300 sm:w-auto"
                    >
                      Budget Planner
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="h-3 rounded-full bg-gray-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${spentPercentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full rounded-full"
                      style={{
                        backgroundColor:
                          spentPercentage > 90
                            ? "#ef4444"
                            : spentPercentage > 75
                            ? "#f59e0b"
                            : theme.accent,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Spent: ${spent.toLocaleString()}</span>
                    <span>Budget: ${monthlyBudget.toLocaleString()}</span>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  {expenseCategories.map((category) => {
                    const metric = categoryMetrics[category];
                    const leftToSpend = Math.max(metric.allocated - metric.spent, 0);
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategoryModalOpen(category)}
                        className="group rounded-2xl border border-gray-100 p-4 text-left transition hover:border-gray-300"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative h-14 w-14">
                            <div
                              className="h-14 w-14 rounded-full border border-gray-100"
                              style={{
                                background: `conic-gradient(${categoryColors[category]} ${metric.progress * 100}%, ${theme.ringBackground} 0)`,
                              }}
                            />
                            <div className="absolute inset-2 flex items-center justify-center rounded-full bg-white text-xs font-semibold text-gray-600">
                              {Math.round(metric.progress * 100)}%
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm font-semibold">
                              <span>{category}</span>
                              <ChevronRight className="h-4 w-4 text-gray-400 transition group-hover:translate-x-1" />
                            </div>
                            <p className="text-xs text-gray-500">
                              Spent ${metric.spent.toFixed(2)} / ${metric.allocated.toFixed(2)}
                            </p>
                            <p className="text-xs font-medium text-gray-700">
                              Left to spend: ${leftToSpend.toFixed(2)}
                            </p>
                            {budgetInput && (
                              <p className="text-[11px] text-emerald-600">
                                Planned: ${metric.planned.toFixed(2)}
                              </p>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <CardWithButton
                  title="Recent Transactions"
                  buttonLabel="Add"
                  onButtonClick={() => openTransactionModal()}
                  background={theme.surface}
                >
                  <div className="space-y-3">
                    {transactions.slice(0, 5).map((transaction) => {
                      const isIncome = transaction.kind === "income";
                      return (
                        <div
                          key={transaction.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50"
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              isIncome ? "bg-emerald-50" : "bg-gray-100"
                            }`}
                          >
                            {isIncome ? (
                              <ArrowDownRight className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <ArrowUpRight className="h-5 w-5 text-gray-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {transaction.payee}
                            </p>
                            <p className="text-xs text-gray-500">
                              {transaction.category} •{" "}
                              {new Date(transaction.transaction_date).toLocaleDateString()}
                            </p>
                          </div>
                          <p
                            className={`text-sm font-semibold ${
                              isIncome ? "text-emerald-600" : "text-gray-900"
                            }`}
                          >
                            {isIncome ? "+" : "-"}$
                            {transaction.amount.toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className="mt-4 w-full py-2 text-sm text-gray-600 transition-colors hover:text-black"
                  >
                    View all transactions
                  </button>
                </CardWithButton>

                <CardWithButton
                  title="Upcoming Bills"
                  buttonLabel="Add"
                  onButtonClick={() => setShowAddBill(true)}
                  background={theme.surface}
                >
                  <div className="space-y-3">
                    {upcomingBills.map((bill) => {
                      const daysUntil =
                        bill.days_until_due ??
                        bill.daysUntil ??
                        Math.max(
                          0,
                          Math.floor(
                            (new Date(bill.due_date).getTime() -
                              Date.now()) /
                              (1000 * 60 * 60 * 24),
                          ),
                        );
                      return (
                        <div
                          key={bill.id}
                          className="flex cursor-pointer items-center gap-3 rounded-xl p-3 transition-colors hover:bg-gray-50"
                        >
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                              daysUntil <= 3 ? "bg-amber-50" : "bg-gray-100"
                            }`}
                          >
                            <Receipt
                              className={`h-5 w-5 ${
                                daysUntil <= 3
                                  ? "text-amber-600"
                                  : "text-gray-600"
                              }`}
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                              {bill.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Due {new Date(bill.due_date).toLocaleDateString()} •{" "}
                              {daysUntil} days
                            </p>
                          </div>
                          <p className="text-sm font-semibold">
                            ${bill.amount.toFixed(2)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => setActiveTab("bills")}
                    className="mt-4 w-full py-2 text-sm text-gray-600 transition-colors hover:text-black"
                  >
                    View all bills
                  </button>
                </CardWithButton>
              </div>

              <div
                className="rounded-2xl border border-gray-200 p-6"
                style={{ backgroundColor: theme.surface }}
              >
                <h3 className="mb-4 font-semibold">Spending by Category</h3>
                <div className="space-y-4">
                  {categorySpending.map((category) => (
                    <div key={category.name}>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">
                          {category.name}
                        </span>
                        <span className="text-sm text-gray-600">
                          ${category.amount.toFixed(2)} ({category.percentage}
                          %)
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${category.percentage}%` }}
                          transition={{ duration: 0.8, ease: "easeOut" }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: category.color }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div
                className="rounded-2xl border border-gray-200 p-6"
                style={{ backgroundColor: theme.surface }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-semibold">Savings Goals</h3>
                  <button
                    onClick={() => openGoalModal("create")}
                    className="flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-black"
                  >
                    <Plus className="h-4 w-4" />
                    Add Goal
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  {savingsGoals.map((goal) => {
                    const progress =
                      goal.target > 0
                        ? Math.min((goal.current / goal.target) * 100, 100)
                        : 0;
                    return (
                      <div
                        key={goal.id}
                        className="cursor-pointer rounded-xl border border-gray-200 p-4 transition-colors hover:border-gray-300"
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <div
                            className="flex h-8 w-8 items-center justify-center rounded-lg"
                            style={{ backgroundColor: `${goal.color}20` }}
                          >
                            <Target
                              className="h-4 w-4"
                              style={{ color: goal.color }}
                            />
                          </div>
                          <span className="text-xs text-gray-500">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <h4 className="mb-1 text-sm font-medium">
                          {goal.name}
                        </h4>
                        <p className="mb-3 text-xs text-gray-500">
                          ${goal.current.toLocaleString()} of $
                          {goal.target.toLocaleString()}
                        </p>
                        <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-gray-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: goal.color }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openGoalModal("update", goal)}
                            className="flex-1 rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
                          >
                            Add Money
                          </button>
                          <button
                            onClick={() => openGoalModal("update", goal)}
                            className="rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "transactions" && (
            <motion.div
              key="transactions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-2xl border border-gray-200 p-6 shadow-sm"
              style={{ backgroundColor: theme.surface }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">All Transactions</h2>
                <button
                  onClick={() => openTransactionModal()}
                  className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Transaction
                </button>
              </div>
              <div className="space-y-2">
                {transactions.map((transaction) => {
                  const isIncome = transaction.kind === "income";
                  return (
                    <div
                      key={transaction.id}
                      className="flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-gray-50"
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          isIncome ? "bg-emerald-50" : "bg-gray-100"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownRight className="h-6 w-6 text-emerald-600" />
                        ) : (
                          <ArrowUpRight className="h-6 w-6 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{transaction.payee}</p>
                        <p className="text-sm text-gray-500">
                          {transaction.category} •{" "}
                          {new Date(transaction.transaction_date).toLocaleString()}
                        </p>
                      </div>
                      <p
                        className={`text-lg font-semibold ${
                          isIncome ? "text-emerald-600" : "text-gray-900"
                        }`}
                      >
                        {isIncome ? "+" : "-"}$
                        {transaction.amount.toFixed(2)}
                      </p>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === "bills" && (
            <motion.div
              key="bills"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-2xl border border-gray-200 p-6"
              style={{ backgroundColor: theme.surface }}
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-xl font-semibold">Bills & Subscriptions</h2>
                <button
                  onClick={() => setShowAddBill(true)}
                  className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800"
                >
                  <Plus className="h-4 w-4" />
                  Add Bill
                </button>
              </div>
              <div className="space-y-2">
                {upcomingBills.map((bill) => {
                  const daysUntil =
                    bill.days_until_due ??
                    Math.max(
                      0,
                      Math.floor(
                        (new Date(bill.due_date).getTime() - Date.now()) /
                          (1000 * 60 * 60 * 24),
                      ),
                    );
                  return (
                    <div
                      key={bill.id}
                      className="flex items-center gap-4 rounded-xl p-4 transition-colors hover:bg-gray-50"
                    >
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                          daysUntil <= 3 ? "bg-amber-50" : "bg-gray-100"
                        }`}
                      >
                        <Receipt
                          className={`h-6 w-6 ${
                            daysUntil <= 3
                              ? "text-amber-600"
                              : "text-gray-600"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{bill.name}</p>
                        <p className="text-sm text-gray-500">
                          {bill.category} • Due{" "}
                          {new Date(bill.due_date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-semibold">
                          ${bill.amount.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {daysUntil} days
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === "savings" && (
            <motion.div
              key="savings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div
                className="rounded-2xl border border-gray-200 p-6"
                style={{ backgroundColor: theme.surface }}
              >
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Savings Goals</h2>
                  <button
                    onClick={() => openGoalModal("create")}
                    className="flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm text-white transition-colors hover:bg-gray-800"
                  >
                    <Plus className="h-4 w-4" />
                    New Goal
                  </button>
                </div>
                <div className="space-y-4">
                  {savingsGoals.map((goal) => {
                    const progress =
                      goal.target > 0
                        ? Math.min((goal.current / goal.target) * 100, 100)
                        : 0;
                    return (
                      <div
                        key={goal.id}
                        className="rounded-xl border border-gray-200 p-6 transition-colors hover:border-gray-300"
                        style={{ backgroundColor: theme.surfaceAlt }}
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-xl"
                              style={{ backgroundColor: `${goal.color}20` }}
                            >
                              <Target
                                className="h-6 w-6"
                                style={{ color: goal.color }}
                              />
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold">
                                {goal.name}
                              </h3>
                              <p className="text-sm text-gray-500">
                                ${goal.current.toLocaleString()} of $
                                {goal.target.toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <span className="text-lg font-semibold">
                            {progress.toFixed(0)}%
                          </span>
                        </div>
                        <div className="mb-4 h-3 overflow-hidden rounded-full bg-gray-100">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: goal.color }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openGoalModal("update", goal)}
                            className="flex-1 rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
                          >
                            Add Money
                          </button>
                          <button
                            onClick={() => openGoalModal("update", goal)}
                            className="rounded-lg bg-gray-50 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-100"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "insights" && (
            <motion.div
              key="insights"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-purple-50 to-blue-50 p-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">
                      AI-Powered Insights
                    </h2>
                    <p className="text-sm text-gray-600">
                      Smart recommendations based on your spending patterns
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                {aiInsights.map((insight, index) => (
                  <div
                    key={`${insight.type}-${index}`}
                    className="rounded-2xl border border-gray-200 p-6 transition-colors hover:border-gray-300"
                    style={{ backgroundColor: theme.surface }}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl ${
                          insight.type === "warning"
                            ? "bg-amber-50"
                            : insight.type === "tip"
                            ? "bg-blue-50"
                            : "bg-emerald-50"
                        }`}
                      >
                        {insight.type === "warning" ? (
                          <AlertCircle className="h-5 w-5 text-amber-600" />
                        ) : insight.type === "tip" ? (
                          <Zap className="h-5 w-5 text-blue-500" />
                        ) : (
                          <CheckCircle className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold leading-relaxed">
                              {insight.message}
                            </p>
                            <p className="text-xs text-gray-500">
                              Generated by Glow Copilot
                            </p>
                          </div>
                          <button
                            type="button"
                            className="text-gray-400 transition-colors hover:text-gray-600"
                          >
                            <MoreHorizontal className="h-5 w-5" />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowAIInsights(true)}
                          className="flex items-center gap-1 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                        >
                          {insight.action}
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showThemeEditor && (
          <ModalCard
            title="Personalize Money Copilot"
            description="Update colors instantly"
            icon={<Sparkles className="h-5 w-5 text-amber-500" />}
            onClose={() => setShowThemeEditor(false)}
          >
            <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-2">
              <div className="grid gap-4 md:grid-cols-2">
                {[
                  { key: "primary", label: "Primary" },
                  { key: "accent", label: "Accent" },
                  { key: "surface", label: "Surface" },
                  { key: "surfaceAlt", label: "Surface Alt" },
                  { key: "ringBackground", label: "Ring Background" },
                ].map((option) => (
                  <label key={option.key} className="block text-sm font-medium text-gray-700">
                    <span>{option.label}</span>
                    <div className="mt-2 flex flex-col gap-3 rounded-xl border border-gray-100 p-3">
                      <div
                        className="h-10 w-10 rounded-full border border-gray-200"
                        style={{ backgroundColor: theme[option.key as keyof typeof theme] }}
                      />
                      <HexColorPicker
                        color={theme[option.key as keyof typeof theme]}
                        style={{ width: "160px", height: "120px" }}
                        onChange={(color) =>
                          setTheme((prev) => ({ ...prev, [option.key]: color }))
                        }
                      />
                    </div>
                  </label>
                ))}
              </div>
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Category colors
                </p>
                <div className="grid gap-4 md:grid-cols-2">
                  {expenseCategories.map((category) => (
                    <div
                      key={category}
                      className="rounded-xl border border-gray-100 p-3"
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div
                          className="h-6 w-6 rounded-full border border-gray-200"
                          style={{ backgroundColor: categoryColors[category] }}
                        />
                        <span className="text-sm font-semibold text-gray-700">
                          {category}
                        </span>
                      </div>
                      <HexColorPicker
                        color={categoryColors[category]}
                        style={{ width: "160px", height: "120px" }}
                        onChange={(color) =>
                          setCategoryColors((prev) => ({
                            ...prev,
                            [category]: color,
                          }))
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ModalCard>
        )}

        {showAddTransaction && (
          <ModalCard
            title="Add transaction"
            description="Track new spending or income instantly"
            icon={<CreditCard className="h-5 w-5 text-emerald-600" />}
            onClose={() => setShowAddTransaction(false)}
          >
            <form className="space-y-4" onSubmit={handleTransactionSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  Payee
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    placeholder="e.g. Whole Foods"
                    value={transactionForm.payee}
                    onChange={(event) =>
                      setTransactionForm((prev) => ({
                        ...prev,
                        payee: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Amount
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    placeholder="0.00"
                    value={transactionForm.amount}
                    onChange={(event) =>
                      setTransactionForm((prev) => ({
                        ...prev,
                        amount: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Date
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    value={transactionForm.date}
                    onChange={(event) =>
                      setTransactionForm((prev) => ({
                        ...prev,
                        date: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Type
                  <select
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    value={transactionForm.kind}
                    onChange={(event) =>
                      setTransactionForm((prev) => ({
                        ...prev,
                        kind: event.target.value as TransactionKind,
                      }))
                    }
                  >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                  </select>
                </label>
                {transactionForm.kind === "expense" ? (
                  <label className="text-sm font-medium text-gray-700 sm:col-span-2">
                    Category
                    <select
                      className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                      value={transactionForm.category}
                      onChange={(event) =>
                        setTransactionForm((prev) => ({
                          ...prev,
                          category: event.target.value as FinanceCategory,
                        }))
                      }
                    >
                      {expenseCategories.map((category) => (
                        <option key={category}>{category}</option>
                      ))}
                    </select>
                  </label>
                ) : (
                  <div className="sm:col-span-2 rounded-xl border border-dashed border-emerald-200 p-3 text-sm text-emerald-700">
                    Income entries are automatically categorized as Income.
                  </div>
                )}
              </div>
              <label className="text-sm font-medium text-gray-700">
                Notes
                <textarea
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  placeholder="Optional details"
                  value={transactionForm.notes}
                  onChange={(event) =>
                    setTransactionForm((prev) => ({
                      ...prev,
                      notes: event.target.value,
                    }))
                  }
                />
              </label>
              <div className="rounded-2xl border border-dashed border-gray-200 p-3 text-sm text-gray-600">
                Glow will recommend a category and split once ledger rules run.
              </div>
              <button
                type="submit"
                disabled={transactionSubmitting}
                className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
              >
                {transactionSubmitting ? "Saving..." : "Save Transaction"}
              </button>
            </form>
          </ModalCard>
        )}

        {showAddBill && (
          <ModalCard
            title="Schedule a bill"
            description="Keep due dates and autopay reminders in one place"
            icon={<Calendar className="h-5 w-5 text-amber-600" />}
            onClose={() => setShowAddBill(false)}
          >
            <form className="space-y-4" onSubmit={handleBillSubmit}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  Biller
                  <input
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    placeholder="e.g. Rent"
                    value={billForm.name}
                    onChange={(event) =>
                      setBillForm((prev) => ({ ...prev, name: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Amount
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    placeholder="0.00"
                    value={billForm.amount}
                    onChange={(event) =>
                      setBillForm((prev) => ({ ...prev, amount: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Due date
                  <input
                    type="date"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    value={billForm.dueDate}
                    onChange={(event) =>
                      setBillForm((prev) => ({
                        ...prev,
                        dueDate: event.target.value,
                      }))
                    }
                    required
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Category
                  <select
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    value={billForm.category}
                    onChange={(event) =>
                      setBillForm((prev) => ({
                        ...prev,
                        category: event.target.value,
                      }))
                    }
                  >
                    {BILL_CATEGORY_OPTIONS.map((option) => (
                      <option key={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="text-sm font-medium text-gray-700">
                Autopay source
                <select
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  value={billForm.autopaySource}
                  onChange={(event) =>
                    setBillForm((prev) => ({
                      ...prev,
                      autopaySource: event.target.value,
                    }))
                  }
                >
                  {AUTOPAY_SOURCES.map((option) => (
                    <option key={option}>{option}</option>
                  ))}
                </select>
              </label>
              <div className="rounded-2xl bg-gray-50 p-4 text-sm text-gray-600">
                <div className="flex items-center gap-2 font-medium text-gray-700">
                  <Clock className="h-4 w-4 text-amber-600" />
                  Reminder cadence
                </div>
                <p className="mt-2">
                  Glow will notify you 3 days before the due date and again on the
                  morning of.
                </p>
              </div>
              <button
                type="submit"
                disabled={billSubmitting}
                className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
              >
                {billSubmitting ? "Saving..." : "Save Bill"}
              </button>
            </form>
          </ModalCard>
        )}

        {showAIInsights && (
          <ModalCard
            title="Glow Copilot Insights"
            description="Personalized guidance generated from your recent activity"
            icon={<Brain className="h-5 w-5 text-purple-600" />}
            onClose={() => setShowAIInsights(false)}
          >
            <div className="space-y-4">
              {aiInsights.map((insight, index) => (
                <div
                  key={`${insight.type}-${index}`}
                  className="rounded-2xl border border-gray-200 p-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">{insight.message}</p>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        insight.type === "warning"
                          ? "bg-amber-50 text-amber-700"
                          : insight.type === "tip"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {insight.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-600">
                    {insight.action} can be automated via Glow Scripts.
                  </p>
                  <button
                    type="button"
                    className="mt-3 flex items-center gap-1 text-sm font-medium text-emerald-600 transition-colors hover:text-emerald-700"
                  >
                    {insight.action}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="rounded-2xl bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <Clock className="h-4 w-4 text-purple-600" />
                  Weekly digest
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Receive a concise summary of spend, cash flow, and goal progress
                  each Friday.
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-gray-800"
                  >
                    Enable digest
                  </button>
                  <button
                    type="button"
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:border-gray-300"
                    onClick={() => setShowAIInsights(false)}
                  >
                    Maybe later
                  </button>
                </div>
              </div>
            </div>
          </ModalCard>
        )}

        {showBudgetPlanner && (
          <ModalCard
            title="Monthly Budget Planner"
            description="Capture income and bills, then let Glow split the remainder"
            icon={<PiggyBank className="h-5 w-5 text-purple-600" />}
            onClose={closeBudgetPlannerModal}
          >
            <div className="space-y-6">
              {plannerStep === 1 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    List every income source you expect this month.
                  </p>
                  <div className="space-y-3">
                    {plannerIncomes.map((income, index) => (
                      <div
                        key={income.id}
                        className="grid gap-3 sm:grid-cols-[1fr_130px_auto]"
                      >
                        <input
                          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                          placeholder="Income source"
                          value={income.source}
                          onChange={(event) =>
                            handlePlannerIncomeChange(income.id, "source", event.target.value)
                          }
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                          placeholder="$0.00"
                          value={income.amount}
                          onChange={(event) =>
                            handlePlannerIncomeChange(income.id, "amount", event.target.value)
                          }
                        />
                        {plannerIncomes.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePlannerIncomeRow(income.id)}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:border-gray-300"
                          >
                            Remove
                          </button>
                        )}
                        {plannerIncomes.length === 1 && index === 0 && (
                          <div className="hidden sm:block" />
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                    onClick={addPlannerIncomeRow}
                  >
                    + Add income source
                  </button>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="text-sm text-gray-500"
                      onClick={closeBudgetPlannerModal}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
                      onClick={handleBudgetPlannerNext}
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {plannerStep === 2 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Add bills or subscriptions due this month.
                  </p>
                  <div className="space-y-3">
                    {plannerBills.map((bill) => (
                      <div
                        key={bill.id}
                        className="grid gap-3 sm:grid-cols-[1fr_120px_140px_140px_auto]"
                      >
                        <input
                          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                          placeholder="Bill name"
                          value={bill.name}
                          onChange={(event) =>
                            handlePlannerBillChange(bill.id, "name", event.target.value)
                          }
                        />
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                          placeholder="$0.00"
                          value={bill.amount}
                          onChange={(event) =>
                            handlePlannerBillChange(bill.id, "amount", event.target.value)
                          }
                        />
                        <input
                          type="date"
                          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                          value={bill.dueDate}
                          onChange={(event) =>
                            handlePlannerBillChange(bill.id, "dueDate", event.target.value)
                          }
                        />
                        <select
                          className="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                          value={bill.category}
                          onChange={(event) =>
                            handlePlannerBillChange(bill.id, "category", event.target.value)
                          }
                        >
                          {BILL_CATEGORY_OPTIONS.map((option) => (
                            <option key={option}>{option}</option>
                          ))}
                        </select>
                        {plannerBills.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removePlannerBillRow(bill.id)}
                            className="rounded-xl border border-gray-200 px-3 py-2 text-sm text-gray-500 hover:border-gray-300"
                          >
                            Remove
                          </button>
                        ) : (
                          <div className="hidden sm:block" />
                        )}
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                    onClick={addPlannerBillRow}
                  >
                    + Add another bill
                  </button>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="text-sm text-gray-500"
                      onClick={handleBudgetPlannerBack}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white"
                      onClick={handleBudgetPlannerNext}
                    >
                      Continue
                    </button>
                  </div>
                </div>
              )}

              {plannerStep === 3 && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Review totals and apply the automatic split.
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <PlannerStat label="Income" value={plannerTotals.incomeTotal} accent="text-emerald-600" />
                    <PlannerStat label="Bills" value={plannerTotals.billTotal} accent="text-red-600" />
                    <PlannerStat label="Remainder" value={plannerTotals.remainder} accent="text-blue-600" />
                  </div>
                  <div className="rounded-2xl border border-gray-100 p-4">
                    <h4 className="text-sm font-semibold text-gray-700">
                      Category allocation
                    </h4>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      {expenseCategories.map((category) => (
                        <div key={category} className="rounded-xl bg-gray-50 p-3 text-sm">
                          <p className="font-semibold">{category}</p>
                          <p className="text-gray-500">
                            ${(plannerTotals.split[category] || 0).toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="text-sm text-gray-500"
                      onClick={handleBudgetPlannerBack}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={plannerSaving}
                      className="rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      onClick={handleBudgetPlannerSave}
                    >
                      {plannerSaving ? "Applying..." : "Apply budget"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </ModalCard>
        )}

        {categoryModal && activeCategorySummary && (
          <ModalCard
            title={`${categoryModal} spending`}
            description="Live transactions and remaining budget"
            icon={
              <div
                className="h-5 w-5 rounded-full"
                style={{ backgroundColor: categoryColors[categoryModal] }}
              />
            }
            onClose={handleCategoryModalClose}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3 rounded-xl bg-gray-50 p-4 text-center text-sm">
                <div>
                  <p className="text-xs text-gray-500">Allocated</p>
                  <p className="text-lg font-semibold">
                    ${activeCategorySummary.allocated.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Spent</p>
                  <p className="text-lg font-semibold">
                    ${activeCategorySummary.spent.toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Remaining</p>
                  <p className="text-lg font-semibold">
                    ${activeCategorySummary.remaining.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <p className="text-gray-600">
                  {categoryTransactions.length} transaction
                  {categoryTransactions.length === 1 ? "" : "s"}
                </p>
                <button
                  type="button"
                  className="text-emerald-600 transition hover:text-emerald-700"
                  onClick={() => openTransactionModal(categoryModal)}
                >
                  + Add transaction
                </button>
              </div>
              <PaginatedList
                items={categoryTransactions}
                renderItem={(transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-xl border border-gray-100 p-3"
                  >
                    <div className="flex items-center justify-between text-sm font-semibold">
                      <span>{transaction.payee}</span>
                      <span>${transaction.amount.toFixed(2)}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.transaction_date).toLocaleDateString()}
                      {transaction.notes ? ` • ${transaction.notes}` : ""}
                    </div>
                  </div>
                )}
                emptyPlaceholder={
                  <p className="rounded-xl border border-dashed border-gray-200 p-4 text-center text-sm text-gray-500">
                    No activity yet for this category.
                  </p>
                }
              />
            </div>
          </ModalCard>
        )}

        {goalModal && (
          <ModalCard
            title={
              goalModal.mode === "create" ? "Create savings goal" : "Edit goal"
            }
            description="Your progress syncs across Glow surfaces"
            icon={<Target className="h-5 w-5 text-emerald-600" />}
            onClose={() => setGoalModal(null)}
          >
            <form className="space-y-4" onSubmit={handleGoalSubmit}>
              <label className="text-sm font-medium text-gray-700">
                Goal name
                <input
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                  value={goalForm.name}
                  onChange={(event) =>
                    setGoalForm((prev) => ({ ...prev, name: event.target.value }))
                  }
                  required
                />
              </label>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="text-sm font-medium text-gray-700">
                  Target amount
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    value={goalForm.target}
                    onChange={(event) =>
                      setGoalForm((prev) => ({ ...prev, target: event.target.value }))
                    }
                    required
                  />
                </label>
                <label className="text-sm font-medium text-gray-700">
                  Current amount
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-black focus:outline-none"
                    value={goalForm.current}
                    onChange={(event) =>
                      setGoalForm((prev) => ({ ...prev, current: event.target.value }))
                    }
                  />
                </label>
              </div>
              <label className="text-sm font-medium text-gray-700">
                Accent color
                <input
                  type="color"
                  className="mt-1 h-12 w-full rounded-xl border border-gray-200 bg-white p-2"
                  value={goalForm.color}
                  onChange={(event) =>
                    setGoalForm((prev) => ({ ...prev, color: event.target.value }))
                  }
                />
              </label>
              <button
                type="submit"
                disabled={goalSubmitting}
                className="w-full rounded-2xl bg-black py-3 text-sm font-semibold text-white transition-colors hover:bg-gray-800 disabled:opacity-60"
              >
                {goalSubmitting ? "Saving..." : "Save Goal"}
              </button>
            </form>
          </ModalCard>
        )}
      </AnimatePresence>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon,
  accent,
  background,
  textColor,
}: {
  title: string;
  value: number;
  icon: ReactNode;
  accent: string;
  background?: string;
  textColor?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-gray-200 p-6"
      style={{ backgroundColor: background }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accent}`}>
          {icon}
        </div>
        <span className="text-xs text-gray-500">This month</span>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold" style={{ color: textColor }}>
          ${value.toLocaleString()}
        </p>
        <p className="text-sm text-gray-500">{title}</p>
      </div>
    </div>
  );
}

function CardWithButton({
  title,
  buttonLabel,
  onButtonClick,
  children,
  background,
}: {
  title: string;
  buttonLabel: string;
  onButtonClick: () => void;
  children: ReactNode;
  background?: string;
}) {
  return (
    <div
      className="rounded-2xl border border-gray-200 p-6"
      style={{ backgroundColor: background }}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold">{title}</h3>
        <button
          onClick={onButtonClick}
          className="flex items-center gap-1 text-sm text-gray-600 transition-colors hover:text-black"
        >
          <Plus className="h-4 w-4" />
          {buttonLabel}
        </button>
      </div>
      {children}
    </div>
  );
}

function PlannerStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="rounded-xl border border-gray-100 p-4 text-center">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-xl font-semibold ${accent}`}>${value.toFixed(2)}</p>
    </div>
  );
}

type ModalCardProps = {
  title: string;
  description?: string;
  icon: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

function ModalCard({ title, description, icon, onClose, children }: ModalCardProps) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
      variants={modalBackdropVariants}
      initial="hidden"
      animate="visible"
      exit="hidden"
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"
        variants={modalContentVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        transition={{ type: "spring", stiffness: 260, damping: 30 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-100">
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{title}</h3>
              {description && (
                <p className="text-sm text-gray-500">{description}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

type PaginatedListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  pageSize?: number;
  emptyPlaceholder?: ReactNode;
};

function PaginatedList<T>({
  items,
  renderItem,
  pageSize = 5,
  emptyPlaceholder,
}: PaginatedListProps<T>) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(Math.ceil(items.length / pageSize), 1);

  useEffect(() => {
    setPage(0);
  }, [items.length, pageSize]);

  if (items.length === 0 && emptyPlaceholder) {
    return <div>{emptyPlaceholder}</div>;
  }

  const start = page * pageSize;
  const visible = items.slice(start, start + pageSize);

  return (
    <div className="space-y-3">
      <div className="space-y-2">{visible.map(renderItem)}</div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-gray-500">
          <button
            type="button"
            disabled={page === 0}
            className="rounded-lg border border-gray-200 px-3 py-1 disabled:opacity-50"
            onClick={() => setPage((p) => Math.max(p - 1, 0))}
          >
            Previous
          </button>
          <span>
            Page {page + 1} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= totalPages}
            className="rounded-lg border border-gray-200 px-3 py-1 disabled:opacity-50"
            onClick={() => setPage((p) => Math.min(p + 1, totalPages - 1))}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
