import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import LanguageThemeSwitch from '../components/LanguageThemeSwitch'

function StatCard({ value, label }) {
  return (
    <div className="rounded-2xl bg-surface border border-border p-5 text-center">
      <div className="text-3xl font-bold text-text">{value}</div>
      <div className="mt-1 text-sm text-muted">{label}</div>
    </div>
  )
}

function ProgressRow({ name, progress }) {
  return (
    <div className="py-2">
      <div className="flex justify-between text-sm text-text">
        <span>{name}</span>
        <span className="tabular-nums text-muted">{progress}%</span>
      </div>
      <div className="mt-1 h-2 w-full rounded-full bg-surface-2 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default function LandingPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    api
      .get('/api/public/dashboard/')
      .then((r) => setData(r.data))
      .catch(() => setError(true))
  }, [])

  if (user) return <Navigate to="/dashboard" replace />

  const stats = data?.stats
  const projects = data?.current_projects ?? []

  return (
    <div className="min-h-screen bg-bg text-text">
      <div className="mx-auto max-w-3xl px-6 py-10">
        <div className="flex justify-end">
          <LanguageThemeSwitch />
        </div>

        <header className="text-center mt-6">
          <h1 className="text-5xl font-extrabold tracking-tight">BORAS Lab</h1>
          <p className="mt-3 text-muted">{t('landing.tagline')}</p>
        </header>

        <section className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard value={stats?.active_projects ?? '—'} label={t('landing.activeProjects')} />
          <StatCard value={stats?.tasks_completed ?? '—'} label={t('landing.completedTasks')} />
          <StatCard value={stats?.team_members ?? '—'} label={t('landing.teamMembers')} />
          <StatCard
            value={stats ? `${stats.on_time_rate}%` : '—'}
            label={t('landing.onTime')}
          />
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-text">{t('landing.currentProjects')}</h2>
          <div className="mt-4 rounded-2xl bg-surface border border-border p-5">
            {error && <p className="text-sm text-danger">{t('landing.loadError')}</p>}
            {!error && projects.length === 0 && (
              <p className="text-sm text-muted">{t('landing.noProjects')}</p>
            )}
            {projects.map((p) => (
              <ProgressRow key={p.name} name={p.name} progress={p.progress} />
            ))}
          </div>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            t('landing.featureTeam'),
            t('landing.featureAnalytics'),
            t('landing.featureProgress'),
          ].map((f) => (
            <div
              key={f}
              className="rounded-xl bg-surface border border-border px-4 py-3 text-sm text-muted"
            >
              ✓ {f}
            </div>
          ))}
        </section>

        <section className="mt-12 flex justify-center gap-4">
          <Link
            to="/login"
            className="rounded-xl bg-primary px-6 py-3 font-medium text-primary-fg hover:bg-primary-hover"
          >
            {t('common.signIn')}
          </Link>
          <Link
            to="/register"
            className="rounded-xl border border-border px-6 py-3 font-medium hover:bg-surface-2"
          >
            {t('common.createAccount')}
          </Link>
        </section>
      </div>
    </div>
  )
}
