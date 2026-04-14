'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, CheckCircle, Clock, Building2, Zap, Search, Filter, Upload, X } from 'lucide-react'

const STATUSES = ['all', 'submitted', 'under_review', 'in_progress', 'resolved'] as const
type Status = typeof STATUSES[number]

const STATUS_COLORS: Record<string, string> = {
  submitted: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  under_review: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  in_progress: 'text-orange-400 bg-orange-400/10 border-orange-400/20',
  resolved: 'text-green-400 bg-green-400/10 border-green-400/20',
  closed: 'text-slate-400 bg-slate-400/10 border-slate-400/20',
}

const mockComplaints = [
  { id: '1', title: 'Broken AC in Lab 3', description: 'Air conditioning unit has been broken for 2 weeks', category: 'electrical', location: 'Block A – Lab 3', status: 'submitted', before_image_url: '', upvote_count: 12, created_at: '2025-03-01T10:00:00Z', student_name: 'Ahmed Khan' },
  { id: '2', title: 'Leaking Pipe in Restroom', description: 'Water pipe leaking in men\'s restroom on 2nd floor', category: 'plumbing', location: 'Block B – 2nd Floor', status: 'under_review', before_image_url: '', upvote_count: 8, created_at: '2025-03-05T14:00:00Z', student_name: 'Sara Malik' },
  { id: '3', title: 'Broken Projector – Room 201', description: 'Projector not working, affecting all lectures', category: 'it_services', location: 'Academic Block – Room 201', status: 'in_progress', before_image_url: '', upvote_count: 31, created_at: '2025-03-07T09:00:00Z', student_name: 'Ali Hassan' },
]

export default function FacultyDashboard() {
  const [statusFilter, setStatusFilter] = useState<Status>('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<typeof mockComplaints[0] | null>(null)
  const [resolveModal, setResolveModal] = useState(false)
  const [remarks, setRemarks] = useState('')

  const filtered = mockComplaints.filter(c => {
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.location.toLowerCase().includes(search.toLowerCase())
    return matchStatus && matchSearch
  })

  const statCards = [
    { label: 'Total Assigned', value: mockComplaints.length, icon: MessageSquare, color: 'from-violet-600 to-indigo-600' },
    { label: 'Pending Review', value: mockComplaints.filter(c => c.status === 'submitted').length, icon: Clock, color: 'from-yellow-600 to-orange-600' },
    { label: 'In Progress', value: mockComplaints.filter(c => c.status === 'in_progress').length, icon: Building2, color: 'from-cyan-600 to-blue-600' },
    { label: 'Resolved', value: mockComplaints.filter(c => c.status === 'resolved').length, icon: CheckCircle, color: 'from-green-600 to-emerald-600' },
  ]

  return (
    <div className="min-h-screen" style={{ background: '#0a0a1a' }}>
      {/* Header */}
      <div className="glass border-b border-white/5 px-8 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-base font-bold gradient-text font-display">CampusIQ Faculty</div>
            <div className="text-xs text-slate-500">Department: Computer Science</div>
          </div>
        </div>
        <div className="text-sm text-slate-400">Dr. Sarah Johnson</div>
      </div>

      <div className="p-8">
        {/* Page title */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black font-display gradient-text">Complaints Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">Verify, assign, and resolve department complaints</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-5 border border-white/5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-black text-white">{s.value}</div>
              <div className="text-slate-500 text-xs mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl glass border border-white/10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div className="flex gap-2">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                  statusFilter === s
                    ? 'bg-indigo-600 text-white'
                    : 'glass border border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {s.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Complaints list */}
        <div className="space-y-4">
          <AnimatePresence>
            {filtered.map((c, i) => (
              <motion.div
                key={c.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: i * 0.06 }}
                className="glass rounded-2xl p-6 border border-white/5 hover:border-indigo-500/20 transition-all cursor-pointer group"
                onClick={() => setSelected(c)}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${STATUS_COLORS[c.status] || ''}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                      <span className="text-slate-600 text-xs">{c.category}</span>
                    </div>
                    <h3 className="text-white font-semibold text-base group-hover:gradient-text transition-colors">{c.title}</h3>
                    <p className="text-slate-500 text-sm mt-1 line-clamp-1">{c.description}</p>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-600">
                      <span>📍 {c.location}</span>
                      <span>👤 {c.student_name}</span>
                      <span>👍 {c.upvote_count} upvotes</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {c.status === 'submitted' && (
                      <button
                        onClick={e => { e.stopPropagation(); alert(`Verifying complaint: ${c.id}`) }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        Verify
                      </button>
                    )}
                    {c.status === 'in_progress' && (
                      <button
                        onClick={e => { e.stopPropagation(); setSelected(c); setResolveModal(true) }}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
                      >
                        <Upload size={12} className="inline mr-1" /> Resolve
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          {filtered.length === 0 && (
            <div className="text-center py-16 text-slate-600">No complaints found</div>
          )}
        </div>
      </div>

      {/* Resolve Modal */}
      <AnimatePresence>
        {resolveModal && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setResolveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9 }}
              className="glass rounded-3xl p-8 border border-indigo-500/20 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-white font-bold text-lg">Upload Resolution Proof</h3>
                <button onClick={() => setResolveModal(false)} className="text-slate-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>
              <p className="text-slate-400 text-sm mb-6">"{selected.title}"</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">After Image (Resolution Proof) *</label>
                  <div className="w-full h-32 rounded-xl border-2 border-dashed border-indigo-500/30 flex items-center justify-center cursor-pointer hover:border-indigo-500/60 transition-colors">
                    <div className="text-center">
                      <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">Click to upload resolution photo</p>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">Resolution Message</label>
                  <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    rows={3}
                    placeholder="Describe what was done to resolve this issue..."
                    className="w-full px-4 py-3 rounded-xl glass border border-white/10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500/50 resize-none"
                  />
                </div>
                <button
                  onClick={() => { setResolveModal(false); alert('Resolution submitted!') }}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold hover:opacity-90 transition-opacity"
                >
                  Submit Resolution
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
