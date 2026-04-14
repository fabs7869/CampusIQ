'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { exportUsersToPDF } from '@/lib/pdf-export';
import { 
  Search, 
  UserPlus, 
  Shield, 
  GraduationCap, 
  Building, 
  Trash2, 
  X,
  RefreshCw,
  MoreHorizontal,
  Key,
  Eye,
  EyeOff,
  Download,
  FileText,
  ChevronDown,
  Users as UsersIcon
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

export default function UsersPage() {
  const { theme } = useTheme();
  const [users, setUsers] = useState<any[]>([]);
  const [depts, setDepts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    full_name: '',
    password: '',
    role: 'student',
    student_id: '',
    department_id: ''
  });
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchDepts();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/users/');
      setUsers(response.data);
    } catch (error: any) {
      if (error.silent || error.response?.status === 401) return;
      const detail = error?.response?.data?.detail;
      toast.error(detail || 'Sync failed');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepts = async () => {
    try {
      const response = await api.get('/departments/');
      setDepts(response.data);
    } catch (error) {}
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Fix: Ensure empty strings are sent as null for UUID and IDs
      const payload = {
        ...newUser,
        department_id: newUser.department_id || null,
        student_id: newUser.student_id || null
      };
      await api.post('/users/', payload);
      toast.success('User enrolled');
      setShowAddModal(false);
      setNewUser({ email: '', full_name: '', password: '', role: 'student', student_id: '', department_id: '' });
      fetchUsers();
    } catch (error: any) {
      if (error.silent || error.response?.status === 401) return;
      toast.error(error.response?.data?.detail || 'Enrollment failed');
    }
  };

  const exportToCSV = () => {
    const headers = ['Full Name', 'Email', 'Role', 'Status', 'ID/Dept', 'Password'];
    const rows = filteredUsers.map(u => [
      u.full_name,
      u.email,
      u.role.toUpperCase(),
      u.is_active ? 'Active' : 'Disabled',
      u.role === 'student' ? u.student_id : (u.department_id || 'N/A'),
      u.plain_password || 'LEGACY_SECURED'
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers, ...rows].map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `campusiq_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Export downloaded');
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Confirm deletion?')) return;
    try {
      await api.delete(`/users/${id}`);
      toast.success('Deleted');
      fetchUsers();
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const toggleStatus = async (user: any) => {
    const action = user.is_active ? 'deactivate' : 'activate';
    try {
      await api.patch(`/users/${user.id}/${action}`);
      toast.success(`User ${action}d`);
      fetchUsers();
    } catch (error) {
      toast.error('Status update failed');
    }
  };

  const handleResetPassword = async (userId: string) => {
    if (!confirm('This will reset the user to the standard recovery password: CampusIQ@2026. Continue?')) return;
    try {
      await api.post(`/users/${userId}/reset-password`);
      toast.success('Password reset to: CampusIQ@2026');
      fetchUsers();
    } catch (error) {
      toast.error('Reset failed');
    }
  };

  const handleAdminChangePassword = async (userId: string) => {
    const newPassword = prompt('Enter a new custom password (min. 8 characters):');
    if (!newPassword) return;
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await api.post(`/users/${userId}/change-password`, { new_password: newPassword });
      toast.success(`Password changed to: ${newPassword}`);
      fetchUsers();
    } catch (error) {
      toast.error('Change failed');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4 text-blue-500" />;
      case 'faculty': return <Building className="h-4 w-4 text-indigo-500" />;
      default: return <GraduationCap className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className={`p-4 md:p-8 space-y-6 max-w-[1600px] mx-auto pb-20 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-black mb-1 tracking-tight">Institutional <span className="text-blue-600">Users</span></h1>
          <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Manage access and account lifecycle.</p>
        </div>
        <div className="flex gap-3 relative">
            <div className="relative">
              <motion.button
                  whileHover={{ scale: 1.02 }}
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  className={`flex items-center gap-2 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 hover:bg-white/10' : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'}`}
              >
                  <Download className="h-4 w-4" />
                  Export
                  <ChevronDown className={`h-3 w-3 transition-transform ${showExportDropdown ? 'rotate-180' : ''}`} />
              </motion.button>

              <AnimatePresence>
                {showExportDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute left-0 mt-2 z-[100] min-w-[180px] p-1.5 rounded-2xl shadow-3xl border backdrop-blur-2xl ${theme === 'dark' ? 'bg-[#0d0d0d]/95 border-white/10 shadow-black' : 'bg-white/95 border-gray-200'}`}
                  >
                    <button 
                      onClick={() => { exportToCSV(); setShowExportDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'hover:bg-green-500/10 text-gray-400 hover:text-green-500' : 'hover:bg-green-50 text-gray-600 hover:text-green-600'}`}
                    >
                      <Download className="h-4 w-4" /> CSV Report
                    </button>
                    <button 
                      onClick={() => { exportUsersToPDF(filteredUsers); setShowExportDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'hover:bg-red-500/10 text-gray-400 hover:text-red-500' : 'hover:bg-red-50 text-gray-600 hover:text-red-600'}`}
                    >
                      <FileText className="h-4 w-4" /> PDF Document
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-600/20"
            >
                <UserPlus className="h-4 w-4" />
                Enroll
            </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
        <div className="lg:col-span-3 relative w-full">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="Search directory..." 
            className={`w-full border-none rounded-2xl pl-12 pr-6 py-4 font-bold text-sm shadow-xl outline-none ring-4 ring-transparent focus:ring-blue-600/5 transition-all ${theme === 'dark' ? 'bg-[#0d0d0d] text-white placeholder:text-gray-800' : 'bg-white text-gray-900 border-gray-100 placeholder:text-gray-400'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className={`flex gap-1 p-1 rounded-2xl overflow-x-auto no-scrollbar shadow-xl ${theme === 'dark' ? 'bg-[#0d0d0d]' : 'bg-white'}`}>
          {['all', 'student', 'faculty', 'admin'].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${
                roleFilter === role ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-gray-500 hover:text-gray-400'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      <div className={`rounded-[2.5rem] overflow-hidden shadow-2xl relative border ${theme === 'dark' ? 'bg-[#0d0d0d] border-white/5' : 'bg-white border-gray-100'}`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-white/5 bg-white/[0.01]' : 'border-gray-50 bg-gray-50/50'}`}>
                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">User</th>
                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Authorized Role</th>
                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Status</th>
                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em]">Password</th>
                <th className="px-8 py-6 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <AnimatePresence mode="popLayout">
                {loading ? (
                   Array(5).fill(0).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={5} className="px-8 py-6"><div className={`h-12 rounded-xl ${theme === 'dark' ? 'bg-white/5' : 'bg-gray-100'} w-full`} /></td>
                    </tr>
                  ))
                ) : filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-24 text-center opacity-30">
                        <UsersIcon className="h-12 w-12 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No matching accounts found</p>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <motion.tr 
                      key={user.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`group transition-all ${theme === 'dark' ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shadow-lg shadow-blue-500/20">
                            {user.full_name.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold tracking-tight">{user.full_name}</div>
                            <div className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className={`flex items-center gap-2.5 px-3.5 py-1.5 rounded-xl border font-black text-[9px] tracking-widest w-fit ${theme === 'dark' ? 'bg-white/5 border-white/5 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                          {getRoleIcon(user.role)}
                          {user.role.toUpperCase()}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <button 
                          onClick={() => toggleStatus(user)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                            user.is_active 
                            ? 'bg-green-500/10 border-green-500/20 text-green-600 hover:bg-green-500/20' 
                            : 'bg-red-500/10 border-red-500/20 text-red-600 hover:bg-red-500/20'
                          }`}
                        >
                          <div className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
                          {user.is_active ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="px-8 py-5">
                        <div className="text-[10px] font-black text-blue-600/60 tracking-[0.2em]">{user.plain_password || 'LEGACY_SECURED'}</div>
                      </td>
                      <td className="px-8 py-5 text-right relative">
                         <div className="flex items-center justify-end gap-3">
                            <motion.button 
                              whileTap={{ scale: 0.9 }}
                              onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                              className={`p-2.5 rounded-xl border transition-all ${theme === 'dark' ? 'bg-white/5 border-white/5 text-gray-500 hover:text-white' : 'bg-white border-gray-100 text-gray-400 hover:text-gray-900'}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </motion.button>
                            
                            <AnimatePresence>
                              {actionMenuId === user.id && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.9, x: 10 }} animate={{ opacity: 1, scale: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9, x: 10 }}
                                  className={`absolute right-20 top-1/2 -translate-y-1/2 z-[100] p-1.5 min-w-[160px] rounded-2xl shadow-3xl flex flex-col gap-1 border ${theme === 'dark' ? 'bg-[#121212] border-white/10 shadow-black' : 'bg-white border-gray-200'}`}
                                >
                                  <button 
                                    onClick={() => handleAdminChangePassword(user.id)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-50 text-gray-600'}`}
                                  >
                                    <Key className="h-3.5 w-3.5 text-green-500" /> Change Password
                                  </button>
                                  <button 
                                    onClick={() => handleResetPassword(user.id)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-50 text-gray-600'}`}
                                  >
                                    <RefreshCw className="h-3.5 w-3.5 text-blue-500" /> Reset Password
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteUser(user.id)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'hover:bg-red-500/10 text-red-500' : 'hover:bg-red-50 text-red-600'}`}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" /> Delete
                                  </button>
                                </motion.div>
                              )}
                            </AnimatePresence>
                         </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* Enrollment Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={() => setShowAddModal(false)} />
             <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className={`relative w-full max-w-2xl rounded-[3rem] shadow-3xl overflow-hidden p-8 md:p-12 ${theme === 'dark' ? 'bg-[#0a0a0a] border border-white/10' : 'bg-white border border-gray-100'}`}
             >
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-black tracking-tight">Institutional <span className="text-blue-500">Enrollment</span></h2>
                  <button onClick={() => setShowAddModal(false)} className="p-3 rounded-full hover:bg-gray-500/10 text-gray-500 transition-all"><X className="h-5 w-5" /></button>
                </div>

                <form onSubmit={handleAddUser} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Full Name</label>
                       <input 
                        type="text" required placeholder="User full identity"
                        className={`w-full px-5 py-3.5 rounded-xl text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${theme === 'dark' ? 'bg-white/5 text-white placeholder:text-gray-800 border-white/5' : 'bg-gray-50 text-gray-900 placeholder:text-gray-400 border-gray-100'}`}
                        value={newUser.full_name} onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Email</label>
                       <input 
                        type="email" required placeholder="name@campusiq.edu"
                        className={`w-full px-5 py-3.5 rounded-xl text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${theme === 'dark' ? 'bg-white/5 text-white placeholder:text-gray-800 border-white/5' : 'bg-gray-50 text-gray-900 placeholder:text-gray-400 border-gray-100'}`}
                        value={newUser.email} onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                       />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                       <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Role</label>
                       <select 
                        required
                        className={`w-full px-5 py-3.5 rounded-xl text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${theme === 'dark' ? 'bg-white/5 text-white border-white/5' : 'bg-gray-50 text-gray-900 border-gray-200'}`}
                        value={newUser.role} onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                       >
                         <option value="student" className="bg-[#0a0a0a]">Student</option>
                         <option value="faculty" className="bg-[#0a0a0a]">Faculty</option>
                         <option value="admin" className="bg-[#0a0a0a]">Administrator</option>
                       </select>
                    </div>
                    <div className="space-y-1.5 relative">
                       <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Password</label>
                       <div className="relative">
                           <input 
                            type={showPassword ? "text" : "password"} required placeholder="Min. 8 characters"
                            className={`w-full px-5 py-3.5 rounded-xl text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${theme === 'dark' ? 'bg-white/5 text-white placeholder:text-gray-800 border-white/5' : 'bg-gray-50 text-gray-900 placeholder:text-gray-400 border-gray-100'}`}
                            value={newUser.password} onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                           />
                           <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-600 hover:text-blue-500 transition-colors">
                             {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                           </button>
                       </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {newUser.role === 'student' && (
                       <div className="space-y-1.5 transition-all">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Student Identifier</label>
                          <input 
                            type="text" placeholder="ID Card Number"
                            className={`w-full px-5 py-3.5 rounded-xl text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${theme === 'dark' ? 'bg-white/5 text-white placeholder:text-gray-800 border-white/5' : 'bg-gray-50 text-gray-900 placeholder:text-gray-400 border-gray-100'}`}
                            value={newUser.student_id} onChange={(e) => setNewUser({...newUser, student_id: e.target.value})}
                          />
                       </div>
                    )}
                    {newUser.role === 'faculty' && (
                       <div className="space-y-1.5 transition-all">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest px-1">Department</label>
                          <select 
                            className={`w-full px-5 py-3.5 rounded-xl text-sm font-bold shadow-inner outline-none focus:ring-4 focus:ring-blue-500/10 transition-all ${theme === 'dark' ? 'bg-white/5 text-white border-white/5' : 'bg-gray-50 text-gray-900 border-gray-100'}`}
                            value={newUser.department_id} onChange={(e) => setNewUser({...newUser, department_id: e.target.value})}
                          >
                             <option value="" className="bg-[#0a0a0a]">Select...</option>
                             {depts.map(d => <option key={d.id} value={d.id} className="bg-[#0a0a0a]">{d.name}</option>)}
                          </select>
                       </div>
                    )}
                  </div>

                  <div className="pt-4">
                    <motion.button 
                      whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit"
                      className="w-full py-4.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl shadow-blue-600/20 transition-all"
                    >
                      Process Enrollment
                    </motion.button>
                  </div>
                </form>
             </motion.div>
          </div>
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
