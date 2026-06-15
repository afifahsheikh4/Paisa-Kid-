import { useState } from "react";
import { Transaction, useApp } from "@/context/AppContext";
import { StatusBadge } from "@/components/common/StatusBadge";
import { formatPKR, relativeTime } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ChevronDown, Flag } from "lucide-react";
import { cn } from "@/lib/utils";

export const TransactionCard = ({ tx }: { tx: Transaction }) => {
  const [open, setOpen] = useState(false);
  const { disputeTransaction } = useApp();

  return (
    <div className="rounded-lg border bg-card transition-colors hover:bg-muted/30">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between p-3 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium truncate">{tx.merchant}</p>
            <StatusBadge status={tx.status} />
          </div>
          <p className="text-sm text-muted-foreground truncate">
            {tx.item} · {relativeTime(tx.timestamp)}
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className={cn(
              "font-semibold tabular-nums",
              tx.status === "Success" ? "text-foreground" : "text-muted-foreground",
            )}
          >
            −{formatPKR(tx.amount)}
          </span>
          <ChevronDown
            className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-180")}
          />
        </div>
      </button>
      {open && (
        <div className="border-t px-3 py-3 space-y-2 text-sm">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-muted-foreground">Transaction ID</p>
              <p className="font-mono">{tx.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Student ID</p>
              <p className="font-mono">{tx.studentId}</p>
            </div>
            <div className="col-span-2">
              <p className="text-muted-foreground">Timestamp</p>
              <p>{new Date(tx.timestamp).toLocaleString()}</p>
            </div>
            {tx.failureReason && (
              <div className="col-span-2">
                <p className="text-muted-foreground">Reason</p>
                <p className="text-destructive">{tx.failureReason}</p>
              </div>
            )}
          </div>
          {tx.status !== "Flagged" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => void disputeTransaction(tx.id)}
              className="w-full"
            >
              <Flag className="h-3.5 w-3.5 mr-1.5" /> Dispute transaction
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
