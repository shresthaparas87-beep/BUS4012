/**
 * api.js – thin wrapper around fetch() for the StudyTracker backend.
 * The backend URL comes from the VITE_BACKEND_URL environment variable.
 * No Supabase keys or secrets are used in the frontend.
 */

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`
  const defaults = {
    headers: { 'Content-Type': 'application/json' },
  }
  const config = { ...defaults, ...options }

  const response = await fetch(url, config)

  // DELETE returns 204 No Content – nothing to parse
  if (response.status === 204) return null

  const data = await response.json()

  if (!response.ok) {
    const message = data?.detail || data?.message || `HTTP ${response.status}`
    throw new Error(message)
  }

  return data
}

// ── Health ──────────────────────────────────────────────────────────────────
export const getHealth = () => request('/health')

// ── Tasks ───────────────────────────────────────────────────────────────────
export const getTasks = (params = {}) => {
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== ''))
  ).toString()
  return request(`/tasks${qs ? '?' + qs : ''}`)
}

export const createTask  = (task)         => request('/tasks',           { method: 'POST',  body: JSON.stringify(task) })
export const updateTask  = (id, updates)  => request(`/tasks/${id}`,     { method: 'PATCH', body: JSON.stringify(updates) })
export const deleteTask  = (id)           => request(`/tasks/${id}`,     { method: 'DELETE' })
export const getTask     = (id)           => request(`/tasks/${id}`)
