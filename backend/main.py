"""
BUS4012 Assignment 03 - StudyTracker Backend
FastAPI + Supabase backend for the StudyTracker application.
All Supabase credentials are loaded from environment variables only.
"""

import os
from datetime import datetime
from typing import Optional, List
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Load environment variables from .env file (local dev only)
load_dotenv()

app = FastAPI(
    title="StudyTracker API",
    description="BUS4012 Assignment 03 - Track study goals and tasks",
    version="1.0.0",
)

# ---------------------------------------------------------------------------
# CORS configuration – allow the React frontend to call this backend
# ---------------------------------------------------------------------------
frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
origins = [
    frontend_url,
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Supabase client – lazily initialised so the app can start and report a
# clear error when credentials are missing, rather than crashing on import.
# ---------------------------------------------------------------------------
_supabase_client = None


def get_supabase():
    """Return a configured Supabase client or raise a 503 with a clear message."""
    global _supabase_client
    if _supabase_client is not None:
        return _supabase_client

    url = os.getenv("SUPABASE_URL")
    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # service-role key stays on the backend only

    if not url or not key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=(
                "Supabase is not configured. "
                "Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables. "
                "See backend/.env.example for required variable names."
            ),
        )

    try:
        from supabase import create_client, Client
        _supabase_client = create_client(url, key)
        return _supabase_client
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to initialise Supabase client: {str(exc)}",
        )


# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------

class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200, description="Task title")
    description: Optional[str] = Field(None, max_length=1000, description="Task description")
    subject: str = Field(..., min_length=1, max_length=100, description="Subject or course name")
    priority: str = Field("medium", description="Priority: low | medium | high")
    due_date: Optional[str] = Field(None, description="Due date in YYYY-MM-DD format")

    class Config:
        json_schema_extra = {
            "example": {
                "title": "Complete Assignment 03",
                "description": "Build the React + FastAPI + Supabase app",
                "subject": "BUS4012",
                "priority": "high",
                "due_date": "2026-06-20",
            }
        }


class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=200)
    description: Optional[str] = Field(None, max_length=1000)
    subject: Optional[str] = Field(None, min_length=1, max_length=100)
    priority: Optional[str] = None
    due_date: Optional[str] = None
    completed: Optional[bool] = None


class TaskResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    subject: str
    priority: str
    due_date: Optional[str]
    completed: bool
    created_at: str
    updated_at: Optional[str]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/", tags=["Root"])
def root():
    """API root – confirms the backend is running."""
    return {
        "message": "StudyTracker API is running",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """
    Health check endpoint.
    Returns Supabase connection status without exposing credentials.
    """
    supabase_url = os.getenv("SUPABASE_URL")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    supabase_configured = bool(supabase_url and service_key)

    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "supabase_configured": supabase_configured,
        "database_provider": os.getenv("DATABASE_PROVIDER", "supabase"),
        "version": "1.0.0",
    }


@app.get("/tasks", response_model=List[TaskResponse], tags=["Tasks"])
def get_tasks(subject: Optional[str] = None, completed: Optional[bool] = None):
    """
    Retrieve all tasks, optionally filtered by subject or completion status.
    Data is fetched from Supabase.
    """
    supabase = get_supabase()
    try:
        query = supabase.table("tasks").select("*").order("created_at", desc=True)

        if subject:
            query = query.eq("subject", subject)
        if completed is not None:
            query = query.eq("completed", completed)

        response = query.execute()
        return response.data

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch tasks: {str(exc)}",
        )


@app.post("/tasks", response_model=TaskResponse, status_code=status.HTTP_201_CREATED, tags=["Tasks"])
def create_task(task: TaskCreate):
    """
    Create a new study task.
    Data is saved to the Supabase `tasks` table.
    """
    supabase = get_supabase()
    try:
        valid_priorities = {"low", "medium", "high"}
        if task.priority not in valid_priorities:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"priority must be one of: {', '.join(valid_priorities)}",
            )

        payload = {
            "title": task.title,
            "description": task.description,
            "subject": task.subject,
            "priority": task.priority,
            "due_date": task.due_date,
            "completed": False,
        }

        response = supabase.table("tasks").insert(payload).execute()

        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Task was not created. Supabase returned empty data.",
            )

        return response.data[0]

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create task: {str(exc)}",
        )


@app.get("/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def get_task(task_id: str):
    """Retrieve a single task by its ID."""
    supabase = get_supabase()
    try:
        response = supabase.table("tasks").select("*").eq("id", task_id).single().execute()
        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")
        return response.data
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch task: {str(exc)}",
        )


@app.patch("/tasks/{task_id}", response_model=TaskResponse, tags=["Tasks"])
def update_task(task_id: str, updates: TaskUpdate):
    """Update an existing task (partial update supported)."""
    supabase = get_supabase()
    try:
        payload = {k: v for k, v in updates.model_dump().items() if v is not None}
        if not payload:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="No valid fields provided for update",
            )

        payload["updated_at"] = datetime.utcnow().isoformat() + "Z"

        response = (
            supabase.table("tasks")
            .update(payload)
            .eq("id", task_id)
            .execute()
        )

        if not response.data:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found")

        return response.data[0]

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update task: {str(exc)}",
        )


@app.delete("/tasks/{task_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Tasks"])
def delete_task(task_id: str):
    """Delete a task by its ID."""
    supabase = get_supabase()
    try:
        supabase.table("tasks").delete().eq("id", task_id).execute()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete task: {str(exc)}",
        )
