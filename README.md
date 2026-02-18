# JU SeatFinder

A web application for Jahangirnagar University (JU) students and teachers to find exam seat allocations, teacher information, and monitor system status.

## Features

### 🎓 Student Seat Finder
- Search exam seat allocation by roll number
- View exam details: date, time, building, floor, room
- Google Maps integration for navigation to exam centers
- Exam day checklist (what to bring / what not to bring)
- Live exam countdown timer
- Motivational quotes and AI assistant (Ema) advice

### 👩‍🏫 Teacher Directory
- Search teachers by name or ID
- View teacher profiles: department, designation, phone, email, office room
- Dark/light theme toggle

### 📊 Admin Dashboard
- Secure admin login with role-based access control
- Manage students and teachers (CRUD operations)
- Activity logs for all admin actions
- Search logs with analytics
- Analytics tab with visual charts (search trends, data distribution)
- Advanced filtering by institution, building, floor

### 📡 Status Page
- Real-time system health monitoring
- Uptime percentage and response time charts
- SSL certificate status checker
- Incident history and tracking
- Keep-alive monitoring with auto-refresh

### 🔐 Authentication
- Email/password admin authentication
- Role-based access control (admin, super_admin)
- Protected admin routes

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **UI Components:** shadcn/ui, Radix UI
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Backend:** Lovable Cloud (Supabase)
- **Routing:** React Router v6
- **State Management:** TanStack React Query

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with navigation |
| `/student` | Student seat finder |
| `/teacher` | Teacher directory search |
| `/admin/login` | Admin login |
| `/admin` | Admin dashboard (protected) |
| `/status` | System status page |

## Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start the development server
npm run dev
```

## Deployment

Open [Lovable](https://lovable.dev) and click on Share → Publish.

## Custom Domain

Navigate to Project → Settings → Domains → Connect Domain.  
[Learn more](https://docs.lovable.dev/features/custom-domain#custom-domain)
