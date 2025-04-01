import { NextResponse } from "next/server";
import { registerSnapTradeUser } from "@/utils/snaptrade";

// Set cache control headers to prevent caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    // Parse the request body safely
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      console.error("Error parsing request JSON:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Force re-register the user with SnapTrade to refresh credentials
    const snapTradeUser = await registerSnapTradeUser(userId);

    return NextResponse.json(
      { success: true, userId: snapTradeUser.userId },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("Error refreshing SnapTrade user:", error);
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
