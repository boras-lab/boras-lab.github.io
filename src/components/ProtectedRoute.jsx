import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

// Route guard: while auth is bootstrapping, show nothing; if no user, bounce to
// the landing page (which offers Sign In / Register).
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-bg" />
  if (!user) return <Navigate to="/" replace />
  return children
}
