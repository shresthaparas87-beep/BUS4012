-- =============================================================================
-- BUS4012 Assignment 03 – StudyTracker Supabase Schema
-- =============================================================================
-- Run this SQL in the Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- after creating your project.
-- =============================================================================

-- Enable the pgcrypto extension for UUID generation (usually already enabled)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- -----------------------------------------------------------------------------
-- Table: tasks
-- Stores study tasks submitted by users through the React frontend.
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
    -- Primary key: auto-generated UUID
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,

    -- Task details submitted by the user
    title       TEXT        NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
    description TEXT                 CHECK (char_length(description) <= 1000),
    subject     TEXT        NOT NULL CHECK (char_length(subject) BETWEEN 1 AND 100),
    priority    TEXT        NOT NULL DEFAULT 'medium'
                            CHECK (priority IN ('low', 'medium', 'high')),
    due_date    DATE,                -- optional due date
    completed   BOOLEAN     NOT NULL DEFAULT FALSE,

    -- Timestamps managed by the database
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ          -- set when a task is updated
);

-- -----------------------------------------------------------------------------
-- Index: speed up filtering by subject and completion status
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_subject   ON public.tasks (subject);
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON public.tasks (completed);
CREATE INDEX IF NOT EXISTS idx_tasks_created   ON public.tasks (created_at DESC);

-- -----------------------------------------------------------------------------
-- Row-Level Security (RLS)
-- The Python backend uses the service-role key which bypasses RLS.
-- Enabling RLS here is a good security practice in case the anon key is
-- ever used directly (it would be blocked without an explicit policy).
-- -----------------------------------------------------------------------------
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Allow the service role (used by the backend) full access
-- Note: service role automatically bypasses RLS in Supabase – this policy
-- is added for documentation clarity.
CREATE POLICY "Service role has full access"
    ON public.tasks
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- -----------------------------------------------------------------------------
-- Sample seed data (optional – comment out for production)
-- -----------------------------------------------------------------------------
INSERT INTO public.tasks (title, description, subject, priority, due_date, completed)
VALUES
    ('Read Chapter 5', 'Read and summarise entrepreneurship chapter', 'BUS4012', 'medium', '2026-06-15', FALSE),
    ('Complete Assignment 03', 'Build React + FastAPI + Supabase app', 'BUS4012', 'high', '2026-06-20', FALSE),
    ('Prepare presentation slides', 'Create slides for the demo', 'BUS4012', 'high', '2026-06-22', FALSE),
    ('Review lecture notes', 'Go over weeks 1-6 notes', 'BUS4012', 'low', NULL, TRUE);
