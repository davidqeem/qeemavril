"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { createClient } from "../../../supabase/client";

export default function SyncSnapTradeAssets() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const supabase = createClient();

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Get the current user
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw new Error("Authentication error: " + userError.message);
      }

      if (!user) {
        throw new Error("User not authenticated");
      }

      // Call the sync endpoint
      const response = await fetch(`/api/snaptrade/sync?userId=${user.id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to sync assets");
      }

      const data = await response.json();
      setSuccess("Assets synced successfully!");

      // Refresh the page after a short delay to show the updated assets
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error("Error syncing assets:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Failed to sync assets. Please try again later.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <Button
        variant="outline"
        size="sm"
        onClick={handleSync}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        {isLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : (
          <RefreshCw className="h-4 w-4" />
        )}
        {isLoading ? "Syncing..." : "Sync SnapTrade"}
      </Button>

      {error && (
        <p className="text-sm text-red-600 mt-1 bg-red-50 p-2 rounded">
          {error}
        </p>
      )}

      {success && (
        <p className="text-sm text-green-600 mt-1 bg-green-50 p-2 rounded">
          {success}
        </p>
      )}
    </div>
  );
}
