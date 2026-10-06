import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ roles }) {
  const { user } = useAuth()
  const location = useLocation()

  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />
  if (roles && !roles.includes(user.role)) return <Navigate to={getDashboardPath(user.role)} replace />
  if (user.role === 'PHARMACY_STAFF' && user.mustChangePassword && location.pathname !== '/pharmacy/change-password') {
    return <Navigate to="/pharmacy/change-password" replace />
  }
  return <Outlet />
}

export function getDashboardPath(role) {
  if (role === 'PHARMACY_STAFF') return '/pharmacy/dashboard'
  if (role === 'ADMIN') return '/admin/dashboard'
  return '/patient/dashboard'
}

export default ProtectedRoute
