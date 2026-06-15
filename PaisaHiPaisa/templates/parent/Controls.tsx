import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useApp } from "@/context/AppContext";
import { toast } from "sonner";
import { Plus, RotateCcw } from "lucide-react";
import { formatPKR } from "@/lib/format";

export const Controls = () => {
  const { dailyLimit, setDailyLimit, purchasesEnabled, togglePurchases, topUp, resetDay } = useApp();
  const [amount, setAmount] = useState("");

  const handleTopUp = () => {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("Enter a valid amount");
      return;
    }
    if (n > 100000) {
      toast.error("Maximum top-up is PKR 100,000");
      return;
    }
    topUp(n);
    toast.success(`Added ${formatPKR(n)} to wallet`);
    setAmount("");
  };

  return (
    <Card className="shadow-soft">
      <CardHeader>
        <CardTitle className="text-base">Wallet Controls</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="topup">Top-up wallet (PKR)</Label>
          <div className="flex gap-2">
            <Input
              id="topup"
              type="number"
              inputMode="numeric"
              placeholder="500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              max={100000}
            />
            <Button onClick={handleTopUp} className="shrink-0">
              <Plus className="h-4 w-4 mr-1" /> Add Funds
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Daily spending limit</Label>
            <span className="text-sm font-semibold tabular-nums">{formatPKR(dailyLimit)}</span>
          </div>
          <Slider
            value={[dailyLimit]}
            onValueChange={(v) => setDailyLimit(v[0])}
            min={0}
            max={2000}
            step={50}
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>PKR 0</span>
            <span>PKR 2,000</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-lg border p-3">
          <div>
            <Label htmlFor="enable" className="text-sm font-medium">
              Enable purchases
            </Label>
            <p className="text-xs text-muted-foreground">
              {purchasesEnabled ? "Merchants can charge the wallet" : "All payments will be blocked"}
            </p>
          </div>
          <Switch id="enable" checked={purchasesEnabled} onCheckedChange={togglePurchases} />
        </div>

        <Button variant="outline" size="sm" onClick={resetDay} className="w-full">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Reset Day (demo)
        </Button>
      </CardContent>
    </Card>
  );
};
