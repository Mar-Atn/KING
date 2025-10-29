import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [role, setRole] = useState<'facilitator' | 'participant'>('participant')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(email, password, displayName, role)

      if (error) {
        setError(error.message)
      } else {
        setSuccess(true)
        // Redirect to dashboard after 2 seconds
        setTimeout(() => {
          navigate('/dashboard')
        }, 2000)
      }
    } catch (err) {
      setError('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden shadow-lg border-4 border-success">
              <img
                src="/olive.jpg"
                alt="The New King SIM"
                className="w-full h-full object-cover"
              />
            </div>
            <h2 className="font-heading text-2xl text-neutral-900 mb-2">Welcome!</h2>
            <p className="text-neutral-600 mb-4">
              Your account has been created successfully.
            </p>
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4 py-12">
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
          <p className="text-neutral-600">Create your account</p>
        </div>

        {/* Registration Form */}
        <div className="bg-white rounded-lg shadow-md p-8 border-l-4 border-primary">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-neutral-700 mb-2">
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Alex, Maria, etc."
                disabled={loading}
              />
              <p className="text-xs text-neutral-500 mt-1">
                This is how others will see you in the simulation
              </p>
            </div>

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
                placeholder="At least 6 characters"
                disabled={loading}
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-neutral-700 mb-2">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                placeholder="Re-enter your password"
                disabled={loading}
              />
            </div>

            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                I am registering as a:
              </label>
              <div className="flex gap-4">
                {/* Participant Option */}
                <label className="flex-1 flex items-center justify-center p-3 border-2 border-neutral-200 rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="participant"
                    checked={role === 'participant'}
                    onChange={(e) => setRole(e.target.value as 'participant')}
                    className="mr-2"
                    disabled={loading}
                  />
                  <div className="font-medium text-neutral-900">Participant</div>
                </label>

                {/* Facilitator Option */}
                <label className="flex-1 flex items-center justify-center p-3 border-2 border-neutral-200 rounded-lg cursor-pointer hover:border-primary transition-colors">
                  <input
                    type="radio"
                    name="role"
                    value="facilitator"
                    checked={role === 'facilitator'}
                    onChange={(e) => setRole(e.target.value as 'facilitator')}
                    className="mr-2"
                    disabled={loading}
                  />
                  <div className="font-medium text-neutral-900">Facilitator</div>
                </label>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
