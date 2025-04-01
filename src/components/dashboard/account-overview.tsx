"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building, DollarSign, LineChart, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

type AccountHolding = {
  symbol: string;
  quantity: number;
  value: number;
  currency: string;
};

type AccountBalance = {
  cash: number;
  currency: string;
};

type Account = {
  id: string;
  name: string;
  number?: string;
  brokerage: {
    name: string;
    logo?: string;
  };
  holdings?: AccountHolding[];
  balance?: AccountBalance;
  lastActivity?: {
    date: string;
    type: string;
  };
};

type AccountOverviewProps = {
  accounts: Account[];
};

export function AccountOverview({ accounts = [] }: AccountOverviewProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = () => {
    setIsLoading(true);
    // Implement refresh logic here
    console.log("Refreshing accounts...");

    // Simulate API call with timeout
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  if (isLoading) {
    return <AccountOverviewSkeleton />;
  }

  if (accounts.length === 0) {
    return (
      <Card className="shadow-sm border-gray-200 overflow-hidden bg-white">
        <CardHeader className="from-blue-50 to-indigo-50 pb-4 bg-[#f0f0f0]">
          <CardTitle className="text-blue-800 flex items-center gap-2">
            <Building className="h-5 w-5" />
            Connected Broker Accounts
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 text-center">
          <div className="inline-flex rounded-full bg-blue-100 p-4 mb-4">
            <Building className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-muted-foreground mb-2">
            No broker accounts connected. Connect your first broker to get
            started.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden bg-white">
      <CardHeader className="from-blue-50 to-indigo-50 pb-4 bg-[#f0f0f0] flex flex-row justify-between items-center">
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <Building className="h-5 w-5" />
          Connected Broker Accounts
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-1"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-4 divide-y divide-gray-100">
          {accounts.map((account) => (
            <div key={account.id} className="p-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                {account.brokerage.logo && (
                  <img
                    src={account.brokerage.logo}
                    alt={account.brokerage.name}
                    className="h-5 w-5 object-contain"
                  />
                )}
                {account.brokerage.name} - {account.name}
                {account.number && (
                  <span className="text-sm font-normal text-gray-500">
                    ({account.number})
                  </span>
                )}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="text-sm text-gray-500 font-medium">Balance</h4>
                  <p className="text-xl font-semibold">
                    {account.balance ? (
                      <>
                        {account.balance.currency}{" "}
                        {account.balance.cash.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </>
                    ) : (
                      "--"
                    )}
                  </p>
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="text-sm text-gray-500 font-medium">
                    Top Holdings
                  </h4>
                  {account.holdings && account.holdings.length > 0 ? (
                    <ul className="mt-2 space-y-1">
                      {account.holdings.slice(0, 3).map((holding) => (
                        <li
                          key={holding.symbol}
                          className="flex justify-between"
                        >
                          <span>{holding.symbol}</span>
                          <span className="font-medium">
                            {holding.currency}{" "}
                            {holding.value.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </li>
                      ))}
                      {account.holdings.length > 3 && (
                        <li className="text-xs text-blue-600 mt-1">
                          +{account.holdings.length - 3} more holdings
                        </li>
                      )}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">
                      No holdings found
                    </p>
                  )}
                </div>

                <div className="bg-gray-50 p-3 rounded">
                  <h4 className="text-sm text-gray-500 font-medium">
                    Last Activity
                  </h4>
                  {account.lastActivity ? (
                    <p className="mt-2">
                      {account.lastActivity.date}: {account.lastActivity.type}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 mt-2">
                      No recent activity
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function AccountOverviewSkeleton() {
  return (
    <Card className="shadow-sm border-gray-200 overflow-hidden bg-white">
      <CardHeader className="from-blue-50 to-indigo-50 pb-4 bg-[#f0f0f0]">
        <CardTitle className="text-blue-800 flex items-center gap-2">
          <Building className="h-5 w-5" />
          Connected Broker Accounts
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
