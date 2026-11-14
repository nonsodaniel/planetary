"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="text-zinc-600 text-sm font-mono">Something went wrong</div>
      <button
        onClick={reset}
        className="text-xs border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
