'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import AdminSidebar from '@/components/AdminSidebar'
import { Map, AlertTriangle, Flame } from 'lucide-react'

// Sample heatmap data — in production, fetched from GET /api/v1/analytics/heatmap
const heatmapData = [
  { location: 'Block A – Ground Floor', location_x: 15, location_y: 20, count: 24, intensity: 1.0 },
  { location: 'Canteen', location_x: 50, location_y: 70, count: 18, intensity: 0.75 },
  { location: 'Library', location_x: 75, location_y: 25, count: 15, intensity: 0.63 },
  { location: 'Block B – 2nd Floor', location_x: 30, location_y: 55, count: 12, intensity: 0.5 },
  { location: 'Parking Lot', location_x: 85, location_y: 80, count: 10, intensity: 0.42 },
  { location: 'Sports Complex', location_x: 60, location_y: 88, count: 8, intensity: 0.33 },
  { location: 'Admin Block', location_x: 45, location_y: 12, count: 6, intensity: 0.25 },
  { location: 'Hostel A', location_x: 10, location_y: 65, count: 5, intensity: 0.21 },
]

function getHeatColor(intensity: number): string {
  if (intensity > 0.8) return '#ef4444'
  if (intensity > 0.6) return '#f97316'
  if (intensity > 0.4) return '#eab308'
  if (intensity > 0.2) return '#22c55e'
  return '#06b6d4'
}

export default function HeatmapPage() {
  const [hovered, setHovered] = useState<typeof heatmapData[0] | null>(null)

  return (
    <div className="min-h-screen flex" style={{ background: '#0a0a1a' }}>
      <AdminSidebar activePath="/dashboard/heatmap" />

      <main className="flex-1 ml-[260px] p-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-black font-display gradient-text">Campus Heatmap</h1>
          <p className="text-slate-500 text-sm mt-1">Complaint density across campus locations</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Heatmap Canvas */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="lg:col-span-2 glass rounded-2xl border border-white/5 p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Map className="w-5 h-5 text-indigo-400" />
              <span className="text-white font-semibold">Campus Map View</span>
            </div>

            {/* Map container */}
            <div
              className="relative w-full rounded-xl overflow-hidden"
              style={{
                height: 400,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                border: '1px solid rgba(255,255,255,0.05)',
              }}
            >
              {/* Grid lines */}
              <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#6366f1" strokeWidth="0.5" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
              </svg>

              {/* Campus blocks background */}
              {[
                { x: '5%', y: '5%', w: '18%', h: '22%', label: 'Block A' },
                { x: '25%', y: '35%', w: '14%', h: '18%', label: 'Block B' },
                { x: '68%', y: '8%', w: '16%', h: '14%', label: 'Library' },
                { x: '40%', y: '60%', w: '20%', h: '15%', label: 'Canteen' },
                { x: '75%', y: '68%', w: '18%', h: '12%', label: 'Parking' },
              ].map((b, i) => (
                <div
                  key={i}
                  className="absolute rounded-lg flex items-center justify-center"
                  style={{
                    left: b.x, top: b.y, width: b.w, height: b.h,
                    background: 'rgba(99,102,241,0.06)',
                    border: '1px solid rgba(99,102,241,0.15)',
                  }}
                >
                  <span className="text-slate-600 text-xs">{b.label}</span>
                </div>
              ))}

              {/* Heatmap dots */}
              {heatmapData.map((point, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="absolute cursor-pointer"
                  style={{
                    left: `${point.location_x}%`,
                    top: `${point.location_y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                  onMouseEnter={() => setHovered(point)}
                  onMouseLeave={() => setHovered(null)}
                >
                  {/* Glow ring */}
                  <div
                    className="absolute rounded-full animate-ping"
                    style={{
                      width: 32 + point.intensity * 24,
                      height: 32 + point.intensity * 24,
                      background: getHeatColor(point.intensity),
                      opacity: 0.15,
                      transform: 'translate(-50%, -50%)',
                      top: '50%',
                      left: '50%',
                    }}
                  />
                  {/* Main dot */}
                  <div
                    className="rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg"
                    style={{
                      width: 28 + point.intensity * 16,
                      height: 28 + point.intensity * 16,
                      background: getHeatColor(point.intensity),
                      boxShadow: `0 0 20px ${getHeatColor(point.intensity)}60`,
                    }}
                  >
                    {point.count}
                  </div>
                </motion.div>
              ))}

              {/* Tooltip */}
              {hovered && (
                <div className="absolute bottom-4 left-4 glass rounded-xl p-3 border border-white/10 z-10">
                  <div className="text-white text-sm font-semibold">{hovered.location}</div>
                  <div className="text-slate-400 text-xs">{hovered.count} complaints reported</div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 mt-2 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${hovered.intensity * 100}%`, background: getHeatColor(hovered.intensity) }} />
                  </div>
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 justify-center">
              {[
                { label: 'Critical', color: '#ef4444' },
                { label: 'High', color: '#f97316' },
                { label: 'Medium', color: '#eab308' },
                { label: 'Low', color: '#22c55e' },
                { label: 'Minimal', color: '#06b6d4' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full" style={{ background: l.color }} />
                  <span className="text-slate-500 text-xs">{l.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Location list */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl border border-white/5 p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="text-white font-semibold">Hotspots Ranked</span>
            </div>
            <div className="space-y-3">
              {[...heatmapData].sort((a, b) => b.count - a.count).map((p, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold"
                    style={{ background: getHeatColor(p.intensity) + '22', color: getHeatColor(p.intensity) }}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-slate-300 text-sm truncate">{p.location}</div>
                    <div className="h-1 mt-1 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${p.intensity * 100}%`, background: getHeatColor(p.intensity) }} />
                    </div>
                  </div>
                  <div className="text-slate-400 text-sm font-medium">{p.count}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
