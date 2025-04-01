import { SubscriptionCheck } from "@/components/subscription-check";
import DashboardNavbar from "@/components/dashboard-navbar";
import Sidebar from "@/components/dashboard/sidebar";
import SnapTradeIntegrationDemo from "@/components/dashboard/snaptrade-integration-demo";

export default function SnapTradeDemoPage() {
  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <div className="flex">
        <Sidebar />
        <main className="w-full bg-gray-50 min-h-screen pl-64">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">
              SnapTrade Integration Demo
            </h1>
            <p className="text-gray-600 mb-8">
              This page demonstrates the complete workflow for integrating with
              SnapTrade, from user registration to displaying account data.
            </p>

            <SnapTradeIntegrationDemo />
          </div>
        </main>
      </div>
    </SubscriptionCheck>
  );
}
