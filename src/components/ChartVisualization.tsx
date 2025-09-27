"use client";

import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  data: any[];
  options?: {
    title?: string;
    xAxisLabel?: string;
    yAxisLabel?: string;
    colors?: string[];
  };
}

interface ChartVisualizationProps {
  config: ChartConfig;
  className?: string;
}

const DEFAULT_COLORS = [
  '#3b82f6', // blue-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#06b6d4', // cyan-500
  '#84cc16', // lime-500
  '#f97316', // orange-500
];

export default function ChartVisualization({ config, className = "" }: ChartVisualizationProps) {
  const { type, data, options } = config;
  const colors = options?.colors || DEFAULT_COLORS;

  const renderBarChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name" 
          label={{ value: options?.xAxisLabel, position: 'insideBottom', offset: -5 }}
        />
        <YAxis 
          label={{ value: options?.yAxisLabel, angle: -90, position: 'insideLeft' }}
        />
        <Tooltip />
        <Legend />
        <Bar dataKey="value" fill={colors[0]} />
      </BarChart>
    </ResponsiveContainer>
  );

  const renderLineChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="name"
          label={{ value: options?.xAxisLabel, position: 'insideBottom', offset: -5 }}
        />
        <YAxis 
          label={{ value: options?.yAxisLabel, angle: -90, position: 'insideLeft' }}
        />
        <Tooltip />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="value" 
          stroke={colors[0]} 
          strokeWidth={2}
          dot={{ fill: colors[0] }}
        />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderPieChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderDoughnutChart = () => (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          innerRadius={40}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  );

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'doughnut':
        return renderDoughnutChart();
      default:
        return renderBarChart();
    }
  };

  return (
    <div className={`bg-white rounded-lg p-6 shadow-sm border border-gray-200 ${className}`}>
      {options?.title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
          {options.title}
        </h3>
      )}
      {renderChart()}
    </div>
  );
}

// Helper function to transform data for different chart types
export function transformDataForChart(
  data: any[], 
  xField: string, 
  yField: string, 
  chartType: ChartConfig['type']
): any[] {
  if (!data || data.length === 0) return [];

  return data.map(item => ({
    name: item[xField],
    value: Number(item[yField]) || 0,
    ...item // Include original data for tooltip
  }));
}

// Generate chart config based on query analysis
export function generateChartConfig(
  data: any[],
  queryType: string,
  fields: { x?: string; y?: string } = {}
): ChartConfig {
  const { x = 'name', y = 'value' } = fields;
  
  const transformedData = transformDataForChart(data, x, y, 'bar');
  
  switch (queryType) {
    case 'ranking':
    case 'top':
      return {
        type: 'bar',
        data: transformedData,
        options: {
          title: 'Top Performers',
          xAxisLabel: 'Items',
          yAxisLabel: 'Value',
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
        }
      };
      
    case 'trend':
    case 'time':
      return {
        type: 'line',
        data: transformedData,
        options: {
          title: 'Trend Analysis',
          xAxisLabel: 'Time Period',
          yAxisLabel: 'Value',
          colors: ['#3b82f6']
        }
      };
      
    case 'comparison':
    case 'distribution':
      return {
        type: 'pie',
        data: transformedData,
        options: {
          title: 'Distribution',
          colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
        }
      };
      
    default:
      return {
        type: 'bar',
        data: transformedData,
        options: {
          title: 'Data Analysis',
          xAxisLabel: 'Categories',
          yAxisLabel: 'Values'
        }
      };
  }
}
