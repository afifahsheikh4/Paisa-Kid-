import { AppHeader } from "@/components/common/AppHeader";
import { SalesSummaryCard } from "@/components/merchant/SalesSummaryCard";
import { PaymentForm } from "@/components/merchant/PaymentForm";
import { RecentSalesList } from "@/components/merchant/RecentSalesList";
import { InfoBox } from "@/components/common/InfoBox";
import { useApp } from "@/context/AppContext";

const MERCHANT_NAME = "School Canteen";

const MerchantDashboard = () => {
  const { merchantName } = useApp();
  return (
    <div className="min-h-screen bg-background">
      <AppHeader subtitle={`${MERCHANT_NAME} – ${merchantName}`} icon="merchant" />
      <main className="container py-6 space-y-6 max-w-5xl">
        <InfoBox>
          <p className="font-medium">Only approved school merchants can access this system.</p>
          <p className="opacity-80">All transactions are logged and monitored.</p>
        </InfoBox>
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-6">
            <SalesSummaryCard merchantName={MERCHANT_NAME} />
            <PaymentForm merchantName={MERCHANT_NAME} />
          </div>
          <div>
            <RecentSalesList merchantName={MERCHANT_NAME} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default MerchantDashboard;
