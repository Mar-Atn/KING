import { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

interface ProtectedRouteProps {
  children: ReactNode
  requireRole?: 'facilitator' | 'participant'
}

export function ProtectedRoute({ children, requireRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Check role requirement
  if (requireRole && profile?.role !== requireRole) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-warning text-center">
            <div className="w-16 h-16 bg-warning rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="font-heading text-2xl text-neutral-900 mb-2">Access Denied</h2>
            <p className="text-neutral-600 mb-4">
              This page requires {requireRole} access.
            </p>
            <p className="text-sm text-neutral-500">
              Your role: {profile?.role || 'unknown'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Render children if authenticated and authorized
  return <>{children}</>
}
