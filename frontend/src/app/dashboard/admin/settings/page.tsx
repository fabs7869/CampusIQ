'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building, 
  Lock, 
  Trash2, 
  Save,
  ShieldCheck,
  History,
  UserCog,
  LogOut
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/auth';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { theme } = useTheme();
  const { logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Information Updated');
    }, 800);
  };

  const handleClearActivity = () => {
    if (confirm('This will clear your local notification view. Continue?')) {
      toast.success('Logs Cleared');
    }
  };

  return (
    <div className={`p-4 md:p-8 space-y-12 max-w-[900px] mx-auto pb-24 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-500/10 pb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tighter">System <span className="text-blue-600">Control</span></h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Adjust primary campus settings and security.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handleUpdate} disabled={isSaving}
          className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20"
        >
          {isSaving ? <span className="animate-pulse">Saving...</span> : (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          )}
        </motion.button>
      </header>

      {/* Sections */}
      <div className="space-y-12">
        
        {/* Section 1: Campus Identity */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2 px-1">
             <Building className="h-5 w-5 text-blue-500" />
             <h2 className="text-lg font-black uppercase tracking-tight">Campus Profile</h2>
          </div>
          <div className={`p-8 rounded-[2rem] border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5 shadow-black' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Official Institution Name</label>
               <input 
                 defaultValue="CampusIQ Educational Institute" 
                 className={`w-full px-6 py-4 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`} 
               />
            </div>
          </div>
        </section>

        {/* Section 2: Security & Login */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2 px-1">
             <ShieldCheck className="h-5 w-5 text-green-500" />
             <h2 className="text-lg font-black uppercase tracking-tight">Security & Privacy</h2>
          </div>
          <div className={`p-8 rounded-[2rem] border space-y-8 ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5 shadow-black' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Quick Password Reset</label>
                  <input 
                    type="password" placeholder="Enter new password"
                    className={`w-full px-6 py-4 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`} 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Enforce 2-Step Verification</label>
                  <select className={`w-full px-6 py-4 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`}>
                     <option>Recommended (Admins Only)</option>
                     <option>Strict (Everyone)</option>
                     <option>Disabled</option>
                  </select>
               </div>
            </div>
            
            <div className={`p-6 rounded-3xl flex items-center justify-between transition-all ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
               <div className="flex items-center gap-4">
                  <History className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm font-black tracking-tight">Public Activity Tracking</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Allow students to see resolution count</p>
                  </div>
               </div>
               <div className="w-12 h-6 bg-blue-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md" />
               </div>
            </div>
          </div>
        </section>

        {/* Section 3: Maintenance */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2 px-1">
             <UserCog className="h-5 w-5 text-red-500" />
             <h2 className="text-lg font-black uppercase tracking-tight">Maintenance</h2>
          </div>
          <div className={`p-8 rounded-[2rem] border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5 shadow-black' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm font-black tracking-tight text-red-500">Purge System Logs</p>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Clear your personal notification history</p>
                </div>
                <button 
                  onClick={handleClearActivity}
                  className="px-6 py-3 rounded-xl bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all border border-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
             </div>
          </div>
        </section>

        {/* Section 4: Session Management */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2 px-1">
             <LogOut className="h-5 w-5 text-red-500" />
             <h2 className="text-lg font-black uppercase tracking-tight">Session Control</h2>
          </div>
          <div className={`p-8 rounded-[2rem] border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5 shadow-black' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm font-black tracking-tight text-red-500">Terminate Administrative Session</p>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Exit the institution management suite securely</p>
                </div>
                <button 
                  onClick={logout}
                  className="px-8 py-4 rounded-2xl bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all border border-red-500/20 flex items-center gap-3 shadow-xl shadow-red-500/5"
                >
                  <LogOut className="h-4 w-4" />
                  Exit Portal
                </button>
             </div>
          </div>
        </section>

      </div>

      <footer className="pt-10 text-center opacity-30">
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">CampusIQ Administrative Suite v2.1</p>
      </footer>

    </div>
  );
}
