import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import {
  deleteSnapTradeConnection,
  createSnapTradeUserLink,
} from "@/utils/snaptrade";

// Set cache control headers to prevent caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId");
    const connectionId = url.searchParams.get("connectionId");

    if (!userId || !connectionId) {
      return NextResponse.json(
        { error: "User ID and connection ID are required" },
        { status: 400 },
      );
    }

    // Verify the user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      return NextResponse.json(
        { error: `Auth error: ${userError.message}` },
        { status: 401 },
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    // Delete the connection
    console.log(`Deleting connection ${connectionId} for user ${userId}`);
    await deleteSnapTradeConnection(userId, connectionId);

    return NextResponse.json(
      {
        success: true,
        message: "Connection deleted successfully",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
          "Content-Type": "application/json",
        },
      },
    );
  } catch (error) {
    console.error("Error deleting connection:", error);
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
          "Content-Type": "application/json",
        },
      },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // First get the request body as text to ensure it's valid JSON
    const bodyText = await req.text();

    // Try to parse the JSON
    let body;
    try {
      body = JSON.parse(bodyText);
    } catch (jsonError) {
      console.error("Error parsing request JSON:", jsonError);
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 },
      );
    }

    const { userId, brokerId, redirectUri } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Verify the user is authenticated
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      return NextResponse.json(
        { error: `Auth error: ${userError.message}` },
        { status: 401 },
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    if (user.id !== userId) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    // Call the actual SnapTrade API to create a connection link
    console.log(
      `Creating connection for user ${userId} with broker ${brokerId || "not specified"}`,
    );

    try {
      // Generate the connection URL
      const redirectURI = await createSnapTradeUserLink(
        userId,
        redirectUri,
        brokerId,
      );

      console.log(`Successfully generated redirect URI: ${redirectURI}`);

      return NextResponse.json(
        {
          success: true,
          redirectUri: redirectURI,
        },
        {
          status: 200,
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
            "Content-Type": "application/json",
          },
        },
      );
    } catch (snapTradeError: any) {
      console.error("SnapTrade error:", snapTradeError);

      // Extract detailed error information
      const errorDetails =
        snapTradeError.response?.data?.detail ||
        snapTradeError.responseBody?.detail ||
        snapTradeError.message ||
        "Unknown error";

      return NextResponse.json(
        {
          success: false,
          error: `Failed to create connection link: ${errorDetails}`,
          details: snapTradeError.message,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in connect route:", error);
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
          "Content-Type": "application/json",
        },
      },
    );
  }
}
