import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function QuickAccess() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Verifying access token...')

  const { signInWithToken } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const token = searchParams.get('token')

    if (!token) {
      setStatus('error')
      setMessage('No access token provided')
      return
    }

    // Attempt to sign in with token
    signInWithToken(token)
      .then(({ error }) => {
        if (error) {
          setStatus('error')
          setMessage(error.message || 'Invalid or expired token')
        } else {
          setStatus('success')
          setMessage('Access granted! Redirecting to dashboard...')
          setTimeout(() => {
            navigate('/dashboard')
          }, 2000)
        }
      })
      .catch((err) => {
        setStatus('error')
        setMessage(err.message || 'An unexpected error occurred')
      })
  }, [searchParams, signInWithToken, navigate])

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className={`bg-white rounded-lg shadow-md p-8 border-l-4 ${
          status === 'loading' ? 'border-primary' :
          status === 'success' ? 'border-success' :
          'border-error'
        } text-center`}>
          {/* Icon */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            status === 'loading' ? 'bg-primary' :
            status === 'success' ? 'bg-success' :
            'bg-error'
          }`}>
            {status === 'loading' && (
              <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {status === 'success' && (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {status === 'error' && (
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
          </div>

          {/* Title */}
          <h2 className="font-heading text-2xl text-neutral-900 mb-2">
            {status === 'loading' && 'Verifying Access'}
            {status === 'success' && 'Access Granted'}
            {status === 'error' && 'Access Denied'}
          </h2>

          {/* Message */}
          <p className="text-neutral-600 mb-4">{message}</p>

          {/* Error Actions */}
          {status === 'error' && (
            <div className="space-y-3 mt-6">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Sign In with Password
              </button>
              <button
                onClick={() => navigate('/')}
                className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Go to Home
              </button>
            </div>
          )}

          {/* Success Loading */}
          {status === 'success' && (
            <div className="w-12 h-12 border-4 border-success border-t-transparent rounded-full animate-spin mx-auto mt-4" />
          )}
        </div>

        {/* Info */}
        <div className="mt-6 text-center text-sm text-neutral-500">
          <p>QR Code Device Access</p>
          <p className="mt-1">Ancient Cyprus Political Simulation</p>
        </div>
      </div>
    </div>
  )
}
