import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Get Supabase URL from environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL environment variable is not set");
    }

    // Construct the URL for the edge function
    const functionUrl = `${supabaseUrl}/functions/v1/connect-broker`;
    console.log("Calling Supabase Edge Function:", functionUrl);
    const response = await fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify(body),
    });

    try {
      // First try to get the response as text
      const responseText = await response.text();
      console.log("Response text:", responseText);

      // Then try to parse it as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log("Parsed JSON data:", data);
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        return NextResponse.json(
          { error: "Invalid JSON response from server", details: responseText },
          { status: 500 },
        );
      }

      return NextResponse.json(data, {
        status: response.status,
        headers: {
          "Cache-Control": "no-store, max-age=0, must-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      });
    } catch (error) {
      console.error("Error processing response:", error);
      return NextResponse.json(
        { error: "Failed to process response", details: error.message },
        { status: 500 },
      );
    }
  } catch (error) {
    console.error("Error in connect-broker API route:", error);
    return NextResponse.json(
      { error: error.message || "An unknown error occurred" },
      { status: 500 },
    );
  }
}
