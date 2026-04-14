'use client'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, MessageSquare, Users, Building2,
  BarChart3, Map, Settings, Zap, ChevronLeft, ChevronRight, Bell
} from 'lucide-react'

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: MessageSquare, label: 'Complaints', href: '/dashboard/complaints' },
  { icon: Users, label: 'Users', href: '/dashboard/users' },
  { icon: Building2, label: 'Departments', href: '/dashboard/departments' },
  { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
  { icon: Map, label: 'Heatmap', href: '/dashboard/heatmap' },
  { icon: Bell, label: 'Notifications', href: '/dashboard/notifications' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

interface SidebarProps {
  activePath?: string
}

export default function AdminSidebar({ activePath = '/dashboard' }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="fixed left-0 top-0 h-screen glass border-r border-white/5 z-40 flex flex-col overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/5">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-cyan-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="overflow-hidden"
            >
              <div className="text-base font-bold gradient-text font-display whitespace-nowrap">CampusIQ</div>
              <div className="text-xs text-slate-500">Admin Panel</div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = activePath === item.href
          return (
            <a
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 mx-2 mb-1 px-3 py-3 rounded-xl transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-600/20 to-cyan-600/10 border border-indigo-500/30 text-white'
                  : 'text-slate-500 hover:bg-white/5 hover:text-slate-200'
              }`}
            >
              <item.icon
                className={`w-5 h-5 flex-shrink-0 transition-colors ${isActive ? 'text-indigo-400' : 'group-hover:text-slate-300'}`}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm font-medium whitespace-nowrap"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </a>
          )
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center py-4 border-t border-white/5 text-slate-500 hover:text-white transition-colors"
      >
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>
    </motion.aside>
  )
}
