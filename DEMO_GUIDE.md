# DEMO_GUIDE.md – 5-Minute Demo Script

**Project:** StudyTracker – BUS4012 Assignment 03  
**GitHub:** https://github.com/shresthaparas87-beep/BUS4012

> Note: The demo video is not being recorded. This file documents what would be shown.

---

## Pre-Demo Setup

1. Start the backend: `cd backend && uvicorn main:app --reload --port 8000`
2. Start the frontend: `cd frontend && npm run dev`
3. Open http://localhost:5173 in the browser
4. Open http://localhost:8000/docs in a second tab
5. Open the Supabase dashboard → Table Editor → tasks in a third tab

---

## Demo Script

### Minute 1 – Introduction (0:00–1:00)

- Show the app at http://localhost:5173
- Point out the health banner: confirms React is talking to FastAPI, which is connected to Supabase
- Point out the stats bar: totals and priorities at a glance

---

### Minute 2 – Adding a Task (1:00–2:00)

- Fill in the Add New Study Task form:
  - Title: "Review lecture notes for Week 7"
  - Subject: "BUS4012"
  - Priority: High
  - Due Date: pick a date
  - Description: "Focus on Lean Startup principles"
- Click **Save Task**
- Show the green success message: "Task saved to Supabase ✓"
- The task appears at the top of the list immediately
- Explain: form → POST request → FastAPI → Supabase Python SDK → INSERT into database

---

### Minute 3 – Proving Persistence (2:00–3:00)

- Switch to the Supabase dashboard — show the new row in the tasks table
- Hard-refresh the page (Ctrl+R) — tasks reload from Supabase
- "Data survived a full page refresh because it comes from the database every time"

---

### Minute 4 – CRUD and Filtering (3:00–4:00)

- Check a task's checkbox → task goes to Completed tab (PATCH request to backend)
- Use the subject filter to narrow down to one course
- Change sort to "Priority" — high tasks rise to top
- Delete a task → confirm dialog → row removed from Supabase

---

### Minute 5 – Code and Security (4:00–5:00)

- Show `backend/main.py`: `SUPABASE_SERVICE_ROLE_KEY` loaded from `os.getenv` — not hardcoded
- Show `frontend/src/api.js`: only the backend URL here, no Supabase keys
- Show `.gitignore`: `.env` files excluded
- Show http://localhost:8000/docs — auto-generated FastAPI docs
- "Frontend → Backend → Supabase. The service role key never touches the browser."

---

## Key Points

1. Data flows: React → FastAPI → Supabase (never React → Supabase directly)
2. Service role key is backend-only — never in React source
3. All three layers are real and working together
4. Data persists across page refreshes
5. App explains clearly when Supabase isn't configured yet
