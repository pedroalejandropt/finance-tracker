'use client';

import { ResponsiveContainer, Treemap, Tooltip } from 'recharts';

interface TreemapData {
  name: string;
  size: number;
  value?: number;
  currency?: string;
  children?: TreemapData[];
  [key: string]: any; // Add index signature for recharts compatibility
}

interface CustomTreemapProps {
  data: TreemapData[];
  colors?: string[];
  height?: number;
  baseCurrency?: string;
  formatCurrency?: (value: number, currency?: string) => string;
}

const DEFAULT_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function CustomTreemap({
  data,
  colors = DEFAULT_COLORS,
  height = 400,
  baseCurrency = 'USD',
  formatCurrency
}: CustomTreemapProps) {
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{data.name}</p>
          <p className="text-sm text-gray-600">
            {formatCurrency
              ? formatCurrency(data.size, data.currency || baseCurrency)
              : `${data.size.toFixed(2)} ${data.currency || baseCurrency}`
            }
          </p>
          {data.currency && data.currency !== baseCurrency && (
            <p className="text-xs text-gray-500">
              Original: {data.size.toFixed(2)} {data.currency}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomContent = (props: any) => {
    const { x, y, width, height, name, size, currency, percentage } = props;

    return (
      <g>
        <rect
          x={x}
          y={y}
          width={width}
          height={height}
          style={{
            fill: colors[Math.floor(Math.random() * colors.length)],
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
                : `${size.toFixed(0)} ${currency || baseCurrency}`
              } - {percentage}%
            </text>
            {/* <text
              x={x + width / 2}
              y={y + height / 2 + 24}
              textAnchor="middle"
              fill="#fff"
              fontSize={10}
            >
              {percentage}%
            </text> */}
          </>
        )}
      </g>
    );
  };

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={data}
          dataKey="size"
          aspectRatio={4 / 3}
          stroke="#fff"
          fill="#8884d8"
          content={<CustomContent />}
        >
          <Tooltip content={<CustomTooltip />} />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}
