'use client'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import AdminSidebar from '@/components/AdminSidebar'
import { MonthlyTrendChart, DeptPerformanceChart, CategoryPieChart } from '@/components/charts/AnalyticsCharts'
import { AlertTriangle, CheckCircle2, Clock, Users, TrendingUp, Activity } from 'lucide-react'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

// Mock data for development
const mockData = {
  total_complaints: 342,
  resolved_complaints: 289,
  pending_complaints: 31,
  in_progress_complaints: 22,
  resolution_rate: 84.5,
  monthly_trends: [
    { month: 'Oct 2024', total: 45, resolved: 38 },
    { month: 'Nov 2024', total: 62, resolved: 51 },
    { month: 'Dec 2024', total: 38, resolved: 35 },
    { month: 'Jan 2025', total: 71, resolved: 58 },
    { month: 'Feb 2025', total: 83, resolved: 67 },
    { month: 'Mar 2025', total: 43, resolved: 40 },
  ],
  department_stats: [
    { department_name: 'Maintenance', total: 98, resolved: 89, pending: 9 },
    { department_name: 'IT Services', total: 76, resolved: 62, pending: 14 },
    { department_name: 'Facilities', total: 54, resolved: 48, pending: 6 },
    { department_name: 'Security', total: 43, resolved: 40, pending: 3 },
    { department_name: 'Canteen', total: 31, resolved: 28, pending: 3 },
  ],
  category_distribution: [
    { category: 'Infrastructure', count: 89 },
    { category: 'Electrical', count: 67 },
    { category: 'Plumbing', count: 54 },
    { category: 'Cleanliness', count: 48 },
    { category: 'IT Services', count: 43 },
    { category: 'Security', count: 31 },
    { category: 'Other', count: 10 },
  ],
}

const statCards = [
  { icon: AlertTriangle, label: 'Total Complaints', key: 'total_complaints', color: 'from-violet-600 to-indigo-600', glow: '99,102,241' },
  { icon: CheckCircle2, label: 'Resolved', key: 'resolved_complaints', color: 'from-green-600 to-emerald-600', glow: '16,185,129' },
  { icon: Clock, label: 'Pending', key: 'pending_complaints', color: 'from-orange-600 to-amber-600', glow: '245,158,11' },
  { icon: Activity, label: 'In Progress', key: 'in_progress_complaints', color: 'from-cyan-600 to-blue-600', glow: '6,182,212' },
]

export default function AdminDashboard() {
  const [data, setData] = useState(mockData)
  const [loading, setLoading] = useState(false)

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a1a' }}>
      <AdminSidebar activePath="/dashboard" />

      <main className="flex-1 ml-[260px] p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-black font-display gradient-text">Admin Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Overview of campus complaint management</p>
        </motion.div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6 border border-white/5 hover:border-indigo-500/20 transition-all group"
              style={{ boxShadow: `0 0 30px rgba(${card.glow},0.05)` }}
            >
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <card.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-3xl font-black text-white mb-1">
                {(data as any)[card.key]?.toLocaleString() ?? '—'}
              </div>
              <div className="text-slate-500 text-xs">{card.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Resolution rate banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass rounded-2xl p-6 border border-green-500/20 mb-8 flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-600 to-emerald-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-white font-semibold">Overall Resolution Rate</div>
              <div className="text-slate-400 text-sm">Campus-wide complaint resolution performance</div>
            </div>
          </div>
          <div className="text-4xl font-black gradient-text">{data.resolution_rate}%</div>
        </motion.div>

        {/* Charts Row 1 */}
        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.35 }}
            className="glass rounded-2xl p-6 border border-white/5"
          >
            <h2 className="text-white font-semibold mb-1">Monthly Complaint Trends</h2>
            <p className="text-slate-500 text-xs mb-6">Total vs Resolved over last 6 months</p>
            <MonthlyTrendChart data={data.monthly_trends} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="glass rounded-2xl p-6 border border-white/5"
          >
            <h2 className="text-white font-semibold mb-1">Category Distribution</h2>
            <p className="text-slate-500 text-xs mb-6">Breakdown of complaint types</p>
            <CategoryPieChart data={data.category_distribution} />
          </motion.div>
        </div>

        {/* Charts Row 2 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="glass rounded-2xl p-6 border border-white/5"
        >
          <h2 className="text-white font-semibold mb-1">Department Performance</h2>
          <p className="text-slate-500 text-xs mb-6">Resolved vs Pending by department</p>
          <DeptPerformanceChart data={data.department_stats} />
        </motion.div>
      </main>
    </div>
  )
}
