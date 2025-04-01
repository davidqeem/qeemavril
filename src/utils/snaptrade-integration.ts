/**
 * SnapTrade Integration Workflow
 * This file contains utilities for implementing the complete SnapTrade integration process
 */

import { getSnapTradeSDK } from "./snaptrade-sdk";
import { createClient } from "@/supabase/client";

/**
 * Step 1: Initialize and register a user with SnapTrade
 * @param userId - The unique user ID in your system
 */
export async function initializeSnapTradeUser(userId: string) {
  try {
    console.log(`Initializing SnapTrade for user: ${userId}`);

    // Register the user with SnapTrade via API
    const response = await fetch(`/api/snaptrade/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to register with SnapTrade");
    }

    const data = await response.json();
    console.log("SnapTrade user initialized successfully", data);
    return data;
  } catch (error) {
    console.error("Error initializing SnapTrade user:", error);
    throw error;
  }
}

/**
 * Step 2: Generate a connection link for a specific broker
 * @param userId - The unique user ID in your system
 * @param brokerId - Optional broker ID (e.g., "QUESTRADE", "ALPACA")
 * @param redirectUri - Optional custom redirect URI after connection
 */
export async function generateBrokerConnectionLink(
  userId: string,
  brokerId?: string,
  redirectUri?: string,
) {
  try {
    console.log(`Generating broker connection link for user: ${userId}`);

    // Create the connection link via API
    const response = await fetch(`/api/snaptrade/connect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId,
        brokerId,
        redirectUri:
          redirectUri ||
          window.location.origin + "/dashboard/assets?success=true",
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create connection link");
    }

    const data = await response.json();
    console.log("Connection link generated successfully", data);
    return data.redirectUri;
  } catch (error) {
    console.error("Error generating broker connection link:", error);
    throw error;
  }
}

/**
 * Step 3: Fetch accounts for a user
 * @param userId - The unique user ID in your system
 */
export async function fetchUserAccounts(userId: string) {
  try {
    console.log(`Fetching accounts for user: ${userId}`);

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
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch accounts");
    }

    const data = await response.json();
    console.log("Raw accounts data:", data.accounts);
    return data.accounts || [];
  } catch (error) {
    console.error("Error fetching user accounts:", error);
    throw error;
  }
}

/**
 * Step 4: Fetch holdings for a specific account
 * @param userId - The unique user ID in your system
 * @param accountId - The account ID to fetch holdings for
 */
export async function fetchAccountHoldings(userId: string, accountId: string) {
  try {
    console.log(`Fetching holdings for account: ${accountId}`);

    const response = await fetch(
      `/api/snaptrade/holdings?userId=${userId}&accountId=${accountId}`,
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
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch holdings");
    }

    const data = await response.json();
    console.log("Raw holdings data:", data.holdings);
    return data.holdings || [];
  } catch (error) {
    console.error("Error fetching account holdings:", error);
    throw error;
  }
}

/**
 * Step 5: Fetch account balance
 * @param userId - The unique user ID in your system
 * @param accountId - The account ID to fetch balance for
 */
export async function fetchAccountBalance(userId: string, accountId: string) {
  try {
    console.log(`Fetching balance for account: ${accountId}`);

    // This would typically call a dedicated balance endpoint
    // For now, we'll extract balance information from the holdings data
    const holdings = await fetchAccountHoldings(userId, accountId);

    // Find cash balance in holdings
    const cashHolding = holdings.find(
      (h) =>
        h.symbol === "CASH" ||
        (typeof h.name === "string" && h.name.includes("Cash")) ||
        h.isCash === true,
    );

    const balance = {
      cash: cashHolding ? cashHolding.totalValue : 0,
      currency: cashHolding ? cashHolding.currency : "USD",
      buying_power: cashHolding ? cashHolding.totalValue : 0,
    };

    console.log("Account balance:", balance);
    return balance;
  } catch (error) {
    console.error("Error fetching account balance:", error);
    throw error;
  }
}

/**
 * Step 6: Normalize account data for display
 * @param account - The raw account data
 * @param balance - The account balance
 * @param holdings - The account holdings
 */
export function normalizeAccountData(
  account: any,
  balance: any,
  holdings: any[],
) {
  try {
    // Sort holdings by value (descending)
    const sortedHoldings = [...holdings]
      .filter((h) => !h.isCash && h.symbol !== "CASH")
      .sort((a, b) => b.totalValue - a.totalValue);

    // Calculate total portfolio value
    const totalValue = holdings.reduce(
      (sum, h) => sum + (h.totalValue || 0),
      0,
    );

    // Calculate percentages of portfolio for each holding
    const holdingsWithPercentage = sortedHoldings.map((h) => ({
      ...h,
      percentOfPortfolio:
        totalValue > 0 ? (h.totalValue / totalValue) * 100 : 0,
    }));

    // Format the account number for display (show only last 4 digits)
    const accountNumber = account.number
      ? `****${account.number.slice(-4)}`
      : "****";

    return {
      id: account.id,
      broker: account.brokerage?.name || "Unknown Broker",
      accountNumber,
      accountName: account.name,
      balance: {
        cash: balance.cash.toFixed(2),
        currency: balance.currency,
        buying_power:
          balance.buying_power?.toFixed(2) || balance.cash.toFixed(2),
      },
      holdings: holdingsWithPercentage.slice(0, 5).map((h) => ({
        symbol: h.symbol,
        name: h.name,
        quantity: h.quantity,
        value: h.totalValue.toFixed(2),
        price: h.pricePerShare.toFixed(2),
        currency: h.currency,
        percentOfPortfolio: h.percentOfPortfolio.toFixed(2),
      })),
      totalValue: totalValue.toFixed(2),
      totalHoldings: sortedHoldings.length,
    };
  } catch (error) {
    console.error("Error normalizing account data:", error);
    // Return a minimal valid object to prevent UI errors
    return {
      id: account.id,
      broker: account.brokerage?.name || "Unknown Broker",
      accountNumber: "****",
      accountName: account.name,
      balance: { cash: "0.00", currency: "USD", buying_power: "0.00" },
      holdings: [],
      totalValue: "0.00",
      totalHoldings: 0,
    };
  }
}

/**
 * Complete verification of SnapTrade integration
 * @param userId - The unique user ID in your system
 */
export async function verifySnapTradeIntegration(userId: string) {
  try {
    console.log("Starting SnapTrade integration verification...");

    // Step 1: Verify user registration
    await initializeSnapTradeUser(userId);

    // Step 2: Fetch accounts
    const accounts = await fetchUserAccounts(userId);
    if (!accounts.length) {
      console.warn("No accounts found for user");
      return { success: false, message: "No accounts found" };
    }

    console.log(`Found ${accounts.length} accounts`);

    // Step 3: Verify each account
    const verifiedAccounts = [];

    for (const account of accounts) {
      try {
        // Fetch holdings
        const holdings = await fetchAccountHoldings(userId, account.id);

        // Fetch balance
        const balance = await fetchAccountBalance(userId, account.id);

        // Normalize the data
        const normalizedAccount = normalizeAccountData(
          account,
          balance,
          holdings,
        );

        verifiedAccounts.push({
          id: account.id,
          name: account.name,
          verified: true,
          holdingsCount: holdings.length,
          hasCashBalance: balance.cash > 0,
        });
      } catch (accountError) {
        console.error(`Error verifying account ${account.id}:`, accountError);
        verifiedAccounts.push({
          id: account.id,
          name: account.name,
          verified: false,
          error: accountError.message,
        });
      }
    }

    const allVerified = verifiedAccounts.every((a) => a.verified);

    return {
      success: allVerified,
      message: allVerified
        ? "All accounts verified successfully"
        : "Some accounts failed verification",
      accounts: verifiedAccounts,
    };
  } catch (error) {
    console.error("Error verifying SnapTrade integration:", error);
    return {
      success: false,
      message: error.message || "Unknown error during verification",
      accounts: [],
    };
  }
}
