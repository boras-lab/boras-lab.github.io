import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../context/AuthContext'
import { AuthShell, Field } from './LoginPage'

export default function RegisterPage() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    role: 'member',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function onSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      const detail = err.response?.data
      setError(
        (detail && (detail.username?.[0] || detail.email?.[0] || detail.password?.[0])) ||
          t('auth.failed'),
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthShell
      title={t('common.createAccount')}
      footer={
        <Link to="/login" className="text-primary hover:underline">
          {t('auth.haveAccount')}
        </Link>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Field label={t('auth.username')} value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
        <Field label={t('auth.email')} type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label={t('auth.password')} type="password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} />
        <label className="block">
          <span className="text-sm text-muted">{t('auth.role')}</span>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="mt-1 w-full rounded-lg bg-surface-2 border border-border px-3 py-2 outline-none focus:border-primary"
          >
            <option value="member">{t('role.member')}</option>
            {/* <option value="team_lead">{t('role.team_lead')}</option> */}
          </select>
          <span className="mt-1 block text-xs text-muted">{t('auth.headNote')}</span>
        </label>
        {error && <p className="text-sm text-danger">{error}</p>}
        <button
          disabled={busy}
          className="w-full rounded-xl bg-primary py-2.5 font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-50"
        >
          {busy ? t('auth.creating') : t('common.createAccount')}
        </button>
      </form>
    </AuthShell>
  )
}
