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
  Map as MapIcon, 
  Activity,
  ShieldCheck,
  ChevronRight,
  Database,
  FileText,
  Download,
  AlertTriangle,
  Monitor,
  ChevronDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/context/ThemeContext';
import { exportAuditToPDF } from '@/lib/pdf-export';

export default function AdminDashboard() {
  const { theme } = useTheme();
  const [data, setData] = useState<any>(null);
  const [pulse, setPulse] = useState<any>(null);
  const [heatmap, setHeatmap] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Strategic Overview');
  const [showAuditExportDropdown, setShowAuditExportDropdown] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [summary, pulseRes, heatmapRes] = await Promise.all([
          api.get('/analytics/summary'),
          api.get('/analytics/campus-pulse'),
          api.get('/analytics/heatmap')
        ]);
        setData(summary.data);
        setPulse(pulseRes.data);
        setHeatmap(heatmapRes.data);
      } catch (error: any) {
        if (error.silent || error.response?.status === 401) return;
        toast.error('Failed to sync intelligence data.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const exportAuditToCSV = () => {
    const headers = ["Department", "Resolved", "In Progress", "Efficiency %"];
    const rows = data.department_stats.map((s: any) => [
      s.department_name,
      s.resolved,
      s.pending,
      `${Math.round((s.resolved/(s.resolved+s.pending)*100)) || 0}%`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map((r: any) => r.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CampusIQ_AuditLog_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6">
        <div className="relative w-16 h-16">
          <div className={`absolute inset-0 border-4 rounded-full ${theme === 'dark' ? 'border-blue-600/10' : 'border-gray-100'}`} />
          <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500 animate-pulse">Computing Campus Intelligence...</p>
      </div>
    );
  }

  if (!data || !pulse) return null;

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring" as const, stiffness: 200, damping: 20 } }
  };

  const kpis = [
    { title: 'System Load', value: data.total_complaints, icon: ClipboardList, color: 'blue', desc: 'Total tracked issues' },
    { title: 'Resolution', value: `${data.resolution_rate}%`, icon: ShieldCheck, color: 'green', desc: 'Efficiency rate' },
    { title: 'Live Pulse', value: pulse.system_reliability_score, icon: Activity, color: 'purple', desc: pulse.system_reliability_label },
    { title: 'Avg Response', value: `${pulse.avg_resolution_time_hours}h`, icon: Zap, color: 'yellow', desc: 'Time to resolve' },
  ];

  return (
    <motion.div 
      initial="hidden" animate="visible"
      transition={{ staggerChildren: 0.05 }}
      className={`p-4 md:p-8 space-y-10 max-w-[1800px] mx-auto pb-20 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}
    >
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <motion.div variants={itemVariants}>
          <div className="flex items-center gap-3 mb-2">
             <div className="px-3 py-1 rounded-full bg-blue-600/10 text-blue-600 border border-blue-600/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <BrainCircuit className="h-3 w-3" />
                Data Science Enabled
             </div>
             <div className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 border border-green-500/20 text-[9px] font-black uppercase tracking-widest">
                Real-time Sync
             </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-none mb-3">
            Campus <span className="text-blue-600">Command</span> Center
          </h1>
          <p className="text-sm md:text-base text-gray-500 font-bold uppercase tracking-tight max-w-2xl">
            Centralized intelligence portal utilizing predictive analytics to monitor institutional infrastructure and student welfare.
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className={`flex items-center gap-2 p-1.5 rounded-[2rem] shadow-xl ${theme === 'dark' ? 'bg-[#0d0d0d]' : 'bg-white'}`}>
          {['Strategic Overview', 'Data Labs', 'Reports'].map((tab) => (
            <button 
              key={tab} 
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all shrink-0 ${activeTab === tab ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-400'}`}
            >
              {tab}
            </button>
          ))}
        </motion.div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'Strategic Overview' && (
          <motion.div 
            key="overview"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="space-y-10"
          >
            {/* KPI Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {kpis.map((kpi) => (
                <div key={kpi.title} className={`group relative rounded-[2.5rem] p-8 overflow-hidden transition-all border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
                  <div className="flex flex-col gap-6 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ${theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                      <kpi.icon className={`h-7 w-7 text-blue-500`} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">{kpi.title}</p>
                      <h3 className="text-3xl font-black tracking-tight mb-1">{kpi.value}</h3>
                      <p className={`text-[10px] font-bold uppercase tracking-widest text-gray-500`}>{kpi.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className={`xl:col-span-2 rounded-[3.5rem] p-10 shadow-3xl relative overflow-hidden border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center justify-between mb-12">
                  <div>
                    <h3 className="text-2xl font-black tracking-tight mb-1">Departmental Efficiency</h3>
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Cross-unit resolution performance</p>
                  </div>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.department_stats}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                      <XAxis 
                        dataKey="department_name" 
                        axisLine={false} tickLine={false} 
                        tick={{fontSize: 9, fontWeight: 900, fill: '#6b7280'}} 
                        dy={10}
                      />
                      <YAxis 
                        axisLine={false} tickLine={false} 
                        tick={{fontSize: 9, fontWeight: 900, fill: '#6b7280'}} 
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(59, 130, 246, 0.05)' }}
                        contentStyle={{
                          backgroundColor: theme === 'dark' ? 'rgba(10, 10, 10, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                          backdropFilter: 'blur(12px)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRadius: '1.5rem',
                          padding: '1.5rem',
                          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'
                        }}
                        itemStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}
                      />
                      <Bar 
                        dataKey="resolved" 
                        fill="#2563eb" 
                        radius={[6, 6, 0, 0]} 
                        name="Resolved" 
                        barSize={24}
                        animationBegin={300}
                        animationDuration={1500}
                        animationEasing="ease-out"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className={`rounded-[3.5rem] p-10 shadow-3xl border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5' : 'bg-white border-gray-100'}`}>
                <div className="flex items-center gap-3 mb-10">
                  <Activity className="h-6 w-6 text-blue-500" />
                  <h3 className="text-xl font-black tracking-tight">Recent Activity</h3>
                </div>
                <div className="space-y-4">
                  {heatmap.slice(0, 5).map((point, idx) => (
                    <div key={idx} className={`p-5 rounded-3xl border ${theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                      <p className="text-xs font-black uppercase mb-1">{point.location}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-gray-500 font-bold uppercase">{point.count} Reports</span>
                        <span className="text-[10px] font-black text-blue-600">{Math.round(point.intensity * 100)}% LOAD</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Data Labs' && (
          <motion.div 
            key="labs"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-8"
          >
            <div className={`rounded-[3.5rem] p-10 border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5' : 'bg-white border-gray-100 shadow-2xl'}`}>
              <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-blue-600/10 flex items-center justify-center"><BrainCircuit className="h-6 w-6 text-blue-600" /></div>
                 <h3 className="text-2xl font-black tracking-tight">AI Predictive Load</h3>
              </div>
              <p className="text-gray-500 text-sm font-bold mb-8 uppercase tracking-widest">Predicting infrastructure failure before it happens based on spatial reporting density.</p>
              <div className="space-y-6">
                 {heatmap.map((point, i) => (
                   <div key={i} className="space-y-2">
                      <div className="flex justify-between text-[10px] font-black uppercase">
                         <span>{point.location}</span>
                         <span className={point.intensity > 0.7 ? 'text-red-500' : 'text-blue-500'}>
                            {point.intensity > 0.7 ? 'High Risk' : 'Optimal'}
                         </span>
                      </div>
                      <div className="h-2 bg-gray-500/10 rounded-full overflow-hidden">
                         <motion.div initial={{ width: 0 }} animate={{ width: `${point.intensity * 100}%` }} className={`h-full ${point.intensity > 0.7 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 'bg-blue-600'}`} />
                      </div>
                   </div>
                 ))}
              </div>
            </div>

            <div className={`rounded-[3.5rem] p-10 border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5' : 'bg-white border-gray-100 shadow-2xl'}`}>
               <div className="flex items-center gap-4 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-purple-600/10 flex items-center justify-center"><Monitor className="h-6 w-6 text-purple-600" /></div>
                 <h3 className="text-2xl font-black tracking-tight">System Reliability</h3>
              </div>
              <div className="flex flex-col items-center justify-center py-10">
                 <div className="text-7xl font-black text-blue-600 mb-2">{pulse.system_reliability_score}</div>
                 <div className="text-xs font-black uppercase tracking-widest text-gray-500 italic">Institutional Health Index</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">MTTR Prediction</p>
                    <p className="text-xl font-black">{pulse.avg_resolution_time_hours} Hours</p>
                 </div>
                 <div className={`p-6 rounded-3xl border ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                    <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1">Network Stability</p>
                    <p className="text-xl font-black">99.9%</p>
                 </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'Reports' && (
          <motion.div 
            key="reports"
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className={`rounded-[3.5rem] overflow-hidden border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5' : 'bg-white border-gray-100 shadow-2xl'}`}
          >
            <div className="p-10 border-b border-gray-500/10 flex items-center justify-between">
               <div>
                  <h3 className="text-2xl font-black tracking-tight mb-1">Institutional Audit Log</h3>
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest text-blue-600">Archival quality data for departmental review</p>
               </div>
                <div className="relative">
                   <button 
                    onClick={() => setShowAuditExportDropdown(!showAuditExportDropdown)}
                    className="flex items-center gap-3 bg-gray-500/10 hover:bg-gray-500/20 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                   >
                      <Download className="h-4 w-4" /> Export Audit
                      <ChevronDown className={`h-3 w-3 transition-transform ${showAuditExportDropdown ? 'rotate-180' : ''}`} />
                   </button>

                   <AnimatePresence>
                     {showAuditExportDropdown && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className={`absolute right-0 mt-2 z-[100] min-w-[180px] p-1.5 rounded-2xl shadow-3xl border backdrop-blur-2xl ${theme === 'dark' ? 'bg-[#0d0d0d]/95 border-white/10 shadow-black' : 'bg-white/95 border-gray-200'}`}
                        >
                          <button 
                            onClick={() => { exportAuditToCSV(); setShowAuditExportDropdown(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'hover:bg-green-500/10 text-gray-400 hover:text-green-500' : 'hover:bg-green-50 text-gray-600 hover:text-green-600'}`}
                          >
                             <Download className="h-4 w-4" /> CSV Report
                          </button>
                          <button 
                            onClick={() => { exportAuditToPDF(data.department_stats); setShowAuditExportDropdown(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-500' : 'hover:bg-red-50 text-gray-600 hover:text-red-600'}`}
                          >
                             <FileText className="h-4 w-4" /> PDF Document
                          </button>
                        </motion.div>
                     )}
                   </AnimatePresence>
                </div>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] font-black text-gray-500 uppercase tracking-widest border-b border-gray-500/10">
                       <th className="px-10 py-6">Department</th>
                       <th className="px-10 py-6">Resolved</th>
                       <th className="px-10 py-6">In Progress</th>
                       <th className="px-10 py-6">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-500/10">
                    {data.department_stats.map((dept: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-500/5 transition-colors">
                        <td className="px-10 py-6 text-sm font-black tracking-tight">{dept.department_name}</td>
                        <td className="px-10 py-6 text-sm font-bold">{dept.resolved}</td>
                        <td className="px-10 py-6 text-sm font-bold">{dept.pending}</td>
                        <td className="px-10 py-6">
                           <div className="flex items-center gap-2">
                             <div className="flex-1 h-1.5 bg-gray-500/10 rounded-full overflow-hidden w-20">
                                <div className="h-full bg-green-500" style={{ width: `${(dept.resolved/(dept.resolved+dept.pending)*100) || 0}%` }} />
                             </div>
                             <span className="text-[10px] font-black">{Math.round((dept.resolved/(dept.resolved+dept.pending)*100)) || 0}%</span>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
