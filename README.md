<div align="center">

# 🎯 JU SeatFinder

### _Find Your Exam Seat. Find Your Teacher. Stay Informed._

[![JU SeatFinder](https://img.shields.io/badge/JU-SeatFinder-blue?style=for-the-badge)](https://afrozaema.github.io/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Framer Motion](https://img.shields.io/badge/Framer%20Motion-12-E91E63?style=for-the-badge&logo=framer&logoColor=white)](https://www.framer.com/motion/)
[![Recharts](https://img.shields.io/badge/Recharts-2-22B5BF?style=for-the-badge)](https://recharts.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

<br/>

> 🌙 **Dark-themed** glassmorphism UI with blue-purple gradients, floating dot animations, and smooth Framer Motion transitions.


---

</div>

## 📖 About

**JU SeatFinder** is a full-stack web application built for **Jahangirnagar University (JU)** that helps students quickly find their exam seat allocations and navigate to exam centers, while also providing a teacher directory, admin management tools, and real-time system monitoring.

The app features **Ema** — an AI-powered exam assistant that provides motivational advice, exam-day checklists, and smart guidance to students.

---

## ✨ Features

### 🎓 Student Seat Finder
> Search your exam seat in seconds — just enter your roll number!
- 📍 **Exam details:** date, time, building, floor, room
- 🗺️ **Google Maps** navigation to exam centers with directions
- ✅ **Exam day checklist** — what to bring & what to avoid
- ⏳ **Live countdown timer** to your exam
- 💬 **Motivational quotes** fetched from API
- 🤖 **Ema AI advice** — personalized exam tips
- 👤 **Gender detection** via name for personalized messages
- 🔍 **Search logging** — all searches recorded for analytics

### 👩‍🏫 Teacher Directory
> Find any teacher by name or ID instantly
- 🔍 Smart search with **ilike** fuzzy matching
- 📋 Full profile: department, designation, phone, email, office room
- 🌗 Dark / Light theme toggle
- 🎬 Smooth Framer Motion animations

### 📊 Admin Dashboard
> Powerful management panel with 5 tabs
- 🔐 **Secure role-based login** (admin / super_admin)
- 📝 **Full CRUD** for students & teachers with modal forms
- 📈 **Analytics tab** — visual charts with Recharts (search trends, data distribution, admin actions)
- 📜 **Activity logs** — tracks every admin action with timestamps
- 🔎 **Search logs** — view all student searches with success/fail stats
- 🏫 **Advanced filters** — by institution, building, floor
- 📊 **Real-time stats** — top searched rolls, success percentage
- 💬 **Toast notifications** for success/error feedback

### 📡 Status Page
> Real-time system health monitoring
- 💚 **Uptime percentage** calculation
- 📈 **Response time graphs** with Recharts
- 🔒 **SSL certificate** monitoring via Edge Function
- 🚨 **Incident history** with severity levels
- 🔄 **Auto-refresh** every 60 seconds
- 💓 **Heartbeat animation** with ECG line
- ⏱️ **Live timer** showing time since last check

### 🔐 Authentication & Security
- 📧 Email/password admin authentication via Supabase Auth
- 👑 **Role-based access control** — `admin` and `super_admin` roles
- 🛡️ **Protected routes** — dashboard only accessible to admins
- 🔄 **Session persistence** — stays logged in across refreshes
- 📝 **Activity logging** — all admin actions tracked

### 🏠 Landing Page
- 🎨 **Glassmorphism design** with backdrop-blur effects
- 🌊 **Floating dots animation** background
- ☀️🌙 **Dark/Light mode** toggle
- 📶 **Live status indicators** — WiFi, battery, signal
- 📅 **Live date & time** display
- ⚡ **Feature cards** — Smart Search, Navigation, AI Support, Trusted
- 🎬 **Framer Motion** entrance animations

---

## 🏗️ Architecture

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (40+ components)
│   └── NavLink.tsx       # Navigation link component
├── contexts/
│   └── AuthContext.tsx    # Authentication context with role checking
├── hooks/
│   ├── use-mobile.tsx    # Mobile detection hook
│   └── use-toast.ts     # Toast notification hook
├── integrations/
│   └── supabase/
│       ├── client.ts    # Supabase client (auto-generated)
│       └── types.ts     # Database types (auto-generated)
├── pages/
│   ├── Index.tsx         # Landing page
│   ├── StudentPage.tsx   # Student seat finder
│   ├── TeacherPage.tsx   # Teacher directory
│   ├── AdminLogin.tsx    # Admin login
│   ├── AdminDashboard.tsx # Admin management panel
│   ├── StatusPage.tsx    # System status monitor
│   └── NotFound.tsx      # 404 page
└── App.tsx               # Router & providers setup

supabase/
└── functions/
    ├── check-ssl/        # SSL certificate checker
    ├── keep-alive/       # Keep-alive ping function
    └── setup-admin/      # Admin user setup
```

---

## 🗄️ Database Schema

| Table | Purpose |
|:------|:--------|
| `students` | Exam seat allocations (roll, building, floor, room, map URL) |
| `teachers` | Teacher directory (name, department, designation, contact) |
| `user_roles` | Admin role assignments (admin / super_admin) |
| `activity_logs` | Admin action tracking |
| `search_logs` | Student search analytics |
| `incidents` | System incident reports |
| `keep_alive_log` | Health check ping logs |
| `site_settings` | App configuration key-value store |

---

## 🛠️ Tech Stack

| Layer | Technology |
|:------|:-----------|
| ⚛️ **Frontend** | React 18, TypeScript, Vite |
| 🎨 **Styling** | Tailwind CSS, shadcn/ui, Radix UI |
| 🎬 **Animations** | Framer Motion |
| 📊 **Charts** | Recharts |
| ☁️ **Backend** | Lovable Cloud (Database, Auth, Edge Functions, Storage) |
| 🧭 **Routing** | React Router v6 |
| 📦 **State** | TanStack React Query |
| 📝 **Forms** | React Hook Form + Zod validation |
| 🔔 **Notifications** | Sonner toast |

---

## 🗺️ Routes

| Route | Page | Access |
|:------|:-----|:-------|
| `/` | 🏠 Landing Page | 🌐 Public |
| `/student` | 🎓 Seat Finder | 🌐 Public |
| `/teacher` | 👩‍🏫 Teacher Search | 🌐 Public |
| `/admin/login` | 🔑 Admin Login | 🌐 Public |
| `/admin` | 📊 Dashboard | 🔒 Admin Only |
| `/status` | 📡 System Status | 🌐 Public |

---

## ⚡ Edge Functions

| Function | Purpose |
|:---------|:--------|
| `check-ssl` | Checks SSL certificate validity for the app domain |
| `keep-alive` | Periodic health check to prevent cold starts |
| `setup-admin` | Initial admin user creation utility |

---

## 🎨 Design System

- **Theme:** Dark glassmorphism with blue-purple gradients (`from-slate-900 via-blue-950 to-purple-950`)
- **Effects:** `backdrop-blur-xl`, floating dots animation, card-with-dots pattern
- **Typography:** System font stack with gradient text (`bg-gradient-to-r bg-clip-text text-transparent`)
- **Animations:** Framer Motion for page transitions, hover scales, entrance animations
- **Components:** 40+ shadcn/ui components with Radix UI primitives
- **Responsive:** Mobile-first with `sm:`, `lg:` breakpoints

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm install

# Start dev server
npm run dev
```

---

## 🌐 Deployment

> Open [Lovable](https://lovable.dev) → **Share** → **Publish** 🚀

---

## 🔗 Custom Domain

> Project → **Settings** → **Domains** → **Connect Domain**

📖 [Learn more](https://docs.lovable.dev/features/custom-domain#custom-domain)

---

## 👩‍💻 Author

<div align="center">

**Afroza Akter Ema**

[![Portfolio](https://img.shields.io/badge/Portfolio-afrozaema.github.io-purple?style=for-the-badge)](https://afrozaema.github.io/)

</div>

---

<div align="center">

### 💜 Made with love for Jahangirnagar University

_© 2025 JU SeatFinder — Smart Exam Seat & Direction Guide with AI Assistant_

</div>
