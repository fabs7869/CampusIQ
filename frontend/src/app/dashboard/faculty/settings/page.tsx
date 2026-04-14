'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  User,
  ShieldCheck,
  Save,
  Bell,
  Building,
  Key,
  LogOut
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/auth';
import toast from 'react-hot-toast';

export default function FacultySettingsPage() {
  const { theme } = useTheme();
  const { user, logout } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('Information Updated');
    }, 800);
  };

  return (
    <div className={`p-4 md:p-8 space-y-12 max-w-[900px] mx-auto pb-24 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-500/10 pb-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
              <div className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 text-[8px] font-black uppercase tracking-widest">
                 Unit-Level Configuration
              </div>
           </div>
          <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tighter">Faculty <span className="text-indigo-500">Settings</span></h1>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Manage your departmental profile and security.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={handleUpdate} disabled={isSaving}
          className="flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20"
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
        
        {/* Section 1: Professional Identity */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2 px-1">
             <User className="h-5 w-5 text-indigo-500" />
             <h2 className="text-lg font-black uppercase tracking-tight">Professional Profile</h2>
          </div>
          <div className={`p-8 rounded-[2rem] border space-y-8 ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5 shadow-black' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Full Name</label>
                  <input 
                    defaultValue={user?.full_name} 
                    className={`w-full px-6 py-4 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`} 
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Assigned Department</label>
                  <div className={`w-full px-6 py-4 rounded-2xl text-sm font-bold flex items-center gap-3 opacity-60 ${theme === 'dark' ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                     <Building className="h-4 w-4" />
                     {user?.role === 'faculty' ? 'Authorized Department Staff' : 'Institutional Support'}
                  </div>
               </div>
            </div>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Contact Email</label>
                <input 
                  defaultValue={user?.email} disabled
                  className={`w-full px-6 py-4 rounded-2xl text-sm font-bold shadow-inner opacity-40 cursor-not-allowed ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`} 
                />
            </div>
          </div>
        </section>

        {/* Section 2: Account Security */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2 px-1">
             <ShieldCheck className="h-5 w-5 text-green-500" />
             <h2 className="text-lg font-black uppercase tracking-tight">Security & Access</h2>
          </div>
          <div className={`p-8 rounded-[2rem] border space-y-8 ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5 shadow-black' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
            <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Update Password</label>
                <div className="relative">
                   <input 
                     type="password" placeholder="Enter new professional credential"
                     className={`w-full px-6 py-4 rounded-2xl text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all pl-14 ${theme === 'dark' ? 'bg-white/5 border-white/5 text-white' : 'bg-gray-50 border-gray-100 text-gray-900'}`} 
                   />
                   <Key className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                </div>
            </div>
            
            <div className={`p-6 rounded-3xl flex items-center justify-between transition-all ${theme === 'dark' ? 'bg-white/[0.02]' : 'bg-gray-50'}`}>
               <div className="flex items-center gap-4">
                  <Bell className="h-5 w-5 text-indigo-500" />
                  <div>
                    <p className="text-sm font-black tracking-tight">Real-time Triage Alerts</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest leading-none mt-1">Receive notifications for new department assignments</p>
                  </div>
               </div>
               <div className="w-12 h-6 bg-indigo-600 rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-md" />
               </div>
            </div>
          </div>
        </section>

        {/* Section 3: Session Management */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 mb-2 px-1">
             <LogOut className="h-5 w-5 text-red-500" />
             <h2 className="text-lg font-black uppercase tracking-tight">Session Control</h2>
          </div>
          <div className={`p-8 rounded-[2rem] border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5 shadow-black' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'}`}>
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm font-black tracking-tight text-red-500">Terminate Active Session</p>
                   <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Securely log out from the institutional portal</p>
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
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">CampusIQ Faculty Portal v1.4</p>
      </footer>

    </div>
  );
}
