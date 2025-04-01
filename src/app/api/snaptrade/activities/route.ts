import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { getSnapTradeSDK } from "@/utils/snaptrade-sdk";

// Set cache control headers to prevent caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const userId = requestUrl.searchParams.get("userId");
  const accountId = requestUrl.searchParams.get("accountId");
  const startDate =
    requestUrl.searchParams.get("startDate") ||
    new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]; // Default to 90 days ago
  const endDate =
    requestUrl.searchParams.get("endDate") ||
    new Date().toISOString().split("T")[0]; // Default to today

  if (!userId || !accountId) {
    return NextResponse.json(
      { error: "User ID and Account ID are required" },
      { status: 400 },
    );
  }

  try {
    const supabase = await createClient();

    // Get the current user to verify they match the userId
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      throw new Error(`Auth error: ${userError.message}`);
    }

    if (!user) {
      console.error("No authenticated user found");
      throw new Error("No authenticated user");
    }

    if (user.id !== userId) {
      console.error("User mismatch:", {
        authUserId: user.id,
        requestUserId: userId,
      });
      throw new Error("User mismatch");
    }

    // Get the user secret from the database
    const { data: connection } = await supabase
      .from("broker_connections")
      .select("api_secret_encrypted, broker_data")
      .eq("user_id", userId)
      .eq("broker_id", "snaptrade")
      .maybeSingle();

    if (!connection || !connection.api_secret_encrypted) {
      console.log(
        "No SnapTrade connection found for user, returning mock data",
      );
      return NextResponse.json(
        { activities: getMockActivities() },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    }

    // If this is a mock connection, return mock data
    if (connection.broker_data?.is_mock) {
      console.log("Using mock connection, returning mock data");
      return NextResponse.json(
        { activities: getMockActivities() },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    }

    // Get activities from SnapTrade
    try {
      const snaptrade = getSnapTradeSDK();
      const { data: activities, error } =
        await snaptrade.accountInformation.getActivities({
          userId: userId,
          userSecret: connection.api_secret_encrypted,
          accountId: accountId,
          startDate: startDate,
          endDate: endDate,
        });

      if (error) {
        console.error("Error fetching activities from SnapTrade:", error);
        return NextResponse.json(
          { activities: getMockActivities() },
          {
            headers: {
              "Cache-Control": "no-store, max-age=0, must-revalidate",
              Pragma: "no-cache",
              Expires: "0",
            },
          },
        );
      }

      return NextResponse.json(
        { activities: activities || [] },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    } catch (apiError) {
      console.error("API error fetching activities:", apiError);
      return NextResponse.json(
        { activities: getMockActivities() },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    }
  } catch (error) {
    console.error("Error fetching activities:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    return NextResponse.json(
      { error: errorMessage },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }
}

// Helper function to generate mock activities
function getMockActivities() {
  return [
    {
      id: "act1",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      type: "buy",
      description: "Purchased shares",
      symbol: "AAPL",
      currency: "USD",
      amount: 1250.75,
      quantity: 5,
      price: 250.15,
    },
    {
      id: "act2",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      type: "dividend",
      description: "Dividend payment",
      symbol: "MSFT",
      currency: "USD",
      amount: 125.5,
    },
    {
      id: "act3",
      date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      type: "sell",
      description: "Sold shares",
      symbol: "TSLA",
      currency: "USD",
      amount: 750.25,
      quantity: 2,
      price: 375.12,
    },
    {
      id: "act4",
      date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      type: "deposit",
      description: "Account deposit",
      currency: "USD",
      amount: 5000,
    },
  ];
}
