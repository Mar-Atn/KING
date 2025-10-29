import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    console.log('🔐 Starting login for:', email)

    try {
      const { error } = await signIn(email, password)

      if (error) {
        console.error('🔐 Auth error:', error)
        setError(error.message)
      } else {
        console.log('✅ Login successful, navigating...')
        // Redirect to dashboard
        navigate('/dashboard')
      }
    } catch (err: any) {
      console.error('❌ Login exception:', err)
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden shadow-lg border-4 border-primary">
            <img
              src="/olive.jpg"
              alt="The New King SIM"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="font-heading text-3xl text-primary mb-2">The New King SIM</h1>
          <p className="text-neutral-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-primary">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-2">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Enter your password"
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary hover:underline font-medium">
                Register here
              </Link>
            </p>
            <p className="text-sm text-neutral-600 mt-2">
              <Link to="/quick-access" className="text-secondary hover:underline font-medium">
                Quick access with QR code
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
