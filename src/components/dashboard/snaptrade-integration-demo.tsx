"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/supabase/client";
import {
  initializeSnapTradeUser,
  generateBrokerConnectionLink,
  fetchUserAccounts,
  fetchAccountHoldings,
  fetchAccountBalance,
  normalizeAccountData,
  verifySnapTradeIntegration,
} from "@/utils/snaptrade-integration";

export default function SnapTradeIntegrationDemo() {
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [holdings, setHoldings] = useState<any[]>([]);
  const [balance, setBalance] = useState<any | null>(null);
  const [normalizedData, setNormalizedData] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("connect");
  const [verificationResult, setVerificationResult] = useState<any | null>(
    null,
  );

  // Get the current user ID on component mount
  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        setError("Failed to get current user. Please sign in.");
      }
    };

    fetchUserId();
  }, []);

  // Step 1: Initialize SnapTrade user
  const handleInitializeUser = async () => {
    if (!userId) {
      setError("User ID is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await initializeSnapTradeUser(userId);
      setSuccess("User initialized successfully with SnapTrade");
      setActiveTab("connect");
    } catch (error) {
      console.error("Error initializing user:", error);
      setError(error.message || "Failed to initialize user");
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Generate broker connection link
  const handleConnectBroker = async (brokerId?: string) => {
    if (!userId) {
      setError("User ID is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const redirectUri = await generateBrokerConnectionLink(
        userId,
        brokerId,
        window.location.origin + "/dashboard/assets?success=true",
      );

      // Redirect to the broker connection page
      window.location.href = redirectUri;

      setSuccess("Redirecting to broker connection page...");
    } catch (error) {
      console.error("Error connecting broker:", error);
      setError(error.message || "Failed to connect broker");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Fetch accounts
  const handleFetchAccounts = async () => {
    if (!userId) {
      setError("User ID is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const fetchedAccounts = await fetchUserAccounts(userId);
      setAccounts(fetchedAccounts);
      setSuccess(`Successfully fetched ${fetchedAccounts.length} accounts`);

      if (fetchedAccounts.length > 0) {
        setSelectedAccount(fetchedAccounts[0].id);
        setActiveTab("holdings");
      }
    } catch (error) {
      console.error("Error fetching accounts:", error);
      setError(error.message || "Failed to fetch accounts");
    } finally {
      setLoading(false);
    }
  };

  // Step 4: Fetch holdings for selected account
  const handleFetchHoldings = async () => {
    if (!userId || !selectedAccount) {
      setError("User ID and account selection are required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const fetchedHoldings = await fetchAccountHoldings(
        userId,
        selectedAccount,
      );
      setHoldings(fetchedHoldings);

      // Also fetch balance
      const fetchedBalance = await fetchAccountBalance(userId, selectedAccount);
      setBalance(fetchedBalance);

      setSuccess(`Successfully fetched ${fetchedHoldings.length} holdings`);
      setActiveTab("normalize");
    } catch (error) {
      console.error("Error fetching holdings:", error);
      setError(error.message || "Failed to fetch holdings");
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Normalize data
  const handleNormalizeData = () => {
    if (!selectedAccount || !balance || !holdings.length) {
      setError("Account, balance, and holdings data are required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const account = accounts.find((a) => a.id === selectedAccount);
      if (!account) {
        throw new Error("Selected account not found");
      }

      const normalized = normalizeAccountData(account, balance, holdings);
      setNormalizedData(normalized);
      setSuccess("Data normalized successfully");
      setActiveTab("display");
    } catch (error) {
      console.error("Error normalizing data:", error);
      setError(error.message || "Failed to normalize data");
    } finally {
      setLoading(false);
    }
  };

  // Step 6: Verify integration
  const handleVerifyIntegration = async () => {
    if (!userId) {
      setError("User ID is required");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await verifySnapTradeIntegration(userId);
      setVerificationResult(result);

      if (result.success) {
        setSuccess("Integration verified successfully");
      } else {
        setError(result.message || "Verification failed");
      }
    } catch (error) {
      console.error("Error verifying integration:", error);
      setError(error.message || "Failed to verify integration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>SnapTrade Integration Workflow</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-4 bg-green-50 border-green-200">
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-6 mb-4">
            <TabsTrigger value="connect">1. Connect</TabsTrigger>
            <TabsTrigger value="accounts">2. Accounts</TabsTrigger>
            <TabsTrigger value="holdings">3. Holdings</TabsTrigger>
            <TabsTrigger value="normalize">4. Normalize</TabsTrigger>
            <TabsTrigger value="display">5. Display</TabsTrigger>
            <TabsTrigger value="verify">6. Verify</TabsTrigger>
          </TabsList>

          {/* Step 1: Connect */}
          <TabsContent value="connect" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">
                  Step 1: Initialize and Connect
                </h3>
                <p className="text-sm text-gray-500">
                  Initialize the user with SnapTrade and connect to a broker
                </p>
              </div>

              <div className="flex flex-col space-y-2">
                <p className="text-sm">
                  Current User ID:{" "}
                  <span className="font-mono">{userId || "Not logged in"}</span>
                </p>

                <div className="flex space-x-2">
                  <Button
                    onClick={handleInitializeUser}
                    disabled={loading || !userId}
                  >
                    {loading ? "Initializing..." : "1. Initialize User"}
                  </Button>
                </div>

                <div className="mt-4">
                  <h4 className="text-md font-medium mb-2">
                    2. Connect to Broker
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    <Button
                      onClick={() => handleConnectBroker("QUESTRADE")}
                      disabled={loading || !userId}
                      variant="outline"
                    >
                      Questrade
                    </Button>
                    <Button
                      onClick={() => handleConnectBroker("ALPACA")}
                      disabled={loading || !userId}
                      variant="outline"
                    >
                      Alpaca
                    </Button>
                    <Button
                      onClick={() => handleConnectBroker()}
                      disabled={loading || !userId}
                      variant="outline"
                    >
                      Show All Brokers
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Step 2: Accounts */}
          <TabsContent value="accounts" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Step 2: Fetch Accounts</h3>
                <p className="text-sm text-gray-500">
                  Retrieve the user's connected accounts
                </p>
              </div>

              <Button
                onClick={handleFetchAccounts}
                disabled={loading || !userId}
              >
                {loading ? "Fetching..." : "Fetch Accounts"}
              </Button>

              {accounts.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-md font-medium mb-2">
                    Connected Accounts
                  </h4>
                  <div className="border rounded-md p-4 bg-gray-50">
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(accounts, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Step 3: Holdings */}
          <TabsContent value="holdings" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Step 3: Fetch Holdings</h3>
                <p className="text-sm text-gray-500">
                  Retrieve holdings for a selected account
                </p>
              </div>

              {accounts.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex flex-col space-y-2">
                    <label className="text-sm font-medium">
                      Select Account
                    </label>
                    <select
                      className="border rounded-md p-2"
                      value={selectedAccount || ""}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                    >
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.brokerage?.name})
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    onClick={handleFetchHoldings}
                    disabled={loading || !selectedAccount}
                  >
                    {loading ? "Fetching..." : "Fetch Holdings"}
                  </Button>

                  {holdings.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium mb-2">
                        Account Holdings
                      </h4>
                      <div className="border rounded-md p-4 bg-gray-50">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(holdings, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {balance && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium mb-2">
                        Account Balance
                      </h4>
                      <div className="border rounded-md p-4 bg-gray-50">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(balance, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-md">
                  <p>
                    No accounts available. Please connect to a broker first.
                  </p>
                  <Button
                    onClick={() => setActiveTab("connect")}
                    variant="link"
                    className="mt-2"
                  >
                    Go to Connect Step
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Step 4: Normalize */}
          <TabsContent value="normalize" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Step 4: Normalize Data</h3>
                <p className="text-sm text-gray-500">
                  Transform raw data into a standardized format
                </p>
              </div>

              {holdings.length > 0 && balance ? (
                <div className="space-y-4">
                  <Button onClick={handleNormalizeData} disabled={loading}>
                    {loading ? "Normalizing..." : "Normalize Data"}
                  </Button>

                  {normalizedData && (
                    <div className="mt-4">
                      <h4 className="text-md font-medium mb-2">
                        Normalized Data
                      </h4>
                      <div className="border rounded-md p-4 bg-gray-50">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(normalizedData, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-md">
                  <p>
                    No holdings or balance data available. Please fetch holdings
                    first.
                  </p>
                  <Button
                    onClick={() => setActiveTab("holdings")}
                    variant="link"
                    className="mt-2"
                  >
                    Go to Holdings Step
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Step 5: Display */}
          <TabsContent value="display" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">Step 5: Display Data</h3>
                <p className="text-sm text-gray-500">
                  Render the normalized data in a user-friendly format
                </p>
              </div>

              {normalizedData ? (
                <div className="border rounded-md p-4 bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h3 className="text-lg font-bold">
                        {normalizedData.broker}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {normalizedData.accountName} (****
                        {normalizedData.accountNumber.slice(-4)})
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">
                        {normalizedData.balance.currency}{" "}
                        {normalizedData.totalValue}
                      </p>
                      <p className="text-sm text-gray-500">Total Value</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Cash Balance
                      </h4>
                      <p className="text-xl font-semibold">
                        {normalizedData.balance.currency}{" "}
                        {normalizedData.balance.cash}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Buying Power
                      </h4>
                      <p className="text-xl font-semibold">
                        {normalizedData.balance.currency}{" "}
                        {normalizedData.balance.buying_power}
                      </p>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">
                        Holdings
                      </h4>
                      <p className="text-xl font-semibold">
                        {normalizedData.totalHoldings}
                      </p>
                    </div>
                  </div>

                  <h4 className="text-md font-medium mb-2">Top Holdings</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="text-left p-2 text-sm font-medium">
                            Symbol
                          </th>
                          <th className="text-left p-2 text-sm font-medium">
                            Name
                          </th>
                          <th className="text-right p-2 text-sm font-medium">
                            Quantity
                          </th>
                          <th className="text-right p-2 text-sm font-medium">
                            Price
                          </th>
                          <th className="text-right p-2 text-sm font-medium">
                            Value
                          </th>
                          <th className="text-right p-2 text-sm font-medium">
                            %
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {normalizedData.holdings.map((holding: any) => (
                          <tr key={holding.symbol} className="hover:bg-gray-50">
                            <td className="p-2 font-medium">
                              {holding.symbol}
                            </td>
                            <td className="p-2 text-sm">{holding.name}</td>
                            <td className="p-2 text-right">
                              {holding.quantity}
                            </td>
                            <td className="p-2 text-right">
                              {holding.currency} {holding.price}
                            </td>
                            <td className="p-2 text-right font-medium">
                              {holding.currency} {holding.value}
                            </td>
                            <td className="p-2 text-right">
                              {holding.percentOfPortfolio}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center p-4 bg-gray-50 rounded-md">
                  <p>
                    No normalized data available. Please normalize data first.
                  </p>
                  <Button
                    onClick={() => setActiveTab("normalize")}
                    variant="link"
                    className="mt-2"
                  >
                    Go to Normalize Step
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Step 6: Verify */}
          <TabsContent value="verify" className="space-y-4">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium">
                  Step 6: Verify Integration
                </h3>
                <p className="text-sm text-gray-500">
                  Run a complete verification of the SnapTrade integration
                </p>
              </div>

              <Button
                onClick={handleVerifyIntegration}
                disabled={loading || !userId}
              >
                {loading ? "Verifying..." : "Verify Integration"}
              </Button>

              {verificationResult && (
                <div className="mt-4">
                  <h4 className="text-md font-medium mb-2">
                    Verification Result
                  </h4>
                  <div
                    className={`border rounded-md p-4 ${verificationResult.success ? "bg-green-50" : "bg-red-50"}`}
                  >
                    <p
                      className={`font-medium ${verificationResult.success ? "text-green-700" : "text-red-700"}`}
                    >
                      {verificationResult.message}
                    </p>

                    {verificationResult.accounts &&
                      verificationResult.accounts.length > 0 && (
                        <div className="mt-4">
                          <h5 className="text-sm font-medium mb-2">
                            Account Verification Status
                          </h5>
                          <ul className="space-y-2">
                            {verificationResult.accounts.map((account: any) => (
                              <li
                                key={account.id}
                                className="flex items-center"
                              >
                                <span
                                  className={`h-2 w-2 rounded-full mr-2 ${account.verified ? "bg-green-500" : "bg-red-500"}`}
                                ></span>
                                <span>{account.name}: </span>
                                <span
                                  className={`ml-2 ${account.verified ? "text-green-600" : "text-red-600"}`}
                                >
                                  {account.verified
                                    ? "Verified"
                                    : account.error || "Failed"}
                                </span>
                                {account.verified && (
                                  <span className="ml-2 text-xs text-gray-500">
                                    ({account.holdingsCount} holdings,{" "}
                                    {account.hasCashBalance
                                      ? "has cash"
                                      : "no cash"}
                                    )
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
