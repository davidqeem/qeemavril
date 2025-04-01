"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "../../../supabase/client";
import { RefreshCw, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";

interface Holding {
  symbol: string | any;
  name: string | any;
  quantity: number;
  pricePerShare: number;
  totalValue: number;
  gainLoss: number;
  purchasePrice: number;
  accountId: string;
  accountName: string;
  brokerName: string;
  currency: string | any;
  isCash?: boolean;
  costBasis?: number;
  percentOfPortfolio?: number;
  isPending?: boolean;
  isError?: boolean;
  errorMessage?: string;
}

interface PortfolioSummary {
  totalValue: number;
  cashAvailable: number;
  investedValue: number;
}

export default function BrokerHoldingsList({
  accountId,
  debug = false,
}: {
  accountId?: string;
  debug?: boolean;
}) {
  const supabase = createClient();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary>({
    totalValue: 0,
    cashAvailable: 0,
    investedValue: 0,
  });

  useEffect(() => {
    const fetchUserAndHoldings = async () => {
      try {
        // Get the current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        setAuthChecked(true);

        if (userError) {
          console.error("Error getting user:", userError);
          setError("Authentication error: " + userError.message);
          setLoading(false);
          return;
        }

        if (!user) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        setUserId(user.id);

        // Fetch holdings
        await fetchHoldings(user.id);
      } catch (err) {
        console.error("Error fetching user and holdings:", err);
        setError("Failed to load holdings. Please try again later.");
        setLoading(false);
      }
    };

    fetchUserAndHoldings();
  }, [supabase.auth, accountId]);

  const fetchHoldings = async (userId: string) => {
    setLoading(true);
    setError(null);

    try {
      // Toggle between mock and real data for testing
      let url;
      const useMockData = debug; // Use mock data in debug mode

      if (useMockData) {
        url = `/api/snaptrade/mock-holdings`;
      } else {
        url = accountId
          ? `/api/snaptrade/holdings?userId=${userId}&accountId=${accountId}`
          : `/api/snaptrade/holdings?userId=${userId}`;
      }

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch holdings");
      }

      const data = await response.json();

      if (debug) console.log("API Response:", data);

      if (debug)
        console.log(
          "Raw holdings data:",
          JSON.stringify(data.holdings, null, 2),
        );

      // Process holdings data and calculate missing values
      const processedHoldings = (data.holdings || [])
        .map((holding) => {
          // Check if holding is valid
          if (!holding) {
            console.error("Invalid holding object:", holding);
            return null;
          }

          // Handle pending or error holdings
          if (holding.isPending || holding.isError) {
            return holding;
          }

          // Ensure all numeric values are properly parsed
          const quantity =
            typeof holding.quantity === "number"
              ? holding.quantity
              : parseFloat(holding.quantity || "0");
          const pricePerShare =
            typeof holding.pricePerShare === "number"
              ? holding.pricePerShare
              : parseFloat(holding.pricePerShare || "0");

          // Calculate totalValue if not available or zero
          let totalValue =
            typeof holding.totalValue === "number"
              ? holding.totalValue
              : parseFloat(holding.totalValue || "0");
          if (totalValue === 0 && quantity > 0 && pricePerShare > 0) {
            totalValue = quantity * pricePerShare;
          }

          const purchasePrice =
            typeof holding.purchasePrice === "number"
              ? holding.purchasePrice
              : parseFloat(holding.purchasePrice || "0");

          // Calculate cost basis if not available
          let costBasis = holding.costBasis
            ? typeof holding.costBasis === "number"
              ? holding.costBasis
              : parseFloat(holding.costBasis || "0")
            : purchasePrice * quantity;

          // If costBasis is still 0 but we have quantity and purchasePrice, calculate it
          if (costBasis === 0 && quantity > 0 && purchasePrice > 0) {
            costBasis = purchasePrice * quantity;
          }

          // Calculate gainLoss if not available
          let gainLoss =
            typeof holding.gainLoss === "number"
              ? holding.gainLoss
              : parseFloat(holding.gainLoss || "0");
          if (gainLoss === 0 && totalValue > 0 && costBasis > 0) {
            gainLoss = totalValue - costBasis;
          }

          return {
            ...holding,
            quantity,
            pricePerShare,
            totalValue,
            purchasePrice,
            costBasis,
            gainLoss,
          };
        })
        .filter(Boolean); // Remove any null values

      if (debug)
        console.log(
          "Processed holdings:",
          JSON.stringify(processedHoldings, null, 2),
        );

      // Calculate portfolio summary
      const cashHoldings =
        processedHoldings.filter(
          (h) =>
            h.isCash ||
            h.symbol === "CASH" ||
            (typeof h.name === "string" && h.name.includes("Cash")),
        ) || [];
      const cashAvailable = cashHoldings.reduce(
        (sum, h) => sum + (h.totalValue || 0),
        0,
      );
      const totalValue =
        processedHoldings.reduce((sum, h) => sum + (h.totalValue || 0), 0) || 0;
      const investedValue = totalValue - cashAvailable;

      // Calculate percentOfPortfolio for each holding
      const holdingsWithPercentage = processedHoldings.map((holding) => ({
        ...holding,
        percentOfPortfolio:
          totalValue > 0 ? ((holding.totalValue || 0) / totalValue) * 100 : 0,
      }));

      // Set holdings with all calculated values
      setHoldings(holdingsWithPercentage);

      setPortfolioSummary({
        totalValue,
        cashAvailable,
        investedValue,
      });
    } catch (err) {
      console.error("Error fetching holdings:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load holdings. Please try again later.",
      );
    } finally {
      setLoading(false);
    }
  };

  const router = useRouter();

  const handleRefresh = () => {
    if (userId) {
      fetchHoldings(userId);
    }
  };

  const handleSignIn = () => {
    router.push("/sign-in");
  };

  const formatCurrency = (value: number | string, currency: any = "USD") => {
    // Ensure value is a number
    const numericValue =
      typeof value === "number" ? value : parseFloat(value || "0");
    // Ensure currency is a valid string
    const validCurrency =
      typeof currency === "string" && currency.trim() !== ""
        ? currency
        : typeof currency === "object" && currency?.currency
          ? currency.currency
          : "USD";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: validCurrency,
    }).format(numericValue);
  };

  const formatPercentage = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "percent",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  if (loading && !authChecked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investment Holdings</CardTitle>
          <CardDescription>
            {accountId
              ? "Holdings in this account"
              : "Your investment holdings across all accounts"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Special case for unauthenticated users
  if (error === "User not authenticated" || !userId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investment Holdings</CardTitle>
          <CardDescription>
            {accountId
              ? "Holdings in this account"
              : "Your investment holdings across all accounts"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-10 w-10 text-blue-500 mb-2" />
            <p className="font-medium">
              Please sign in to view your investment holdings
            </p>
            <div className="flex gap-2 mt-4">
              <Button variant="default" size="sm" onClick={handleSignIn}>
                Sign In
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href="/sign-up">Sign Up</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Investment Holdings</CardTitle>
          <CardDescription>
            {accountId
              ? "Holdings in this account"
              : "Your investment holdings across all accounts"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
            <p className="text-red-500 font-medium">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" /> Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Portfolio values are now calculated when fetching data and stored in state

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Investment Holdings</CardTitle>
          <CardDescription>
            {accountId
              ? "Holdings in this account"
              : "Your investment holdings across all accounts"}
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4 mr-2" /> Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {holdings.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground">No holdings found.</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push("/dashboard/assets")}
            >
              Add Investments
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-sm text-gray-500 mb-1">
                  Total Portfolio Value
                </h3>
                <p className="text-2xl font-bold">
                  {formatCurrency(portfolioSummary.totalValue)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-sm text-gray-500 mb-1">
                  Cash Available
                </h3>
                <p className="text-2xl font-bold">
                  {formatCurrency(portfolioSummary.cashAvailable)}
                </p>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-medium text-sm text-gray-500 mb-1">
                  Invested Value
                </h3>
                <p className="text-2xl font-bold">
                  {formatCurrency(portfolioSummary.investedValue)}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {holdings.map((holding, index) => (
                <div
                  key={`${holding.symbol}-${holding.accountId}-${index}`}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {holding.isPending ? (
                    <div className="flex flex-col items-center justify-center py-2">
                      <div className="flex items-center mb-2">
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        <span className="font-medium">{holding.name}</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Account is still syncing. Please check back in a few
                        minutes.
                      </p>
                    </div>
                  ) : holding.isError ? (
                    <div className="flex flex-col items-center justify-center py-2">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="font-medium text-red-500">
                          Error loading holdings
                        </span>
                      </div>
                      <p className="text-sm text-red-500">
                        {holding.errorMessage ||
                          "Please try refreshing the data."}
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium">
                            {typeof holding.name === "string"
                              ? holding.name
                              : typeof holding.symbol === "string"
                                ? holding.symbol
                                : "Unknown"}
                          </h3>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <span className="font-mono mr-2">
                              {typeof holding.symbol === "string"
                                ? holding.symbol
                                : holding.symbol?.symbol || "Unknown"}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                              {holding.accountName}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            {formatCurrency(
                              holding.totalValue,
                              holding.currency,
                            )}
                          </div>
                          <div
                            className={`text-sm flex items-center ${holding.gainLoss >= 0 ? "text-green-600" : "text-red-600"}`}
                          >
                            {holding.gainLoss >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {formatCurrency(holding.gainLoss, holding.currency)}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-3 text-sm">
                        <div>
                          <div className="text-gray-500">Quantity</div>
                          <div>
                            {(typeof holding.quantity === "number"
                              ? holding.quantity
                              : parseFloat(holding.quantity || "0")
                            ).toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Price</div>
                          <div>
                            {formatCurrency(
                              holding.pricePerShare,
                              holding.currency,
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">Cost Basis</div>
                          <div>
                            {formatCurrency(
                              holding.costBasis ||
                                holding.purchasePrice * holding.quantity,
                              holding.currency,
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500">% of Portfolio</div>
                          <div>
                            {holding.percentOfPortfolio
                              ? holding.percentOfPortfolio.toFixed(2) + "%"
                              : "0.00%"}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button
          variant="outline"
          className="w-full"
          onClick={() => router.push("/dashboard/assets")}
        >
          Manage Investments
        </Button>
      </CardFooter>
    </Card>
  );
}
