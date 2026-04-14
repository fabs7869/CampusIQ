'use client'
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, Area, AreaChart
} from 'recharts'

const CHART_COLORS = {
  primary: '#6366f1',
  accent: '#06b6d4',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
}
const PIE_COLORS = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316']

const tooltipStyle = {
  backgroundColor: 'rgba(10,10,26,0.95)',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: '12px',
  color: '#e2e8f0',
}

// ─── Monthly Trend Chart ────────────────────────────────────────────────────
interface TrendData { month: string; total: number; resolved: number }
export function MonthlyTrendChart({ data }: { data: TrendData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.accent} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.accent} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="month" stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
        <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12, paddingTop: 12 }} />
        <Area type="monotone" dataKey="total" stroke={CHART_COLORS.primary} fill="url(#totalGrad)" strokeWidth={2} dot={false} name="Total" />
        <Area type="monotone" dataKey="resolved" stroke={CHART_COLORS.accent} fill="url(#resolvedGrad)" strokeWidth={2} dot={false} name="Resolved" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ─── Department Performance Chart ───────────────────────────────────────────
interface DeptData { department_name: string; total: number; resolved: number; pending: number }
export function DeptPerformanceChart({ data }: { data: DeptData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="department_name" stroke="#475569" tick={{ fill: '#64748b', fontSize: 10 }} />
        <YAxis stroke="#475569" tick={{ fill: '#64748b', fontSize: 11 }} />
        <Tooltip contentStyle={tooltipStyle} />
        <Legend wrapperStyle={{ color: '#94a3b8', fontSize: 12, paddingTop: 12 }} />
        <Bar dataKey="resolved" fill={CHART_COLORS.success} radius={[4, 4, 0, 0]} name="Resolved" />
        <Bar dataKey="pending" fill={CHART_COLORS.warning} radius={[4, 4, 0, 0]} name="Pending" />
      </BarChart>
    </ResponsiveContainer>
  )
}

// ─── Category Pie Chart ─────────────────────────────────────────────────────
interface CategoryData { category: string; count: number }
export function CategoryPieChart({ data }: { data: CategoryData[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={3}
          dataKey="count"
          nameKey="category"
          label={({ category, percent }) => `${category} (${(percent * 100).toFixed(0)}%)`}
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={tooltipStyle} formatter={(value, name) => [value, name]} />
      </PieChart>
    </ResponsiveContainer>
  )
}
