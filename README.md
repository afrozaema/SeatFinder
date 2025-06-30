# 🎯 JU SeatFinder - Smart Exam Seat & Direction Guide

<div align="center">

![JU SeatFinder Logo](https://img.shields.io/badge/JU-SeatFinder-blue?style=for-the-badge&logo=graduation-cap)

**An AI-powered exam seat finder and direction guide for Jahangirnagar University students**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4.2-646CFF?style=flat&logo=vite)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

[🚀 Live Demo](https://ju-seatfinder.netlify.app) • [📖 Documentation](#documentation) • [🐛 Report Bug](https://github.com/afrozaema/SeatFinder/issues) • [✨ Request Feature](https://github.com/afrozaema/SeatFinder/issues)

</div>

---

## 🌟 Features

### 🎯 **Core Functionality**
- **🔍 Smart Search**: Find exam seat details by roll number instantly
- **📍 Step-by-Step Directions**: Detailed navigation to exam rooms with visual guides
- **⏰ Real-Time Clock**: Live time display with exam countdown timer
- **🗺️ Interactive Maps**: Direct Google Maps integration with live preview
- **📱 Fully Responsive**: Optimized for all devices (mobile, tablet, desktop)
- **🌙 Dark/Light Mode**: Toggle between themes with smooth transitions

### 🤖 **AI-Powered Assistant - Ema**
- **💬 Personalized Advice**: AI companion providing motivational support
- **🔄 Real-Time Updates**: Dynamic advice updates every 2 seconds
- **🎯 Context-Aware**: Personalized messages based on student name and gender
- **💝 Emotional Support**: Encouraging messages for exam success
- **🧠 Smart Guidance**: Intelligent responses based on exam preparation

### 🎨 **Modern UI/UX**
- **✨ Smooth Animations**: Micro-interactions and floating dot backgrounds
- **📊 Live Status Bar**: Battery, network, weather, time, and date indicators
- **🎭 Gender Detection**: Smart student profile enhancement
- **📋 Exam Checklist**: What to bring and what to avoid sections
- **🏆 Success Preparation**: Motivational cards and countdown timers

### 📊 **Real-Time Data Integration**
- **🌤️ Weather Integration**: Current weather conditions for exam day
- **⏱️ Live Clock**: Real-time updates with timezone support
- **📅 Date Display**: Current date with full formatting
- **🔋 Device Status**: Battery level and network status monitoring
- **📡 Online/Offline Detection**: Connection status with visual indicators

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/afrozaema/SeatFinder.git
   cd SeatFinder
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

---

## 🏗️ Project Structure

```
ju-seatfinder/
├── 📁 public/
│   ├── 📄 centers.txt          # Student data database
│   ├── 📄 robots.txt           # SEO robots configuration
│   ├── 📄 sitemap.xml          # SEO sitemap
│   ├── 📄 site.webmanifest     # PWA manifest
│   └── 🖼️ favicon.svg          # App icon
├── 📁 src/
│   ├── 📄 App.tsx              # Main application component
│   ├── 📄 main.tsx             # Application entry point
│   ├── 📄 index.css            # Global styles with animations
│   └── 📄 vite-env.d.ts        # TypeScript definitions
├── 📄 package.json             # Dependencies and scripts
├── 📄 tailwind.config.js       # Tailwind CSS configuration
├── 📄 vite.config.ts           # Vite configuration
├── 📄 tsconfig.json            # TypeScript configuration
└── 📄 README.md                # Project documentation
```

---

## 💾 Data Format

The student data is stored in `public/centers.txt` with the following format:

```
Roll|Name|Institution|Building|Room|Floor|ReportTime|StartTime|EndTime|Directions|MapURL
230417|Sadia Islam|NSU|Main Building|506|5th Floor|10:00 AM|12:00 PM|2:00 PM|Enter through Gate 2 ➞ Walk to Main Building ➞ Go to 5th Floor ➞ Room 506 on your right|https://www.google.com/maps?q=23.8156,90.4253
```

### Data Fields:
- **Roll**: Student roll number (unique identifier)
- **Name**: Full student name
- **Institution**: University/Institution code
- **Building**: Exam building name
- **Room**: Room number
- **Floor**: Floor information
- **ReportTime**: Exam reporting time
- **StartTime**: Exam start time
- **EndTime**: Exam end time
- **Directions**: Step-by-step navigation (separated by ➞)
- **MapURL**: Google Maps link with coordinates

---

## 🎨 Design System

### 🎨 **Color Palette**
- **Primary**: Blue to Purple gradient (`from-blue-600 to-purple-600`)
- **Secondary**: Purple to Pink gradient (`from-purple-500 to-pink-500`)
- **Success**: Green shades (`green-50` to `green-900`)
- **Warning**: Yellow to Orange gradient (`from-yellow-50 to-orange-50`)
- **Error**: Red shades (`red-50` to `red-900`)
- **Info**: Cyan to Blue gradient (`from-cyan-500 to-blue-500`)

### 📱 **Responsive Breakpoints**
- **Mobile**: `< 640px` (sm) - Optimized for phones
- **Tablet**: `640px - 1024px` (md) - Perfect for tablets
- **Desktop**: `> 1024px` (lg) - Full desktop experience

### 🎭 **Animation System**
- **Floating Dots**: Multi-layer animated background patterns
- **Micro-interactions**: Hover effects and button animations
- **Loading States**: Smooth loading indicators
- **Transitions**: Seamless theme switching and state changes

---

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the root directory:

```env
VITE_APP_TITLE=JU SeatFinder
VITE_API_BASE_URL=https://api.example.com
VITE_WEATHER_API_KEY=your_weather_api_key
```

### Tailwind CSS
The project uses Tailwind CSS for styling. Configuration is in `tailwind.config.js`:

```javascript
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
```

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
# or
yarn build
```

### Deploy to Netlify
1. Build the project: `npm run build`
2. Upload the `dist` folder to Netlify
3. Configure redirects for SPA routing

### Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
```

### Deploy to GitHub Pages
```bash
npm run build
npm run deploy
```

---

## 🤖 Ema Assistant Features

### 💬 **Personalized Messages**
- Uses student's first name for personalization
- 15+ unique motivational messages
- Updates every 2 seconds for dynamic experience
- Gender-aware messaging for better connection

### 🎯 **Message Categories**
- **Confidence Boosters**: "You are stronger than you think!"
- **Preparation Reminders**: "You've prepared well for this!"
- **Stress Relief**: "Take deep breaths and stay confident!"
- **Success Motivation**: "Your hard work will definitely pay off!"
- **Exam Day Tips**: "Remember to stay hydrated and focused!"

### 🔄 **Real-Time Features**
- Automatic message rotation every 2 seconds
- Live status indicator showing "Live" updates
- Smooth animations and transitions
- Context-aware advice based on exam timing

---

## 📊 API Integrations

### 🌐 **External APIs Used**

1. **World Time API**: Real-time clock and date
   ```javascript
   https://worldtimeapi.org/api/timezone/Asia/Dhaka
   ```

2. **Quotable API**: Motivational quotes
   ```javascript
   https://api.quotable.io/random?tags=motivational,success
   ```

3. **Genderize API**: Gender detection from names
   ```javascript
   https://api.genderize.io?name={firstName}
   ```

4. **OpenWeatherMap API**: Weather information
   ```javascript
   https://api.openweathermap.org/data/2.5/weather?q=Dhaka
   ```

5. **Google Maps API**: Interactive maps and directions
   ```javascript
   https://www.google.com/maps?q={latitude},{longitude}
   ```

---

## 🎯 Usage Examples

### Basic Search
```typescript
// Search for a student by roll number
const rollNumber = "230417";
const student = centersData.find(s => s.roll === rollNumber);

if (student) {
  console.log(`Found: ${student.name} in ${student.building} Room ${student.room}`);
}
```

### Ema Advice Generation
```typescript
// Generate personalized advice
const firstName = studentData.name.split(' ')[0];
const randomAdvice = emaAdviceMessages[Math.floor(Math.random() * emaAdviceMessages.length)];
const personalizedAdvice = randomAdvice.replace('{name}', firstName);
```

### Live Status Updates
```typescript
// Update live time every second
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
```

---

## 🛠️ Development

### Available Scripts
- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production with optimizations
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint for code quality

### Code Style
- **TypeScript**: Strict mode enabled with comprehensive type checking
- **ESLint**: React and TypeScript rules for consistent code
- **Prettier**: Code formatting (recommended setup)
- **Conventional Commits**: Standardized commit messages

### Git Workflow
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request with detailed description

---

## 🐛 Troubleshooting

### Common Issues

**1. API Calls Failing**
```bash
# Check network connection
ping google.com

# Verify API endpoints are accessible
curl https://worldtimeapi.org/api/timezone/Asia/Dhaka
```

**2. Data Not Loading**
- Ensure `centers.txt` is in the `public` folder
- Check file format and encoding (UTF-8)
- Verify data structure matches expected format

**3. Responsive Issues**
- Clear browser cache and cookies
- Check Tailwind CSS classes for responsive prefixes
- Test on different devices and browsers

**4. Build Errors**
```bash
# Update Node.js to latest LTS version
nvm install --lts
nvm use --lts

# Clear cache and reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Check TypeScript errors
npm run type-check
```

**5. Performance Issues**
- Optimize images and assets
- Check for memory leaks in useEffect hooks
- Monitor API call frequency and implement caching

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Ways to Contribute
- 🐛 **Bug Reports**: Report issues and bugs with detailed reproduction steps
- ✨ **Feature Requests**: Suggest new features with use cases
- 📝 **Documentation**: Improve documentation and examples
- 🎨 **Design**: UI/UX improvements and design suggestions
- 💻 **Code**: Bug fixes, new features, and performance improvements
- 🌐 **Translations**: Help translate the app to other languages

### Development Setup
1. Fork and clone the repository
2. Install dependencies: `npm install`
3. Create a feature branch: `git checkout -b feature/your-feature`
4. Make your changes with proper testing
5. Commit with conventional commit format
6. Push and submit a pull request

### Code Review Process
1. All PRs require at least one review
2. Automated tests must pass
3. Code coverage should not decrease
4. Follow existing code style and patterns
5. Update documentation if needed

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2025 Afroza Akter Ema

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 👥 Team

<div align="center">

### 💝 Created with Love by

**[Afroza Akter Ema](https://afrozaema.github.io/)**

*Full Stack Developer & UI/UX Designer*

[![Portfolio](https://img.shields.io/badge/Portfolio-FF5722?style=for-the-badge&logo=google-chrome&logoColor=white)](https://afrozaema.github.io/)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/afrozaema)
[![GitHub](https://img.shields.io/badge/GitHub-100000?style=for-the-badge&logo=github&logoColor=white)](https://github.com/afrozaema)
[![Twitter](https://img.shields.io/badge/Twitter-1DA1F2?style=for-the-badge&logo=twitter&logoColor=white)](https://twitter.com/afrozaema)

</div>

---

## 🙏 Acknowledgments

- **Jahangirnagar University** - For inspiration and educational excellence
- **React Team** - For the amazing framework and ecosystem
- **Tailwind CSS** - For the utility-first CSS framework
- **Lucide React** - For beautiful and consistent icons
- **Vite** - For lightning-fast development experience
- **TypeScript** - For type safety and developer experience
- **Netlify** - For seamless deployment and hosting
- **Open Source Community** - For continuous inspiration and support

---

## 📈 Project Stats

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/afrozaema/SeatFinder?style=social)
![GitHub forks](https://img.shields.io/github/forks/afrozaema/SeatFinder?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/afrozaema/SeatFinder?style=social)
![GitHub issues](https://img.shields.io/github/issues/afrozaema/SeatFinder)
![GitHub pull requests](https://img.shields.io/github/issues-pr/afrozaema/SeatFinder)
![GitHub last commit](https://img.shields.io/github/last-commit/afrozaema/SeatFinder)

**Made with ❤️ for JU Students**

</div>

---

## 🔮 Future Roadmap

### 🚀 **Upcoming Features**
- [ ] **📱 Progressive Web App (PWA)**: Offline support and app installation
- [ ] **🔔 Push Notifications**: Exam reminders and important updates
- [ ] **🌍 Multi-language Support**: Bengali and English language options
- [ ] **📊 Analytics Dashboard**: Usage statistics and insights
- [ ] **🎯 Advanced Search**: Filter by building, time, or institution
- [ ] **📝 Exam Notes**: Personal notes and reminders feature
- [ ] **👥 Student Community**: Chat and discussion features
- [ ] **📱 Mobile App**: Native iOS and Android applications

### 🎨 **Design Enhancements**
- [ ] **🎭 Custom Themes**: Multiple color schemes and themes
- [ ] **✨ Advanced Animations**: More sophisticated micro-interactions
- [ ] **📱 Better Mobile UX**: Enhanced mobile-first design
- [ ] **🎨 Accessibility**: WCAG 2.1 AA compliance
- [ ] **🖼️ Visual Improvements**: Better graphics and illustrations

### 🔧 **Technical Improvements**
- [ ] **⚡ Performance**: Code splitting and lazy loading
- [ ] **🔒 Security**: Enhanced data protection and privacy
- [ ] **📊 Monitoring**: Error tracking and performance monitoring
- [ ] **🧪 Testing**: Comprehensive test coverage
- [ ] **📚 Documentation**: Interactive API documentation

---

<div align="center">

### 🚀 Ready to find your exam seat? [Get Started Now!](https://ju-seatfinder.netlify.app)

---

**⭐ If this project helped you, please give it a star! ⭐**

</div>
