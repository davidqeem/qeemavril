import DashboardNavbar from "@/components/dashboard-navbar";
import Sidebar from "@/components/dashboard/sidebar";
import { createClient } from "../../../../supabase/server";
import { redirect } from "next/navigation";
import { SubscriptionCheck } from "@/components/subscription-check";
import AddAssetButton from "@/components/dashboard/add-asset-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, Briefcase } from "lucide-react";
import { revalidatePath } from "next/cache";
import SyncAssetsButton from "@/components/dashboard/sync-assets-button";
import SyncSnapTradeAssets from "@/components/dashboard/sync-snaptrade-assets";
import dynamic from "next/dynamic";
import { AccountOverviewWrapper } from "@/components/dashboard/account-overview-wrapper";

// Dynamically import client components with no SSR
const PortfolioAllocation = dynamic(
  () =>
    import("@/components/dashboard/portfolio-allocation").then(
      (mod) => mod.PortfolioAllocation,
    ),
  { ssr: false },
);

const RecentActivities = dynamic(
  () =>
    import("@/components/dashboard/recent-activities").then(
      (mod) => mod.RecentActivities,
    ),
  { ssr: false },
);

export const dynamicParams = "force-dynamic";
export const revalidate = 0;

async function deleteAsset(formData: FormData) {
  "use server";

  const assetId = formData.get("assetId") as string;

  if (!assetId) {
    return;
  }

  const supabase = await createClient();

  // Delete the asset
  const { error } = await supabase.from("assets").delete().eq("id", assetId);

  if (error) {
    console.error("Error deleting asset:", error);
  }

  // Revalidate the page to show the updated list
  revalidatePath("/dashboard/assets");
}

export default async function AssetsPage({
  searchParams,
}: {
  searchParams: {
    success?: string;
    error?: string;
    broker?: string;
    message?: string;
  };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Fetch user's assets
  const { data: assets } = await supabase
    .from("assets")
    .select("*, asset_categories(name, slug, icon)")
    .eq("is_liability", false);

  // Fetch broker connections for the user
  const { data: brokerConnections } = await supabase
    .from("broker_connections")
    .select("*")
    .eq("user_id", user.id);

  const showSuccessAlert = searchParams.success === "true";
  const showErrorAlert = searchParams.error === "true";
  const broker = searchParams.broker || "";
  const errorMessage = searchParams.message || "";

  // Sample data for portfolio allocation (in a real app, this would come from the API)
  const sampleAllocation = [
    { category: "Stocks", value: 25000, percentage: 50, color: "#4f46e5" },
    { category: "Bonds", value: 10000, percentage: 20, color: "#0ea5e9" },
    { category: "Cash", value: 7500, percentage: 15, color: "#10b981" },
    { category: "Crypto", value: 5000, percentage: 10, color: "#f59e0b" },
    { category: "Other", value: 2500, percentage: 5, color: "#6b7280" },
  ];

  // Sample data for recent activities (in a real app, this would come from the API)
  const sampleActivities = [
    {
      id: "act1",
      date: "2023-10-15",
      type: "buy" as const,
      description: "Purchased shares",
      amount: 1250.75,
      currency: "USD",
      symbol: "AAPL",
    },
    {
      id: "act2",
      date: "2023-10-10",
      type: "dividend" as const,
      description: "Dividend payment",
      amount: 125.5,
      currency: "USD",
      symbol: "MSFT",
    },
    {
      id: "act3",
      date: "2023-10-05",
      type: "sell" as const,
      description: "Sold shares",
      amount: 750.25,
      currency: "USD",
      symbol: "TSLA",
    },
    {
      id: "act4",
      date: "2023-10-01",
      type: "deposit" as const,
      description: "Account deposit",
      amount: 5000,
      currency: "USD",
    },
  ];

  // Sample data for connected accounts (in a real app, this would come from the API)
  const sampleAccounts = [
    {
      id: "acc1",
      name: "Investment Account",
      number: "****1234",
      brokerage: {
        name: "Questrade",
        logo: "https://api.dicebear.com/7.x/avataaars/svg?seed=Questrade",
      },
      holdings: [
        { symbol: "AAPL", quantity: 10, value: 1750.5, currency: "USD" },
        { symbol: "MSFT", quantity: 5, value: 1250.75, currency: "USD" },
        { symbol: "TSLA", quantity: 2, value: 450.25, currency: "USD" },
        { symbol: "AMZN", quantity: 3, value: 950.3, currency: "USD" },
      ],
      balance: {
        cash: 2500.75,
        currency: "USD",
      },
      lastActivity: {
        date: "2023-10-15",
        type: "Buy AAPL",
      },
    },
    {
      id: "acc2",
      name: "Retirement Account",
      number: "****5678",
      brokerage: {
        name: "Interactive Brokers",
        logo: "https://api.dicebear.com/7.x/avataaars/svg?seed=InteractiveBrokers",
      },
      holdings: [
        { symbol: "VTI", quantity: 20, value: 2500.0, currency: "USD" },
        { symbol: "VXUS", quantity: 15, value: 1800.5, currency: "USD" },
        { symbol: "BND", quantity: 30, value: 3000.25, currency: "USD" },
      ],
      balance: {
        cash: 1250.5,
        currency: "USD",
      },
      lastActivity: {
        date: "2023-10-10",
        type: "Dividend VXUS",
      },
    },
  ];

  return (
    <SubscriptionCheck>
      <DashboardNavbar />
      <div className="flex">
        <Sidebar />
        <main className="w-full bg-gray-50 min-h-screen pl-64">
          <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
            {/* Header Section with Sync Button */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <h1 className="text-3xl font-bold">My Assets</h1>
              <div className="flex items-center gap-3">
                <SyncAssetsButton />
                <AddAssetButton />
                <div className="ml-2">
                  {/* @ts-expect-error Server Component */}
                  <SyncSnapTradeAssets />
                </div>
              </div>
            </header>

            {/* Success/Error Alerts */}
            {showSuccessAlert && (
              <Alert className="bg-green-50 border-green-200">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">Success</AlertTitle>
                <AlertDescription className="text-green-700">
                  Your accounts have been successfully linked
                  {broker ? ` with ${broker}` : ""}. If your assets don't appear
                  below, click the "Sync Assets" button above.
                </AlertDescription>
              </Alert>
            )}

            {showErrorAlert && (
              <Alert className="bg-red-50 border-red-200">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertTitle className="text-red-800">Error</AlertTitle>
                <AlertDescription className="text-red-700">
                  {errorMessage ||
                    "There was a problem linking your accounts. Please try again or contact support."}
                </AlertDescription>
              </Alert>
            )}

            {/* Connected Broker Accounts with Holdings */}
            <div className="grid grid-cols-1 gap-8">
              {/* Connected Accounts Overview */}
              <AccountOverviewWrapper accounts={sampleAccounts} />

              {/* Portfolio Allocation */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* @ts-expect-error Client Component */}
                <PortfolioAllocation
                  allocations={sampleAllocation}
                  totalValue={50000}
                  currency="USD"
                />

                {/* Recent Activities */}
                {/* @ts-expect-error Client Component */}
                <RecentActivities activities={sampleActivities} />
              </div>
            </div>

            {/* Manual Assets List */}
            <Card className="shadow-sm border-gray-200 overflow-hidden bg-white">
              <CardHeader className="from-blue-50 to-indigo-50 pb-4 bg-[#f0f0f0]">
                <CardTitle className="text-blue-800 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Manual Assets
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {assets && assets.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="text-left p-3 font-medium text-sm">
                            Name
                          </th>
                          <th className="text-right p-3 font-medium text-sm">
                            Quantity
                          </th>
                          <th className="text-right p-3 font-medium text-sm">
                            Price per share
                          </th>
                          <th className="text-right p-3 font-medium text-sm">
                            Total Value
                          </th>
                          <th className="text-right p-3 font-medium text-sm">
                            Gain/Loss
                          </th>
                          <th className="text-right p-3 font-medium text-sm">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {assets.map((asset) => {
                          // Check if this is a stock asset
                          const isStock =
                            asset.metadata?.asset_type === "stock";
                          const stockMetadata = isStock ? asset.metadata : null;

                          // Calculate gain/loss if it's a stock
                          const gainLoss =
                            isStock && asset.acquisition_value
                              ? asset.value - asset.acquisition_value
                              : 0;

                          // Calculate percentage change
                          const percentChange =
                            isStock && asset.acquisition_value
                              ? ((asset.value - asset.acquisition_value) /
                                  asset.acquisition_value) *
                                100
                              : 0;

                          // Generate a fake identifier for stocks
                          const identifier = isStock
                            ? `USD${Math.floor(Math.random() * 900000000) + 100000000}`
                            : "";

                          // Convert USD to EUR (simplified conversion for demo)
                          const eurRate = 0.82;
                          const valueEUR = asset.value * eurRate;
                          const pricePerShareEUR = isStock
                            ? stockMetadata.price_per_share * eurRate
                            : 0;
                          const gainLossEUR = gainLoss * eurRate;

                          return (
                            <tr
                              key={asset.id}
                              className="hover:bg-muted/30 transition-colors"
                            >
                              <td className="p-3">
                                <div className="font-medium">{asset.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {asset.asset_categories?.name ||
                                    "Uncategorized"}
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                {isStock
                                  ? stockMetadata.quantity.toLocaleString()
                                  : "-"}
                              </td>
                              <td className="p-3 text-right">
                                {isStock ? (
                                  <div>
                                    <div>€{pricePerShareEUR.toFixed(2)}</div>
                                    <div className="text-xs text-muted-foreground">
                                      $
                                      {stockMetadata.price_per_share.toFixed(2)}
                                    </div>
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-3 text-right font-medium">
                                <div>€{valueEUR.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                  ${asset.value.toFixed(2)}
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                {isStock ? (
                                  <div
                                    className={
                                      gainLoss >= 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }
                                  >
                                    {gainLoss >= 0 ? "" : "-"}€
                                    {Math.abs(gainLossEUR).toFixed(2)}
                                  </div>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="p-3 text-right">
                                <form action={deleteAsset}>
                                  <input
                                    type="hidden"
                                    name="assetId"
                                    value={asset.id}
                                  />
                                  <button
                                    type="submit"
                                    className="text-red-500 hover:text-red-700 transition-colors p-1 rounded-full hover:bg-red-50"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="16"
                                      height="16"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="lucide lucide-trash-2"
                                    >
                                      <path d="M3 6h18" />
                                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                                      <line x1="10" x2="10" y1="11" y2="17" />
                                      <line x1="14" x2="14" y1="11" y2="17" />
                                    </svg>
                                  </button>
                                </form>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 px-4 bg-gray-50">
                    <div className="inline-flex rounded-full bg-blue-100 p-4 mb-4">
                      <Briefcase className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-muted-foreground mb-2">
                      No manual assets found. Add your first asset to get
                      started.
                    </p>
                    <button
                      onClick={() => {}}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <path d="M12 8v8" />
                        <path d="M8 12h8" />
                      </svg>
                      Add Asset
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SubscriptionCheck>
  );
}
