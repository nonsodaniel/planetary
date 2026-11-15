export default function GlobeLoading() {
  return (
    <div
      className="relative overflow-hidden bg-zinc-950"
      style={{ height: "calc(100vh - 56px)" }}
    >
      {/* Fake static stars */}
      <div className="absolute inset-0 pointer-events-none">
        {[
          [12,8],[24,33],[41,17],[55,62],[67,28],[78,74],[88,41],[33,88],
          [9,55],[51,7],[72,91],[16,76],[93,19],[46,47],[60,82],
        ].map(([x, y], i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white opacity-20"
            style={{ left: `${x}%`, top: `${y}%`, width: 2, height: 2 }}
          />
        ))}
      </div>

      {/* Stats bar skeleton */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <div className="h-7 w-40 rounded-full bg-zinc-800 animate-pulse" />
        <div className="h-7 w-32 rounded-full bg-zinc-800 animate-pulse" />
      </div>

      {/* Globe pulse */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative flex items-center justify-center">
          <div className="w-80 h-80 rounded-full border border-zinc-800/50 animate-pulse" />
          <div
            className="absolute w-60 h-60 rounded-full border border-zinc-800/30 animate-pulse"
            style={{ animationDelay: "0.15s" }}
          />
          <div
            className="absolute w-40 h-40 rounded-full border border-zinc-800/20 animate-pulse"
            style={{ animationDelay: "0.3s" }}
          />
          <div className="absolute text-zinc-700 text-xs font-mono tracking-widest">
            LOADING EARTH
          </div>
        </div>
      </div>

      {/* Controls skeleton */}
      <div className="absolute bottom-6 left-4 flex flex-col gap-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-9 h-9 rounded-lg bg-zinc-800 animate-pulse" />
        ))}
      </div>

      {/* Sidebar skeleton */}
      <div className="absolute bottom-6 right-4 w-56 space-y-1.5">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-9 w-full rounded-lg bg-zinc-800/70 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
