import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import LanguageThemeSwitch from '../components/LanguageThemeSwitch'

export default function LoginPage() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(form.username, form.password)
      navigate('/dashboard')
    } catch {
      setError(t('auth.invalid'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={t('common.signIn')}
      footer={
        <Link to="/register" className="text-primary hover:underline">
          {t('auth.createOne')}
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field
          label={t('auth.username')}
          value={form.username}
          onChange={(v) => setForm({ ...form, username: v })}
        />
        <Field
          label={t('auth.password')}
          type="password"
          value={form.password}
          onChange={(v) => setForm({ ...form, password: v })}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-primary py-2.5 font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? t('auth.signingIn') : t('common.signIn')}
        </button>
      </form>
    </AuthShell>
  )
}

export function AuthShell({ title, children, footer }) {
  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="mb-4 flex justify-end">
          <LanguageThemeSwitch />
        </div>
        <Link to="/" className="block text-center text-2xl font-extrabold tracking-tight">BORAS Lab</Link>
        <div className="mt-6 rounded-2xl bg-surface border border-border p-6">
          <h1 className="text-xl font-semibold">{title}</h1>
          <div className="mt-4">{children}</div>
        </div>
        <p className="mt-4 text-center text-sm text-muted">{footer}</p>
      </div>
    </div>
  )
}

export function Field({ label, type = 'text', value, onChange }) {
  return (
    <label className="block">
      <span className="text-sm text-muted">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2 outline-none focus:border-primary"
        required
      />
    </label>
  )
}
