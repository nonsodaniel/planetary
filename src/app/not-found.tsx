import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-6">
      <div className="font-mono text-zinc-600 text-sm">404 · Page not found</div>
      <Link
        href="/"
        className="text-xs border border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded transition-colors"
      >
        Back to home
      </Link>
    </div>
  );
}
