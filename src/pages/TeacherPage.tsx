import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import {
  Search, User, Sun, Moon, GraduationCap, Sparkles, Zap, AlertCircle,
  ArrowLeft, Building, Mail, Phone, BookOpen, Award
} from 'lucide-react';

interface TeacherData {
  id: string;
  teacher_id: string;
  name: string;
  department: string;
  designation: string;
  phone: string;
  email: string;
  office_room: string;
}

function TeacherPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [teacherData, setTeacherData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setError('Please enter a teacher name or ID'); return; }
    setLoading(true); setError(''); setTeacherData(null);
    const trimmed = searchQuery.trim();

    try {
      const { data, error: dbError } = await supabase
        .from('teachers')
        .select('*')
        .or(`teacher_id.ilike.%${trimmed}%,name.ilike.%${trimmed}%`)
        .limit(1)
        .maybeSingle();

      if (dbError) throw dbError;
      if (data) {
        setTeacherData(data);
      } else {
        setError('No teacher found. Please check the name or ID and try again.');
      }
    } catch (err) {
      console.error('Error searching teacher:', err);
      setError('An error occurred while searching. Please try again.');
    }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSearch(); };

  return (
    <div className={`min-h-screen transition-all duration-500 floating-dots ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 floating-dots-dark' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      {/* Header */}
      <div className={`shadow-lg border-b backdrop-blur-xl sticky top-0 z-50 ${isDarkMode ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white/80 border-gray-200/60'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-colors ${isDarkMode ? 'text-white hover:bg-white/10' : 'text-gray-700 hover:bg-gray-100'}`}>
              <ArrowLeft className="w-5 h-5" /><span className="font-semibold text-sm">Back</span>
            </button>
            <div className="flex items-center space-x-2">
              <BookOpen className="w-6 h-6 text-emerald-600" />
              <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Teacher Search</span>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-gray-100 text-gray-600'}`}>
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Search */}
        <div className={`rounded-2xl shadow-xl border backdrop-blur-xl mb-6 card-with-dots ${isDarkMode ? 'bg-gray-800/60 border-white/10 card-with-dots-dark' : 'bg-white/70 border-gray-200/60'}`}>
          <div className="p-5 sm:p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl shadow-lg shadow-emerald-500/20"><Search className="w-5 h-5 text-white" /></div>
                <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Find Teacher Info</h2>
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl shadow-lg shadow-blue-500/20"><Award className="w-5 h-5 text-white" /></div>
              </div>
              <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Enter teacher name or ID to get their information</p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <input type="text" placeholder="Enter Teacher Name or ID" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyPress}
                  className={`w-full px-5 py-3.5 sm:py-4 rounded-xl border-2 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-300 text-base font-medium ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'}`} />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2"><Zap className="w-4 h-4 text-yellow-500 opacity-60" /></div>
              </div>
              <div className="flex justify-center">
                <button onClick={handleSearch} disabled={loading}
                  className="w-fit px-7 py-3.5 sm:py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-emerald-500/25 focus:ring-4 focus:ring-emerald-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md font-bold text-sm sm:text-base">
                  {loading ? (<><div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div><span>Searching...</span></>) : (<><Search className="w-4 h-4" /><span>Search</span><Sparkles className="w-3 h-3 opacity-70" /></>)}
                </button>
              </div>
            </div>

            {error && (
              <div className={`mt-4 p-3.5 rounded-xl flex items-center space-x-3 max-w-2xl mx-auto ${isDarkMode ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" /><span className="font-medium text-sm sm:text-base">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Teacher Result */}
        {teacherData && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-6">
            {/* Profile Card */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}
              className={`rounded-2xl shadow-xl border p-5 sm:p-6 card-with-dots w-fit mx-auto ${isDarkMode ? 'bg-gradient-to-r from-emerald-900/40 via-teal-900/40 to-cyan-900/40 border-emerald-500/20 card-with-dots-dark' : 'bg-gradient-to-r from-emerald-50/80 via-teal-50/80 to-cyan-50/80 border-emerald-200/60'}`}>
              <div className="flex flex-col items-center gap-3">
                {/* Avatar */}
                <div className="p-4 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full shadow-lg shadow-emerald-500/20">
                  <User className="w-10 h-10 text-white" />
                </div>
                {/* Name */}
                <h3 className={`text-xl sm:text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{teacherData.name}</h3>
                {/* Info */}
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className={`font-mono text-sm font-bold px-3 py-1 rounded-lg ${isDarkMode ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    ID: {teacherData.teacher_id}
                  </span>
                  {teacherData.designation && (
                    <span className={`text-sm font-bold px-3 py-1 rounded-lg ${isDarkMode ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                      {teacherData.designation}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { icon: <Building className="w-5 h-5" />, label: 'Department', value: teacherData.department || 'N/A', gradient: isDarkMode ? 'from-blue-500/15 to-indigo-500/10' : 'from-blue-50 to-indigo-50', border: isDarkMode ? 'border-blue-500/20' : 'border-blue-200', iconColor: 'text-blue-500', labelColor: isDarkMode ? 'text-blue-400' : 'text-blue-700', valueColor: isDarkMode ? 'text-white' : 'text-blue-900' },
                { icon: <Mail className="w-5 h-5" />, label: 'Email', value: teacherData.email || 'N/A', gradient: isDarkMode ? 'from-purple-500/15 to-pink-500/10' : 'from-purple-50 to-pink-50', border: isDarkMode ? 'border-purple-500/20' : 'border-purple-200', iconColor: 'text-purple-500', labelColor: isDarkMode ? 'text-purple-400' : 'text-purple-700', valueColor: isDarkMode ? 'text-white' : 'text-purple-900' },
                { icon: <Phone className="w-5 h-5" />, label: 'Phone', value: teacherData.phone || 'N/A', gradient: isDarkMode ? 'from-emerald-500/15 to-teal-500/10' : 'from-emerald-50 to-teal-50', border: isDarkMode ? 'border-emerald-500/20' : 'border-emerald-200', iconColor: 'text-emerald-500', labelColor: isDarkMode ? 'text-emerald-400' : 'text-emerald-700', valueColor: isDarkMode ? 'text-white' : 'text-emerald-900' },
                { icon: <GraduationCap className="w-5 h-5" />, label: 'Office Room', value: teacherData.office_room || 'N/A', gradient: isDarkMode ? 'from-orange-500/15 to-red-500/10' : 'from-orange-50 to-red-50', border: isDarkMode ? 'border-orange-500/20' : 'border-orange-200', iconColor: 'text-orange-500', labelColor: isDarkMode ? 'text-orange-400' : 'text-orange-700', valueColor: isDarkMode ? 'text-white' : 'text-orange-900' },
              ].map((card, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + i * 0.08 }}
                  className={`bg-gradient-to-br ${card.gradient} rounded-xl p-4 border ${card.border} hover:shadow-md transition-shadow`}>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className={card.iconColor}>{card.icon}</span>
                    <label className={`text-xs font-bold uppercase tracking-wider ${card.labelColor}`}>{card.label}</label>
                  </div>
                  <p className={`text-lg font-extrabold break-all ${card.valueColor}`}>{card.value}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default TeacherPage;
