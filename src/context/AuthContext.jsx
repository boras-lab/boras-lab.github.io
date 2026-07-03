import { createContext, useContext, useEffect, useState } from 'react'
import api, { clearTokens, getAccess, setTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // On first load, if we have a token, fetch the current user.
  useEffect(() => {
    let active = true
    async function bootstrap() {
      if (!getAccess()) {
        setLoading(false)
        return
      }
      try {
        const { data } = await api.get('/api/auth/me/')
        if (active) setUser(data)
      } catch {
        clearTokens()
      } finally {
        if (active) setLoading(false)
      }
    }
    bootstrap()
    return () => {
      active = false
    }
  }, [])

  async function login(username, password) {
    const { data } = await api.post('/api/auth/login/', { username, password })
    setTokens({ access: data.access, refresh: data.refresh })
    const me = await api.get('/api/auth/me/')
    setUser(me.data)
    return me.data
  }

  async function register(payload) {
    await api.post('/api/auth/register/', payload)
    // Convenience: log the new user straight in.
    return login(payload.username, payload.password)
  }

  function logout() {
    clearTokens()
    setUser(null)
  }

  const value = { user, loading, login, register, logout }
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
