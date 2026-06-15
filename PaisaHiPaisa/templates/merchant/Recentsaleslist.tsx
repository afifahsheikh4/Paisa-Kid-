import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatPKR, maskStudentId, relativeTime } from "@/lib/format";
import { Receipt } from "lucide-react";

export const RecentSalesList = ({ merchantName }: { merchantName: string }) => {
  const { transactions } = useApp();
  const sales = transactions.filter((t) => t.merchant === merchantName);

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Recent Sales
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sales.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No sales yet. Process a payment to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {sales.map((s) => (
              <div
                key={s.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-sm">{maskStudentId(s.studentId)}</p>
                    <StatusBadge status={s.status} />
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {s.item} · {relativeTime(s.timestamp)}
                  </p>
                </div>
                <span className="font-semibold tabular-nums shrink-0">{formatPKR(s.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
