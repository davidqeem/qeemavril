"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SnapTradeDebugTools() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [responseData, setResponseData] = useState<any>(null);
  const [userId, setUserId] = useState("");
  const [accountId, setAccountId] = useState("");
  const [brokerId, setBrokerId] = useState("");
  const [activeTab, setActiveTab] = useState("register");

  const handleApiCall = async (
    endpoint: string,
    method: string = "GET",
    body?: any,
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResponseData(null);

    try {
      const url = new URL(`/api/snaptrade/${endpoint}`, window.location.origin);

      // Add query parameters for GET requests
      if (method === "GET") {
        if (userId) url.searchParams.append("userId", userId);
        if (accountId) url.searchParams.append("accountId", accountId);
      }

      const response = await fetch(url.toString(), {
        method,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate",
          Pragma: "no-cache",
        },
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || `API call failed with status ${response.status}`,
        );
      }

      setResponseData(data);
      setSuccess(`API call to ${endpoint} successful`);
    } catch (error) {
      console.error(`Error calling ${endpoint}:`, error);
      setError(error.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    if (!userId) {
      setError("User ID is required");
      return;
    }
    handleApiCall("register", "POST", { userId });
  };

  const handleConnect = () => {
    if (!userId) {
      setError("User ID is required");
      return;
    }
    handleApiCall("connect", "POST", {
      userId,
      brokerId: brokerId || undefined,
      redirectUri: window.location.origin + "/dashboard/assets?success=true",
    });
  };

  const handleFetchAccounts = () => {
    if (!userId) {
      setError("User ID is required");
      return;
    }
    handleApiCall("accounts");
  };

  const handleFetchHoldings = () => {
    if (!userId) {
      setError("User ID is required");
      return;
    }
    handleApiCall("holdings");
  };

  const handleFetchBalance = () => {
    if (!userId || !accountId) {
      setError("User ID and Account ID are required");
      return;
    }
    handleApiCall("balance");
  };

  const handleFetchActivities = () => {
    if (!userId || !accountId) {
      setError("User ID and Account ID are required");
      return;
    }
    handleApiCall("activities");
  };

  const handleDeleteUser = () => {
    if (!userId) {
      setError("User ID is required");
      return;
    }
    handleApiCall(`register?userId=${userId}`, "DELETE");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>SnapTrade Debug Tools</CardTitle>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <Label htmlFor="userId">User ID</Label>
            <Input
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="Enter user ID"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="accountId">
              Account ID (for account-specific operations)
            </Label>
            <Input
              id="accountId"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              placeholder="Enter account ID"
              className="mt-1"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="register">Register/Connect</TabsTrigger>
            <TabsTrigger value="accounts">Accounts</TabsTrigger>
            <TabsTrigger value="holdings">Holdings/Balance</TabsTrigger>
            <TabsTrigger value="activities">Activities</TabsTrigger>
          </TabsList>

          <TabsContent value="register" className="space-y-4">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Button onClick={handleRegister} disabled={loading || !userId}>
                  {loading ? "Processing..." : "Register User"}
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Registers a user with SnapTrade or refreshes an existing
                  registration
                </p>
              </div>

              <div className="flex flex-col space-y-2 mt-4">
                <Label htmlFor="brokerId">Broker ID (optional)</Label>
                <Input
                  id="brokerId"
                  value={brokerId}
                  onChange={(e) => setBrokerId(e.target.value)}
                  placeholder="e.g., QUESTRADE, ALPACA (leave empty for all brokers)"
                  className="mt-1"
                />

                <Button
                  onClick={handleConnect}
                  disabled={loading || !userId}
                  className="mt-2"
                >
                  {loading ? "Processing..." : "Generate Connection Link"}
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Generates a link to connect to a broker
                </p>
              </div>

              <div className="flex flex-col space-y-2 mt-4">
                <Button
                  onClick={handleDeleteUser}
                  disabled={loading || !userId}
                  variant="destructive"
                >
                  {loading ? "Processing..." : "Delete User"}
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Deletes a user from SnapTrade (use with caution)
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="accounts" className="space-y-4">
            <div className="space-y-4">
              <Button
                onClick={handleFetchAccounts}
                disabled={loading || !userId}
              >
                {loading ? "Fetching..." : "Fetch Accounts"}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Retrieves all accounts for the user
              </p>
            </div>
          </TabsContent>

          <TabsContent value="holdings" className="space-y-4">
            <div className="space-y-4">
              <Button
                onClick={handleFetchHoldings}
                disabled={loading || !userId}
              >
                {loading ? "Fetching..." : "Fetch Holdings"}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Retrieves holdings for all accounts (or specific account if
                Account ID is provided)
              </p>

              <div className="mt-4">
                <Button
                  onClick={handleFetchBalance}
                  disabled={loading || !userId || !accountId}
                >
                  {loading ? "Fetching..." : "Fetch Balance"}
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  Retrieves balance for a specific account (Account ID required)
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-4">
            <div className="space-y-4">
              <Button
                onClick={handleFetchActivities}
                disabled={loading || !userId || !accountId}
              >
                {loading ? "Fetching..." : "Fetch Activities"}
              </Button>
              <p className="text-xs text-gray-500 mt-1">
                Retrieves recent activities for a specific account (Account ID
                required)
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {responseData && (
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Response Data</h3>
            <div className="border rounded-md p-4 bg-gray-50 overflow-auto max-h-96">
              <pre className="text-xs">
                {JSON.stringify(responseData, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
