"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { fmtNum } from "@/lib/utils";
import type { YearlyMetric } from "@/lib/planetary/types";

interface TimelineChartProps {
  yearly: YearlyMetric[];
  claimedAnnual?: number;
}

function formatTick(value: number): string {
  return fmtNum(value, 0);
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name: string; value: number; color: string }[];
  label?: string;
}) => {
  if (!active || !payload?.length) return null;

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-3 shadow-xl text-xs">
      <div className="text-slate-400 mb-2 font-mono">Year {label}</div>
      {payload.map((entry) => (
        <div key={entry.name} className="flex justify-between gap-4">
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span className="font-mono text-slate-200">{fmtNum(entry.value)} tCO₂</span>
        </div>
      ))}
    </div>
  );
};

export function TimelineChart({ yearly, claimedAnnual }: TimelineChartProps) {
  if (!yearly.length) return null;

  const data = yearly.map((y) => ({
    year: y.year,
    Sequestered: y.co2_sequestered_tons,
    Avoided: y.co2_avoided_tons,
    Cumulative: y.cumulative_co2_tons,
  }));

  const hasAvoided = yearly.some((y) => y.co2_avoided_tons > 0);
  const hasSeq = yearly.some((y) => y.co2_sequestered_tons > 0);

  return (
    <div className="w-full">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-200">10-Year CO₂ Trajectory</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulated annual carbon impact via NVIDIA NIM
          </p>
        </div>
        {claimedAnnual && (
          <div className="text-right">
            <div className="text-xs text-slate-500">Claimed/year</div>
            <div className="font-mono text-xs text-amber-400">{fmtNum(claimedAnnual)} tCO₂</div>
          </div>
        )}
      </div>

      {/* Annual chart */}
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <defs>
            <linearGradient id="seqGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="avoidGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#60a5fa" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="year"
            tickFormatter={(v) => `Y${v}`}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatTick}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: "11px", color: "#64748b", paddingTop: "8px" }}
          />
          {claimedAnnual && (
            <ReferenceLine
              y={claimedAnnual}
              stroke="#fbbf24"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{
                value: "Claimed",
                fill: "#fbbf24",
                fontSize: 9,
                position: "insideTopRight",
              }}
            />
          )}
          {hasSeq && (
            <Area
              type="monotone"
              dataKey="Sequestered"
              stroke="#34d399"
              strokeWidth={2}
              fill="url(#seqGrad)"
            />
          )}
          {hasAvoided && (
            <Area
              type="monotone"
              dataKey="Avoided"
              stroke="#60a5fa"
              strokeWidth={2}
              fill="url(#avoidGrad)"
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Cumulative chart */}
      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 mb-2">Cumulative 10-Year Impact</div>
        <ResponsiveContainer width="100%" height={120}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
            <defs>
              <linearGradient id="cumGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="year"
              tickFormatter={(v) => `Y${v}`}
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatTick}
              tick={{ fill: "#64748b", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="Cumulative"
              stroke="#818cf8"
              strokeWidth={2}
              fill="url(#cumGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
