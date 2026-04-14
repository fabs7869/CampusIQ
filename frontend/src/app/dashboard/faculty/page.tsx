'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { 
  ClipboardList, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  BrainCircuit,
  Zap,
  Activity,
  History
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';

export default function FacultyDashboard() {
  const { theme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [pulse, setPulse] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Active Tasks');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [summary, pulseRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/campus-pulse')
        ]);
        setData(summary.data);
        setPulse(pulseRes.data);
      } catch (error: any) {
        if (!error.silent) {
          toast.error('Failed to load department analytics.');
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="relative w-16 h-16">
          <div className={`absolute inset-0 border-4 rounded-full ${theme === 'dark' ? 'border-blue-600/10' : 'border-gray-100'}`} />
          <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 animate-pulse">Syncing Department Intelligence...</p>
      </div>
    );
  }

  if (!data || !pulse) return null;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 200, damping: 20 } }
  };

  const kpis = [
    { title: 'Assigned Issues', value: data.total_complaints, icon: ClipboardList, color: 'blue' },
    { title: 'Resolved Tasks', value: data.resolved_complaints, icon: CheckCircle, color: 'green' },
    { title: 'Avg Speed', value: `${pulse.avg_resolution_time_hours}h`, icon: Zap, color: 'yellow' },
    { title: 'Efficiency', value: `${data.resolution_rate}%`, icon: TrendingUp, color: 'indigo' },
  ];

  return (
    <div 
      className={`p-4 md:p-8 space-y-10 max-w-[1600px] mx-auto pb-20 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
    >
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
             <div className="px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                <BrainCircuit className="h-3 w-3" />
                Department Intelligence Mode
             </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none mb-3">
            Faculty <span className="text-indigo-400">Hub</span>
          </h1>
          <p className="text-sm md:text-base text-gray-500 font-bold uppercase tracking-tight max-w-md">
            Department-specific triage monitoring and resolution performance dashboard.
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className={`flex items-center gap-2 p-1.5 rounded-[2rem] shadow-xl ${theme === 'dark' ? 'bg-[#0d0d0d]' : 'bg-white'}`}>
          {['Active Tasks', 'Resolutions'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shrink-0 ${activeTab === tab ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:text-indigo-400'}`}
            >
              {tab}
            </button>
          ))}
        </motion.div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'Active Tasks' && (
          <motion.div 
            key="tasks"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              visible: { transition: { staggerChildren: 0.05 } }
            }}
            className="space-y-10"
          >
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {kpis.map((kpi) => (
                <motion.div
                  key={kpi.title}
                  variants={itemVariants}
                  whileHover={{ y: -5, scale: 1.02 }}
                  className={`group relative rounded-[2.5rem] p-8 overflow-hidden shadow-2xl transition-all border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5' : 'bg-white border-gray-100'}`}
                >
                  <div className={`absolute -right-8 -bottom-8 w-32 h-32 bg-${kpi.color}-500/10 blur-3xl rounded-full group-hover:scale-150 transition-transform duration-700`} />
                  <div className="flex flex-col gap-6 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl bg-${kpi.color}-500/10 border border-${kpi.color}-500/20 flex items-center justify-center group-hover:bg-${kpi.color}-600 group-hover:border-transparent transition-all duration-300 shadow-lg`}>
                      <kpi.icon className={`h-7 w-7 text-${kpi.color}-500 group-hover:text-white transition-colors`} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{kpi.title}</p>
                      <h3 className="text-3xl font-black tracking-tight">{kpi.value}</h3>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <motion.div 
              variants={itemVariants}
              className={`rounded-[3.5rem] p-10 shadow-3xl relative overflow-hidden border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]' : 'bg-white border-gray-100 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.05)]'}`}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-600 opacity-30" />
              <div className="flex items-center justify-between mb-12">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                      <Activity className="h-4 w-4 text-indigo-500 animate-pulse" />
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Efficiency Matrix</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight mb-1">Resolution Velocity</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Monitoring department-wide completion rates & load distribution</p>
                </div>
              </div>
              
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data.department_stats?.filter((d: any) => d.resolved > 0 || d.pending > 0)} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} />
                    <XAxis 
                      dataKey="department_name" 
                      axisLine={false} tickLine={false} 
                      tick={{fill: '#6b7280', fontSize: 10, fontWeight: 900}}
                      dy={15}
                    />
                    <YAxis 
                      axisLine={false} tickLine={false} 
                      tick={{fill: '#6b7280', fontSize: 10, fontWeight: 900}} 
                    />
                    <Tooltip 
                      cursor={{fill: 'rgba(99, 102, 241, 0.05)'}}
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#0a0a0a' : '#fff',
                        border: 'none',
                        borderRadius: '24px',
                        padding: '20px',
                        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
                      }}
                    />
                    <Bar dataKey="resolved" fill="#6366f1" radius={[8, 8, 8, 8]} name="Resolved" barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'Resolutions' && (
          <motion.div 
            key="resolutions"
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={{
              visible: { transition: { staggerChildren: 0.1 } }
            }}
            className="space-y-10"
          >
            <div className={`rounded-[3.5rem] p-10 shadow-3xl relative overflow-hidden border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5 shadow-black' : 'bg-white border-gray-100 shadow-xl'}`}>
              <div className="flex items-center justify-between mb-12">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                      <History className="h-4 w-4 text-emerald-500" />
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Historical Performance</span>
                  </div>
                  <h3 className="text-2xl font-black tracking-tight mb-1">Impact Trend</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Monthly resolution volume and institutional throughput</p>
                </div>
              </div>

              <div className="h-[450px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data.monthly_trends} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)"} />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10, fontWeight: 900}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 10, fontWeight: 900}} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: theme === 'dark' ? '#0a0a0a' : '#fff',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '15px'
                      }}
                    />
                    <Area type="monotone" dataKey="total" stroke="#6366f1" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                    <Area type="monotone" dataKey="resolved" stroke="#10b981" fillOpacity={1} fill="url(#colorResolved)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
