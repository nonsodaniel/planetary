function Sk({ className }: { className?: string }) {
  return <div className={`bg-zinc-800 rounded animate-pulse ${className ?? ""}`} />;
}

export default function PortfolioLoading() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <Sk className="h-8 w-52 mb-2" />
          <Sk className="h-4 w-72" />
        </div>
        <Sk className="h-9 w-36 rounded-lg" />
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[0, 1, 2].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-800 bg-zinc-900 p-4">
            <Sk className="h-3 w-28 mb-3" />
            <Sk className="h-9 w-20 mb-1.5" />
            <Sk className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Project rows */}
      <div className="space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-zinc-800 bg-zinc-900 p-4"
            style={{ opacity: 1 - i * 0.15 }}
          >
            <div className="flex items-start gap-4">
              <div className="w-16 flex-shrink-0">
                <Sk className="h-9 w-12 mx-auto mb-1" />
                <Sk className="h-3 w-8 mx-auto" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Sk className="h-4 w-48" />
                  <Sk className="h-5 w-16 rounded-full" />
                  <Sk className="h-5 w-20 rounded-full ml-auto" />
                </div>
                <Sk className="h-3 w-64 mb-2" />
                <div className="flex gap-4">
                  <Sk className="h-3 w-20" />
                  <Sk className="h-3 w-16" />
                  <Sk className="h-3 w-24" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
