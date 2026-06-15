import { Card } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { formatPKR } from "@/lib/format";
import { Wallet, TrendingDown, Gauge } from "lucide-react";

export const WalletSummaryCard = () => {
  const { balance, todaySpent, dailyLimit, childName } = useApp();
  const remaining = Math.max(0, dailyLimit - todaySpent);
  const pct = dailyLimit === 0 ? 0 : Math.min(100, (todaySpent / dailyLimit) * 100);

  return (
    <Card className="overflow-hidden border-0 shadow-card">
      <div className="bg-gradient-primary p-6 text-primary-foreground">
        <p className="text-sm opacity-90">{childName}'s Wallet</p>
        <div className="mt-1 flex items-baseline gap-2">
          <h2 className="text-4xl font-bold tracking-tight">{formatPKR(balance)}</h2>
        </div>
        <p className="mt-1 text-xs opacity-80">Current balance</p>
      </div>
      <div className="grid grid-cols-2 divide-x">
        <div className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <TrendingDown className="h-3.5 w-3.5" />
            Spent today
          </div>
          <p className="mt-1 text-xl font-semibold">{formatPKR(todaySpent)}</p>
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <Gauge className="h-3.5 w-3.5" />
            Remaining limit
          </div>
          <p className="mt-1 text-xl font-semibold">{formatPKR(remaining)}</p>
        </div>
      </div>
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
          <span>Daily spending</span>
          <span>
            {formatPKR(todaySpent)} / {formatPKR(dailyLimit)}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-gradient-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
    </Card>
  );
};
