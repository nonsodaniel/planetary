import type { CSSProperties } from "react";

function Sk({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div className={`bg-zinc-800 rounded animate-pulse ${className ?? ""}`} style={style} />;
}

function SkCard({ children }: { children: React.ReactNode; }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">{children}</div>
  );
}

export default function SimulateLoading() {
  return (
    <div className="min-h-[calc(100vh-56px)] px-4 py-6 max-w-7xl mx-auto">
      {/* Top bar */}
      <div className="flex items-start justify-between mb-6 gap-4">
        <div className="flex items-start gap-4">
          <Sk className="w-7 h-7 rounded-lg mt-1 flex-shrink-0" />
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Sk className="h-6 w-56" />
              <Sk className="h-5 w-20 rounded-full" />
            </div>
            <Sk className="h-4 w-72" />
          </div>
        </div>
        <Sk className="h-5 w-24 flex-shrink-0 mt-1" />
      </div>

      {/* Main grid — mirrors the 3-column simulate layout */}
      <div className="grid grid-cols-12 gap-5">

        {/* Left column */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          <SkCard>
            <Sk className="h-3 w-36 mb-5" />
            {/* Score donut placeholder */}
            <div className="flex flex-col items-center gap-4 py-4">
              <Sk className="w-32 h-32 rounded-full" />
              <Sk className="h-5 w-24 rounded-full" />
            </div>
            <div className="space-y-2 mt-4">
              {[80, 65, 55, 45, 35, 70].map((w, i) => (
                <div key={i} className="flex items-center justify-between gap-3">
                  <Sk className="h-3 flex-1" style={{ maxWidth: `${w}%` } as React.CSSProperties} />
                  <Sk className="h-3 w-8" />
                </div>
              ))}
            </div>
          </SkCard>

          <SkCard>
            <Sk className="h-3 w-28 mb-4" />
            <div className="space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Sk className="w-6 h-6 rounded-full flex-shrink-0" />
                  <div className="flex-1">
                    <Sk className="h-3 w-28 mb-1.5" />
                    <Sk className="h-2.5 w-20" />
                  </div>
                </div>
              ))}
            </div>
          </SkCard>
        </div>

        {/* Centre column */}
        <div className="col-span-12 lg:col-span-6 space-y-5">
          <SkCard>
            <Sk className="h-3 w-32 mb-5" />
            <Sk className="h-48 w-full rounded-lg" />
            <div className="flex gap-6 mt-4">
              <Sk className="h-3 w-20" />
              <Sk className="h-3 w-20" />
              <Sk className="h-3 w-20" />
            </div>
          </SkCard>

          <SkCard>
            <Sk className="h-3 w-24 mb-5" />
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-zinc-800 p-3">
                  <Sk className="h-3 w-20 mb-2" />
                  <Sk className="h-6 w-28" />
                </div>
              ))}
            </div>
          </SkCard>
        </div>

        {/* Right column */}
        <div className="col-span-12 lg:col-span-3 space-y-5">
          <SkCard>
            <Sk className="h-3 w-28 mb-4" />
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-start justify-between gap-2">
                  <Sk className="h-4 w-32" />
                  <Sk className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          </SkCard>

          <SkCard>
            <Sk className="h-3 w-28 mb-4" />
            <div className="grid grid-cols-2 gap-2">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-zinc-800 p-3">
                  <Sk className="h-3 w-16 mb-2" />
                  <Sk className="h-5 w-12" />
                </div>
              ))}
            </div>
          </SkCard>

          <SkCard>
            <Sk className="h-3 w-28 mb-4" />
            <div className="space-y-2.5">
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <Sk className="h-3 w-full mb-1.5" />
                  <Sk className="h-2.5 w-4/5" />
                </div>
              ))}
            </div>
          </SkCard>
        </div>
      </div>
    </div>
  );
}
