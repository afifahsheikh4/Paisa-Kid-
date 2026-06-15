import { TxStatus } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export const StatusBadge = ({ status }: { status: TxStatus }) => {
  const styles: Record<TxStatus, string> = {
    Success: "bg-success/15 text-success border-success/30",
    Failed: "bg-destructive/15 text-destructive border-destructive/30",
    Flagged: "bg-warning/15 text-warning border-warning/40",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[status],
      )}
    >
      {status}
    </span>
  );
};