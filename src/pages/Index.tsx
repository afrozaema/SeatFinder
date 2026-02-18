import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import {
  Search,
  Clock,
  MapPin,
  Building,
  Calendar,
  CheckCircle,
  AlertCircle,
  Navigation,
  User,
  ExternalLink,
  BookOpen,
  Heart,
  Sun,
  Moon,
  Wifi,
  Battery,
  Signal,
  Timer,
  Award,
  Bookmark,
  Coffee,
  Brain,
  Sparkles,
  Trophy,
  Star,
  Zap,
  Shield,
  Bell,
  Cloud,
  CloudRain,
  CloudSnow,
  Menu,
  X,
  GraduationCap,
  Target,
  Compass,
  Route,
  Map,
  ArrowRight,
  Eye,
  Locate
} from 'lucide-react';

interface StudentData {
  roll: string;
  name: string;
  institution: string;
  building: string;
  room: string;
  floor: string;
  reportTime: string;
  startTime: string;
  endTime: string;
  directions: string;
  mapUrl: string;
}

interface TimeData {
  datetime: string;
  timezone: string;
}

interface Quote {
  content: string;
  author: string;
}

interface GenderData {
  gender: string;
  probability: number;
}

interface WeatherData {
  main: {
    temp: number;
    feels_like: number;
    humidity: number;
  };
  weather: Array<{
    main: string;
    description: string;
    icon: string;
  }>;
  name: string;
}

const whatToBring = [
  { item: 'Admit Card', required: true, icon: '🎫' },
  { item: 'ID Card', required: true, icon: '🆔' },
  { item: 'Pen & Pencil', required: true, icon: '✏️' },
  { item: 'Eraser & Scale', required: false, icon: '📏' },
  { item: 'Calculator (if allowed)', required: false, icon: '🧮' },
  { item: 'Water Bottle', required: false, icon: '💧' },
];

const whatNotToBring = [
  { item: 'Mobile Phones', icon: '📱' },
  { item: 'Smart Watches', icon: '⌚' },
  { item: 'Electronic Devices', icon: '💻' },
  { item: 'Books or Notes', icon: '📚' },
  { item: 'Bags (except transparent)', icon: '🎒' },
];

const emaAdviceMessages = [
  "Hi dear {name}! I am Ema. Remember, you are stronger than you think! 💪",
  "Hello {name}! This is Ema speaking. Take deep breaths and stay confident! 🌟",
  "Dear {name}, Ema here! Your hard work will definitely pay off today! ✨",
  "Hi {name}! Ema wants you to know - believe in yourself completely! 🚀",
  "Hello dear {name}! I'm Ema, and I know you're going to do amazing! 🎯",
  "Hi {name}! Ema here with a reminder - you've prepared well for this! 📚",
  "Dear {name}, this is Ema! Stay calm and trust your knowledge! 🧠",
  "Hello {name}! Ema believes in your abilities - you've got this! 💫",
  "Hi dear {name}! I'm Ema, reminding you to stay positive and focused! 🌈",
  "Hello {name}! Ema here - every challenge is an opportunity to shine! ⭐",
  "Dear {name}, Ema speaking! Your dedication will lead you to success! 🏆",
  "Hi {name}! This is Ema - remember to stay hydrated and take breaks! 💧",
  "Hello dear {name}! Ema wants you to know - you're capable of great things! 🌟",
  "Hi {name}! Ema here with love - trust the process and your preparation! 💖",
  "Dear {name}, I'm Ema! Keep your head high and your confidence higher! 👑"
];

function Index() {
  const [rollNumber, setRollNumber] = useState('');
  const [studentData, setStudentData] = useState<StudentData | null>(null);
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [liveTime, setLiveTime] = useState<string>('');
  const [quote, setQuote] = useState<Quote | null>(null);
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [centersData, setCentersData] = useState<StudentData[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [examCountdown, setExamCountdown] = useState<string>('');
  const [batteryLevel, setBatteryLevel] = useState<number>(100);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [gender, setGender] = useState<string>('');
  const [currentEmaAdvice, setCurrentEmaAdvice] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadCentersData();
    fetchCurrentTime();
    fetchQuote();
    fetchWeather();
    getBatteryLevel();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setLiveTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      }));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(fetchCurrentTime, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (studentData) {
      const updateEmaAdvice = () => {
        const firstName = studentData.name.split(' ')[0];
        const randomAdvice = emaAdviceMessages[Math.floor(Math.random() * emaAdviceMessages.length)];
        const personalizedAdvice = randomAdvice.replace('{name}', firstName);
        setCurrentEmaAdvice(personalizedAdvice);
      };
      updateEmaAdvice();
      const interval = setInterval(updateEmaAdvice, 2000);
      return () => clearInterval(interval);
    }
  }, [studentData]);

  useEffect(() => {
    if (studentData) {
      const interval = setInterval(() => {
        const examDate = new Date();
        examDate.setDate(examDate.getDate() + 1);
        const [time, period] = studentData.reportTime.split(' ');
        const [hours, minutes] = time.split(':').map(Number);

        let hour24 = hours;
        if (period === 'PM' && hours !== 12) hour24 += 12;
        if (period === 'AM' && hours === 12) hour24 = 0;

        examDate.setHours(hour24, minutes, 0, 0);

        const now = new Date();
        const diff = examDate.getTime() - now.getTime();

        if (diff > 0) {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const s = Math.floor((diff % (1000 * 60)) / 1000);
          setExamCountdown(`${h}h ${m}m ${s}s`);
        } else {
          setExamCountdown('Exam Started!');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [studentData]);

  const loadCentersData = async () => {
    try {
      const { data, error } = await supabase.from('students').select('*');
      if (error) throw error;
      if (data) {
        const mapped = data.map(s => ({
          roll: s.roll_number,
          name: s.name,
          institution: s.institution,
          building: s.building,
          room: s.room,
          floor: s.floor,
          reportTime: s.report_time,
          startTime: s.start_time,
          endTime: s.end_time,
          directions: s.directions,
          mapUrl: s.map_url,
        }));
        setCentersData(mapped);
      }
    } catch (err) {
      console.error('Error loading students data:', err);
    }
  };

  const fetchCurrentTime = async () => {
    try {
      const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Dhaka');
      const data: TimeData = await response.json();
      const dateTime = new Date(data.datetime);
      setCurrentTime(dateTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setCurrentDate(dateTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    } catch {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
      setCurrentDate(now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }));
    }
  };

  const fetchQuote = async () => {
    try {
      const response = await fetch('https://api.quotable.io/random?tags=motivational,success');
      const data: Quote = await response.json();
      setQuote(data);
    } catch {
      setQuote({
        content: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
        author: "Winston Churchill"
      });
    }
  };

  const fetchWeather = async () => {
    try {
      const response = await fetch('https://api.openweathermap.org/data/2.5/weather?q=Dhaka&appid=demo&units=metric');
      if (response.ok) {
        const data: WeatherData = await response.json();
        setWeather(data);
      } else {
        throw new Error('Weather API failed');
      }
    } catch {
      setWeather({
        main: { temp: 28, feels_like: 32, humidity: 75 },
        weather: [{ main: 'Clear', description: 'clear sky', icon: '01d' }],
        name: 'Dhaka'
      });
    }
  };

  const fetchGender = async (name: string) => {
    try {
      const firstName = name.split(' ')[0];
      const response = await fetch(`https://api.genderize.io?name=${firstName}`);
      const data: GenderData = await response.json();
      if (data.gender && data.probability > 0.5) {
        setGender(data.gender);
      }
    } catch (err) {
      console.error('Error fetching gender:', err);
    }
  };

  const getBatteryLevel = async () => {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        setBatteryLevel(Math.round(battery.level * 100));
      }
    } catch {
      setBatteryLevel(85);
    }
  };

  const extractCoordinates = (mapUrl: string) => {
    const patterns = [
      /q=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /@(-?\d+\.?\d*),(-?\d+\.?\d*)/,
      /ll=(-?\d+\.?\d*),(-?\d+\.?\d*)/,
    ];
    for (const pattern of patterns) {
      const match = mapUrl.match(pattern);
      if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    }
    return { lat: 23.8103, lng: 90.4125 };
  };

  const handleSearch = async () => {
    if (!rollNumber.trim()) {
      setError('Please enter a roll number');
      return;
    }
    setLoading(true);
    setError('');
    setStudentData(null);
    setGender('');

    const trimmedRoll = rollNumber.trim();
    const student = centersData.find(s => s.roll === trimmedRoll);
    
    // Log the search (fire and forget)
    supabase.from('search_logs').insert({ roll_number: trimmedRoll, found: !!student }).then();

    if (student) {
      setStudentData(student);
      await fetchGender(student.name);
      // Auto-scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } else {
      setError('Roll number not found. Please check and try again.');
    }
    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const getWeatherIcon = (weatherMain: string) => {
    switch (weatherMain.toLowerCase()) {
      case 'clear': return <Sun className="w-4 h-4 text-orange-500" />;
      case 'clouds': return <Cloud className="w-4 h-4 text-gray-500" />;
      case 'rain': return <CloudRain className="w-4 h-4 text-blue-500" />;
      case 'snow': return <CloudSnow className="w-4 h-4 text-blue-300" />;
      default: return <Sun className="w-4 h-4 text-orange-500" />;
    }
  };

  return (
    <div className={`min-h-screen transition-all duration-500 floating-dots ${
      isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 floating-dots-dark'
        : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50'
    }`}>
      {/* Header */}
      <div className={`shadow-lg border-b backdrop-blur-xl sticky top-0 z-50 ${
        isDarkMode ? 'bg-gray-900/80 border-gray-700/50' : 'bg-white/80 border-gray-200/60'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-3 text-sm">
            <div className="flex items-center gap-4">
              <div className={`flex items-center space-x-1.5 ${isOnline ? 'text-emerald-500' : 'text-red-500'}`}>
                <Wifi className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold tracking-wide">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <div className={`flex items-center space-x-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Battery className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">{batteryLevel}%</span>
              </div>
              <div className="flex items-center space-x-1.5 text-blue-500">
                <Signal className="w-3.5 h-3.5" />
                <span className="text-xs font-semibold">Strong</span>
              </div>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-xl transition-all duration-300 hover:scale-110 ${
                isDarkMode ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          {/* Mobile Header */}
          <div className="flex items-center justify-between lg:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-lg transition-colors ${
                isDarkMode ? 'text-white hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center space-x-2">
              <GraduationCap className="w-6 h-6 text-blue-600" />
              <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                JU SeatFinder
              </span>
            </div>
            <div className="w-10"></div>
          </div>

          <div className={`lg:hidden mt-3 ${isMobileMenuOpen ? 'block' : 'hidden'}`}>
            <div className="text-center py-4">
              <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Smart Exam Seat & Direction Guide with AI Assistant
              </p>
            </div>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block">
            <div className="text-center">
              <div className="flex items-center justify-center space-x-3 mb-2">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/20">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h1 
                  className="text-3xl font-extrabold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 bg-clip-text text-transparent tracking-tight cursor-pointer"
                  onClick={() => window.location.reload()}
                >
                  JU SeatFinder
                </h1>
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/20">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className={`text-base mb-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Smart Exam Seat & Direction Guide with AI Assistant
              </p>

              <div className="grid grid-cols-3 gap-3 text-sm max-w-3xl mx-auto">
                <div className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl ${
                  isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100'
                } shadow-sm`}>
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm truncate`}>
                    {currentDate}
                  </span>
                </div>
                <div className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl ${
                  isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100'
                } shadow-sm`}>
                  <Clock className="w-4 h-4 text-emerald-500 animate-pulse" />
                  <span className={`font-mono text-lg font-bold ${
                    isDarkMode ? 'text-emerald-400' : 'text-emerald-600'
                  }`}>
                    {liveTime || currentTime}
                  </span>
                </div>
                {weather && (
                  <div className={`flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl ${
                    isDarkMode ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100'
                  } shadow-sm`}>
                    {getWeatherIcon(weather.weather[0].main)}
                    <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} text-sm`}>
                      {Math.round(weather.main.temp)}°C
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Hero Section - WELCOME TO EMA */}
        <div className={`rounded-2xl shadow-xl border p-5 sm:p-8 mb-6 text-center card-with-dots ${
          isDarkMode
            ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border-purple-500/20 card-with-dots-dark'
            : 'bg-gradient-to-br from-purple-50/80 to-indigo-50/80 border-purple-200/60'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
            <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/25">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent uppercase tracking-wider">
              WELCOME TO EMA
            </h2>
            <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg shadow-pink-500/25">
              <Heart className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>
          <p className={`text-base sm:text-lg mb-6 ${isDarkMode ? 'text-purple-300/80' : 'text-purple-700/80'}`}>
            Your AI-Powered Exam Assistant
          </p>

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

        {/* Search Section */}
        <div className={`rounded-2xl shadow-xl border backdrop-blur-xl mb-6 card-with-dots ${
          isDarkMode ? 'bg-gray-800/60 border-white/10 card-with-dots-dark' : 'bg-white/70 border-gray-200/60'
        }`}>
          <div className="p-5 sm:p-8">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="p-2.5 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl shadow-lg shadow-blue-500/20">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <h2 className={`text-xl sm:text-2xl font-extrabold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Find Your Exam Seat
                </h2>
                <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg shadow-purple-500/20">
                  <Target className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Enter your roll number to get complete exam details with AI assistance
              </p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Enter Roll Number (e.g., 230417)"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={`w-full px-5 py-3.5 sm:py-4 rounded-xl border-2 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base font-medium ${
                    isDarkMode
                      ? 'bg-white/5 border-white/10 text-white placeholder-gray-500 focus:bg-white/10'
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:bg-white'
                  }`}
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                  <Zap className="w-4 h-4 text-yellow-500 opacity-60" />
                </div>
              </div>
              <div className="flex justify-center">
              <button
                onClick={handleSearch}
                disabled={loading}
                className="w-fit px-7 py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-md font-bold text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span>Search</span>
                    <Sparkles className="w-3 h-3 opacity-70" />
                  </>
                )}
              </button>
              </div>
            </div>

            {error && (
              <div className={`mt-4 p-3.5 rounded-xl flex items-center space-x-3 max-w-2xl mx-auto ${
                isDarkMode ? 'bg-red-500/10 border border-red-500/20 text-red-400' : 'bg-red-50 border border-red-200 text-red-700'
              }`}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Student Information */}
        {studentData && (
          <motion.div
            ref={resultsRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="space-y-6"
          >
            {/* Quick Summary Banner */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className={`rounded-2xl shadow-xl border p-5 sm:p-6 card-with-dots ${
                isDarkMode
                  ? 'bg-gradient-to-r from-blue-900/40 via-purple-900/40 to-pink-900/40 border-blue-500/20 card-with-dots-dark'
                  : 'bg-gradient-to-r from-blue-50/80 via-purple-50/80 to-pink-50/80 border-purple-200/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/20">
                    <User className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-xl sm:text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {studentData.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`font-mono text-sm font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        #{studentData.roll}
                      </span>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>•</span>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {studentData.institution}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {gender && (
                    <div className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                      isDarkMode
                        ? gender === 'male' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20' : 'bg-pink-500/15 text-pink-300 border border-pink-500/20'
                        : gender === 'male' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-pink-50 text-pink-700 border border-pink-200'
                    }`}>
                      {gender === 'male' ? '👨‍🎓 Male' : '👩‍🎓 Female'}
                    </div>
                  )}
                  <div className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 ${
                    isDarkMode ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}>
                    <CheckCircle className="w-3 h-3" /> Verified
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Exam Countdown */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className={`rounded-2xl shadow-xl border p-5 text-center ${
                isDarkMode
                  ? 'bg-gradient-to-r from-red-900/30 to-orange-900/30 border-red-500/20'
                  : 'bg-gradient-to-r from-red-50/80 to-orange-50/80 border-red-200/60'
              }`}
            >
              <div className="flex items-center justify-center space-x-3 mb-3">
                <Timer className="w-5 h-5 text-red-500 animate-pulse" />
                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Exam Countdown
                </h3>
                <Bell className="w-5 h-5 text-orange-500 animate-bounce" />
              </div>
              <div className={`text-3xl sm:text-4xl font-mono font-extrabold tracking-wider ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                {examCountdown}
              </div>
            </motion.div>

            {/* Exam Details - Key Info Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className={`rounded-2xl shadow-xl border p-5 sm:p-6 ${
                isDarkMode ? 'bg-gray-800/60 border-white/10' : 'bg-white/70 border-gray-200/60'
              }`}
            >
              <div className="flex items-center space-x-3 mb-5">
                <div className="p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg shadow-emerald-500/20">
                  <Building className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg sm:text-xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Exam Details</h3>
                <div className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                  isDarkMode ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                }`}>
                  <CheckCircle className="w-3 h-3" /> Confirmed
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { icon: <Building className="w-5 h-5" />, label: 'Room', value: studentData.room, sub: studentData.floor, gradient: isDarkMode ? 'from-emerald-500/15 to-teal-500/10' : 'from-emerald-50 to-teal-50', border: isDarkMode ? 'border-emerald-500/20' : 'border-emerald-200', iconColor: 'text-emerald-500', labelColor: isDarkMode ? 'text-emerald-400' : 'text-emerald-700', valueColor: isDarkMode ? 'text-white' : 'text-emerald-900', subColor: isDarkMode ? 'text-emerald-400/70' : 'text-emerald-600' },
                  { icon: <Clock className="w-5 h-5" />, label: 'Report', value: studentData.reportTime, sub: 'Be punctual!', gradient: isDarkMode ? 'from-blue-500/15 to-cyan-500/10' : 'from-blue-50 to-cyan-50', border: isDarkMode ? 'border-blue-500/20' : 'border-blue-200', iconColor: 'text-blue-500', labelColor: isDarkMode ? 'text-blue-400' : 'text-blue-700', valueColor: isDarkMode ? 'text-white' : 'text-blue-900', subColor: isDarkMode ? 'text-blue-400/70' : 'text-blue-600' },
                  { icon: <Timer className="w-5 h-5" />, label: 'Start', value: studentData.startTime, sub: 'Exam begins', gradient: isDarkMode ? 'from-purple-500/15 to-indigo-500/10' : 'from-purple-50 to-indigo-50', border: isDarkMode ? 'border-purple-500/20' : 'border-purple-200', iconColor: 'text-purple-500', labelColor: isDarkMode ? 'text-purple-400' : 'text-purple-700', valueColor: isDarkMode ? 'text-white' : 'text-purple-900', subColor: isDarkMode ? 'text-purple-400/70' : 'text-purple-600' },
                  { icon: <Clock className="w-5 h-5" />, label: 'End', value: studentData.endTime, sub: 'Exam ends', gradient: isDarkMode ? 'from-orange-500/15 to-red-500/10' : 'from-orange-50 to-red-50', border: isDarkMode ? 'border-orange-500/20' : 'border-orange-200', iconColor: 'text-orange-500', labelColor: isDarkMode ? 'text-orange-400' : 'text-orange-700', valueColor: isDarkMode ? 'text-white' : 'text-orange-900', subColor: isDarkMode ? 'text-orange-400/70' : 'text-orange-600' },
                ].map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 + i * 0.08 }}
                    className={`bg-gradient-to-br ${card.gradient} rounded-xl p-4 border ${card.border} hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={card.iconColor}>{card.icon}</span>
                      <label className={`text-xs font-bold uppercase tracking-wider ${card.labelColor}`}>{card.label}</label>
                    </div>
                    <p className={`text-2xl font-extrabold mb-1 ${card.valueColor}`}>{card.value}</p>
                    <p className={`text-xs font-semibold ${card.subColor}`}>{card.sub}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Live Location & Directions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className={`rounded-2xl shadow-xl border p-5 sm:p-6 ${
                isDarkMode ? 'bg-gray-800/60 border-white/10' : 'bg-white/70 border-gray-200/60'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl shadow-lg shadow-purple-500/20">
                    <Map className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-lg sm:text-xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Live Location & Directions
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className={`flex items-center space-x-1 px-2 py-0.5 rounded-lg text-xs font-bold ${
                        isDarkMode ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span>Live</span>
                      </div>
                      <div className={`px-2 py-0.5 rounded-lg text-xs font-bold ${
                        isDarkMode ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20' : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`}>
                        <Navigation className="w-3 h-3 inline mr-1" />GPS Ready
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-fit mx-auto">
                  <a href={studentData.mapUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all duration-300 text-sm font-bold">
                    <Eye className="w-4 h-4" /><span>View Full Map</span><ExternalLink className="w-3 h-3" />
                  </a>
                  <a href={`${studentData.mapUrl}&dir=1`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:shadow-purple-500/25 transition-all duration-300 text-sm font-bold">
                    <Route className="w-4 h-4" /><span>Get Directions</span><ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Map Preview */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-2">
                    <Locate className="w-5 h-5 text-blue-500" />
                    <h4 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Live Location Preview</h4>
                  </div>

                  <div className={`relative rounded-2xl p-5 border min-h-[280px] overflow-hidden ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-blue-900/30 via-emerald-900/20 to-blue-900/30 border-blue-500/20'
                      : 'bg-gradient-to-br from-blue-100 via-emerald-50 to-blue-100 border-blue-200'
                  }`}>
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-4 left-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="absolute top-8 right-6 w-1 h-1 bg-emerald-500 rounded-full animate-ping"></div>
                      <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-4 right-4 w-2 h-2 bg-pink-500 rounded-full animate-ping"></div>
                    </div>

                    <div className="relative z-10 space-y-3">
                      <div className={`backdrop-blur-sm rounded-xl p-4 border shadow-sm ${
                        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/90 border-blue-200'
                      }`}>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl">
                            <Building className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h5 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{studentData.building}</h5>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{studentData.institution}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div className={`rounded-lg p-2 ${isDarkMode ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50 border border-blue-200'}`}>
                            <span className={`font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>Room:</span>
                            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-blue-900'}`}>{studentData.room}</p>
                          </div>
                          <div className={`rounded-lg p-2 ${isDarkMode ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                            <span className={`font-semibold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Floor:</span>
                            <p className={`font-bold ${isDarkMode ? 'text-white' : 'text-emerald-900'}`}>{studentData.floor}</p>
                          </div>
                        </div>
                      </div>

                      <div className={`backdrop-blur-sm rounded-xl p-3 border shadow-sm ${
                        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/90 border-purple-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-purple-500" />
                            <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>GPS Coordinates</span>
                          </div>
                          <div className={`text-xs font-mono ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {(() => {
                              const coords = extractCoordinates(studentData.mapUrl);
                              return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className={`backdrop-blur-sm rounded-xl p-3 border shadow-sm ${
                        isDarkMode ? 'bg-white/5 border-white/10' : 'bg-white/90 border-orange-200'
                      }`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Exam Schedule</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <p className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>Report</p>
                            <p className={`font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>{studentData.reportTime}</p>
                          </div>
                          <div className="text-center">
                            <p className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>Start</p>
                            <p className={`font-bold ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>{studentData.startTime}</p>
                          </div>
                          <div className="text-center">
                            <p className={isDarkMode ? 'text-gray-500' : 'text-gray-500'}>End</p>
                            <p className={`font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{studentData.endTime}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="relative">
                        <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                          <MapPin className="w-5 h-5 text-white" />
                        </div>
                        <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-red-500 rotate-45"></div>
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 border-2 border-red-400 rounded-full animate-ping opacity-75"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step-by-Step Directions */}
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Route className="w-5 h-5 text-purple-500" />
                    <h4 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Step-by-Step Directions</h4>
                  </div>

                  <div className="space-y-2">
                    {studentData.directions.split(' ➞ ').map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                        className={`flex items-start space-x-3 p-3.5 rounded-xl border transition-all duration-200 hover:shadow-md ${
                          isDarkMode
                            ? 'bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/15 hover:from-purple-500/15 hover:to-pink-500/15'
                            : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200/60 hover:from-purple-100 hover:to-pink-100'
                        }`}
                      >
                        <div className="flex-shrink-0 w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg flex items-center justify-center text-xs font-bold shadow-md">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <span className={`text-sm font-medium leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{step}</span>
                        </div>
                        <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      </motion.div>
                    ))}
                  </div>

                  <div className={`mt-3 p-3.5 rounded-xl border ${
                    isDarkMode
                      ? 'bg-yellow-500/10 border-yellow-500/15'
                      : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200'
                  }`}>
                    <div className="flex items-start space-x-3">
                      <Bell className={`w-5 h-5 flex-shrink-0 mt-0.5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`} />
                      <div>
                        <h5 className={`font-bold mb-1.5 text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-800'}`}>📍 Navigation Tips:</h5>
                        <ul className={`text-xs space-y-0.5 ${isDarkMode ? 'text-yellow-400/80' : 'text-yellow-700'}`}>
                          <li>• Arrive 30 minutes before exam time</li>
                          <li>• Follow the step-by-step directions above</li>
                          <li>• Use the GPS coordinates for precise location</li>
                          <li>• Ask security guards if you need assistance</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Exam Day Checklist */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className={`rounded-2xl shadow-xl border p-5 sm:p-6 ${
                isDarkMode ? 'bg-gray-800/60 border-white/10' : 'bg-white/70 border-gray-200/60'
              }`}
            >
              <div className="flex items-center space-x-3 mb-5">
                <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h3 className={`text-lg sm:text-xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Exam Day Checklist</h3>
                <div className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1 ${
                  isDarkMode ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                }`}>
                  <Bookmark className="w-3 h-3" /> Essential
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div>
                  <h4 className={`font-bold mb-3 flex items-center space-x-2 text-base ${isDarkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                    <CheckCircle className="w-4 h-4" />
                    <span>✅ What to Bring</span>
                  </h4>
                  <div className="space-y-2">
                    {whatToBring.map((item, index) => (
                      <div key={index} className={`flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                        isDarkMode
                          ? item.required ? 'bg-emerald-500/10 border-emerald-500/15' : 'bg-white/5 border-white/10'
                          : item.required ? 'bg-emerald-50 border-emerald-200/60' : 'bg-gray-50 border-gray-200/60'
                      }`}>
                        <span className="text-lg">{item.icon}</span>
                        <CheckCircle className={`w-4 h-4 ${item.required ? 'text-emerald-500' : isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
                        <span className={`font-semibold text-sm ${isDarkMode ? (item.required ? 'text-gray-200' : 'text-gray-400') : (item.required ? 'text-gray-900' : 'text-gray-600')}`}>
                          {item.item}
                          {item.required && <span className="text-red-500 ml-1.5 font-bold">*</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className={`font-bold mb-3 flex items-center space-x-2 text-base ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>
                    <AlertCircle className="w-4 h-4" />
                    <span>🚫 What NOT to Bring</span>
                  </h4>
                  <div className="space-y-2">
                    {whatNotToBring.map((item, index) => (
                      <div key={index} className={`flex items-center space-x-3 p-3 rounded-xl border transition-all duration-200 hover:shadow-sm ${
                        isDarkMode ? 'bg-red-500/10 border-red-500/15' : 'bg-red-50 border-red-200/60'
                      }`}>
                        <span className="text-lg">{item.icon}</span>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className={`font-semibold text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{item.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Motivation Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {quote && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className={`rounded-2xl shadow-xl border p-5 sm:p-6 ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-pink-900/30 to-rose-900/30 border-pink-500/20'
                      : 'bg-gradient-to-br from-pink-50/80 to-rose-50/80 border-pink-200/60'
                  }`}
                >
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="p-2.5 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg shadow-pink-500/20">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <h4 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Quote of the Day</h4>
                  </div>
                  <blockquote className={`text-sm italic mb-3 leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    "{quote.content}"
                  </blockquote>
                  <cite className={`text-sm font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    — {quote.author}
                  </cite>
                </motion.div>
              )}

              {currentEmaAdvice && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className={`rounded-2xl shadow-xl border p-5 sm:p-6 ${
                    isDarkMode
                      ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/20'
                      : 'bg-gradient-to-br from-purple-50/80 to-indigo-50/80 border-purple-200/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2.5 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/20">
                        <Brain className="w-5 h-5 text-white" />
                      </div>
                      <h4 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Ema Advice</h4>
                    </div>
                    <div className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                      isDarkMode ? 'bg-red-500/15 text-red-300 border border-red-500/20' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      <Heart className="w-3 h-3 animate-pulse" />
                      <span>Live</span>
                    </div>
                  </div>
                  <div className={`p-3.5 rounded-xl border ${isDarkMode ? 'bg-purple-500/10 border-purple-500/15' : 'bg-white/80 border-purple-200/60'}`}>
                    <p className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                      {currentEmaAdvice}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-center">
                    <div className={`flex items-center space-x-2 text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                      <span>Updates every 2 seconds</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Success Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 }}
              className={`rounded-2xl shadow-xl border p-5 sm:p-6 text-center ${
                isDarkMode
                  ? 'bg-gradient-to-r from-emerald-900/30 to-teal-900/30 border-emerald-500/20'
                  : 'bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-emerald-200/60'
              }`}
            >
              <div className="flex items-center justify-center space-x-4 mb-3">
                <Trophy className="w-9 h-9 text-yellow-500" />
                <h3 className={`text-xl sm:text-2xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>You're All Set! 🎯</h3>
                <Star className="w-9 h-9 text-yellow-500" />
              </div>
              <p className={`text-base mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Everything is prepared for your exam success. Stay confident and give your best!
              </p>
              <div className="flex items-center justify-center space-x-3">
                <Coffee className="w-5 h-5 text-amber-600" />
                <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  Good luck with your exam! ☕
                </span>
                <Sparkles className="w-5 h-5 text-purple-500" />
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Footer */}
        <div className={`mt-16 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className={`rounded-2xl shadow-xl border p-6 sm:p-8 mb-8 text-center card-with-dots ${
            isDarkMode
              ? 'bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/15 card-with-dots-dark'
              : 'bg-gradient-to-br from-purple-50/60 to-indigo-50/60 border-purple-200/50'
          }`}>
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl shadow-lg shadow-purple-500/20">
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-extrabold bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                Ema Assistant
              </h3>
              <div className="p-3 bg-gradient-to-br from-pink-500 to-rose-600 rounded-2xl shadow-lg shadow-pink-500/20">
                <Heart className="w-7 h-7 text-white animate-pulse" />
              </div>
            </div>
            <p className={`text-base mb-5 ${isDarkMode ? 'text-purple-300/70' : 'text-purple-700/70'}`}>
              Your AI-powered companion for exam success and guidance
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              {[
                { icon: <Sparkles className="w-4 h-4" />, label: 'Smart Guidance', color: isDarkMode ? 'bg-purple-500/10 text-purple-300 border-purple-500/20' : 'bg-purple-50 text-purple-700 border-purple-200' },
                { icon: <Zap className="w-4 h-4" />, label: 'Real-time Support', color: isDarkMode ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20' : 'bg-indigo-50 text-indigo-700 border-indigo-200' },
                { icon: <Heart className="w-4 h-4" />, label: 'Personalized Care', color: isDarkMode ? 'bg-pink-500/10 text-pink-300 border-pink-500/20' : 'bg-pink-50 text-pink-700 border-pink-200' },
              ].map((tag, i) => (
                <div key={i} className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-semibold border text-sm ${tag.color}`}>
                  {tag.icon}<span>{tag.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center pb-8">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <Shield className="w-5 h-5 text-emerald-500" />
              <span className={`text-base font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>Smart Exam Seat & Direction Guide</span>
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <div className="flex items-center justify-center space-x-4 mb-4 text-sm">
              <a href="/status" className={`font-medium transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                System Status
              </a>
              <span className={isDarkMode ? 'text-gray-600' : 'text-gray-300'}>•</span>
              <a href="/admin/login" className={`font-medium transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
                Admin
              </a>
            </div>
            <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
              © 2025 JU SeatFinder · Made with ❤️ by
              <a
                href="https://afrozaema.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1.5 text-purple-500 hover:text-purple-600 font-semibold transition-colors duration-200"
              >
                Afroza Akter Ema
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Index;
