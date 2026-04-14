'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth';
import Link from 'next/link';
import api from '@/lib/api';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  ClipboardList,
  Sun,
  Moon,
  ChevronRight,
  User as UserIcon,
  Bell,
  CheckCircle
} from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const isExpanded = isHovered || isSidebarOpen;

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000); // 30s poll
      return () => clearInterval(interval);
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications/');
      setNotifications(res.data);
      setUnreadCount(res.data.filter((n: any) => !n.is_read).length);
    } catch (error) {}
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      fetchNotifications();
    } catch (error) {}
  };

  const navigation = user?.role === 'admin' 
    ? [
        { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
        { name: 'Complaints', href: '/dashboard/admin/complaints', icon: ClipboardList },
        { name: 'Users', href: '/dashboard/admin/users', icon: Users },
        { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
      ]
    : [
        { name: 'Dashboard', href: '/dashboard/faculty', icon: LayoutDashboard },
        { name: 'Assigned Complaints', href: '/dashboard/faculty/complaints', icon: ClipboardList },
        { name: 'Settings', href: '/dashboard/faculty/settings', icon: Settings },
      ];

  return (
    <div className={`min-h-screen transition-colors duration-500 ${theme === 'dark' ? 'bg-[#050505] text-white' : 'bg-gray-50 text-gray-900'} flex selection:bg-blue-500/30`}>
      
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 lg:hidden bg-black/60 backdrop-blur-sm" 
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.div 
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        animate={{ 
          width: isExpanded ? 260 : 80,
          x: (isSidebarOpen || typeof window !== 'undefined' && window.innerWidth >= 1024) ? 0 : -260
        }}
        transition={{ type: "spring", stiffness: 450, damping: 35 }}
        className={`fixed inset-y-0 left-0 z-50 backdrop-blur-2xl transition-colors duration-500 lg:static lg:inset-auto flex flex-col overflow-hidden shadow-2xl ${
          theme === 'dark' 
          ? 'bg-[#0a0a0a]/95 border-r border-white/5' 
          : 'bg-white/95 border-r border-gray-200 shadow-indigo-500/5'
        }`}
      >
        <div className={`flex items-center h-20 px-6 border-b shrink-0 ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
          <Link href="/dashboard" className="flex items-center gap-4 group">
            <div className="relative w-9 h-9 overflow-hidden rounded-xl border border-white/10 group-hover:border-blue-500/50 transition-colors shrink-0">
              <Image src="/logo.png" alt="Logo" fill className="object-cover" />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
                  className="text-lg font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 whitespace-nowrap tracking-tight"
                >
                  CampusIQ
                </motion.span>
              )}
            </AnimatePresence>
          </Link>
        </div>

        <div className="flex-1 px-3 py-6 overflow-y-auto overflow-x-hidden space-y-1 custom-scrollbar">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link key={item.name} href={item.href} className="relative block group">
                <div className={`flex items-center gap-4 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${isActive ? 'bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)]' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'group-hover:text-blue-400'}`} />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">
                        {item.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </Link>
            );
          })}
        </div>

        <div className={`p-3 border-t bg-white/[0.01] ${theme === 'dark' ? 'border-white/5' : 'border-gray-100'}`}>
          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/5 overflow-hidden">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shadow-lg shrink-0">
              {user?.full_name?.charAt(0)}
            </div>
            {isExpanded && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white truncate">{user?.full_name}</p>
                <p className="text-[8px] text-gray-500 truncate uppercase tracking-widest">{user?.role}</p>
              </motion.div>
            )}
          </div>
          
          <button 
            onClick={logout}
            className={`mt-2 flex items-center justify-center gap-3 w-full py-2.5 text-[9px] font-black uppercase tracking-widest text-red-500 bg-red-500/5 border border-red-500/10 rounded-xl hover:bg-red-500/10 transition-all ${!isExpanded && 'px-0'}`}
          >
            <LogOut className="h-3.5 w-3.5 shrink-0" />
            {isExpanded && <span>Exit</span>}
          </button>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className={`h-20 flex items-center justify-between px-6 md:px-10 border-b transition-colors duration-500 ${theme === 'dark' ? 'bg-[#0a0a0a]/50 border-white/5' : 'bg-white border-gray-200'} backdrop-blur-md relative z-30`}>
          <div className="flex items-center gap-4">
            <button className="lg:hidden text-gray-500 hover:text-blue-500 transition-colors" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-5 w-5" />
            </button>
            <div className="hidden md:flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.2em] text-gray-500">
               {user?.role} portal <ChevronRight className="h-3 w-3" /> 
               <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{pathname.split('/').pop()?.replace('-', ' ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-5">
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-yellow-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
            >
              {theme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
            </motion.button>
            
            <div className="relative">
              <motion.button 
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => {
                   setShowNotifications(!showNotifications);
                   if (!showNotifications && unreadCount > 0) markAllRead();
                }}
                className={`p-2.5 rounded-xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'}`}
              >
                <Bell className="h-4.5 w-4.5" />
                {unreadCount > 0 && <span className="absolute top-2.5 right-2.5 w-1.5 h-1.5 bg-blue-600 rounded-full" />}
              </motion.button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }}
                    className={`absolute right-0 mt-3 w-80 rounded-[2rem] shadow-3xl border z-[100] overflow-hidden ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/10 shadow-black' : 'bg-white border-gray-100 shadow-xl'}`}
                  >
                    <div className={`p-5 border-b flex items-center justify-between ${theme === 'dark' ? 'border-white/5' : 'border-gray-50'}`}>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-gray-500 underline underline-offset-4 decoration-blue-500">Live Alerts</h4>
                      <span className="text-[8px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">Notification Type: Contextual</span>
                    </div>
                    <div className="max-h-[350px] overflow-y-auto no-scrollbar">
                      {notifications.length === 0 ? (
                        <div className="p-10 text-center text-[9px] font-black uppercase tracking-widest text-gray-500 opacity-30">No notifications</div>
                      ) : (
                        notifications.map((notif, i) => (
                          <div key={i} className={`p-5 border-b last:border-0 hover:bg-white/[0.02] transition-all ${theme === 'dark' ? 'border-white/5' : 'border-gray-50'}`}>
                            <div className="flex gap-4">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-50'}`}>
                                 <Bell className={`h-4 w-4 ${notif.is_read ? 'text-gray-500' : 'text-blue-500'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <p className="text-[11px] font-black tracking-tight truncate">{notif.title}</p>
                                    <span className="text-[7px] font-black text-gray-500 bg-gray-500/10 px-1.5 py-0.5 rounded uppercase">{notif.type.replace('_',' ')}</span>
                                </div>
                                <p className="text-[9px] text-gray-500 font-bold leading-relaxed">{notif.message}</p>
                                <p className="text-[8px] text-gray-400 mt-2 font-black uppercase tracking-tighter">Ref# {notif.id.slice(0,8)}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className={`h-8 w-px ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'} hidden md:block`} />

            <div className="flex items-center gap-3 pr-2">
              <div className="text-right hidden sm:block">
                <p className={`text-[10px] font-black uppercase tracking-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{user?.full_name}</p>
                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">Institutional User</p>
              </div>
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black shadow-lg shadow-blue-500/20">
                 {user?.full_name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Backgrounds */}
        {theme === 'dark' && (
          <>
            <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
          </>
        )}

        <main className={`flex-1 overflow-y-auto custom-scrollbar relative z-10 p-0`}>
          <AnimatePresence mode="wait">
            <motion.div
              key={pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: ${theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}; border-radius: 10px; }
      `}</style>
    </div>
  );
}
