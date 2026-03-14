'use client';

import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';

interface TreemapData {
  name: string;
  size: number;
  value?: number;
  currency?: string;
  children?: TreemapData[];
  [key: string]: unknown;
}

interface CustomTreemapProps {
  data: TreemapData[];
  colors?: string[];
  height?: number;
  baseCurrency?: string;
  formatCurrency?: (value: number, currency?: string) => string;
}

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

interface TooltipPayloadItem {
  payload: {
    name: string;
    size: number;
    currency?: string;
  };
}

interface TreemapTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  baseCurrency?: string;
  formatCurrency?: (value: number, currency?: string) => string;
}

function TreemapTooltip({ active, payload, baseCurrency, formatCurrency }: TreemapTooltipProps) {
  if (active && payload && payload.length) {
    const item = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-medium text-gray-900">{item.name}</p>
        <p className="text-sm text-gray-600">
          {formatCurrency
            ? formatCurrency(item.size, item.currency || baseCurrency)
            : `${item.size.toFixed(2)} ${item.currency || baseCurrency}`}
        </p>
        {item.currency && item.currency !== baseCurrency && (
          <p className="text-xs text-gray-500">
            Original: {item.size.toFixed(2)} {item.currency}
          </p>
        )}
      </div>
    );
  }
  return null;
}

interface ContentProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  size?: number;
  currency?: string;
  percentage?: number;
  index?: number;
  colors: string[];
  baseCurrency: string;
  formatCurrency?: (value: number, currency?: string) => string;
}

function TreemapContent({
  x = 0,
  y = 0,
  width = 0,
  height = 0,
  name,
  size = 0,
  currency,
  percentage,
  index = 0,
  colors,
  baseCurrency,
  formatCurrency,
}: ContentProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: colors[index % colors.length],
          stroke: '#fff',
          strokeWidth: 2,
          strokeOpacity: 1,
        }}
      />
      {width > 50 && height > 30 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill="#fff"
            fontSize={12}
            fontWeight="bold"
          >
            {name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 8}
            textAnchor="middle"
            fill="#fff"
            fontSize={10}
          >
            {formatCurrency
              ? formatCurrency(size, currency || baseCurrency)
              : `${size.toFixed(0)} ${currency || baseCurrency}`}{' '}
            - {percentage}%
          </text>
        </>
      )}
    </g>
  );
}

export function CustomTreemap({
  data,
  colors = DEFAULT_COLORS,
  height = 400,
  baseCurrency = 'USD',
  formatCurrency,
}: CustomTreemapProps) {
  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="#fff"
          fill="#8884d8"
          content={
            <TreemapContent
              colors={colors}
              baseCurrency={baseCurrency}
              formatCurrency={formatCurrency}
            />
          }
        >
          <Tooltip
            content={<TreemapTooltip baseCurrency={baseCurrency} formatCurrency={formatCurrency} />}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
