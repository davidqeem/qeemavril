"use client";

// Import the dev tools and initialize them
import { TempoDevtools } from "tempo-devtools";
import { useEffect } from "react";

export function TempoInit() {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_TEMPO) {
      TempoDevtools.init();
    }
  }, []);

  return null;
}
