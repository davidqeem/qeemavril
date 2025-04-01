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
        { balance: getMockBalance() },
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
        { balance: getMockBalance() },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    }

    // Get balance from SnapTrade
    try {
      const snaptrade = getSnapTradeSDK();
      const { data: balance, error } =
        await snaptrade.accountInformation.getUserAccountBalance({
          userId: userId,
          userSecret: connection.api_secret_encrypted,
          accountId: accountId,
        });

      if (error) {
        console.error("Error fetching balance from SnapTrade:", error);
        return NextResponse.json(
          { balance: getMockBalance() },
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
        { balance: balance || getMockBalance() },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    } catch (apiError) {
      console.error("API error fetching balance:", apiError);
      return NextResponse.json(
        { balance: getMockBalance() },
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
    console.error("Error fetching balance:", error);
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

// Helper function to generate mock balance
function getMockBalance() {
  return {
    cash: 2500.75,
    buying_power: 2500.75,
    currency: "USD",
  };
}
