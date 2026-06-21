import React from 'react'
import { TrendingUp } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts'

const STATUS_COLORS = {
  Active: '#168447',
  Assigned: '#176ea6',
  Borrowed: '#8a4f7d',
  'In Repair': '#b66a08',
  Returned: '#47707a',
  Disposed: '#7454a6',
  Lost: '#c93636'
}
const RESPONSIVE_CHART_PROPS = {
  width: '100%',
  height: '100%',
  minWidth: 0,
  minHeight: 260,
  initialDimension: { width: 320, height: 290 },
  debounce: 50
}

function ChartEmptyState({ message }) {
  return <div className="dashboard-chart-empty"><TrendingUp size={26} /><span>{message}</span></div>
}

function DashboardChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const tooltipColor = payload.length === 1
    ? payload[0].color || payload[0].payload?.fill || '#176ea6'
    : '#176ea6'

  return (
    <div className="dashboard-chart-tooltip" style={{ '--chart-tooltip-color': tooltipColor }}>
      {label && <strong>{label}</strong>}
      {payload.map(entry => (
        <div className="dashboard-chart-tooltip-row" key={`${entry.name}-${entry.value}`}>
          <i style={{ backgroundColor: entry.color || entry.payload?.fill || '#ffffff' }} />
          <span>{entry.name}</span>
          <b>{Number(entry.value || 0).toLocaleString()}</b>
        </div>
      ))}
    </div>
  )
}

export default function DashboardCharts({ trendData, categoryData, statusData, totalAssets }) {
  return (
    <div className="dashboard-analytics-grid">
      <article className="dashboard-chart-panel dashboard-chart-wide">
        <div className="dashboard-chart-header"><h3>Transaction Activity</h3><span>Last 6 months</span></div>
        <div className="dashboard-chart-body">
          <ResponsiveContainer {...RESPONSIVE_CHART_PROPS}>
            <LineChart data={trendData} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
              <CartesianGrid stroke="#e5eaf0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#657486', fontSize: 12 }} />
              <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#657486', fontSize: 12 }} />
              <Tooltip content={<DashboardChartTooltip />} cursor={{ stroke: '#9eb8c9', strokeDasharray: '4 4' }} offset={0} allowEscapeViewBox={{ x: true, y: true }} isAnimationActive={false} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Line type="monotone" dataKey="Transactions" stroke="#176ea6" strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="Issuances" stroke="#168447" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="Transfers" stroke="#b66a08" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </article>

      <article className="dashboard-chart-panel">
        <div className="dashboard-chart-header"><h3>Assets by Category</h3><span>{categoryData.length} categories</span></div>
        <div className="dashboard-chart-body">
          {categoryData.length ? (
            <ResponsiveContainer {...RESPONSIVE_CHART_PROPS}>
              <BarChart data={categoryData} margin={{ top: 8, right: 8, left: -20, bottom: 16 }}>
                <CartesianGrid stroke="#e5eaf0" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={55} tick={{ fill: '#657486', fontSize: 10 }} tickFormatter={value => value.length > 12 ? `${value.slice(0, 11)}...` : value} />
                <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: '#657486', fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#edf4f7' }} content={<DashboardChartTooltip />} offset={0} allowEscapeViewBox={{ x: true, y: true }} isAnimationActive={false} />
                <Bar dataKey="Assets" fill="#176ea6" radius={[4, 4, 0, 0]} maxBarSize={54} />
              </BarChart>
            </ResponsiveContainer>
          ) : <ChartEmptyState message="No inventory categories yet" />}
        </div>
      </article>

      <article className="dashboard-chart-panel">
        <div className="dashboard-chart-header"><h3>Asset Status</h3><span>{totalAssets} total</span></div>
        <div className="dashboard-chart-body">
          {statusData.length ? (
            <ResponsiveContainer {...RESPONSIVE_CHART_PROPS}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="46%" innerRadius="42%" outerRadius="68%" paddingAngle={2}>
                  {statusData.map(entry => <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || '#657486'} />)}
                </Pie>
                <Tooltip content={<DashboardChartTooltip />} offset={0} allowEscapeViewBox={{ x: true, y: true }} isAnimationActive={false} />
                <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <ChartEmptyState message="No asset status data yet" />}
        </div>
      </article>
    </div>
  )
}
