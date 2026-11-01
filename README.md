# TechFest 2026 Portal

MERN stack portal for TechFest 2026 — Web Technology Laboratory (23CSB40B), MBCET.

| Part | Folder | Tech |
|------|--------|------|
| Frontend | `client/` | React 19 + Vite, React Router, Context API, axios |
| Backend | `server/` | Node.js, Express 4, Mongoose 8, bcrypt, JWT |
| Database | — | MongoDB (local) / MongoDB Atlas (cloud) |

## Run locally

```bash
# 1. Backend
cd server
cp .env.example .env        # then edit MONGO_URI and JWT_SECRET
npm install
npm run seed                # adds sample events (+ admin if ADMIN_EMAIL/ADMIN_PASSWORD set)
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173  (/api is proxied to :5000)
```

## API

| Method | Route | Access | Purpose |
|--------|-------|--------|---------|
| GET | `/api/health` | public | health check |
| POST | `/api/auth/register` | public | sign up |
| POST | `/api/auth/login` | public | log in |
| GET | `/api/auth/me` | logged in | current user |
| GET | `/api/events` | public | list events |
| GET | `/api/events/:id` | public | one event |
| POST/PUT/DELETE | `/api/events[/:id]` | admin | manage events |
| POST | `/api/registrations` | logged in | register for an event |
| GET | `/api/registrations/my` | logged in | my registrations |
| GET/POST | `/api/feedback` | public | feedback wall |
