'use client';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { NetWorthSnapshot } from '@/types';
import { FinancialCalculator } from '@/lib/calculations';

interface NetWorthChartProps {
  snapshots: NetWorthSnapshot[];
  baseCurrency?: string;
  height?: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: { value: number }[];
  label?: string;
  baseCurrency: string;
}

function CustomTooltip({ active, payload, label, baseCurrency }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
        <p className="text-base font-semibold">
          {FinancialCalculator.formatCurrency(payload[0].value, baseCurrency)}
        </p>
      </div>
    );
  }
  return null;
}

function formatXAxis(dateStr: string) {
  const [, month, day] = dateStr.split('-');
  return `${parseInt(month)}/${parseInt(day)}`;
}

export function NetWorthChart({
  snapshots,
  baseCurrency = 'USD',
  height = 240,
}: NetWorthChartProps) {
  // De-duplicate: keep only the latest snapshot per day
  const byDate = new Map<string, NetWorthSnapshot>();
  for (const s of snapshots) {
    byDate.set(s.date, s);
  }
  const data = Array.from(byDate.values())
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((s) => ({ date: s.date, value: s.totalUSD }));

  if (data.length < 2) {
    return (
      <div
        className="flex items-center justify-center text-muted-foreground text-sm"
        style={{ height }}
      >
        Not enough data yet. Check back after a few days to see your net worth trend.
      </div>
    );
  }

  const minValue = Math.min(...data.map((d) => d.value));
  const maxValue = Math.max(...data.map((d) => d.value));
  const padding = (maxValue - minValue) * 0.1 || maxValue * 0.1;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="netWorthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#0088FE" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#0088FE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis
            dataKey="date"
            tickFormatter={formatXAxis}
            tick={{ fontSize: 11 }}
            tickLine={false}
          />
          <YAxis
            domain={[minValue - padding, maxValue + padding]}
            tickFormatter={(v) => FinancialCalculator.formatCurrency(v, baseCurrency, true)}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={72}
          />
          <Tooltip content={<CustomTooltip baseCurrency={baseCurrency} />} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#0088FE"
            strokeWidth={2}
            fill="url(#netWorthGradient)"
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
