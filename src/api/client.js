import axios from 'axios'

// Token storage keys (localStorage). Kept in one place so AuthContext and the
// interceptors agree on names.
export const ACCESS_KEY = 'tf_access'
export const REFRESH_KEY = 'tf_refresh'

export const getAccess = () => localStorage.getItem(ACCESS_KEY)
export const getRefresh = () => localStorage.getItem(REFRESH_KEY)
export const setTokens = ({ access, refresh }) => {
  if (access) localStorage.setItem(ACCESS_KEY, access)
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh)
}
export const clearTokens = () => {
  localStorage.removeItem(ACCESS_KEY)
  localStorage.removeItem(REFRESH_KEY)
}

// Base URL is relative — the Vite dev proxy forwards /api to Django. In
// production, set VITE_API_BASE to the API origin.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || '',
})

// Public endpoints that must NOT carry an Authorization header. JWTAuthentication
// is a global default auth class, so a stale token here is rejected with
// `token_not_valid` (401) before the view's AllowAny permission is checked.
// `/api/auth/me/` is intentionally excluded — it requires the token.
const PUBLIC_PATHS = ['/api/auth/register/', '/api/auth/login/', '/api/auth/refresh/']
const isPublicPath = (url = '') => PUBLIC_PATHS.some((p) => url.includes(p))

// Attach the access token to every request except public auth endpoints.
api.interceptors.request.use((config) => {
  const token = getAccess()
  if (token && !isPublicPath(config.url)) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// On 401, try a one-shot refresh, then replay the original request.
let refreshing = null
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    const refresh = getRefresh()

    const isAuthCall = original?.url?.includes('/api/auth/')
    if (status === 401 && refresh && !original._retry && !isAuthCall) {
      original._retry = true
      try {
        refreshing =
          refreshing ||
          axios.post('/api/auth/refresh/', { refresh }).then((r) => r.data)
        const data = await refreshing
        refreshing = null
        setTokens({ access: data.access })
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (e) {
        refreshing = null
        clearTokens()
        // Full reload sends the user back through the guard → landing.
        window.location.href = '/'
        return Promise.reject(e)
      }
    }
    return Promise.reject(error)
  },
)

export default api
