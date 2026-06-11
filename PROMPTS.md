# PROMPTS.md – Development Prompt Log

**Project:** BUS4012 Assignment 03 – StudyTracker  
**GitHub:** https://github.com/shresthaparas87-beep/BUS4012

---

## Overview

This document records the main prompts and follow-up prompts used to develop the StudyTracker application during BUS4012 Assignment 03. The application was built using Kiro (AI-powered IDE) following a "vibe coding" approach.

---

## Main Development Prompt

> "Build a full-stack web application called StudyTracker for BUS4012 Assignment 03.
> Use React for the frontend, FastAPI (Python) for the backend, and Supabase as the database.
> The app should let students add study tasks with a title, subject, priority level, due date, and description.
> Tasks must be saved to Supabase and retrieved from Supabase via the Python backend.
> Sensitive credentials like SUPABASE_SERVICE_ROLE_KEY must be environment variables only — never hardcoded.
> The frontend must only call the backend API, not Supabase directly."

**Purpose:** This is the foundational prompt that established the entire architecture — React + FastAPI + Supabase — and set the security requirement that the service role key stays on the backend only.

---

## Follow-Up Prompts

### 1. Project Structure and File Organisation

> "Set up a clear folder structure with a `/frontend` directory for React/Vite, a `/backend` directory for FastAPI, and a `/supabase` directory for the database schema. Include .env.example files for both frontend and backend."

**Purpose:** Establishes separation of concerns and makes the project easy for a marker to navigate. Environment variable examples ensure anyone cloning the repo knows exactly what to configure.

---

### 2. Backend API Design

> "Create a FastAPI backend with CRUD endpoints for tasks: GET /tasks, POST /tasks, PATCH /tasks/{id}, DELETE /tasks/{id}, and GET /health. Use the supabase-py SDK with the service role key from environment variables. Return a clear 503 error if Supabase env variables are missing instead of crashing."

**Purpose:** Covers the full task lifecycle. The graceful 503 error is important for a robust demo — the app explains what's missing rather than showing a cryptic crash.

---

### 3. Supabase Schema

> "Write the SQL schema for the tasks table in Supabase. Include id (UUID), title, description, subject, priority (low/medium/high), due_date, completed (boolean), created_at, and updated_at. Add Row Level Security and useful indexes. Include optional seed data for testing."

**Purpose:** Ensures the database is set up correctly with good constraints and indexes. RLS is enabled as a security best practice.

---

### 4. React Frontend UI

> "Build a clean React frontend for StudyTracker. Include: a form to add new tasks, a task list with filtering by subject and sorting by priority/due date/date added, tabs for All/Pending/Completed, statistics showing total/completed/pending/high-priority counts, loading and error states, and a health banner showing whether the backend and Supabase are connected."

**Purpose:** Covers all required screens and user interactions. The health banner gives immediate feedback during development and demos.

---

### 5. Security — No Secrets in Frontend

> "Make sure the React frontend never uses SUPABASE_SERVICE_ROLE_KEY directly. All data must flow through the FastAPI backend. Frontend environment variables must only include VITE_BACKEND_URL. Add clear comments in the code explaining why each variable is on each side."

**Purpose:** Addresses the assignment security requirement directly. The service role key would give full database access — keeping it backend-only is essential.

---

### 6. Error Handling and Validation

> "Add validation to the task form: title and subject are required, priority must be low/medium/high, due_date is optional. Show success and error messages after form submission. Handle network errors and backend errors gracefully with readable messages."

**Purpose:** Improves user experience and demonstrates professional coding standards expected in a startup context.

---

### 7. CORS Configuration

> "Configure CORS in FastAPI so the React frontend at localhost:5173 (and the production Vercel URL from FRONTEND_URL env variable) can call the backend. Reject cross-origin requests from other origins."

**Purpose:** Required for the browser to allow the frontend to communicate with the backend. Restricting origins is a security best practice.

---

### 8. .gitignore and Environment Security

> "Create a comprehensive .gitignore that excludes .env files, node_modules, Python virtual environments, __pycache__, build folders, and OS-specific files. Ensure no secrets can accidentally be committed to GitHub."

**Purpose:** Prevents the most common student mistake — accidentally committing .env files with Supabase keys to a public GitHub repository.

---

### 9. Documentation

> "Create README.md with full setup instructions, environment variable reference, API endpoint docs, and deployment notes. Create PROMPTS.md, DEMO_GUIDE.md, and COMPLETION_REPORT.md for the assignment submission."

**Purpose:** Documentation is a graded component of the assignment. Clear README shows professional practice; the other documents satisfy specific assignment requirements.

---

### 10. Optimistic UI Updates

> "When the user checks/unchecks a task as complete, update the UI immediately (optimistic update) and then send the PATCH request to the backend. If the backend call fails, revert the UI change and show an error message."

**Purpose:** Makes the app feel fast and responsive — important for a startup MVP demo. The revert logic prevents data inconsistency.

---

### 11. Deployment Readiness

> "Make the project deployable to Vercel (frontend) and Railway/Render (backend). Document the exact deployment steps including how to set environment variables in each platform. Update CORS settings to allow the production frontend URL."

**Purpose:** Satisfies the deployment-readiness requirement without requiring actual account access during the automated build.

---

## Key Technical Decisions

| Decision | Rationale |
|----------|-----------|
| FastAPI over Flask | FastAPI has automatic OpenAPI docs (/docs), async support, and Pydantic validation — better for a demo |
| Vite over Create React App | Faster builds, better developer experience, still standard in 2026 |
| Service role key on backend only | Prevents full-access database key from being exposed in browser source code |
| Supabase SDK over raw REST calls | Official SDK handles auth headers and error handling cleanly |
| Graceful 503 on missing env vars | App explains the problem clearly instead of crashing with a confusing Python traceback |
