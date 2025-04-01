"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { createClient } from "@/supabase/client";
import {
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

interface BrokerAccount {
  id: string;
  name: string;
  number?: string;
  type?: string;
  brokerage?: {
    id: string;
    name: string;
  };
  connection_id?: string;
  totalValue?: number;
  gainLoss?: number;
  holdings?: Holding[];
}

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

export default function UnifiedBrokerAssets({
  debug = false,
}: {
  debug?: boolean;
}) {
  const supabase = createClient();
  const router = useRouter();
  const [accounts, setAccounts] = useState<BrokerAccount[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [deletingAccount, setDeletingAccount] = useState<BrokerAccount | null>(
    null,
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [expandedAccounts, setExpandedAccounts] = useState<
    Record<string, boolean>
  >({});
  const [portfolioSummary, setPortfolioSummary] = useState<PortfolioSummary>({
    totalValue: 0,
    cashAvailable: 0,
    investedValue: 0,
  });

  // Fetch accounts
  const fetchAccounts = useCallback(async (userId: string) => {
    console.log("fetchAccounts called with userId:", userId);
    setLoading(true);
    setError(null);

    try {
      // First try to refresh the user to ensure we have valid credentials
      try {
        const refreshResponse = await fetch(`/api/snaptrade/refresh-user`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
          cache: "no-store",
        });

        if (refreshResponse.ok) {
          console.log(
            "Successfully refreshed user credentials before fetching accounts",
          );
        } else {
          console.warn(
            "Refresh before fetching accounts failed, continuing anyway",
          );
        }
      } catch (refreshError) {
        console.warn(
          "Failed to refresh user credentials, continuing anyway:",
          refreshError,
        );
        // Continue with the accounts fetch even if refresh fails
      }

      // Add a cache-busting parameter to prevent caching issues
      const cacheBuster = Date.now();
      const response = await fetch(
        `/api/snaptrade/accounts?userId=${userId}&_=${cacheBuster}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch accounts");
      }

      const data = await response.json();
      const fetchedAccounts = data.accounts || [];
      setAccounts(fetchedAccounts);

      // Fetch holdings for each account
      await fetchAllHoldings(userId, fetchedAccounts);
    } catch (err) {
      console.error("Error fetching accounts:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to load accounts. Please try again later.",
      );
      setLoading(false);
    }
  }, []);

  // Fetch holdings for all accounts
  const fetchAllHoldings = async (
    userId: string,
    accountsList: BrokerAccount[],
  ) => {
    try {
      // Toggle between mock and real data for testing
      let url;
      const useMockData = debug; // Use mock data in debug mode

      if (useMockData) {
        url = `/api/snaptrade/mock-holdings`;
      } else {
        url = `/api/snaptrade/holdings?userId=${userId}`;
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
      const allHoldings = processHoldings(data.holdings || []);
      setHoldings(allHoldings);

      // Group holdings by account and update accounts with totals
      const accountsWithHoldings = groupHoldingsByAccount(
        accountsList,
        allHoldings,
      );
      setAccounts(accountsWithHoldings);

      // Calculate portfolio summary
      calculatePortfolioSummary(allHoldings);
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

  // Process holdings data
  const processHoldings = (rawHoldings: any[]) => {
    return rawHoldings
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
  };

  // Group holdings by account
  const groupHoldingsByAccount = (
    accountsList: BrokerAccount[],
    allHoldings: Holding[],
  ) => {
    const holdingsByAccount: Record<string, Holding[]> = {};
    const accountTotals: Record<
      string,
      { totalValue: number; gainLoss: number }
    > = {};

    // Group holdings by accountId
    allHoldings.forEach((holding) => {
      if (!holdingsByAccount[holding.accountId]) {
        holdingsByAccount[holding.accountId] = [];
      }
      holdingsByAccount[holding.accountId].push(holding);

      // Calculate totals for each account
      if (!accountTotals[holding.accountId]) {
        accountTotals[holding.accountId] = { totalValue: 0, gainLoss: 0 };
      }
      accountTotals[holding.accountId].totalValue += holding.totalValue || 0;
      accountTotals[holding.accountId].gainLoss += holding.gainLoss || 0;
    });

    // Update accounts with holdings and totals
    return accountsList.map((account) => ({
      ...account,
      holdings: holdingsByAccount[account.id] || [],
      totalValue: accountTotals[account.id]?.totalValue || 0,
      gainLoss: accountTotals[account.id]?.gainLoss || 0,
    }));
  };

  // Calculate portfolio summary
  const calculatePortfolioSummary = (allHoldings: Holding[]) => {
    const cashHoldings =
      allHoldings.filter(
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
      allHoldings.reduce((sum, h) => sum + (h.totalValue || 0), 0) || 0;

    const investedValue = totalValue - cashAvailable;

    setPortfolioSummary({
      totalValue,
      cashAvailable,
      investedValue,
    });
  };

  useEffect(() => {
    const fetchUserAndData = async () => {
      try {
        // First try server-side check via API
        try {
          console.log("Attempting server-side authentication check first");
          const response = await fetch("/api/snaptrade/status", {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "no-store, no-cache, must-revalidate",
              Pragma: "no-cache",
            },
            cache: "no-store",
          });

          if (response.ok) {
            const data = await response.json();
            console.log("Server-side auth check response:", data);

            if (data.authenticated && data.userId) {
              console.log(
                "User authenticated via server-side check",
                data.userId,
              );
              setAuthChecked(true);
              setUserId(data.userId);
              await fetchAccounts(data.userId);
              return;
            }
          }
        } catch (apiError) {
          console.error("Error checking auth via server-side API:", apiError);
          // Continue with client-side check if server-side fails
        }

        // Fallback to client-side check
        console.log("Falling back to client-side authentication check");
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        setAuthChecked(true);
        console.log(
          "Client-side auth checked, user:",
          user ? "Found" : "Not found",
        );

        if (userError) {
          console.error("Error getting user:", userError);
          setError("Authentication error: " + userError.message);
          setLoading(false);
          return;
        }

        if (!user) {
          console.warn("No user found in client-side check");
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        setUserId(user.id);
        console.log("Setting user ID and fetching accounts:", user.id);

        // Fetch accounts and holdings
        await fetchAccounts(user.id);
      } catch (err) {
        console.error("Error fetching user and data:", err);
        setError("Failed to load data. Please try again later.");
        setLoading(false);
      }
    };

    fetchUserAndData();
  }, [fetchAccounts, supabase.auth]);

  const handleRefresh = () => {
    if (userId) {
      fetchAccounts(userId);
    }
  };

  const handleDeleteAccount = async (account: BrokerAccount) => {
    if (!userId) return;

    setIsDeleting(true);
    try {
      // Delete the connection from SnapTrade
      const response = await fetch(
        `/api/snaptrade/connect?userId=${userId}&connectionId=${account.connection_id}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-store, no-cache, must-revalidate",
            Pragma: "no-cache",
          },
        },
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete connection");
      }

      // Add a small delay to allow the deletion to propagate
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Refresh the accounts list
      await fetchAccounts(userId);
      setDeletingAccount(null);
    } catch (err) {
      console.error("Error deleting account:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete account. Please try again later.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSnapTradeUser = async () => {
    if (!userId) return;

    setIsDeleting(true);
    try {
      // First, re-register the user to ensure we have a valid connection
      try {
        const registerResponse = await fetch(`/api/snaptrade/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ userId }),
        });

        if (!registerResponse.ok) {
          const data = await registerResponse.json();
          console.warn("Registration before deletion failed:", data.error);
          // Continue with deletion anyway
        } else {
          console.log("User re-registered successfully before deletion");
        }
      } catch (regError) {
        console.warn("Error during registration before deletion:", regError);
        // Continue with deletion anyway
      }

      // Delete the SnapTrade user completely
      const response = await fetch(`/api/snaptrade/register?userId=${userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete SnapTrade user");
      }

      // Refresh the accounts list
      await fetchAccounts(userId);
      setDeletingAccount(null);
    } catch (err) {
      console.error("Error deleting SnapTrade user:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to delete SnapTrade user. Please try again later.",
      );
    } finally {
      setIsDeleting(false);
    }
  };

  const handleAddAccount = () => {
    router.push("/dashboard/assets");
  };

  const handleSignIn = () => {
    router.push("/sign-in");
  };

  const toggleAccountExpansion = (accountId: string) => {
    setExpandedAccounts((prev) => ({
      ...prev,
      [accountId]: !prev[accountId],
    }));
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

  console.log("Render state:", {
    loading,
    authChecked,
    error,
    userId,
    accountsLength: accounts.length,
  });

  if (loading && !authChecked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Your linked investment accounts</CardDescription>
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
  if ((error === "User not authenticated" || !userId) && authChecked) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Your linked investment accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-10 w-10 text-blue-500 mb-2" />
            <p className="font-medium">
              Please sign in to view your connected accounts
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
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>Your linked investment accounts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <AlertCircle className="h-10 w-10 text-red-500 mb-2" />
            <p className="text-red-500 font-medium">{error}</p>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" size="sm" onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" /> Try Again
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden">
      <CardHeader className="from-blue-50 to-indigo-50 pb-4 bg-[#f0f0f0] flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="lucide lucide-briefcase"
            >
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
            </svg>
            All Assets
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4 mr-2" /> Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleAddAccount}>
            Connect Account
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {accounts.length === 0 ? (
          <div className="text-center py-12 px-4 bg-gray-50">
            <div className="inline-flex rounded-full bg-blue-100 p-4 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
              </svg>
            </div>
            <p className="text-muted-foreground mb-2">
              No accounts connected yet. Connect your first account to get
              started.
            </p>
            <Button
              variant="outline"
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1"
              onClick={handleAddAccount}
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
              Connect Account
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium text-sm">
                    Broker / Asset
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
                {accounts.map((account) => {
                  const isExpanded = expandedAccounts[account.id] || false;
                  const hasHoldings =
                    account.holdings && account.holdings.length > 0;

                  return (
                    <React.Fragment key={account.id}>
                      {/* Main broker row */}
                      <tr
                        className={`hover:bg-muted/30 transition-colors ${hasHoldings ? "cursor-pointer" : ""}`}
                        onClick={
                          hasHoldings
                            ? () => toggleAccountExpansion(account.id)
                            : undefined
                        }
                      >
                        <td className="p-3">
                          <div className="flex items-center">
                            {hasHoldings && (
                              <span className="mr-2">
                                {isExpanded ? (
                                  <ChevronUp className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <ChevronDown className="h-4 w-4 text-gray-500" />
                                )}
                              </span>
                            )}
                            <div>
                              <div className="font-medium">
                                {account.brokerage?.name || account.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {account.number
                                  ? `Account #${account.number}`
                                  : "Investment Account"}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-right font-medium">
                          <div>€{(account.totalValue * 0.82).toFixed(2)}</div>
                          <div className="text-xs text-muted-foreground">
                            ${account.totalValue.toFixed(2)}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div
                            className={
                              account.gainLoss >= 0
                                ? "text-green-600 flex items-center justify-end"
                                : "text-red-600 flex items-center justify-end"
                            }
                          >
                            {account.gainLoss >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {account.gainLoss >= 0 ? "" : "-"}€
                            {Math.abs(account.gainLoss * 0.82).toFixed(2)}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="text-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(
                                  `/dashboard/assets?accountId=${account.id}`,
                                );
                              }}
                            >
                              <a>
                                <ExternalLink className="h-4 w-4" />
                              </a>
                            </Button>
                            <AlertDialog
                              open={deletingAccount?.id === account.id}
                              onOpenChange={(open) =>
                                !open && setDeletingAccount(null)
                              }
                            >
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeletingAccount(account);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Delete Connection
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete the
                                    connection to {account.name}? This will
                                    remove all data associated with this
                                    account.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel disabled={isDeleting}>
                                    Cancel
                                  </AlertDialogCancel>
                                  <div className="flex gap-2">
                                    <AlertDialogAction
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleDeleteAccount(account);
                                      }}
                                      className="bg-red-600 hover:bg-red-700"
                                      disabled={isDeleting}
                                    >
                                      {isDeleting
                                        ? "Deleting..."
                                        : "Delete Connection"}
                                    </AlertDialogAction>
                                    <AlertDialogAction
                                      onClick={(e) => {
                                        e.preventDefault();
                                        handleDeleteSnapTradeUser();
                                      }}
                                      className="bg-red-800 hover:bg-red-900"
                                      disabled={isDeleting}
                                    >
                                      {isDeleting
                                        ? "Deleting..."
                                        : "Delete User Completely"}
                                    </AlertDialogAction>
                                  </div>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </td>
                      </tr>

                      {/* Holdings rows (expanded) */}
                      {isExpanded &&
                        account.holdings &&
                        account.holdings.map((holding, idx) => {
                          if (holding.isPending || holding.isError) return null;

                          return (
                            <tr
                              key={`${account.id}-holding-${idx}`}
                              className="bg-gray-50"
                            >
                              <td className="p-3 pl-10 border-t border-gray-100">
                                <div className="font-medium">
                                  {typeof holding.name === "string"
                                    ? holding.name
                                    : typeof holding.symbol === "string"
                                      ? holding.symbol
                                      : "Unknown"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {typeof holding.symbol === "string"
                                    ? holding.symbol
                                    : holding.symbol?.symbol || ""}
                                </div>
                              </td>
                              <td className="p-3 text-right border-t border-gray-100">
                                <div>
                                  {holding.quantity.toLocaleString()}{" "}
                                  {holding.isCash ? "" : "shares"}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(
                                    holding.pricePerShare,
                                    holding.currency,
                                  )}{" "}
                                  per share
                                </div>
                              </td>
                              <td className="p-3 text-right border-t border-gray-100">
                                <div>
                                  {formatCurrency(
                                    holding.costBasis ||
                                      holding.purchasePrice * holding.quantity,
                                    holding.currency,
                                  )}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {holding.percentOfPortfolio
                                    ? holding.percentOfPortfolio.toFixed(2) +
                                      "%"
                                    : "0.00%"}{" "}
                                  of portfolio
                                </div>
                              </td>
                              <td className="p-3 text-right border-t border-gray-100"></td>
                            </tr>
                          );
                        })}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-gray-50 border-t p-4">
        <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <h3 className="font-medium text-sm text-gray-500 mb-1">
              Total Portfolio Value
            </h3>
            <p className="text-xl font-bold">
              {formatCurrency(portfolioSummary.totalValue)}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-sm text-gray-500 mb-1">
              Cash Available
            </h3>
            <p className="text-xl font-bold">
              {formatCurrency(portfolioSummary.cashAvailable)}
            </p>
          </div>

          <div>
            <h3 className="font-medium text-sm text-gray-500 mb-1">
              Invested Value
            </h3>
            <p className="text-xl font-bold">
              {formatCurrency(portfolioSummary.investedValue)}
            </p>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
