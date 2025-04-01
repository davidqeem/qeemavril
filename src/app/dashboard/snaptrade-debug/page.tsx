import { SubscriptionCheck } from "@/components/subscription-check";
import DashboardNavbar from "@/components/dashboard-navbar";
import Sidebar from "@/components/dashboard/sidebar";
import SnapTradeDebugTools from "@/components/dashboard/snaptrade-debug-tools";

export default function SnapTradeDebugPage() {
  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <div className="flex">
        <Sidebar />
        <main className="w-full bg-gray-50 min-h-screen pl-64">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">SnapTrade Debug Tools</h1>
            <p className="text-gray-600 mb-8">
              Use these tools to test and debug your SnapTrade integration. You
              can make direct API calls to the SnapTrade endpoints and view the
              raw responses.
            </p>

            <SnapTradeDebugTools />
          </div>
        </main>
      </div>
    </SubscriptionCheck>
  );
}
