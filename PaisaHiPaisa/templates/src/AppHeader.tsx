import { Link, useLocation } from "react-router-dom";
import { Wallet, Store, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  subtitle: string;
  icon?: "parent" | "merchant";
}

export const AppHeader = ({ subtitle, icon = "parent" }: Props) => {
  const { pathname } = useLocation();
  const Icon = icon === "parent" ? Wallet : Store;
  return (
    <header className="border-b bg-card/80 backdrop-blur sticky top-0 z-40">
      <div className="container flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-card">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">PaisaKid</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Icon className="h-3 w-3" />
              {subtitle}
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-1 rounded-full bg-muted p-1">
          <Link
            to="/parent"
            className={cn(
              "px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors",
              pathname === "/parent" || pathname === "/"
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Parent
          </Link>
          <Link
            to="/merchant"
            className={cn(
              "px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-colors",
              pathname === "/merchant"
                ? "bg-card text-foreground shadow-soft"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Merchant
          </Link>
        </nav>
      </div>
    </header>
  );
};
