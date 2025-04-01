import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";

// Set cache control headers to prevent caching
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = createClient();

    if (!supabase || !supabase.auth) {
      console.error("Supabase client or auth is undefined");
      return NextResponse.json(
        { authenticated: false, error: "Authentication service unavailable" },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          status: 500,
        },
      );
    }

    // Get the current user from the server-side
    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user || null;

    if (userError) {
      console.error("Error getting user in status API:", userError);
      return NextResponse.json(
        { authenticated: false, error: userError.message },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          status: 401,
        },
      );
    }

    if (!user) {
      console.log("No user found in status API");
      return NextResponse.json(
        { authenticated: false, message: "No user found" },
        {
          headers: {
            "Cache-Control": "no-store, max-age=0, must-revalidate",
            Pragma: "no-cache",
            Expires: "0",
          },
          status: 200,
        },
      );
    }

    // Check if the user has any broker connections
    const { data: connections, error: connectionsError } = await supabase
      .from("broker_connections")
      .select("*")
      .eq("user_id", user.id);

    if (connectionsError) {
      console.error("Error fetching broker connections:", connectionsError);
    }

    console.log(`User authenticated in status API: ${user.id}`);

    return NextResponse.json(
      {
        authenticated: true,
        userId: user.id,
        email: user.email,
        hasConnections: connections && connections.length > 0,
        connectionsCount: connections ? connections.length : 0,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        status: 200,
      },
    );
  } catch (error) {
    console.error("Error in status API:", error);
    return NextResponse.json(
      { authenticated: false, error: "Server error" },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
        status: 500,
      },
    );
  }
}
