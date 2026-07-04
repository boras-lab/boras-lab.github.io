import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/Modal'
import LanguageThemeSwitch from '../components/LanguageThemeSwitch'
import RiskBadge from '../components/RiskBadge'
import { STATUS_COLOR, STATUS_ORDER } from '../constants'

const ROLE_HINT = { head: 'nav.headHint', team_lead: 'nav.leadHint', member: 'nav.memberHint' }

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user, logout } = useAuth()
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  async function load() {
    const [p, t2] = await Promise.all([
      api.get('/api/projects/'),
      api.get('/api/tasks/'),
    ])
    setProjects(p.data.results ?? p.data)
    setTasks(t2.data.results ?? t2.data)
  }

  useEffect(() => {
    load().finally(() => setLoading(false))
  }, [])

  async function updateStatus(taskId, status) {
    const { data } = await api.patch(`/api/tasks/${taskId}/status/`, { status })
    setTasks((prev) => prev.map((tk) => (tk.id === taskId ? data : tk)))
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="text-xl font-extrabold tracking-tight">BORAS Lab</div>
          <div className="flex items-center gap-4 text-sm">
            <LanguageThemeSwitch />
            <span className="text-muted hidden sm:inline">
              {user.username}{' '}
              <span className="rounded bg-surface-2 px-2 py-0.5 text-xs">
                {t(`role.${user.role}`)}
              </span>
            </span>
            <button
              onClick={logout}
              className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface-2"
            >
              {t('common.logout')}
            </button>
            <Link
  to="/settings"
  className="rounded-lg border border-border px-3 py-1.5 hover:bg-surface-2"
>
  {t('settings.title')}
</Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8 space-y-10">
        {loading && <p className="text-muted">{t('common.loading')}</p>}

        {!loading && (
          <>
            {/* Role-aware hint */}
            <p className="-mt-4 text-sm text-muted">{t(ROLE_HINT[user.role] ?? 'nav.memberHint')}</p>

            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('dash.myProjects')}</h2>
                {user.role === 'head' && (
                  <button
                    onClick={() => setShowCreate(true)}
                    className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-fg hover:bg-primary-hover"
                  >
                    + {t('dash.newProject')}
                  </button>
                )}
              </div>
              {projects.length === 0 && (
                <p className="mt-2 text-sm text-muted">{t('dash.noProjects')}</p>
              )}
              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => (
                  <Link
                    key={p.id}
                    to={`/projects/${p.id}`}
                    className="rounded-2xl bg-surface border border-border p-4 hover:border-primary transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">{p.name}</h3>
                      <span className="text-xs text-muted">
                        {t(`projectStatus.${p.status}`, p.status)}
                      </span>
                    </div>
                    <div className="mt-3 h-2 w-full rounded-full bg-surface-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${p.progress ?? 0}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {p.progress ?? 0}% · {p.task_count ?? 0} {t('project.tasks').toLowerCase()}
                    </div>
                  </Link>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold">{t('dash.myTasks')}</h2>
              {tasks.length === 0 && (
                <p className="mt-2 text-sm text-muted">{t('dash.noTasks')}</p>
              )}
              <div className="mt-4 space-y-3">
                {tasks.map((tk) => (
                  <div
                    key={tk.id}
                    className="rounded-xl bg-surface border border-border p-4 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-medium flex items-center gap-2">
                        {tk.title}
                        <RiskBadge risk={tk.risk} />
                      </div>
                      <div className="text-xs text-muted">
                        {tk.assignee_detail?.username
                          ? t('dash.assignedTo', { name: tk.assignee_detail.username })
                          : t('dash.unassigned')}
                        {tk.deadline ? ` · ${t('dash.due', { date: tk.deadline })}` : ''}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs text-white ${STATUS_COLOR[tk.status] ?? 'bg-slate-600'}`}
                      >
                        {t(`status.${tk.status}`)}
                      </span>
                      <select
                        value={tk.status}
                        onChange={(e) => updateStatus(tk.id, e.target.value)}
                        className="rounded-lg bg-surface-2 border border-border px-2 py-1 text-xs"
                      >
                        {STATUS_ORDER.map((s) => (
                          <option key={s} value={s}>
                            {t(`status.${s}`)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      <CreateProjectModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={async () => {
          setShowCreate(false)
          await load()
        }}
      />
    </div>
  )
}

function CreateProjectModal({ open, onClose, onCreated }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ name: '', description: '', status: 'active' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/api/projects/', form)
      setForm({ name: '', description: '', status: 'active' })
      await onCreated()
    } catch {
      setError(t('dash.couldNotCreateProject'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal open={open} title={t('dash.newProject')} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="text-sm text-muted">{t('dash.name')}</span>
          <input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2 outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted">{t('dash.description')}</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2 outline-none focus:border-primary"
          />
        </label>
        <label className="block">
          <span className="text-sm text-muted">{t('dash.status')}</span>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2 outline-none focus:border-primary"
          >
            <option value="planning">{t('projectStatus.planning')}</option>
            <option value="active">{t('projectStatus.active')}</option>
            <option value="on_hold">{t('projectStatus.on_hold')}</option>
            <option value="completed">{t('projectStatus.completed')}</option>
          </select>
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-primary py-2.5 font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? t('dash.creating') : t('dash.createProject')}
        </button>
      </form>
    </Modal>
  )
}
