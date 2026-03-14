'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { DEFAULT_COLORS } from './index';

interface PieChartData {
  name: string;
  value: number;
  percentage?: number;
}

interface CustomPieChartProps {
  data: PieChartData[];
  colors?: string[];
  innerRadius?: number;
  outerRadius?: number;
  height?: number;
  showLabels?: boolean;
  showLegend?: boolean;
  baseCurrency?: string;
  formatCurrency?: (value: number, currency?: string) => string;
}

interface TooltipPayloadItem {
  payload: {
    name: string;
    value: number;
    currency?: string;
    percentage?: number;
    total?: number;
  };
}

interface LabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

interface TooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  formatCurrency?: (value: number, currency?: string) => string;
}

function CustomTooltip({ active, payload, formatCurrency }: TooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{item.name}</p>
        <p className="text-sm text-gray-600">
          {formatCurrency
            ? formatCurrency(item.value, item.currency)
            : `${item.value.toFixed(2)} ${item.currency}`}
        </p>
        <p className="text-sm text-gray-500">
          {item.percentage
            ? `${item.percentage.toFixed(1)}%`
            : item.total
              ? `${((item.value / item.total) * 100).toFixed(1)}%`
              : ''}
        </p>
      </div>
    );
  }
  return null;
}

export function CustomPieChart({
  data,
  colors = DEFAULT_COLORS,
  innerRadius = 60,
  outerRadius = 80,
  height = 256,
  showLabels = true,
  showLegend = true,
  formatCurrency,
}: CustomPieChartProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const renderLabel = (props: LabelProps) => {
    if (!showLabels) return null;

    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent > 0.05) {
      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor="middle"
          dominantBaseline="central"
          className="font-semibold text-xs"
          style={{
            filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))',
            pointerEvents: 'none',
          }}
        >
          {`${((percent || 0) * 100).toFixed(1)}%`}
        </text>
      );
    }
    return null;
  };

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index);
  };

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy={showLegend ? '45%' : '50%'}
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            fill="#8884d8"
            dataKey="value"
            label={renderLabel}
            labelLine={false}
            onMouseEnter={onPieEnter}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
                stroke={index === activeIndex ? '#333' : 'none'}
                strokeWidth={index === activeIndex ? 2 : 0}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip formatCurrency={formatCurrency} />} />
          {showLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => <span className="text-sm font-medium">{value}</span>}
            />
          )}
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
