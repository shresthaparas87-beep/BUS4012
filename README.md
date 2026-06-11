# StudyTracker – BUS4012 Assignment 03

**Vibe Coding for Startups** — A full-stack task management app built with React, FastAPI, and Supabase.

GitHub: https://github.com/shresthaparas87-beep/BUS4012

---

## Application Purpose

StudyTracker lets students add, view, filter, and complete their study tasks.
Each task has a title, subject/course, priority level, optional due date, and description.
Tasks are saved to and retrieved from a Supabase PostgreSQL database via a Python backend API.

---

## Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Frontend   | React 19 + Vite                    |
| Backend    | Python 3.11 + FastAPI + Uvicorn    |
| Database   | Supabase (PostgreSQL)              |
| ORM/SDK    | `supabase-py` (official Python SDK)|
| Deployment | Vercel (frontend), Railway or Render (backend) |

---

## Project Structure

```
BUS4012/
├── frontend/               # React + Vite application
│   ├── src/
│   │   ├── App.jsx         # Main app component (all UI logic)
│   │   ├── api.js          # API helper functions (calls backend only)
│   │   ├── index.css       # All styles
│   │   └── main.jsx        # React entry point
│   ├── .env.example        # Frontend env variable template
│   ├── index.html
│   └── vite.config.js
│
├── backend/                # FastAPI Python backend
│   ├── main.py             # All API routes + Supabase integration
│   ├── requirements.txt    # Python dependencies
│   └── .env.example        # Backend env variable template
│
├── supabase/
│   └── schema.sql          # SQL to create tables in Supabase
│
├── .env.example            # Root-level env variable reference
├── .gitignore
├── README.md
├── PROMPTS.md              # Development prompts log
├── DEMO_GUIDE.md           # Demo script for presentation
└── COMPLETION_REPORT.md    # Assignment completion summary
```

---

## Local Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+
- A free [Supabase](https://supabase.com) project

---

### 1. Clone the repository

```bash
git clone https://github.com/shresthaparas87-beep/BUS4012.git

cd BUS4012
```

---

### 2. Set up Supabase

1. Create a free project at [https://supabase.com](https://supabase.com)
2. Go to **SQL Editor → New Query**
3. Paste and run the contents of `supabase/schema.sql`
4. Go to **Project Settings → API** to copy your credentials

---

### 3. Configure Environment Variables

**Backend (`backend/.env`):**
```bash
cp backend/.env.example backend/.env
# Edit backend/.env and fill in your Supabase credentials
```

Required values:
```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key   ← backend only, never expose
FRONTEND_URL=http://localhost:5173
BACKEND_URL=http://localhost:8000
DATABASE_PROVIDER=supabase
```

**Frontend (`frontend/.env.local`):**
```bash
cp frontend/.env.example frontend/.env.local
# Set VITE_BACKEND_URL if backend is not on localhost:8000
```

Required value:
```
VITE_BACKEND_URL=http://localhost:8000
```

> ⚠️ **NEVER put SUPABASE_SERVICE_ROLE_KEY in the frontend or any file that begins with VITE_**

---

### 4. Run the Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API docs available at: [http://localhost:8000/docs](http://localhost:8000/docs)  
Health check: [http://localhost:8000/health](http://localhost:8000/health)

---

### 5. Run the Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at: [http://localhost:5173](http://localhost:5173)

---

## Environment Variables Reference

| Variable                 | Where used | Required | Description                                     |
|--------------------------|-----------|----------|-------------------------------------------------|
| `SUPABASE_URL`           | Backend   | Yes      | Supabase project URL                            |
| `SUPABASE_ANON_KEY`      | Backend   | Yes      | Supabase anonymous key                          |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend | Yes   | Service role key — backend only, never frontend |
| `FRONTEND_URL`           | Backend   | Yes      | Frontend origin for CORS                        |
| `BACKEND_URL`            | Both      | Yes      | Backend URL                                     |
| `DATABASE_PROVIDER`      | Backend   | No       | Set to `supabase` (informational)               |
| `VITE_BACKEND_URL`       | Frontend  | Yes      | Backend URL (VITE_ prefix = exposed to browser) |

---

## How to Test Data Saving and Retrieval

1. Open the app at http://localhost:5173
2. The health banner at the top shows backend and Supabase status
3. Fill in the **Add New Study Task** form and click **Save Task**
4. The task appears in the list immediately (data round-trips through FastAPI → Supabase → back)
5. Check the **Supabase dashboard → Table Editor → tasks** to confirm the row was saved
6. Refresh the page — tasks reload from Supabase, confirming persistence
7. Click a checkbox to mark a task complete (PATCH request to backend)
8. Delete a task with the 🗑️ button (DELETE request to backend)
9. Use the **Filter** and **Sort** controls to filter by subject and sort by priority or due date

---

## API Endpoints

| Method | Path            | Description                          |
|--------|-----------------|--------------------------------------|
| GET    | `/`             | API root                             |
| GET    | `/health`       | Health check + Supabase status       |
| GET    | `/tasks`        | List all tasks (optional filters)    |
| POST   | `/tasks`        | Create a new task                    |
| GET    | `/tasks/{id}`   | Get a single task                    |
| PATCH  | `/tasks/{id}`   | Update a task (partial)              |
| DELETE | `/tasks/{id}`   | Delete a task                        |

---

## Deployment Notes

### Frontend → Vercel
1. Push to GitHub
2. Import project in [vercel.com](https://vercel.com) → set root to `frontend/`
3. Add environment variable: `VITE_BACKEND_URL=https://your-backend-url`

### Backend → Railway or Render
1. Connect GitHub repo
2. Set root directory to `backend/`
3. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. Add all environment variables from `backend/.env.example`

### After deploying both:
- Update `FRONTEND_URL` on the backend to the Vercel URL (for CORS)
- Update `VITE_BACKEND_URL` on the frontend to the Railway/Render URL

---

## Security Notes

- `SUPABASE_SERVICE_ROLE_KEY` is used exclusively in the backend
- No secrets are hardcoded in any source file
- All sensitive configuration is loaded from environment variables
- The frontend never communicates directly with Supabase — all data goes through the FastAPI backend
- CORS is restricted to the configured `FRONTEND_URL`
