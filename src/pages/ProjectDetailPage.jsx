import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import LanguageThemeSwitch from '../components/LanguageThemeSwitch'
import RiskBadge from '../components/RiskBadge'
import { STATUS_COLOR, STATUS_ORDER } from '../constants'

const PRIORITIES = ['low', 'medium', 'high', 'urgent']

export default function ProjectDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams()
  const { user } = useAuth()

  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [instructions, setInstructions] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [selectedTask, setSelectedTask] = useState(null)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showAddInstruction, setShowAddInstruction] = useState(false)

  // Board filters.
  const [search, setSearch] = useState('')
  const [assigneeFilter, setAssigneeFilter] = useState('')

  const load = useCallback(async () => {
    try {
      const [p, tk, ins, u] = await Promise.all([
        api.get(`/api/projects/${id}/`),
        api.get(`/api/tasks/?project=${id}`),
        api.get(`/api/instructions/?project=${id}`),
        api.get('/api/users/'),
      ])
      setProject(p.data)
      setTasks(tk.data.results ?? tk.data)
      setInstructions(ins.data.results ?? ins.data)
      setUsers(u.data.results ?? u.data)
    } catch (e) {
      if (e.response?.status === 404) setNotFound(true)
    }
  }, [id])

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [load])

  const members = useMemo(() => project?.members ?? [], [project])

  const canManage = useMemo(() => {
    if (!user) return false
    if (user.role === 'head') return true
    return members.some((m) => m.user === user.id && m.role_in_project === 'lead')
  }, [user, members])

  // Apply the board's search + assignee filters.
  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase()
    return tasks.filter((tk) => {
      if (q && !tk.title.toLowerCase().includes(q)) return false
      if (assigneeFilter && String(tk.assignee) !== String(assigneeFilter)) return false
      return true
    })
  }, [tasks, search, assigneeFilter])

  async function changeStatus(taskId, status) {
    await api.patch(`/api/tasks/${taskId}/status/`, { status })
    await load()
  }
  async function assignTask(taskId, assignee) {
    await api.post(`/api/tasks/${taskId}/assign/`, { assignee })
    await load()
  }
  async function removeMember(membershipId) {
    await api.delete(`/api/memberships/${membershipId}/`)
    await load()
  }

  if (loading) return <Shell><p className="text-muted">{t('common.loading')}</p></Shell>
  if (notFound) return <Shell><p className="text-muted">{t('project.notFound')}</p></Shell>

  const memberUserIds = new Set(members.map((m) => m.user))
  const nonMembers = users.filter((u) => !memberUserIds.has(u.id))

  return (
    <Shell>
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {t(`projectStatus.${project.status}`, project.status)}
            {project.deadline ? ` · ${t('dash.due', { date: project.deadline })}` : ''} ·{' '}
            {t('project.complete', { n: project.progress })}
          </p>
          {project.description && (
            <p className="mt-2 max-w-2xl text-sm text-text">{project.description}</p>
          )}
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreateTask(true)}
            className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg hover:bg-primary-hover"
          >
            + {t('project.newTask')}
          </button>
        )}
      </div>

      <Section
        title={t('project.instructions')}
        action={
          user.role === 'head' && (
            <SmallButton onClick={() => setShowAddInstruction(true)}>
              + {t('common.add')}
            </SmallButton>
          )
        }
      >
        {instructions.length === 0 ? (
          <Empty>{t('project.noInstructions')}</Empty>
        ) : (
          <ul className="space-y-2">
            {instructions.map((ins) => (
              <li key={ins.id} className="rounded-lg bg-surface border border-border p-3">
                <div className="font-medium">{ins.title}</div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-text">{ins.body}</div>
                <div className="mt-1 text-xs text-muted">— {ins.author_detail?.username}</div>
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section
        title={t('project.team', { count: members.length })}
        action={
          user.role === 'head' &&
          nonMembers.length > 0 && (
            <SmallButton onClick={() => setShowAddMember(true)}>
              + {t('project.addMember')}
            </SmallButton>
          )
        }
      >
        {members.length === 0 ? (
          <Empty>{t('project.noMembers')}</Empty>
        ) : (
          <div className="flex flex-wrap gap-2">
            {members.map((m) => (
              <span
                key={m.id}
                className="inline-flex items-center gap-2 rounded-full bg-surface border border-border px-3 py-1 text-sm"
              >
                {m.user_detail?.username}
                <span className="text-xs text-muted">
                  {m.role_in_project === 'lead' ? t('role.team_lead') : t('role.member')}
                </span>
                {user.role === 'head' && (
                  <button
                    onClick={() => removeMember(m.id)}
                    className="text-muted hover:text-danger"
                    aria-label="Remove"
                  >
                    ✕
                  </button>
                )}
              </span>
            ))}
          </div>
        )}
      </Section>

      <Section title={t('project.tasks')}>
        {/* Filter bar */}
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('filter.search')}
            className="flex-1 min-w-40 rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm outline-none focus:border-primary"
          />
          <select
            value={assigneeFilter}
            onChange={(e) => setAssigneeFilter(e.target.value)}
            className="rounded-lg bg-surface-2 border border-border px-3 py-1.5 text-sm"
          >
            <option value="">{t('filter.allAssignees')}</option>
            {members.map((m) => (
              <option key={m.id} value={m.user}>{m.user_detail?.username}</option>
            ))}
          </select>
        </div>
        {tasks.length > 0 && filteredTasks.length === 0 && (
          <Empty>{t('filter.none')}</Empty>
        )}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {STATUS_ORDER.map((status) => {
            const col = filteredTasks.filter((tk) => tk.status === status)
            return (
              <div key={status} className="rounded-xl bg-surface-2 p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-medium">
                  <span className={`inline-block h-2 w-2 rounded-full ${STATUS_COLOR[status]}`} />
                  {t(`status.${status}`)}
                  <span className="text-muted">{col.length}</span>
                </div>
                <div className="space-y-2">
                  {col.map((tk) => (
                    <button
                      key={tk.id}
                      onClick={() => setSelectedTask(tk)}
                      className="block w-full rounded-lg bg-surface border border-border p-3 text-left hover:border-primary"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="text-sm font-medium">{tk.title}</div>
                        <RiskBadge risk={tk.risk} />
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {tk.assignee_detail?.username ?? t('project.unassigned')}
                        {tk.deadline ? ` · ${tk.deadline}` : ''}
                      </div>
                      <div className="mt-1 text-xs text-muted">
                        {t(`priority.${tk.priority}`)} · 💬 {tk.comment_count ?? 0}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </Section>

      {selectedTask && (
        <TaskModal
          task={tasks.find((tk) => tk.id === selectedTask.id) ?? selectedTask}
          members={members}
          canManage={canManage}
          currentUser={user}
          onClose={() => setSelectedTask(null)}
          onChangeStatus={changeStatus}
          onAssign={assignTask}
          onChanged={load}
        />
      )}

      <CreateTaskModal
        open={showCreateTask}
        projectId={id}
        members={members}
        onClose={() => setShowCreateTask(false)}
        onCreated={async () => {
          setShowCreateTask(false)
          await load()
        }}
      />

      <AddMemberModal
        open={showAddMember}
        projectId={id}
        candidates={nonMembers}
        onClose={() => setShowAddMember(false)}
        onAdded={async () => {
          setShowAddMember(false)
          await load()
        }}
      />

      <AddInstructionModal
        open={showAddInstruction}
        projectId={id}
        onClose={() => setShowAddInstruction(false)}
        onAdded={async () => {
          setShowAddInstruction(false)
          await load()
        }}
      />
    </Shell>
  )
}

/* ---------- layout helpers ---------- */

function Shell({ children }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border">
        <div className="mx-auto max-w-6xl px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-muted hover:text-text">
            ← {t('common.back')}
          </Link>
          <div className="text-xl font-extrabold tracking-tight">BORAS Lab</div>
          <div className="ml-auto">
            <LanguageThemeSwitch />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8 space-y-10">{children}</main>
    </div>
  )
}

function Section({ title, action, children }) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  )
}

function Empty({ children }) {
  return <p className="text-sm text-muted">{children}</p>
}

function SmallButton({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg border border-border px-3 py-1 text-sm hover:bg-surface-2"
    >
      {children}
    </button>
  )
}

/* ---------- task modal ---------- */

function TaskModal({
  task,
  members,
  canManage,
  currentUser,
  onClose,
  onChangeStatus,
  onAssign,
  onChanged,
}) {
  const { t } = useTranslation()
  const [comments, setComments] = useState([])
  const [body, setBody] = useState('')
  const [busy, setBusy] = useState(false)

  const loadComments = useCallback(async () => {
    const { data } = await api.get(`/api/comments/?task=${task.id}`)
    setComments(data.results ?? data)
  }, [task.id])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const canChangeStatus = canManage || task.assignee === currentUser.id

  async function addComment(e) {
    e.preventDefault()
    if (!body.trim()) return
    setBusy(true)
    try {
      await api.post('/api/comments/', { task: task.id, body })
      setBody('')
      await loadComments()
      await onChanged()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open title={task.title} onClose={onClose}>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 text-sm">
          <span className={`rounded px-2 py-0.5 text-white ${STATUS_COLOR[task.status]}`}>
            {t(`status.${task.status}`)}
          </span>
          <span className="rounded bg-surface-2 px-2 py-0.5">
            {t(`priority.${task.priority}`)}
          </span>
          {task.deadline && (
            <span className="rounded bg-surface-2 px-2 py-0.5">{task.deadline}</span>
          )}
          <RiskBadge risk={task.risk} />
        </div>

        {task.description && (
          <p className="text-sm text-text whitespace-pre-wrap">{task.description}</p>
        )}

        {canChangeStatus && (
          <label className="block">
            <span className="text-sm text-muted">{t('project.status')}</span>
            <select
              value={task.status}
              onChange={(e) => onChangeStatus(task.id, e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2"
            >
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{t(`status.${s}`)}</option>
              ))}
            </select>
          </label>
        )}

        {canManage && (
          <label className="block">
            <span className="text-sm text-muted">{t('project.assignee')}</span>
            <select
              value={task.assignee ?? ''}
              onChange={(e) => onAssign(task.id, e.target.value)}
              className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2"
            >
              <option value="">{t('project.unassigned')}</option>
              {members.map((m) => (
                <option key={m.id} value={m.user}>{m.user_detail?.username}</option>
              ))}
            </select>
          </label>
        )}

        <div>
          <h3 className="text-sm font-medium text-muted">{t('project.comments')}</h3>
          <div className="mt-2 space-y-2 max-h-48 overflow-y-auto">
            {comments.length === 0 && (
              <p className="text-sm text-muted">{t('project.noComments')}</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="rounded-lg bg-surface-2 border border-border p-2 text-sm">
                <span className="text-muted">{c.author_detail?.username}:</span> {c.body}
              </div>
            ))}
          </div>
          <form onSubmit={addComment} className="mt-3 flex gap-2">
            <input
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t('project.addComment')}
              className="flex-1 rounded-lg bg-surface-2 border border-border px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              disabled={busy}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-50"
            >
              {t('common.send')}
            </button>
          </form>
        </div>
      </div>
    </Modal>
  )
}

/* ---------- create-task modal ---------- */

function CreateTaskModal({ open, projectId, members, onClose, onCreated }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    title: '',
    description: '',
    priority: 'medium',
    assignee: '',
    deadline: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const payload = {
        project: Number(projectId),
        title: form.title,
        description: form.description,
        priority: form.priority,
      }
      if (form.assignee) payload.assignee = Number(form.assignee)
      if (form.deadline) payload.deadline = form.deadline
      await api.post('/api/tasks/', payload)
      setForm({ title: '', description: '', priority: 'medium', assignee: '', deadline: '' })
      await onCreated()
    } catch (err) {
      setError(err.response?.data?.assignee?.[0] ?? t('project.couldNotCreateTask'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title={t('project.newTask')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Text label={t('project.title')} value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <label className="block">
          <span className="text-sm text-muted">{t('project.description')}</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2 outline-none focus:border-primary"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-sm text-muted">{t('project.priority')}</span>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2"
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{t(`priority.${p}`)}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm text-muted">{t('project.deadline')}</span>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2"
            />
          </label>
        </div>
        <label className="block">
          <span className="text-sm text-muted">{t('project.assigneeOptional')}</span>
          <select
            value={form.assignee}
            onChange={(e) => setForm({ ...form, assignee: e.target.value })}
            className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2"
          >
            <option value="">{t('project.unassigned')}</option>
            {members.map((m) => (
              <option key={m.id} value={m.user}>{m.user_detail?.username}</option>
            ))}
          </select>
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-primary py-2.5 font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? t('project.creating') : t('project.createTask')}
        </button>
      </form>
    </Modal>
  )
}

/* ---------- add-member modal ---------- */

function AddMemberModal({ open, projectId, candidates, onClose, onAdded }) {
  const { t } = useTranslation()
  const [userId, setUserId] = useState('')
  const [role, setRole] = useState('member')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    if (!userId) return
    setError('')
    setBusy(true)
    try {
      await api.post('/api/memberships/', {
        project: Number(projectId),
        user: Number(userId),
        role_in_project: role,
      })
      setUserId('')
      setRole('member')
      await onAdded()
    } catch {
      setError(t('project.couldNotAddMember'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title={t('project.addMemberTitle')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="text-sm text-muted">{t('auth.username')}</span>
          <select
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2"
          >
            <option value="">{t('project.selectUser')}</option>
            {candidates.map((u) => (
              <option key={u.id} value={u.id}>
                {u.username} ({t(`role.${u.role}`)})
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-sm text-muted">{t('project.roleInProject')}</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2"
          >
            <option value="member">{t('role.member')}</option>
            <option value="lead">{t('role.team_lead')}</option>
          </select>
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-primary py-2.5 font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? t('project.adding') : t('project.addMemberBtn')}
        </button>
      </form>
    </Modal>
  )
}

/* ---------- add-instruction modal ---------- */

function AddInstructionModal({ open, projectId, onClose, onAdded }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ title: '', body: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/api/instructions/', {
        project: Number(projectId),
        title: form.title,
        body: form.body,
      })
      setForm({ title: '', body: '' })
      await onAdded()
    } catch {
      setError(t('project.couldNotAddInstruction'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title={t('project.addInstruction')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Text label={t('project.title')} value={form.title} onChange={(v) => setForm({ ...form, title: v })} required />
        <label className="block">
          <span className="text-sm text-muted">{t('project.body')}</span>
          <textarea
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
            rows={4}
            required
            className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2 outline-none focus:border-primary"
          />
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-primary py-2.5 font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? t('project.saving') : t('project.saveInstruction')}
        </button>
      </form>
    </Modal>
  )
}

function Text({ label, value, onChange, required }) {
  return (
    <label className="block">
      <span className="text-sm text-muted">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2 outline-none focus:border-primary"
      />
    </label>
  )
}
