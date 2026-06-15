import { AppHeader } from "@/components/common/AppHeader";
import { WalletSummaryCard } from "@/components/parent/WalletSummaryCard";
import { Controls } from "@/components/parent/Controls";
import { TransactionList } from "@/components/parent/TransactionList";
import { AlertsSection } from "@/components/parent/AlertsSection";
import { InfoBox } from "@/components/common/InfoBox";
import { useApp } from "@/context/AppContext";

const ParentDashboard = () => {
  const { parentName } = useApp();
  return (
    <div className="min-h-screen bg-background">
      <AppHeader subtitle={`${parentName}, Parent`} icon="parent" />
      <main className="container py-6 space-y-6 max-w-5xl">
        <InfoBox>
          <p className="font-medium">
            Only school-approved vendors can process payments. All transactions are recorded in real-time.
          </p>
        </InfoBox>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <WalletSummaryCard />
            <Controls />
          </div>
          <div className="space-y-6">
            <TransactionList />
            <AlertsSection />
          </div>
        </div>
      </main>
    </div>
  );
};

export default ParentDashboard;
