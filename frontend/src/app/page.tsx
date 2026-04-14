'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Cookies from 'js-cookie';
import { Mail, Lock, Loader2, ChevronRight, Shield, Building, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

type LoginRole = 'admin' | 'faculty';

export default function LoginPage() {
  const [role, setRole] = useState<LoginRole>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user: authUser, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // ONLY clear stale session data if we have finished loading and confirmed there is no user
    if (!authLoading && !authUser) {
      console.log("--- CLEANUP --- Purging legacy session markers.");
      Cookies.remove('token', { path: '/' });
      Cookies.remove('role', { path: '/' });
      Cookies.remove('user', { path: '/' });
      
      // Absolute wipe via document.cookie for legacy safety
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "role=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  }, [authUser, authLoading]);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && authUser) {
      if (authUser.role === 'admin') router.push('/dashboard/admin');
      else if (authUser.role === 'faculty') router.push('/dashboard/faculty');
    }
  }, [authUser, authLoading, router]);

  if (authLoading || authUser) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-600/10 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { access_token, user } = response.data;
      
      // STRICT Role validation: Only allow exact match
      if (user.role !== role) {
        toast.error(`This account is not authorized for the ${role.toUpperCase()} portal.`);
        setIsLoading(false);
        return;
      }

      login(access_token, user.role, user);
      toast.success(`Welcome back, ${user.full_name}!`);
    } catch (error: any) {
      let errorMsg = 'Authentication failed. Please verify credentials.';
      const detail = error.response?.data?.detail;
      if (detail) {
        errorMsg = typeof detail === 'string' ? detail : detail[0]?.msg || 'Authentication error';
      }
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForceReset = () => {
    localStorage.clear();
    sessionStorage.clear();
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i];
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
    window.location.reload();
  };

  const themeColors = {
    admin: {
      primary: 'blue',
      glow: 'rgba(59, 130, 246, 0.15)',
      text: 'Admin Portal',
      icon: Shield
    },
    faculty: {
      primary: 'indigo',
      glow: 'rgba(99, 102, 241, 0.15)',
      text: 'Faculty Access',
      icon: Building
    }
  };

  const currentTheme = themeColors[role];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-4 md:p-8 relative overflow-hidden selection:bg-blue-500/30">
      
      {/* Dynamic Background Decor */}
      <motion.div 
        animate={{ 
          backgroundColor: role === 'admin' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(99, 102, 241, 0.1)',
        }}
        className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] blur-[150px] rounded-full pointer-events-none transition-colors duration-700" 
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl relative z-10"
      >
        <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/5 rounded-[3.5rem] p-8 md:p-16 shadow-2xl overflow-hidden relative transition-all duration-700">
          
          <motion.div 
            animate={{ 
              background: role === 'admin' 
                ? 'linear-gradient(to right, #2563eb, #3b82f6)' 
                : 'linear-gradient(to right, #4f46e5, #6366f1)' 
            }}
            className="absolute top-0 left-0 w-full h-1.5 opacity-60" 
          />

          {/* Toggle Switch */}
          <div className="flex justify-center mb-12">
            <div className="bg-white/5 p-1.5 rounded-2xl flex items-center gap-1 border border-white/5 relative">
              <motion.div 
                layoutId="roleToggle"
                animate={{ x: role === 'admin' ? 0 : 108 }}
                className={`absolute w-[100px] h-[38px] rounded-xl bg-${currentTheme.primary}-600 shadow-lg shadow-${currentTheme.primary}-600/30`}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
              <button 
                onClick={() => setRole('admin')}
                className={`relative z-10 w-[100px] py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${role === 'admin' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                ADMIN
              </button>
              <button 
                onClick={() => setRole('faculty')}
                className={`relative z-10 w-[100px] py-2 text-[10px] font-black uppercase tracking-widest transition-colors ${role === 'faculty' ? 'text-white' : 'text-gray-500 hover:text-gray-300'}`}
              >
                FACULTY
              </button>
            </div>
          </div>

          <div className="text-center mb-10">
            <div className="relative w-20 h-20 mx-auto mb-8 rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl group transition-all duration-500">
              <Image src="/logo.png" alt="CampusIQ" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
            </div>
            
            <AnimatePresence mode="wait">
              <motion.div
                key={role}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-2">
                  CampusIQ <span className={`text-${currentTheme.primary}-500 transition-colors duration-500`}>Portal</span>
                </h2>
                <div className="flex items-center justify-center gap-2 text-gray-500 font-bold uppercase tracking-widest text-[10px]">
                  <currentTheme.icon className="h-4 w-4" />
                  {currentTheme.text}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <form className="space-y-6 md:space-y-8" onSubmit={handleLogin}>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-1">Institutional Email</label>
              <div className="relative group/input">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 group-focus-within/input:text-blue-500 transition-colors" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-4 py-4 md:py-4.5 text-white text-sm focus:border-blue-500/50 focus:ring-4 ring-blue-500/10 transition-all placeholder:text-gray-800 outline-none"
                  placeholder="admin@campusiq.edu"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-600 uppercase tracking-[0.2em] px-1">Security Token</label>
              <div className="relative group/input">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-600 group-focus-within/input:text-blue-500 transition-colors" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white/[0.02] border border-white/5 rounded-2xl pl-12 pr-12 py-4 md:py-4.5 text-white text-sm focus:border-blue-500/50 focus:ring-4 ring-blue-500/10 transition-all placeholder:text-gray-800 outline-none"
                  placeholder="••••••••"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-3 py-4 md:py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-${currentTheme.primary}-600 shadow-2xl shadow-${currentTheme.primary}-600/30 hover:bg-${currentTheme.primary}-500 transition-all disabled:opacity-50`}
            >
              {isLoading ? <Loader2 className="animate-spin h-5 w-5" /> : (
                <>
                  Enter Dynamic Dashboard
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>

          <p className="mt-12 text-center text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            Faculty and Administrator Portal Access Only
          </p>

          <button 
            type="button"
            onClick={handleForceReset}
            className="mt-6 w-full text-[9px] font-black text-blue-500/40 hover:text-blue-500 uppercase tracking-widest transition-colors"
          >
            Master Reset Session & Clear Tokens
          </button>
        </div>
      </motion.div>

      {/* Helper Grid Decor */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay" />
    </div>
  );
}
