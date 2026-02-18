import React, { useState, useEffect } from 'react';
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

    const student = centersData.find(s => s.roll === rollNumber.trim());
    if (student) {
      setStudentData(student);
      await fetchGender(student.name);
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
      <div className={`shadow-lg border-b backdrop-blur-md ${
        isDarkMode ? 'bg-gray-800/90 border-gray-700' : 'bg-white/90 border-gray-200'
      }`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-3 sm:py-4">
          {/* Status Bar */}
          <div className="flex items-center justify-between mb-3 text-sm">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className={`flex items-center space-x-1 ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                <Wifi className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">{isOnline ? 'Online' : 'Offline'}</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-600">
                <Battery className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">{batteryLevel}%</span>
              </div>
              <div className="flex items-center space-x-1 text-blue-600">
                <Signal className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-xs sm:text-sm font-medium">Strong</span>
              </div>
            </div>
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-2 rounded-full transition-all duration-300 ${
                isDarkMode ? 'bg-yellow-500 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              {isDarkMode ? <Sun className="w-3 h-3 sm:w-4 sm:h-4" /> : <Moon className="w-3 h-3 sm:w-4 sm:h-4" />}
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
              <div className="flex items-center justify-center space-x-3 mb-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  JU SeatFinder
                </h1>
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Smart Exam Seat & Direction Guide with AI Assistant
              </p>

              <div className="grid grid-cols-3 gap-4 text-sm max-w-4xl mx-auto">
                <div className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full ${
                  isDarkMode ? 'bg-gray-700' : 'bg-white'
                } shadow-md`}>
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'} text-sm truncate`}>
                    {currentDate}
                  </span>
                </div>
                <div className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full ${
                  isDarkMode ? 'bg-gray-700' : 'bg-white'
                } shadow-md`}>
                  <Clock className="w-4 h-4 text-green-500 animate-pulse" />
                  <span className={`font-mono text-lg font-bold ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                    {liveTime || currentTime}
                  </span>
                </div>
                {weather && (
                  <div className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-full ${
                    isDarkMode ? 'bg-gray-700' : 'bg-white'
                  } shadow-md`}>
                    {getWeatherIcon(weather.weather[0].main)}
                    <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-700'} text-sm`}>
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
        <div className={`rounded-xl shadow-xl border p-4 sm:p-6 mb-6 text-center card-with-dots ${
          isDarkMode
            ? 'bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-700 card-with-dots-dark'
            : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
        }`}>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
            <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent uppercase tracking-wide">
              WELCOME TO EMA
            </h2>
            <div className="p-2 bg-gradient-to-r from-pink-500 to-red-500 rounded-full">
              <Heart className="w-6 h-6 text-white animate-pulse" />
            </div>
          </div>
          <p className={`text-base sm:text-lg mb-4 ${isDarkMode ? 'text-purple-200' : 'text-purple-800'}`}>
            Your AI-Powered Exam Assistant
          </p>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { icon: <Search className="w-5 h-5 text-blue-500 mx-auto mb-2" />, label: 'Smart Search', color: isDarkMode ? 'bg-blue-900/30 border-blue-600 hover:bg-blue-800/40' : 'bg-blue-50 border-blue-200 hover:bg-blue-100', textColor: isDarkMode ? 'text-blue-300' : 'text-blue-700' },
              { icon: <Compass className="w-5 h-5 text-green-500 mx-auto mb-2" />, label: 'Navigation', color: isDarkMode ? 'bg-green-900/30 border-green-600 hover:bg-green-800/40' : 'bg-green-50 border-green-200 hover:bg-green-100', textColor: isDarkMode ? 'text-green-300' : 'text-green-700' },
              { icon: <Brain className="w-5 h-5 text-purple-500 mx-auto mb-2" />, label: 'AI Support', color: isDarkMode ? 'bg-purple-900/30 border-purple-600 hover:bg-purple-800/40' : 'bg-purple-50 border-purple-200 hover:bg-purple-100', textColor: isDarkMode ? 'text-purple-300' : 'text-purple-700' },
              { icon: <Shield className="w-5 h-5 text-orange-500 mx-auto mb-2" />, label: 'Trusted', color: isDarkMode ? 'bg-orange-900/30 border-orange-600 hover:bg-orange-800/40' : 'bg-orange-50 border-orange-200 hover:bg-orange-100', textColor: isDarkMode ? 'text-orange-300' : 'text-orange-700' },
            ].map((feature, i) => (
              <div key={i} className={`p-3 rounded-lg border-2 transition-all hover:scale-105 ${feature.color}`}>
                {feature.icon}
                <p className={`text-xs font-semibold ${feature.textColor}`}>{feature.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Search Section */}
        <div className={`rounded-xl shadow-xl border backdrop-blur-md mb-6 card-with-dots ${
          isDarkMode ? 'bg-gray-800/90 border-gray-700 card-with-dots-dark' : 'bg-white/90 border-gray-200'
        }`}>
          <div className="p-4 sm:p-6">
            <div className="text-center mb-6">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                  <Search className="w-5 h-5 text-white" />
                </div>
                <h2 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Find Your Exam Seat
                </h2>
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                  <Target className="w-5 h-5 text-white" />
                </div>
              </div>
              <p className={`text-sm sm:text-base ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                Enter your roll number to get complete exam details with AI assistance
              </p>
            </div>

            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 max-w-2xl mx-auto">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Enter Roll Number (e.g., 230417)"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  onKeyDown={handleKeyPress}
                  className={`w-full px-4 sm:px-6 py-3 sm:py-4 rounded-lg border-2 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 text-base ${
                    isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                  }`}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                </div>
              </div>
              <button
                onClick={handleSearch}
                disabled={loading}
                className="px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shadow-lg text-sm sm:text-base"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span className="font-semibold">Searching...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    <span className="font-semibold">Search</span>
                    <Sparkles className="w-3 h-3" />
                  </>
                )}
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 sm:p-4 bg-red-50 border-2 border-red-200 rounded-lg flex items-center space-x-3 text-red-700 max-w-2xl mx-auto">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base">{error}</span>
              </div>
            )}
          </div>
        </div>

        {/* Student Information */}
        {studentData && (
          <div className="space-y-6">
            {/* Exam Countdown */}
            <div className={`rounded-xl shadow-xl border p-4 sm:p-6 text-center card-with-dots ${
              isDarkMode ? 'bg-gradient-to-r from-red-900/50 to-orange-900/50 border-red-700 card-with-dots-dark' : 'bg-gradient-to-r from-red-50 to-orange-50 border-red-200'
            }`}>
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Timer className="w-6 h-6 text-red-500 animate-pulse" />
                <h3 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Exam Countdown
                </h3>
                <Bell className="w-6 h-6 text-orange-500 animate-bounce" />
              </div>
              <div className={`text-2xl sm:text-3xl font-mono font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                {examCountdown}
              </div>
            </div>

            {/* Basic Info */}
            <div className={`rounded-xl shadow-xl border p-4 sm:p-6 card-with-dots ${
              isDarkMode ? 'bg-gray-800/90 border-gray-700 card-with-dots-dark' : 'bg-white/90 border-gray-200'
            }`}>
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                  <User className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Student Information
                </h3>
                <div className="flex flex-wrap gap-2">
                  {gender && (
                    <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                      gender === 'male'
                        ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                        : 'bg-pink-100 text-pink-800 border-2 border-pink-300'
                    }`}>
                      {gender === 'male' ? '👨‍🎓 Male' : '👩‍🎓 Female'}
                    </div>
                  )}
                  <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border-2 border-green-300">
                    <Award className="w-3 h-3 inline mr-1" />
                    Verified
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wide`}>Full Name</label>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{studentData.name}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wide`}>Roll Number</label>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-1 font-mono`}>{studentData.roll}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wide`}>Institution</label>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{studentData.institution}</p>
                  </div>
                  <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <label className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-500'} uppercase tracking-wide`}>Building</label>
                    <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-1`}>{studentData.building}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Exam Details */}
            <div className={`rounded-xl shadow-xl border p-4 sm:p-6 card-with-dots ${
              isDarkMode ? 'bg-gray-800/90 border-gray-700 card-with-dots-dark' : 'bg-white/90 border-gray-200'
            }`}>
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-2 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full">
                  <Building className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Exam Details</h3>
                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border-2 border-green-300">
                  <CheckCircle className="w-3 h-3 inline mr-1" />Confirmed
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border-2 border-green-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Building className="w-5 h-5 text-green-600" />
                    <label className="text-xs font-bold text-green-700 uppercase tracking-wide">Room Number</label>
                  </div>
                  <p className="text-2xl font-bold text-green-900 mb-2">{studentData.room}</p>
                  <p className="text-sm text-green-700 font-semibold">{studentData.floor}</p>
                </div>

                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border-2 border-blue-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <label className="text-xs font-bold text-blue-700 uppercase tracking-wide">Report Time</label>
                  </div>
                  <p className="text-2xl font-bold text-blue-900 mb-2">{studentData.reportTime}</p>
                  <p className="text-xs text-blue-600 font-semibold">Be punctual!</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border-2 border-purple-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Timer className="w-5 h-5 text-purple-600" />
                    <label className="text-xs font-bold text-purple-700 uppercase tracking-wide">Start Time</label>
                  </div>
                  <p className="text-2xl font-bold text-purple-900 mb-2">{studentData.startTime}</p>
                  <p className="text-xs text-purple-600 font-semibold">Exam begins</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 border-2 border-orange-200">
                  <div className="flex items-center space-x-2 mb-3">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <label className="text-xs font-bold text-orange-700 uppercase tracking-wide">End Time</label>
                  </div>
                  <p className="text-2xl font-bold text-orange-900 mb-2">{studentData.endTime}</p>
                  <p className="text-xs text-orange-600 font-semibold">Exam ends</p>
                </div>
              </div>
            </div>

            {/* Live Location & Directions */}
            <div className={`rounded-xl shadow-xl border p-4 sm:p-6 card-with-dots ${
              isDarkMode ? 'bg-gray-800/90 border-gray-700 card-with-dots-dark' : 'bg-white/90 border-gray-200'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 mb-6">
                <div className="flex items-center space-x-4">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full">
                    <Map className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      Live Location & Directions
                    </h3>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex items-center space-x-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold border border-green-300">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span>Live</span>
                      </div>
                      <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold border border-blue-300">
                        <Navigation className="w-3 h-3 inline mr-1" />GPS Ready
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full sm:w-auto">
                  <a href={studentData.mapUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 shadow-lg text-sm font-semibold">
                    <Eye className="w-4 h-4" /><span>View Full Map</span><ExternalLink className="w-3 h-3" />
                  </a>
                  <a href={`${studentData.mapUrl}&dir=1`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-lg text-sm font-semibold">
                    <Route className="w-4 h-4" /><span>Get Directions</span><ArrowRight className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Map Preview */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Locate className="w-5 h-5 text-blue-500" />
                    <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Live Location Preview</h4>
                  </div>

                  <div className="relative bg-gradient-to-br from-blue-100 via-green-50 to-blue-100 rounded-xl p-6 border-2 border-blue-200 min-h-[300px] overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                      <div className="absolute top-4 left-4 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                      <div className="absolute top-8 right-6 w-1 h-1 bg-green-500 rounded-full animate-ping"></div>
                      <div className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse"></div>
                      <div className="absolute bottom-4 right-4 w-2 h-2 bg-pink-500 rounded-full animate-ping"></div>
                    </div>

                    <div className="relative z-10 space-y-4">
                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 border border-blue-200 shadow-lg">
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                            <Building className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h5 className="font-bold text-gray-900">{studentData.building}</h5>
                            <p className="text-sm text-gray-600">{studentData.institution}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="bg-blue-50 rounded-lg p-2 border border-blue-200">
                            <span className="text-blue-600 font-semibold">Room:</span>
                            <p className="font-bold text-blue-900">{studentData.room}</p>
                          </div>
                          <div className="bg-green-50 rounded-lg p-2 border border-green-200">
                            <span className="text-green-600 font-semibold">Floor:</span>
                            <p className="font-bold text-green-900">{studentData.floor}</p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-purple-200 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <MapPin className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-semibold text-gray-700">GPS Coordinates</span>
                          </div>
                          <div className="text-xs font-mono text-gray-600">
                            {(() => {
                              const coords = extractCoordinates(studentData.mapUrl);
                              return `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`;
                            })()}
                          </div>
                        </div>
                      </div>

                      <div className="bg-white/90 backdrop-blur-sm rounded-lg p-3 border border-orange-200 shadow-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="w-4 h-4 text-orange-500" />
                          <span className="text-sm font-semibold text-gray-700">Exam Schedule</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="text-center">
                            <p className="text-gray-500">Report</p>
                            <p className="font-bold text-orange-600">{studentData.reportTime}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-500">Start</p>
                            <p className="font-bold text-green-600">{studentData.startTime}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-500">End</p>
                            <p className="font-bold text-red-600">{studentData.endTime}</p>
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
                <div className="space-y-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Route className="w-5 h-5 text-purple-500" />
                    <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Step-by-Step Directions</h4>
                  </div>

                  <div className="space-y-3">
                    {studentData.directions.split(' ➞ ').map((step, index) => (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200 hover:from-purple-100 hover:to-pink-100 transition-all duration-200">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <span className="text-gray-800 font-medium text-sm leading-relaxed">{step}</span>
                        </div>
                        <div className="flex-shrink-0">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg">
                    <div className="flex items-start space-x-3">
                      <Bell className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-yellow-800 mb-2">📍 Navigation Tips:</h5>
                        <ul className="text-sm text-yellow-700 space-y-1">
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
            </div>

            {/* Exam Day Checklist */}
            <div className={`rounded-xl shadow-xl border p-4 sm:p-6 card-with-dots ${
              isDarkMode ? 'bg-gray-800/90 border-gray-700 card-with-dots-dark' : 'bg-white/90 border-gray-200'
            }`}>
              <div className="flex items-center space-x-4 mb-6">
                <div className="p-2 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <h3 className={`text-xl sm:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Exam Day Checklist</h3>
                <div className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold border-2 border-indigo-300">
                  <Bookmark className="w-3 h-3 inline mr-1" />Essential
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold text-green-700 mb-4 flex items-center space-x-2 text-lg">
                    <CheckCircle className="w-5 h-5" />
                    <span>✅ What to Bring</span>
                  </h4>
                  <div className="space-y-2">
                    {whatToBring.map((item, index) => (
                      <div key={index} className={`flex items-center space-x-3 p-3 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
                        item.required ? 'bg-green-50 border-green-200 hover:bg-green-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                      }`}>
                        <span className="text-xl">{item.icon}</span>
                        <CheckCircle className={`w-4 h-4 ${item.required ? 'text-green-600' : 'text-gray-400'}`} />
                        <span className={`font-semibold text-sm ${item.required ? 'text-gray-900' : 'text-gray-600'}`}>
                          {item.item}
                          {item.required && <span className="text-red-500 ml-2 font-bold">*</span>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-bold text-red-700 mb-4 flex items-center space-x-2 text-lg">
                    <AlertCircle className="w-5 h-5" />
                    <span>🚫 What NOT to Bring</span>
                  </h4>
                  <div className="space-y-2">
                    {whatNotToBring.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-red-50 rounded-lg border-2 border-red-200 hover:bg-red-100 transition-all duration-200">
                        <span className="text-xl">{item.icon}</span>
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        <span className="text-gray-800 font-semibold text-sm">{item.item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Motivation Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {quote && (
                <div className={`rounded-xl shadow-xl border p-4 sm:p-6 card-with-dots ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-pink-900/50 to-rose-900/50 border-pink-700 card-with-dots-dark'
                    : 'bg-gradient-to-br from-pink-50 to-rose-50 border-pink-200'
                }`}>
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="p-2 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full">
                      <Heart className="w-6 h-6 text-white" />
                    </div>
                    <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Quote of the Day</h4>
                  </div>
                  <blockquote className={`text-base italic mb-4 leading-relaxed ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                    "{quote.content}"
                  </blockquote>
                  <cite className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    — {quote.author}
                  </cite>
                </div>
              )}

              {currentEmaAdvice && (
                <div className={`rounded-xl shadow-xl border p-4 sm:p-6 card-with-dots ${
                  isDarkMode
                    ? 'bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-700 card-with-dots-dark'
                    : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
                }`}>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full">
                        <Brain className="w-6 h-6 text-white" />
                      </div>
                      <h4 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Ema Advice</h4>
                    </div>
                    <div className="flex items-center space-x-1 px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold border border-red-300">
                      <Heart className="w-3 h-3 animate-pulse" />
                      <span>Live</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg border-2 ${isDarkMode ? 'bg-purple-800/30 border-purple-600' : 'bg-white border-purple-200'}`}>
                    <p className={`text-base leading-relaxed font-medium ${isDarkMode ? 'text-purple-200' : 'text-purple-800'}`}>
                      {currentEmaAdvice}
                    </p>
                  </div>
                  <div className="mt-3 flex items-center justify-center">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <div className="flex space-x-1">
                        <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse"></div>
                        <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-1 h-1 bg-purple-500 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
                      </div>
                      <span>Updates every 2 seconds</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Success Card */}
            <div className={`rounded-xl shadow-xl border p-4 sm:p-6 text-center card-with-dots ${
              isDarkMode
                ? 'bg-gradient-to-r from-green-900/50 to-emerald-900/50 border-green-700 card-with-dots-dark'
                : 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
            }`}>
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Trophy className="w-10 h-10 text-yellow-500" />
                <h3 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>You're All Set! 🎯</h3>
                <Star className="w-10 h-10 text-yellow-500" />
              </div>
              <p className={`text-lg mb-4 ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                Everything is prepared for your exam success. Stay confident and give your best!
              </p>
              <div className="flex items-center justify-center space-x-4">
                <Coffee className="w-6 h-6 text-amber-700" />
                <span className={`text-lg font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                  Good luck with your exam! ☕
                </span>
                <Sparkles className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className={`mt-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          <div className={`rounded-xl shadow-xl border p-4 sm:p-6 mb-6 text-center card-with-dots ${
            isDarkMode
              ? 'bg-gradient-to-br from-purple-900/50 to-indigo-900/50 border-purple-700 card-with-dots-dark'
              : 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200'
          }`}>
            <div className="flex items-center justify-center space-x-4 mb-4">
              <div className="p-3 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full shadow-lg">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Ema Assistant
              </h3>
              <div className="p-3 bg-gradient-to-r from-pink-500 to-red-500 rounded-full shadow-lg">
                <Heart className="w-8 h-8 text-white animate-pulse" />
              </div>
            </div>
            <p className={`text-lg mb-4 ${isDarkMode ? 'text-purple-200' : 'text-purple-800'}`}>
              Your AI-powered companion for exam success and guidance
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2 px-3 py-2 bg-purple-100 text-purple-800 rounded-full font-semibold border-2 border-purple-300 text-sm">
                <Sparkles className="w-4 h-4" /><span>Smart Guidance</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 bg-indigo-100 text-indigo-800 rounded-full font-semibold border-2 border-indigo-300 text-sm">
                <Zap className="w-4 h-4" /><span>Real-time Support</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 bg-pink-100 text-pink-800 rounded-full font-semibold border-2 border-pink-300 text-sm">
                <Heart className="w-4 h-4" /><span>Personalized Care</span>
              </div>
            </div>
          </div>

          <div className="text-center pb-8">
            <div className="flex items-center justify-center space-x-4 mb-4">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="text-lg font-semibold">Smart Exam Seat & Direction Guide</span>
              <Zap className="w-5 h-5 text-yellow-500" />
            </div>
            <p className="text-base mb-4">
              © 2025 JU SeatFinder - ❤️
              <a
                href="https://afrozaema.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-purple-600 hover:text-purple-800 font-semibold transition-colors duration-200"
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
