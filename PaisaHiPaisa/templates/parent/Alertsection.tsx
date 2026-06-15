import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useApp } from "@/context/AppContext";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import { relativeTime } from "@/lib/format";
import { cn } from "@/lib/utils";

const ICONS = {
  info: Info,
  warning: AlertTriangle,
  danger: ShieldAlert,
};

const STYLES = {
  info: "bg-primary/10 text-primary border-primary/20",
  warning: "bg-warning/10 text-warning border-warning/30",
  danger: "bg-destructive/10 text-destructive border-destructive/30",
};

export const AlertsSection = () => {
  const { alerts } = useApp();
  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" /> Alerts & Disputes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No alerts. Everything looks good.
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => {
              const Icon = ICONS[a.severity];
              return (
                <li
                  key={a.id}
                  className={cn("flex items-start gap-2 rounded-lg border p-3 text-sm", STYLES[a.severity])}
                >
                  <Icon className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium">{a.message}</p>
                    <p className="text-xs opacity-75">{relativeTime(a.timestamp)}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};
