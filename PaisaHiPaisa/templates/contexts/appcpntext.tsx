import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type TxStatus = "Success" | "Failed" | "Flagged";

export interface Transaction {
  id: string;
  studentId: string;
  merchant: string;
  item: string;
  amount: number;
  timestamp: number;
  status: TxStatus;
  failureReason?: string;
}

export interface Alert {
  id: string;
  message: string;
  timestamp: number;
  severity: "info" | "warning" | "danger";
}

export interface MerchantSummary {
  transactionsCount: number;
  totalSalesPkr: number;
  todaySalesPkr: number;
  todayCount: number;
}

interface PaymentResult {
  ok: boolean;
  message: string;
  transaction?: Transaction;
}

interface AppState {
  apiConnected: boolean;
  role: "parent" | "merchant" | "mock";
  parentName: string;
  childName: string;
  studentId: string;
  merchantName: string;
  balance: number;
  dailyLimit: number;
  todaySpent: number;
  purchasesEnabled: boolean;
  transactions: Transaction[];
  alerts: Alert[];
  merchantSummary: MerchantSummary | null;
}

interface AppContextValue extends AppState {
  topUp: (amount: number) => Promise<void>;
  setDailyLimit: (n: number) => void;
  togglePurchases: (v: boolean) => Promise<void>;
  resetDay: () => Promise<void>;
  processPayment: (input: {
    studentId: string;
    item: string;
    amount: number;
    merchant: string;
  }) => Promise<PaymentResult>;
  disputeTransaction: (id: string) => Promise<void>;
  refreshState: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

function apiBase(): string {
  try {
    const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env;
    if (env?.VITE_API_BASE) {
      const b = env.VITE_API_BASE.replace(/\/?$/, "/");
      return b.endsWith("/api/") ? b : `${b}api/`;
    }
  } catch {
    /* ignore */
  }
  return "http://127.0.0.1:8000/api/";
}

const TOKEN_KEY = "paisakid_token";

function authHeaders(): HeadersInit {
  const token = typeof localStorage !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const h: Record<string, string> = { "Content-Type": "application/json" };
  if (token) h.Authorization = `Token ${token}`;
  return h;
}

const now = Date.now();
const initialTransactions: Transaction[] = [
  {
    id: "t1",
    studentId: "S123",
    merchant: "School Canteen",
    item: "Sandwich",
    amount: 150,
    timestamp: now - 2 * 60 * 60 * 1000,
    status: "Success",
  },
  {
    id: "t2",
    studentId: "S123",
    merchant: "Stationery Shop",
    item: "Notebook",
    amount: 80,
    timestamp: now - 5 * 60 * 60 * 1000,
    status: "Success",
  },
];

export function AppProvider({ children }: { children: ReactNode }) {
  const [apiConnected, setApiConnected] = useState(false);
  const [role, setRole] = useState<AppState["role"]>("mock");
  const [balance, setBalance] = useState(800);
  const [dailyLimit, setDailyLimitState] = useState(500);
  const [todaySpent, setTodaySpent] = useState(0);
  const [purchasesEnabled, setPurchasesEnabled] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [parentName, setParentName] = useState("Sarah");
  const [childName, setChildName] = useState("Ali");
  const [studentId, setStudentId] = useState("S123");
  const [merchantName, setMerchantName] = useState("Ahmed");
  const [merchantSummary, setMerchantSummary] = useState<MerchantSummary | null>(null);

  const refreshState = useCallback(async () => {
    const base = apiBase();
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return;

    let r = await fetch(`${base}parent/state/`, { headers: authHeaders() });
    if (r.ok) {
      const d = await r.json();
      setRole("parent");
      setApiConnected(true);
      setParentName(d.parentName ?? "Parent");
      setChildName(d.childName ?? "");
      setStudentId(d.studentId ?? "");
      setBalance(d.balance ?? 0);
      setDailyLimitState(d.dailyLimit ?? 0);
      setTodaySpent(d.todaySpent ?? 0);
      setPurchasesEnabled(d.purchasesEnabled ?? true);
      setTransactions(d.transactions ?? []);
      setAlerts(d.alerts ?? []);
      setMerchantSummary(null);
      return;
    }

    r = await fetch(`${base}merchant/state/`, { headers: authHeaders() });
    if (r.ok) {
      const d = await r.json();
      setRole("merchant");
      setApiConnected(true);
      setMerchantName(d.merchantName ?? "Merchant");
      setTransactions(d.transactions ?? []);
      setMerchantSummary(d.summary ?? null);
      setAlerts([]);
      return;
    }

    setApiConnected(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setApiConnected(false);
      setRole("mock");
      return;
    }
    void refreshState();
  }, [refreshState]);

  const addAlert = useCallback((message: string, severity: Alert["severity"] = "warning") => {
    setAlerts((prev) => [
      {
        id: `a${Date.now()}${Math.random().toString(36).slice(2, 6)}`,
        message,
        timestamp: Date.now(),
        severity,
      },
      ...prev,
    ]);
  }, []);

  const topUp = useCallback(
    async (amount: number) => {
      if (amount <= 0) return;
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token || role === "mock") {
        setBalance((b) => b + amount);
        return;
      }
      const base = apiBase();
      const r = await fetch(`${base}parent/topup/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ amount: String(amount.toFixed(2)) }),
      });
      if (!r.ok) return;
      await refreshState();
    },
    [role, refreshState],
  );

  const setDailyLimit = useCallback(
    async (n: number) => {
      const v = Math.max(0, Math.min(2000, n));
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token || role === "mock") {
        setDailyLimitState(v);
        return;
      }
      const base = apiBase();
      await fetch(`${base}parent/controls/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ daily_limit_pkr: String(v.toFixed(2)) }),
      });
      await refreshState();
    },
    [role, refreshState],
  );

  const togglePurchases = useCallback(
    async (v: boolean) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token || role === "mock") {
        setPurchasesEnabled(v);
        return;
      }
      const base = apiBase();
      await fetch(`${base}parent/controls/`, {
        method: "PATCH",
        headers: authHeaders(),
        body: JSON.stringify({ purchases_enabled: v }),
      });
      await refreshState();
    },
    [role, refreshState],
  );

  const resetDay = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token || role === "mock") {
      setTodaySpent(0);
      return;
    }
    const base = apiBase();
    await fetch(`${base}parent/reset-day/`, { method: "POST", headers: authHeaders() });
    await refreshState();
  }, [role, refreshState]);

  const processPayment = useCallback(
    async ({
      studentId: sid,
      item,
      amount,
      merchant,
    }: {
      studentId: string;
      item: string;
      amount: number;
      merchant: string;
    }): Promise<PaymentResult> => {
      const token = localStorage.getItem(TOKEN_KEY);
      const useMerchantApi = Boolean(token && role === "merchant");
      if (!useMerchantApi) {
        /* mock behaviour (matches previous client-side rules) */
        const fail = (reason: string): PaymentResult => {
          const tx: Transaction = {
            id: `t${Date.now()}`,
            studentId: sid || "—",
            merchant,
            item: item || "—",
            amount,
            timestamp: Date.now(),
            status: "Failed",
            failureReason: reason,
          };
          setTransactions((prev) => [tx, ...prev]);
          return { ok: false, message: reason, transaction: tx };
        };

        if (!/^S\d{3}$/.test(sid.trim())) return fail("Invalid student ID");
        if (!item.trim()) return fail("Item name required");
        if (!Number.isFinite(amount) || amount <= 0) return fail("Invalid amount");
        if (!purchasesEnabled) return fail("Payments disabled by parent");
        if (todaySpent + amount > dailyLimit) return fail("Daily limit exceeded");
        if (amount > balance) return fail("Insufficient balance");

        const tx: Transaction = {
          id: `t${Date.now()}`,
          studentId: sid.trim(),
          merchant,
          item: item.trim(),
          amount,
          timestamp: Date.now(),
          status: "Success",
        };

        setBalance((b) => b - amount);
        setTodaySpent((s) => s + amount);
        setTransactions((prev) => {
          const next = [tx, ...prev];
          const recent = next.filter(
            (t) => t.status === "Success" && Date.now() - t.timestamp < 60_000,
          );
          if (recent.length >= 3) {
            addAlert("Multiple rapid transactions detected – review activity.", "danger");
          }
          return next;
        });

        return {
          ok: true,
          message: `Payment approved – PKR ${amount} deducted from student.`,
          transaction: tx,
        };
      }

      const base = apiBase();
      const r = await fetch(`${base}merchant/payment/`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          student_id: sid,
          item,
          amount: String(amount.toFixed(2)),
          merchant,
        }),
      });
      const data = await r.json().catch(() => ({}));
      await refreshState();
      if (data.transaction) {
        const t = data.transaction as Transaction;
        return {
          ok: !!data.ok,
          message: data.message ?? "",
          transaction: t,
        };
      }
      return {
        ok: !!data.ok,
        message: data.message ?? "Payment failed",
        transaction: undefined,
      };
    },
    [role, purchasesEnabled, todaySpent, dailyLimit, balance, addAlert, refreshState],
  );

  const disputeTransaction = useCallback(
    async (id: string) => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (!token || role === "mock") {
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...t, status: "Flagged" as TxStatus } : t)),
        );
        addAlert(`Transaction #${id.slice(-4)} disputed – review required.`, "warning");
        return;
      }
      const base = apiBase();
      await fetch(`${base}parent/dispute/${id}/`, { method: "POST", headers: authHeaders() });
      await refreshState();
    },
    [role, addAlert, refreshState],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      apiConnected,
      role,
      parentName,
      childName,
      studentId,
      merchantName,
      balance,
      dailyLimit,
      todaySpent,
      purchasesEnabled,
      transactions,
      alerts,
      merchantSummary,
      topUp,
      setDailyLimit,
      togglePurchases,
      resetDay,
      processPayment,
      disputeTransaction,
      refreshState,
    }),
    [
      apiConnected,
      role,
      parentName,
      childName,
      studentId,
      merchantName,
      balance,
      dailyLimit,
      todaySpent,
      purchasesEnabled,
      transactions,
      alerts,
      merchantSummary,
      topUp,
      setDailyLimit,
      togglePurchases,
      resetDay,
      processPayment,
      disputeTransaction,
      refreshState,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
