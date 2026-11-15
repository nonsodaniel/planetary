import { TrendingUp } from "lucide-react";

function Sk({ className }: { className?: string }) {
  return <div className={`bg-zinc-800 rounded animate-pulse ${className ?? ""}`} />;
}

export default function OptimizeLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <Sk className="h-8 w-56 mb-2" />
        <Sk className="h-4 w-[480px] max-w-full" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Config panel skeleton */}
        <div className="lg:col-span-4">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
            <Sk className="h-3 w-24 mb-5" />

            {/* Budget label + presets */}
            <Sk className="h-3 w-20 mb-3" />
            <div className="flex gap-2 flex-wrap mb-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <Sk key={i} className="h-7 w-12 rounded" />
              ))}
            </div>
            <Sk className="h-9 w-full rounded mb-5" />

            {/* Slider */}
            <Sk className="h-3 w-28 mb-3" />
            <Sk className="h-4 w-full rounded-full mb-5" />

            {/* Intervention type list */}
            <Sk className="h-3 w-36 mb-3" />
            <div className="space-y-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <Sk key={i} className="h-9 w-full rounded" />
              ))}
            </div>

            <Sk className="h-11 w-full rounded-lg mt-5" />
          </div>
        </div>

        {/* Results area skeleton */}
        <div className="lg:col-span-8">
          <div className="rounded-lg border border-zinc-800 bg-zinc-900 h-72 flex flex-col items-center justify-center gap-3">
            <TrendingUp className="w-8 h-8 text-zinc-800" />
            <div className="text-sm text-zinc-700">Configure a budget and optimise</div>
          </div>
        </div>
      </div>
    </div>
  );
}
