import { useState, useEffect, useCallback } from 'react'
import { getTasks, createTask, updateTask, deleteTask, getHealth } from './api'

// ── Helpers ──────────────────────────────────────────────────────────────────
const PRIORITY_ORDER = { high: 0, medium: 1, low: 2 }

function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  return d.toLocaleDateString('en-NZ', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HealthBanner({ health, loading, error }) {
  if (loading) return (
    <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
      <span className="health-dot checking" />
      Checking backend connection…
    </div>
  )
  if (error) return (
    <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
      <span className="health-dot error" />
      <span>
        <strong>Backend unavailable:</strong> {error}
        <br />
        <small>Make sure the Python backend is running on {import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000'}</small>
      </span>
    </div>
  )
  if (!health) return null
  return (
    <div className={`alert ${health.supabase_configured ? 'alert-success' : 'alert-warning'}`}
         style={{ marginBottom: '1rem' }}>
      <span className={`health-dot ${health.supabase_configured ? 'ok' : 'checking'}`} />
      <span>
        Backend is online.&nbsp;
        {health.supabase_configured
          ? 'Supabase is connected.'
          : 'Supabase is NOT configured — set environment variables on the backend.'}
      </span>
    </div>
  )
}

function TaskForm({ onCreated }) {
  const [form, setForm] = useState({
    title: '', description: '', subject: '', priority: 'medium', due_date: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [success, setSuccess] = useState(false)

  const handleChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!form.title.trim()) { setError('Title is required.'); return }
    if (!form.subject.trim()) { setError('Subject is required.'); return }

    setLoading(true)
    try {
      const payload = {
        title:       form.title.trim(),
        description: form.description.trim() || null,
        subject:     form.subject.trim(),
        priority:    form.priority,
        due_date:    form.due_date || null,
      }
      const created = await createTask(payload)
      setSuccess(true)
      setForm({ title: '', description: '', subject: '', priority: 'medium', due_date: '' })
      onCreated(created)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <h2 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
        ➕ Add New Study Task
      </h2>

      {error   && <div className="alert alert-error"   style={{ marginBottom: '1rem' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>Task saved to Supabase ✓</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group full-width">
            <label htmlFor="title">Task Title *</label>
            <input
              id="title" name="title" type="text"
              placeholder="e.g. Complete Assignment 03"
              value={form.title} onChange={handleChange}
              maxLength={200} required
            />
          </div>

          <div className="form-group">
            <label htmlFor="subject">Subject / Course *</label>
            <input
              id="subject" name="subject" type="text"
              placeholder="e.g. BUS4012"
              value={form.subject} onChange={handleChange}
              maxLength={100} required
            />
          </div>

          <div className="form-group">
            <label htmlFor="priority">Priority</label>
            <select id="priority" name="priority" value={form.priority} onChange={handleChange}>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="due_date">Due Date</label>
            <input
              id="due_date" name="due_date" type="date"
              value={form.due_date} onChange={handleChange}
            />
          </div>

          <div className="form-group full-width">
            <label htmlFor="description">Description</label>
            <textarea
              id="description" name="description"
              placeholder="Optional notes about this task…"
              value={form.description} onChange={handleChange}
              maxLength={1000}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Saving…' : 'Save Task'}
          </button>
          <button
            type="button" className="btn btn-secondary"
            onClick={() => setForm({ title: '', description: '', subject: '', priority: 'medium', due_date: '' })}
            disabled={loading}
          >
            Clear
          </button>
        </div>
      </form>
    </div>
  )
}

function TaskItem({ task, onToggle, onDelete }) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${task.title}"?`)) return
    setDeleting(true)
    try {
      await deleteTask(task.id)
      onDelete(task.id)
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleToggle = () => onToggle(task.id, !task.completed)

  const priorityIcons = { high: '🔴', medium: '🟡', low: '🟢' }

  return (
    <div className={`task-item${task.completed ? ' completed' : ''}`}>
      <input
        type="checkbox"
        className="task-checkbox"
        checked={task.completed}
        onChange={handleToggle}
        aria-label={`Mark ${task.title} as ${task.completed ? 'incomplete' : 'complete'}`}
      />
      <div className="task-body">
        <div className="task-title">{task.title}</div>
        {task.description && <div className="task-desc">{task.description}</div>}
        <div className="task-meta">
          <span className="badge badge-subject">{task.subject}</span>
          <span className={`badge badge-${task.priority}`}>
            {priorityIcons[task.priority]} {task.priority}
          </span>
          {task.due_date && (
            <span className="task-date">📅 {formatDate(task.due_date)}</span>
          )}
          <span className="task-date" style={{ marginLeft: 'auto' }}>
            Added {formatDate(task.created_at)}
          </span>
        </div>
      </div>
      <div className="task-actions">
        <button
          className="btn-icon"
          onClick={handleDelete}
          disabled={deleting}
          title="Delete task"
          aria-label="Delete task"
        >
          {deleting ? '…' : '🗑️'}
        </button>
      </div>
    </div>
  )
}

function TaskList({ tasks, onToggle, onDelete, loading, error }) {
  if (loading) return (
    <div className="spinner-wrapper">
      <div className="spinner" aria-label="Loading tasks" />
    </div>
  )

  if (error) return (
    <div className="alert alert-error">{error}</div>
  )

  if (tasks.length === 0) return (
    <div className="empty-state">
      <div className="empty-icon">📚</div>
      <p>No tasks yet. Add one above to get started.</p>
    </div>
  )

  return (
    <div className="task-list" role="list">
      {tasks.map(t => (
        <TaskItem key={t.id} task={t} onToggle={onToggle} onDelete={onDelete} />
      ))}
    </div>
  )
}

function StatsBar({ tasks }) {
  const total     = tasks.length
  const completed = tasks.filter(t => t.completed).length
  const high      = tasks.filter(t => t.priority === 'high' && !t.completed).length
  const pending   = total - completed

  return (
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-number">{total}</div>
        <div className="stat-label">Total Tasks</div>
      </div>
      <div className="stat-card">
        <div className="stat-number" style={{ color: 'var(--secondary)' }}>{completed}</div>
        <div className="stat-label">Completed</div>
      </div>
      <div className="stat-card">
        <div className="stat-number" style={{ color: 'var(--warning)' }}>{pending}</div>
        <div className="stat-label">Pending</div>
      </div>
      <div className="stat-card">
        <div className="stat-number" style={{ color: 'var(--danger)' }}>{high}</div>
        <div className="stat-label">High Priority</div>
      </div>
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [tasks,         setTasks]         = useState([])
  const [tasksLoading,  setTasksLoading]  = useState(true)
  const [tasksError,    setTasksError]    = useState(null)

  const [health,        setHealth]        = useState(null)
  const [healthLoading, setHealthLoading] = useState(true)
  const [healthError,   setHealthError]   = useState(null)

  const [activeTab,     setActiveTab]     = useState('all')   // 'all' | 'pending' | 'completed'
  const [filterSubject, setFilterSubject] = useState('')
  const [sortBy,        setSortBy]        = useState('created') // 'created' | 'priority' | 'due'

  // ── Health check ────────────────────────────────────────────────────────────
  useEffect(() => {
    getHealth()
      .then(data  => { setHealth(data);        setHealthLoading(false) })
      .catch(err  => { setHealthError(err.message); setHealthLoading(false) })
  }, [])

  // ── Load tasks ───────────────────────────────────────────────────────────────
  const loadTasks = useCallback(async () => {
    setTasksLoading(true)
    setTasksError(null)
    try {
      const data = await getTasks()
      setTasks(data)
    } catch (err) {
      setTasksError(err.message)
    } finally {
      setTasksLoading(false)
    }
  }, [])

  useEffect(() => { loadTasks() }, [loadTasks])

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleCreated = task => setTasks(prev => [task, ...prev])

  const handleToggle = async (id, completed) => {
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed } : t))
    try {
      await updateTask(id, { completed })
    } catch (err) {
      // Revert on failure
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !completed } : t))
      alert('Failed to update task: ' + err.message)
    }
  }

  const handleDelete = id => setTasks(prev => prev.filter(t => t.id !== id))

  // ── Derived lists ────────────────────────────────────────────────────────────
  const subjects = [...new Set(tasks.map(t => t.subject))].sort()

  let visible = tasks
  if (activeTab === 'pending')   visible = visible.filter(t => !t.completed)
  if (activeTab === 'completed') visible = visible.filter(t =>  t.completed)
  if (filterSubject)             visible = visible.filter(t => t.subject === filterSubject)

  visible = [...visible].sort((a, b) => {
    if (sortBy === 'priority') return PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]
    if (sortBy === 'due') {
      if (!a.due_date) return 1
      if (!b.due_date) return -1
      return new Date(a.due_date) - new Date(b.due_date)
    }
    return new Date(b.created_at) - new Date(a.created_at)
  })

  return (
    <div className="app-wrapper">
      {/* ── Navbar ── */}
      <nav className="navbar" role="banner">
        <h1>📚 StudyTracker</h1>
        <span className="navbar-badge">BUS4012 Assignment 03</span>
      </nav>

      <main className="main-content" role="main">
        {/* ── Health banner ── */}
        <HealthBanner health={health} loading={healthLoading} error={healthError} />

        {/* ── Stats ── */}
        {!tasksLoading && !tasksError && <StatsBar tasks={tasks} />}

        {/* ── Add Task form ── */}
        <TaskForm onCreated={handleCreated} />

        {/* ── Task list ── */}
        <div style={{ marginTop: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Your Tasks</h2>
            <button className="btn btn-secondary btn-sm" onClick={loadTasks} disabled={tasksLoading}>
              🔄 Refresh
            </button>
          </div>

          {/* ── Tabs ── */}
          <div className="tabs" role="tablist">
            {[['all','All'], ['pending','Pending'], ['completed','Completed']].map(([val, label]) => (
              <button
                key={val}
                role="tab"
                className={`tab${activeTab === val ? ' active' : ''}`}
                onClick={() => setActiveTab(val)}
                aria-selected={activeTab === val}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Filters ── */}
          <div className="filters">
            <span className="filter-label">Filter:</span>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
              <option value="">All subjects</option>
              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <span className="filter-label">Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="created">Date added</option>
              <option value="priority">Priority</option>
              <option value="due">Due date</option>
            </select>
          </div>

          <TaskList
            tasks={visible}
            onToggle={handleToggle}
            onDelete={handleDelete}
            loading={tasksLoading}
            error={tasksError}
          />
        </div>
      </main>

      <footer>
        StudyTracker · BUS4012 Vibe Coding for Startups · Built with React + FastAPI + Supabase
      </footer>
    </div>
  )
}
