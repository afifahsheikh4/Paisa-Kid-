import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { formatPKR } from "@/lib/format";
import { BarChart3, CalendarDays } from "lucide-react";

export const SalesSummaryCard = ({ merchantName }: { merchantName: string }) => {
  const { merchantSummary, transactions, role } = useApp();

  const todayFromTx =
    merchantSummary ??
    (() => {
      const todayKey = new Date().toDateString();
      const sales = transactions.filter(
        (t) =>
          t.merchant === merchantName &&
          t.status === "Success" &&
          new Date(t.timestamp).toDateString() === todayKey,
      );
      const sum = sales.reduce((a, t) => a + t.amount, 0);
      return {
        transactionsCount: transactions.filter((t) => t.merchant === merchantName && t.status === "Success")
          .length,
        totalSalesPkr: transactions
          .filter((t) => t.merchant === merchantName && t.status === "Success")
          .reduce((a, t) => a + t.amount, 0),
        todaySalesPkr: sum,
        todayCount: sales.length,
      };
    })();

  return (
    <Card className="shadow-soft overflow-hidden border-0">
      <div className="bg-gradient-primary p-5 text-primary-foreground">
        <p className="text-sm opacity-90">{merchantName}</p>
        <div className="mt-2 flex items-baseline gap-2">
          <h2 className="text-3xl font-bold tracking-tight">{formatPKR(todayFromTx.todaySalesPkr)}</h2>
        </div>
        <p className="mt-1 text-xs opacity-80">Sales today ({todayFromTx.todayCount} payments)</p>
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" /> Overview
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg border p-3">
          <div className="flex items-center gap-1 text-muted-foreground text-xs">
            <CalendarDays className="h-3.5 w-3.5" /> All-time net sales
          </div>
          <p className="mt-1 font-semibold tabular-nums">{formatPKR(todayFromTx.totalSalesPkr)}</p>
          <p className="text-xs text-muted-foreground">{todayFromTx.transactionsCount} successful tx</p>
        </div>
        <div className="rounded-lg border p-3">
          <div className="text-muted-foreground text-xs">Connection</div>
          <p className="mt-1 font-medium">{role === "merchant" ? "API (merchant token)" : "Offline demo"}</p>
        </div>
      </CardContent>
    </Card>
  );
};
