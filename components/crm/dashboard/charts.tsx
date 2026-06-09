"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

export type Series = { key: string; name: string; color: string; format?: "number" | "euro" };

function fmt(value: number, format?: "number" | "euro") {
  if (format === "euro") {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
  }
  return new Intl.NumberFormat("fr-FR").format(value);
}

type TooltipEntry = { name: string; value: number; color: string; dataKey: string };

function ChartTooltip({
  active,
  payload,
  label,
  series
}: {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string;
  series: Series[];
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs shadow-premium">
      <p className="mb-1 font-semibold text-loden-ink">{label}</p>
      {payload.map((entry) => {
        const conf = series.find((s) => s.key === entry.dataKey);
        return (
          <p key={entry.dataKey} className="flex items-center gap-2 text-loden-muted">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} aria-hidden="true" />
            {entry.name} : <span className="font-semibold text-loden-ink">{fmt(entry.value, conf?.format)}</span>
          </p>
        );
      })}
    </div>
  );
}

/** Graphique d'aire (séries temporelles) avec dégradés LODENE. */
export function AreaTrendChart({
  data,
  series,
  height = 240
}: {
  data: Array<Record<string, string | number>>;
  series: Series[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          {series.map((s) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.28} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f3" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: "#94a3b8" }}
          tickLine={false}
          axisLine={false}
          minTickGap={24}
        />
        <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} width={44} allowDecimals={false} />
        <Tooltip content={<ChartTooltip series={series} />} cursor={{ stroke: "#cbd5e1", strokeWidth: 1 }} />
        {series.map((s) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.name}
            stroke={s.color}
            strokeWidth={2.5}
            fill={`url(#grad-${s.key})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export type DonutDatum = { name: string; value: number; color: string };

/** Donut avec libellé central + légende latérale. */
export function DonutChart({
  data,
  total,
  centerLabel,
  height = 220
}: {
  data: DonutDatum[];
  total: number;
  centerLabel: string;
  height?: number;
}) {
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
      <div className="relative" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius="64%"
              outerRadius="92%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d) => (
                <Cell key={d.name} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number, name: string) => [new Intl.NumberFormat("fr-FR").format(value), name]}
              contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold tracking-tight text-loden-ink">{new Intl.NumberFormat("fr-FR").format(total)}</span>
          <span className="text-xs text-loden-muted">{centerLabel}</span>
        </div>
      </div>
      <ul className="flex w-full flex-1 flex-col gap-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: d.color }} aria-hidden="true" />
            <span className="truncate text-loden-muted">{d.name}</span>
            <span className="ml-auto font-semibold text-loden-ink">{new Intl.NumberFormat("fr-FR").format(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
