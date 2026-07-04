import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../api/client'
import { useAuth } from '../context/AuthContext'
import LanguageThemeSwitch from '../components/LanguageThemeSwitch'
import { Field } from './LoginPage'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { user, refreshUser } = useAuth()

  const [profile, setProfile] = useState({ username: user.username, email: user.email })
  const [profileError, setProfileError] = useState('')
  const [profileMsg, setProfileMsg] = useState('')
  const [profileBusy, setProfileBusy] = useState(false)

  const [passwords, setPasswords] = useState({ current: '', next: '' })
  const [passwordError, setPasswordError] = useState('')
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordBusy, setPasswordBusy] = useState(false)

  async function saveProfile(e) {
    e.preventDefault()
    setProfileError('')
    setProfileMsg('')
    setProfileBusy(true)
    try {
      await api.patch('/api/auth/me/', profile)
      await refreshUser?.()
      setProfileMsg(t('settings.profileSaved'))
    } catch (err) {
      const detail = err.response?.data
      setProfileError(detail?.username?.[0] ?? detail?.email?.[0] ?? t('settings.saveFailed'))
    } finally {
      setProfileBusy(false)
    }
  }

  async function savePassword(e) {
    e.preventDefault()
    setPasswordError('')
    setPasswordMsg('')
    setPasswordBusy(true)
    try {
      await api.post('/api/auth/change-password/', {
        current_password: passwords.current,
        new_password: passwords.next,
      })
      setPasswords({ current: '', next: '' })
      setPasswordMsg(t('settings.passwordSaved'))
    } catch (err) {
      const detail = err.response?.data
      setPasswordError(
        detail?.current_password?.[0] ?? detail?.new_password?.[0] ?? t('settings.wrongPassword'),
      )
    } finally {
      setPasswordBusy(false)
    }
  }

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border">
        <div className="mx-auto max-w-xl px-6 py-4 flex items-center gap-4">
          <Link to="/dashboard" className="text-muted hover:text-text">
            ← {t('common.back')}
          </Link>
          <div className="text-xl font-extrabold tracking-tight">BORAS Lab</div>
          <div className="ml-auto">
            <LanguageThemeSwitch />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-6 py-8 space-y-8">
        <h1 className="text-2xl font-bold">{t('settings.title')}</h1>

        <form onSubmit={saveProfile} className="rounded-2xl bg-surface border border-border p-6 space-y-4">
          <h2 className="font-semibold">{t('settings.profile')}</h2>
          <Field
            label={t('auth.username')}
            value={profile.username}
            onChange={(v) => setProfile({ ...profile, username: v })}
          />
          <Field
            label={t('auth.email')}
            type="email"
            value={profile.email}
            onChange={(v) => setProfile({ ...profile, email: v })}
          />
          {profileError && <p className="text-sm text-danger">{profileError}</p>}
          {profileMsg && <p className="text-sm text-muted">{profileMsg}</p>}
          <button
            disabled={profileBusy}
            className="rounded-xl bg-primary px-4 py-2 font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-50"
          >
            {profileBusy ? t('project.saving') : t('common.save')}
          </button>
        </form>

        <form onSubmit={savePassword} className="rounded-2xl bg-surface border border-border p-6 space-y-4">
          <h2 className="font-semibold">{t('settings.changePassword')}</h2>
          <Field
            label={t('settings.currentPassword')}
            type="password"
            value={passwords.current}
            onChange={(v) => setPasswords({ ...passwords, current: v })}
          />
          <Field
            label={t('settings.newPassword')}
            type="password"
            value={passwords.next}
            onChange={(v) => setPasswords({ ...passwords, next: v })}
          />
          {passwordError && <p className="text-sm text-danger">{passwordError}</p>}
          {passwordMsg && <p className="text-sm text-muted">{passwordMsg}</p>}
          <button
            disabled={passwordBusy}
            className="rounded-xl bg-primary px-4 py-2 font-medium text-primary-fg hover:bg-primary-hover disabled:opacity-50"
          >
            {passwordBusy ? t('project.saving') : t('common.save')}
          </button>
        </form>
      </main>
    </div>
  )
}