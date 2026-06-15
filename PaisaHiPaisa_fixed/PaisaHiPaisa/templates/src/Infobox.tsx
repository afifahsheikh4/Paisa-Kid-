import { ShieldCheck } from "lucide-react";
import { ReactNode } from "react";

export const InfoBox = ({ children }: { children: ReactNode }) => (
  <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-primary">
    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
    <div className="space-y-1">{children}</div>
  </div>
);
