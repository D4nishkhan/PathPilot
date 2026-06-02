# PathPilot 🚀

> The Learning Operating System for students who want to go from beginner to job-ready.

## Stack
- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Vite 8
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas or local)
- **AI**: Google Gemini API
- **Payments**: Razorpay
- **Auth**: JWT + Google OAuth

---

## Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
```

Edit `.env` with your credentials (MongoDB URI, JWT Secret, Gemini API key):

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pathpilot  # or MongoDB Atlas URI
JWT_SECRET=your_secret_here
GEMINI_API_KEY=your_gemini_key_here
FRONTEND_URL=http://localhost:5173
```

Seed the database with sample content:

```bash
npm run seed
```

Start the backend:

```bash
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

---

## Demo Login Credentials

After running `npm run seed`:

| Role    | Email                     | Password     |
|---------|---------------------------|--------------|
| Admin   | admin@pathpilot.dev       | admin123456  |
| Student | student@pathpilot.dev     | student123   |

---

## Project Structure

```
pathpilot/
├── backend/
│   ├── src/
│   │   ├── config/        # DB & Passport config
│   │   ├── controllers/   # Route handlers
│   │   ├── middleware/    # Auth, error handlers
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API routes
│   │   ├── services/      # Gemini AI, Email
│   │   └── server.js      # Entry point
│   ├── seed.js            # DB seeder
│   └── .env               # Environment variables
│
└── frontend/
    └── src/
        ├── components/    # Reusable UI components
        ├── pages/         # Route pages
        ├── lib/           # API client (axios)
        ├── store/         # Zustand state management
        └── types/         # TypeScript types
```

---

## API Endpoints

| Module     | Endpoints                                          |
|------------|----------------------------------------------------|
| Auth       | POST /auth/register, login; GET /auth/me, /google  |
| Tracks     | GET /tracks, /tracks/:id, /tracks/:id/topics/:id   |
| Progress   | POST /progress/video; GET /progress/dashboard      |
| Quizzes    | GET /quizzes/:id; POST /quizzes/:id/attempt        |
| AI         | POST /ai/tutor, /ai/roadmap, /ai/interview         |
| Payments   | GET /payments/plans; POST /payments/create-order   |
| Admin      | CRUD /admin/tracks, /admin/users, /admin/analytics |

---

## Features Complete

- [x] Authentication (JWT + Google OAuth)
- [x] Roadmap Generator (Gemini AI)
- [x] Learning Tracks with Locked Progression
- [x] Video Player with Progress Tracking
- [x] AI Tutor Chat
- [x] Quiz System with Scoring
- [x] Mock Interview (Premium)
- [x] Dashboard Analytics
- [x] XP/Level/Streak Gamification
- [x] Leaderboard
- [x] Profile Management
- [x] Admin Panel (CRUD for content & users)
- [x] Razorpay Payment Integration
- [x] Responsive Design (Mobile-first)
