import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApp } from "@/context/AppContext";
import { CheckCircle2, QrCode, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export const PaymentForm = ({ merchantName }: { merchantName: string }) => {
  const { processPayment } = useApp();
  const [studentId, setStudentId] = useState("");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await processPayment({
      studentId,
      item,
      amount: Number(amount),
      merchant: merchantName,
    });
    setFeedback({ ok: result.ok, message: result.message });
    if (result.ok) {
      setItem("");
      setAmount("");
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="text-base">Process Payment</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Student ID</Label>
            <div className="flex gap-2">
              <Input
                id="student"
                placeholder="Enter student ID or scan QR (e.g. S123)"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                maxLength={10}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => alert("QR scanner placeholder")}
                aria-label="Scan QR"
              >
                <QrCode className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="item">Item</Label>
              <Input
                id="item"
                placeholder="Sandwich"
                value={item}
                onChange={(e) => setItem(e.target.value)}
                maxLength={50}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (PKR)</Label>
              <Input
                id="amount"
                type="number"
                inputMode="numeric"
                placeholder="150"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={1}
                max={10000}
              />
            </div>
          </div>
          <Button type="submit" className="w-full bg-gradient-primary text-primary-foreground">
            Process Payment
          </Button>

          {feedback && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-lg border p-3 text-sm",
                feedback.ok
                  ? "bg-success/10 text-success border-success/30"
                  : "bg-destructive/10 text-destructive border-destructive/30",
              )}
            >
              {feedback.ok ? (
                <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
              )}
              <p className="font-medium">{feedback.message}</p>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
