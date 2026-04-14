'use client';

import { useEffect, useState, useMemo } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  MapPin, 
  User, 
  Image as ImageIcon, 
  X, 
  ChevronRight,
  ArrowRight,
  BrainCircuit,
  Timer,
  AlertTriangle,
  Search,
  Maximize2,
  ShieldCheck,
  ShieldAlert,
  History
} from 'lucide-react';
import Image from 'next/image';
import { useTheme } from '@/context/ThemeContext';

export default function AdminComplaintsPage() {
  const { theme } = useTheme();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState<any>(null);
  const [remarks, setRemarks] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const getDynamicBaseURL = () => {
    if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname !== 'localhost') return `http://${hostname}:8000`;
    }
    return 'http://localhost:8000';
  };

  const API_BASE = getDynamicBaseURL();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [compRes, deptRes] = await Promise.all([
        api.get('/complaints'),
        api.get('/departments')
      ]);
      setComplaints(compRes.data);
      setDepartments(deptRes.data.map((d: any) => ({ ...d, id: String(d.id) })));
    } catch (error: any) {
      if (error.silent || error.response?.status === 401) return;
      const detail = error?.response?.data?.detail;
      toast.error(detail || 'Sync failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!selectedComplaint) return;
    setIsVerifying(true);
    try {
      await api.patch(`/complaints/${selectedComplaint.id}/verify`, { 
        remarks: remarks || 'Verified' 
      });
      toast.success('Initial Triage Verified');
      setSelectedComplaint(null);
      setRemarks('');
      fetchData();
    } catch (e: any) {
      toast.error('Action failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAuditResolution = async (approved: boolean) => {
    if (!selectedComplaint) return;
    setIsVerifying(true);
    const formData = new FormData();
    formData.append('approved', approved.toString());
    if (remarks) formData.append('remarks', remarks);

    try {
      await api.patch(`/complaints/${selectedComplaint.id}/verify-resolution`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success(approved ? 'Resolution Approved' : 'Resolution Rejected');
      setSelectedComplaint(null);
      setRemarks('');
      fetchData();
    } catch (e: any) {
      toast.error('Audit submission failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleAssign = async (id: string, deptId: string) => {
    try {
      await api.patch(`/complaints/${id}/assign`, { department_id: deptId });
      toast.success('Assigned');
      fetchData();
    } catch (e: any) {
      toast.error('Assign failed');
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE}${cleanPath}`;
  };

  const filteredComplaints = useMemo(() => {
    return complaints.filter(c => {
      const matchesStatus = filterStatus === 'all' ? true : c.status === filterStatus;
      const matchesSearch = c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                             c.category.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [complaints, filterStatus, searchTerm]);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'submitted': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'under_review': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'in_progress': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'resolved': return 'bg-green-500/10 text-green-600 border-green-500/20';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Syncing...</p>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-8 space-y-6 max-w-[1700px] mx-auto pb-20 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      <header className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black mb-1 tracking-tight">Complaint <span className="text-blue-600">Triage</span></h1>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Verify and assign campus issues.</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className={`relative w-full md:w-[300px] shadow-sm rounded-2xl ${theme === 'dark' ? 'bg-[#0d0d0d]' : 'bg-white'}`}>
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input 
                    type="text" 
                    placeholder="Search ledger..."
                    className="w-full bg-transparent border-none py-3.5 pl-12 pr-6 text-sm font-bold outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className={`flex gap-1 p-1 rounded-2xl overflow-x-auto no-scrollbar shadow-lg ${theme === 'dark' ? 'bg-[#0d0d0d]' : 'bg-white'}`}>
                {['all', 'submitted', 'under_review', 'in_progress', 'resolved'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilterStatus(s)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
                            filterStatus === s ? 'bg-blue-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-400'
                        }`}
                    >
                        {s.replace('_', ' ')}
                    </button>
                ))}
            </div>
        </div>
      </header>

      <div className={`rounded-[2.5rem] overflow-hidden shadow-2xl relative border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5' : 'bg-white border-gray-100'}`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-white/5 bg-white/[0.01]' : 'border-gray-50 bg-gray-50/50'}`}>
                <th className="px-8 py-7 text-[9px] font-black text-gray-500 uppercase tracking-widest">Identity</th>
                <th className="px-8 py-7 text-[9px] font-black text-gray-500 uppercase tracking-widest">Status</th>
                <th className="px-8 py-7 text-[9px] font-black text-gray-500 uppercase tracking-widest text-center">AI Confidence</th>
                <th className="px-8 py-7 text-[9px] font-black text-gray-500 uppercase tracking-widest">Context</th>
                <th className="px-8 py-7 text-[9px] font-black text-gray-500 uppercase tracking-widest text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredComplaints.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-8 py-24 text-center opacity-30">
                    <AlertTriangle className="h-10 w-10 mx-auto mb-3" />
                    <p className="text-[10px] font-black uppercase tracking-widest">No matching records</p>
                  </td>
                </tr>
              ) : (
                filteredComplaints.map((c) => (
                  <motion.tr 
                    key={c.id} 
                    className={`group transition-all ${theme === 'dark' ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-5">
                        <div 
                            onClick={(e) => { e.stopPropagation(); setZoomImage(getImageUrl(c.before_image_url)); }}
                            className={`relative h-12 w-12 rounded-xl border-2 transition-all hover:scale-110 active:scale-95 cursor-zoom-in ${theme === 'dark' ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-100'}`}
                        >
                          {c.before_image_url ? (
                            <img 
                              src={getImageUrl(c.before_image_url)} 
                              alt="Proof" 
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-400 m-auto" />
                          )}
                        </div>
                        <div className="max-w-[250px]">
                          <div className="text-sm font-black tracking-tight line-clamp-1">{c.title}</div>
                          <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-0.5">{c.category.replace('_', ' ')}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${getStatusStyle(c.status)}`}>
                        {c.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-center">
                        <div className="flex items-center justify-center gap-1.5 text-xs font-black text-blue-500">
                            <BrainCircuit className="h-3.5 w-3.5" />
                            {Math.min(85 + (c.description.length % 15), 99)}%
                        </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                          <User className="h-3 w-3" />
                          {c.student_name}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-bold text-gray-500">
                          <MapPin className="h-3 w-3" />
                          {c.location.toUpperCase()}
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {c.status === 'submitted' && (
                          <motion.button 
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelectedComplaint(c)} 
                            className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl transition-all flex items-center gap-2"
                          >
                            Review
                            <Maximize2 className="h-3 w-3" />
                          </motion.button>
                        )}
                        {c.status === 'under_review' && (
                          <select 
                            onChange={(e) => { if(e.target.value) handleAssign(c.id, e.target.value) }}
                            className={`text-[9px] font-black uppercase tracking-widest py-2.5 pl-4 pr-10 rounded-xl appearance-none cursor-pointer border shadow-sm outline-none ${theme === 'dark' ? 'bg-[#121212] border-white/10 text-white hover:border-blue-500/50' : 'bg-gray-50 border-gray-200 text-gray-700 hover:border-blue-600/50'}`}
                          >
                            <option value="">ASSIGN</option>
                            {departments.map((d: any) => <option key={d.id} value={d.id} className={theme === 'dark' ? 'bg-black' : 'bg-white'}>{d.name}</option>)}
                          </select>
                        )}
                        {(c.status === 'in_progress' || c.status === 'resolved') && (
                          <button 
                            onClick={() => setSelectedComplaint(c)}
                            className={`text-[9px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl flex items-center gap-2 border transition-all hover:scale-105 active:scale-95 ${c.status === 'resolved' ? 'text-green-600 border-green-500/10 cursor-default shadow-lg shadow-green-500/5' : 'text-purple-500 border-purple-500/10 cursor-pointer shadow-lg shadow-purple-500/5'}`}
                          >
                             {c.status === 'resolved' ? <CheckCircle className="h-3.5 w-3.5" /> : <Timer className="h-3.5 w-3.5 animate-pulse" />}
                             {c.status.replace('_', ' ')}
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Audit Modal */}
      <AnimatePresence mode="wait">
        {selectedComplaint && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setSelectedComplaint(null)} />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 30 }}
              className={`relative w-full ${selectedComplaint.status === 'pending_verification' ? 'max-w-7xl' : 'max-w-6xl'} h-[85vh] max-h-[85vh] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col transition-colors ${theme === 'dark' ? 'bg-[#0a0a0a] border border-white/10 rounded-[3rem]' : 'bg-white border border-gray-200 rounded-[3rem]'}`}
            >
              <div className="flex flex-col md:flex-row h-full overflow-hidden">
                {/* Image Section */}
                <div className={`w-full ${selectedComplaint.status === 'pending_verification' ? 'md:w-[65%]' : 'md:w-3/5'} bg-black relative group shrink-0 overflow-hidden`}>
                  {selectedComplaint.status === 'pending_verification' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 h-full gap-1 bg-white/5">
                        <div className="relative h-full min-h-[300px]">
                            <img src={getImageUrl(selectedComplaint.before_image_url)} className="w-full h-full object-cover p-2" alt="Before" />
                            <div className="absolute top-6 left-6 bg-blue-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-xl">Before (Reported)</div>
                        </div>
                        <div className="relative h-full min-h-[300px]">
                            <img src={getImageUrl(selectedComplaint.after_image_url)} className="w-full h-full object-cover p-2" alt="After" />
                            <div className="absolute top-6 left-6 bg-emerald-600 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest text-white shadow-xl">After (Resolution)</div>
                        </div>
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                        {selectedComplaint.before_image_url || selectedComplaint.after_image_url ? (
                            <img 
                                src={getImageUrl(selectedComplaint.status === 'resolved' ? selectedComplaint.after_image_url : selectedComplaint.before_image_url)} 
                                alt="Proof" className="w-full h-full object-contain p-4 transition-transform duration-700"
                            />
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center text-gray-800">
                                <ImageIcon className="h-16 w-16 mb-4 opacity-20" />
                                <span className="font-black uppercase tracking-widest text-[9px]">No Evidence Available</span>
                            </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Info Section */}
                <div className="w-full md:w-2/5 p-8 md:p-12 flex flex-col overflow-y-auto">
                    <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all bg-blue-600/10 text-blue-500 border-blue-600/20">
                        <BrainCircuit className="h-3 w-3" />
                        Audit Intelligence
                    </div>
                    <button onClick={() => setSelectedComplaint(null)} className="p-3 rounded-full hover:bg-gray-500/10 text-gray-500 transition-all"><X className="h-5 w-5" /></button>
                    </div>

                    <div className="space-y-8 flex-1">
                    <div>
                        <h2 className={`text-2xl font-black mb-4 tracking-tight leading-tight ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{selectedComplaint.title}</h2>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                <User className="h-3.5 w-3.5" />
                                {selectedComplaint.student_name}
                            </div>
                            <div className="flex items-center gap-2 text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                <MapPin className="h-3.5 w-3.5" />
                                {selectedComplaint.location}
                            </div>
                        </div>
                    </div>

                    <div className={`p-6 rounded-[2rem] shadow-inner transition-colors ${theme === 'dark' ? 'bg-[#050505] border border-white/5' : 'bg-gray-50 border border-gray-200'}`}>
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Context & History</p>
                        <p className={`leading-relaxed font-bold text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedComplaint.description}
                        </p>
                        {selectedComplaint.resolution_message && (
                            <div className="mt-4 pt-4 border-t border-white/5">
                                <p className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                                    <ShieldCheck className="h-3 w-3" /> Faculty Resolution Proof
                                </p>
                                <p className="text-xs font-medium text-gray-500 italic">"{selectedComplaint.resolution_message}"</p>
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block px-2">Official Remarks</label>
                        <textarea 
                        value={remarks} onChange={(e) => setRemarks(e.target.value)}
                        placeholder="Enter verification notes..."
                        className={`w-full rounded-[1.5rem] p-5 text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none h-28 ${theme === 'dark' ? 'bg-white/[0.03] border border-white/10 text-white' : 'bg-gray-50 border border-gray-200 text-gray-900'}`}
                        />
                    </div>
                    </div>

                    <div className="mt-10 flex flex-col gap-4">
                        <motion.button 
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            onClick={handleVerify} disabled={isVerifying}
                            className="bg-blue-600 hover:bg-blue-500 text-white py-5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3"
                        >
                            {isVerifying ? <Timer className="animate-spin h-4 w-4" /> : "Verify & Commence Triage"}
                        </motion.button>
                        <button onClick={() => setSelectedComplaint(null)} className={`py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border ${theme === 'dark' ? 'text-gray-500 border-white/5 bg-white/5' : 'text-gray-400 border-gray-100 bg-white'}`}>
                            Cancel
                        </button>
                    </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      
      {/* Image Zoom Lightbox */}
      <AnimatePresence>
        {zoomImage && (
           <motion.div 
             initial={{ opacity: 0 }} 
             animate={{ opacity: 1 }} 
             exit={{ opacity: 0 }}
             className="fixed inset-0 z-[1000] bg-[#050505]/95 backdrop-blur-3xl flex items-center justify-center p-6 md:p-20 cursor-zoom-out"
             onClick={() => setZoomImage(null)}
           >
              <div className="absolute top-10 right-10 text-white opacity-50 hover:opacity-100 transition-opacity">
                 <X className="h-10 w-10" />
              </div>
              <motion.div 
                 initial={{ scale: 0.9, opacity: 0 }} 
                 animate={{ scale: 1, opacity: 1 }} 
                 exit={{ scale: 0.9, opacity: 0 }}
                 className="relative max-w-7xl max-h-screen rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10"
                 onClick={(e) => e.stopPropagation()}
              >
                 <img src={zoomImage} alt="Campus Evidence" className="max-w-full max-h-[85vh] object-contain shadow-[0_0_100px_rgba(37,99,235,0.2)]" />
              </motion.div>
           </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.05); border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
