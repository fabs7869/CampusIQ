'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, 
  MapPin, 
  Image as ImageIcon, 
  BrainCircuit, 
  Timer, 
  Send, 
  CloudUpload
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function FacultyComplaintsPage() {
  const { theme } = useTheme();
  const [complaints, setComplaints] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolveMessage, setResolveMessage] = useState('');
  const [resolveFile, setResolveFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
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
      const res = await api.get('/complaints/');
      setComplaints(res.data);
    } catch (error: any) {
      if (error.silent || error.response?.status === 401) return;
      console.error('Sync Error:', error);
      const detail = error?.response?.data?.detail;
      const status = error?.response?.status;
      const msg = detail || (status ? `Sync failed (Error ${status})` : 'Sync failed (Network Error)');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const setFileAndPreview = (file: File | null) => {
    setResolveFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingId || !resolveFile) {
       toast.error('Proof photo required');
       return;
    }
    const formData = new FormData();
    formData.append('after_image', resolveFile);
    if (resolveMessage) formData.append('resolution_message', resolveMessage);

    try {
      // Do NOT set Content-Type manually — axios must set it with the correct multipart boundary
      await api.post(`/complaints/${resolvingId}/resolve`, formData);
      toast.success('Resolution submitted for verification');
      setResolvingId(null);
      setResolveFile(null);
      setPreviewUrl(null);
      setResolveMessage('');
      setErrorMessage('');
      fetchData();
    } catch (err: any) {
      console.error('Submission Error:', err);
      const detail = err?.response?.data?.detail;
      const status = err?.response?.status;
      const msg = detail || (status ? `Error ${status}: Failed to submit` : 'Network Connection Error - check backend');
      setErrorMessage(msg);
      toast.error(msg);
    }
  };

  const getImageUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE}${cleanPath}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <div className="w-10 h-10 border-4 border-indigo-600/10 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">Syncing Triage Tasks...</p>
      </div>
    );
  }

  return (
    <div className={`p-4 md:p-8 space-y-8 max-w-[1700px] mx-auto pb-20 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      <header>
        <div className="flex items-center gap-3 mb-2">
            <div className="px-3 py-1 rounded-full bg-indigo-600/10 text-indigo-500 border border-indigo-600/20 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
                <BrainCircuit className="h-3 w-3" />
                Action Required
            </div>
        </div>
        <h1 className="text-2xl md:text-3xl font-black mb-1 tracking-tight">Active <span className="text-indigo-500">Assignments</span></h1>
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Execute resolutions and submit verified proof.</p>
      </header>
      
      {complaints.length === 0 ? (
        <div className={`rounded-[3rem] p-20 text-center border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5' : 'bg-white border-gray-100 shadow-xl'}`}>
           <CheckCircle className="h-16 w-16 mx-auto mb-6 text-green-500/20" />
           <p className="text-sm font-black uppercase tracking-[0.2em] text-gray-500">Department operational - all clear</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {complaints.map(c => (
            <motion.div 
                key={c.id} 
                layout
                className={`rounded-[3rem] overflow-hidden border flex flex-col sm:flex-row transition-all shadow-2xl ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5' : 'bg-white border-gray-100 hover:shadow-indigo-500/5'}`}
            >
              {/* Student Proof Image */}
              <div className="w-full sm:w-[240px] h-[240px] sm:h-auto bg-black relative shrink-0">
                 {c.before_image_url ? (
                    <img 
                       src={getImageUrl(c.before_image_url)} 
                       alt="Student Proof" 
                       className="w-full h-full object-cover p-1 opacity-80 hover:opacity-100 transition-opacity"
                    />
                 ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-800">
                       <ImageIcon className="h-10 w-10 mb-2 opacity-20" />
                       <span className="text-[8px] font-black uppercase tracking-widest">No Student Proof</span>
                    </div>
                 )}
                 <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-[8px] font-black uppercase tracking-widest text-white">
                    Initial Evidence
                 </div>
              </div>

              <div className="flex-1 p-8 flex flex-col">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-xl font-black tracking-tight leading-none mb-2">{c.title}</h3>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest border ${
                          c.status === 'resolved' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                          c.status === 'pending_verification' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
                        }`}>
                           {c.status.replace('_', ' ')}
                        </span>
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-gray-500 uppercase tracking-widest">
                           <MapPin className="h-3 w-3" />
                           {c.location}
                        </div>
                    </div>
                  </div>
                </div>

                <p className={`text-sm font-bold line-clamp-3 mb-8 flex-1 leading-relaxed ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{c.description}</p>

                <div className="mt-auto">
                  {c.status === 'in_progress' ? (
                     resolvingId === c.id ? (
                        <motion.form 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                            onSubmit={handleResolveSubmit} className="space-y-4"
                        >
                           <div className="flex gap-4">
                              <div className="flex-1 space-y-2">
                                <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest px-1">Resolution Intelligence</label>
                                <input 
                                    type="text" required placeholder="What was done?"
                                    value={resolveMessage} onChange={(e) => setResolveMessage(e.target.value)}
                                    className={`w-full text-sm font-bold py-3.5 px-5 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${theme === 'dark' ? 'bg-white/5 border border-white/5 text-white' : 'bg-gray-50 border border-gray-100 text-gray-900'}`}
                                />
                              </div>
                              <div className="w-16 h-16 shrink-0 relative rounded-2xl overflow-hidden border border-dashed border-gray-600 flex items-center justify-center group cursor-pointer">
                                 {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                 ) : (
                                    <CloudUpload className="h-6 w-6 text-gray-600 group-hover:text-indigo-500 transition-colors" />
                                 )}
                                 <input 
                                    type="file" accept="image/*" required
                                    onChange={(e) => setFileAndPreview(e.target.files?.[0] || null)}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                 />
                              </div>
                           </div>
                           <div className="flex gap-3">
                              <motion.button 
                                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                                type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                              >
                                <Send className="h-3.5 w-3.5" /> Submit Resolution
                              </motion.button>
                              <button type="button" onClick={() => setResolvingId(null)} className="px-5 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-500/5 transition-all">Cancel</button>
                           </div>
                        </motion.form>
                     ) : (
                        <motion.button 
                           whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                           onClick={() => setResolvingId(c.id)} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                        >
                           <Timer className="h-4 w-4" /> Commence Resolution
                        </motion.button>
                     )
                  ) : c.status === 'pending_verification' ? (
                    <div className="flex flex-col gap-3 w-full">
                       <div className="flex items-center justify-center gap-3 py-4 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-2xl font-black text-[9px] uppercase tracking-widest">
                          <Timer className="h-4 w-4 animate-pulse" /> Awaiting Institutional Audit
                       </div>
                       <p className="text-[8px] text-center text-gray-500 font-bold uppercase tracking-widest leading-relaxed">Proof submitted. Awaiting administrative verification before finalization.</p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-3 py-4 bg-green-500/10 text-green-500 border border-green-500/20 rounded-2xl font-black text-[9px] uppercase tracking-widest w-full">
                       <CheckCircle className="h-4 w-4" /> Finalized & Verified
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}
