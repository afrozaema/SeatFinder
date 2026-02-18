import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Sun, Moon, Wifi, Battery, Signal, Calendar, Clock,
  GraduationCap, Trophy, Sparkles, Brain, Heart, Shield,
  Search, Compass, BookOpen, User, ArrowRight
} from 'lucide-react';

function Index() {
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [liveTime, setLiveTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const now = new Date();
    setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => { window.removeEventListener('online', handleOnline); window.removeEventListener('offline', handleOffline); };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const getBattery = async () => {
      try {
        if ('getBattery' in navigator) {
          const battery = await (navigator as any).getBattery();
          setBatteryLevel(Math.round(battery.level * 100));
        }
      } catch { setBatteryLevel(85); }
    };
    getBattery();
  }, []);

  return (
    <div className={`min-h-screen transition-all duration-500 floating-dots ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 floating-dots-dark' : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'}`}>
      {/* Header */}
      <div className={`shadow-lg border-b backdrop-blur-xl sticky top-0 z-50 ${isDarkMode ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white/80 border-gray-200/60'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 text-sm">
            <div className="flex items-center gap-4">
              <div className={`flex items-center space-x-1.5 ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                <Wifi className="w-3.5 h-3.5" /><span className="text-xs font-semibold tracking-wide">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Battery className="w-3.5 h-3.5" /><span className="text-xs font-semibold">{batteryLevel}%</span>
              </div>
              <div className="flex items-center space-x-1.5 text-blue-500">
                <Signal className="w-3.5 h-3.5" /><span className="text-xs font-semibold">Strong</span>
              </div>
            </div>
            <button onClick={() => setIsDarkMode(!isDarkMode)} className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${isDarkMode ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/20">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight cursor-pointer" onClick={() => window.location.reload()}>
                JU SeatFinder
              </h1>
              <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/20">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className={`text-base mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Smart Exam Seat & Direction Guide with AI Assistant</p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 text-sm">
              <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100'} shadow-sm`}>
                <Calendar className="w-4 h-4 text-blue-500" />
                <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm truncate`}>{currentDate}</span>
              </div>
              <div className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl ${isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100'} shadow-sm`}>
                <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
                <span className={`font-mono text-lg font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{liveTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Hero Section */}
        <div className={`rounded-2xl shadow-xl border p-5 sm:p-8 mb-6 text-center card-with-dots ${isDarkMode ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-500/20 card-with-dots-dark' : 'bg-gradient-to-br from-purple-50/80 to-indigo-50/80 border-purple-200/60'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/25"><Brain className="w-6 h-6 text-white" /></div>
            <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent uppercase tracking-wider">WELCOME TO EMA</h2>
            <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg shadow-pink-500/25"><Heart className="w-6 h-6 text-white animate-pulse" /></div>
          </div>
          <p className={`text-base sm:text-lg mb-6 ${isDarkMode ? 'text-purple-300/80' : 'text-purple-700/80'}`}>Your AI-Powered Exam Assistant</p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: <Search className="w-5 h-5 text-blue-500 mx-auto mb-2" />, label: 'Smart Search', color: isDarkMode ? 'bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/15' : 'bg-blue-50/80 border-blue-200/60 hover:bg-blue-100', textColor: isDarkMode ? 'text-blue-300' : 'text-blue-700' },
              { icon: <Compass className="w-5 h-5 text-emerald-500 mx-auto mb-2" />, label: 'Navigation', color: isDarkMode ? 'bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/15' : 'bg-emerald-50/80 border-emerald-200/60 hover:bg-emerald-100', textColor: isDarkMode ? 'text-emerald-300' : 'text-emerald-700' },
              { icon: <Brain className="w-5 h-5 text-purple-500 mx-auto mb-2" />, label: 'AI Support', color: isDarkMode ? 'bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/15' : 'bg-purple-50/80 border-purple-200/60 hover:bg-purple-100', textColor: isDarkMode ? 'text-purple-300' : 'text-purple-700' },
              { icon: <Shield className="w-5 h-5 text-amber-500 mx-auto mb-2" />, label: 'Trusted', color: isDarkMode ? 'bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/15' : 'bg-amber-50/80 border-amber-200/60 hover:bg-amber-100', textColor: isDarkMode ? 'text-amber-300' : 'text-amber-700' },
            ].map((feature, i) => (
              <div key={i} className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.03] hover:shadow-md cursor-default ${feature.color}`}>
                {feature.icon}
                <p className={`text-xs font-bold tracking-wide ${feature.textColor}`}>{feature.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Student & Teacher Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
          {/* Student Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            onClick={() => navigate('/student')}
            className={`rounded-2xl shadow-xl border p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl card-with-dots ${isDarkMode ? 'bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-blue-500/20 hover:border-blue-400/40 card-with-dots-dark' : 'bg-gradient-to-br from-blue-50/80 to-purple-50/80 border-blue-200/60 hover:border-blue-300'}`}
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center mb-4">
                <GraduationCap className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl sm:text-2xl font-extrabold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Student</h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Search exam seat by roll number</p>
              <div className="flex items-center justify-center space-x-2">
                <span className={`text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Find Your Seat</span>
                <ArrowRight className={`w-4 h-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              </div>
            </div>
          </motion.div>

          {/* Teacher Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => navigate('/teacher')}
            className={`rounded-2xl shadow-xl border p-6 sm:p-8 cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl card-with-dots ${isDarkMode ? 'bg-gradient-to-br from-emerald-900/40 to-teal-900/40 border-emerald-500/20 hover:border-emerald-400/40 card-with-dots-dark' : 'bg-gradient-to-br from-emerald-50/80 to-teal-50/80 border-emerald-200/60 hover:border-emerald-300'}`}
          >
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center mb-4">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h3 className={`text-xl sm:text-2xl font-extrabold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Teacher</h3>
              <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Search teacher info by name or ID</p>
              <div className="flex items-center justify-center space-x-2">
                <span className={`text-sm font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Find Teacher</span>
                <ArrowRight className={`w-4 h-4 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Footer */}
        <div className={`mt-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className={`rounded-2xl shadow-xl border p-6 sm:p-8 mb-8 text-center card-with-dots ${isDarkMode ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/15 card-with-dots-dark' : 'bg-gradient-to-br from-purple-50/60 to-indigo-50/60 border-purple-200/50'}`}>
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/20"><Brain className="w-7 h-7 text-white" /></div>
              <h3 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">Ema Assistant</h3>
              <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg shadow-pink-500/20"><Heart className="w-7 h-7 text-white animate-pulse" /></div>
            </div>
            <p className={`text-base mb-5 ${isDarkMode ? 'text-purple-300/70' : 'text-purple-700/70'}`}>Your AI-powered companion for exam success and guidance</p>
          </div>

          <div className="text-center pb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Smart Exam Seat & Direction Guide</span>
            </div>
            <div className="flex items-center justify-center space-x-4 mb-4 text-sm">
              <a href="/status" className={`font-medium transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>System Status</a>
              <span className={isDarkMode ? 'text-gray-600' : 'text-gray-300'}>•</span>
              <a href="/admin/login" className={`font-medium transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>Admin</a>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              © 2025 JU SeatFinder · Made with ❤️ by
              <a href="https://afrozaema.github.io/" target="_blank" rel="noopener noreferrer" className="ml-1.5 text-purple-500 hover:text-purple-600 font-semibold transition-colors duration-200">Afroza Akter Ema</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Index;
