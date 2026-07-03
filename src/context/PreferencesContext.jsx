import { createContext, useContext, useEffect, useState } from 'react'
import i18n from '../i18n'
import api from '../api/client'
import { useAuth } from './AuthContext'

const PreferencesContext = createContext(null)

const THEME_KEY = 'tf_theme'
const LANG_KEY = 'tf_lang'

function applyTheme(theme) {
  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
}

export function PreferencesProvider({ children }) {
  const { user } = useAuth()
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(THEME_KEY) || 'dark',
  )
  const [language, setLanguageState] = useState(
    () => localStorage.getItem(LANG_KEY) || 'en',
  )

  useEffect(() => applyTheme(theme), [theme])
  useEffect(() => {
    i18n.changeLanguage(language)
  }, [language])

  // Adopt the signed-in user's saved server prefs when they load.
  useEffect(() => {
    if (!user) return
    if (user.theme) {
      setThemeState(user.theme)
      localStorage.setItem(THEME_KEY, user.theme)
    }
    if (user.language) {
      setLanguageState(user.language)
      localStorage.setItem(LANG_KEY, user.language)
    }
  }, [user])

  // Persist to the backend when signed in (fire-and-forget).
  function persist(patch) {
    if (user) api.patch('/api/auth/me/', patch).catch(() => {})
  }

  function setTheme(next) {
    setThemeState(next)
    localStorage.setItem(THEME_KEY, next)
    persist({ theme: next })
  }

  function toggleTheme() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  function setLanguage(next) {
    setLanguageState(next)
    localStorage.setItem(LANG_KEY, next)
    persist({ language: next })
  }

  const value = { theme, language, setTheme, toggleTheme, setLanguage }
  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePreferences() {
  const ctx = useContext(PreferencesContext)
  if (!ctx) throw new Error('usePreferences must be used within PreferencesProvider')
  return ctx
}
