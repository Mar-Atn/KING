import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import QRCode from 'qrcode'

export function Settings() {
  const { user, profile } = useAuth()
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const generateAccessToken = async () => {
    if (!user) return

    setLoading(true)
    setError('')

    try {
      // Generate secure random token (32 characters)
      const token = Array.from(crypto.getRandomValues(new Uint8Array(24)))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Set expiry to 24 hours from now
      const expiresAt = new Date()
      expiresAt.setHours(expiresAt.getHours() + 24)

      // Insert token into database
      const { error: insertError } = await supabase
        .from('access_tokens')
        .insert({
          user_id: user.id,
          token,
          expires_at: expiresAt.toISOString(),
          device_name: 'Web Generated',
          is_valid: true,
        })

      if (insertError) {
        setError(insertError.message)
        setLoading(false)
        return
      }

      // Generate QR code URL
      const quickAccessUrl = `${window.location.origin}/quick-access?token=${token}`
      const qrDataUrl = await QRCode.toDataURL(quickAccessUrl, {
        width: 300,
        margin: 2,
        color: {
          dark: '#2C5F7C', // primary color
          light: '#FFFFFF',
        },
      })

      setQrCodeUrl(qrDataUrl)
      setAccessToken(token)
      setExpiresAt(expiresAt.toISOString())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token')
    } finally {
      setLoading(false)
    }
  }

  const copyTokenUrl = () => {
    if (accessToken) {
      const url = `${window.location.origin}/quick-access?token=${accessToken}`
      navigator.clipboard.writeText(url)
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="text-primary hover:text-primary-hover">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className="font-heading text-3xl text-primary">The New King SIM</h1>
              <p className="text-sm text-neutral-600 mt-1">Settings - Manage your account and device access</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary mb-6">
          <h2 className="font-heading text-xl text-primary mb-4">Profile Information</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-sm font-medium text-neutral-600">Display Name:</span>
              <span className="text-sm text-neutral-900">{profile?.display_name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-sm font-medium text-neutral-600">Email:</span>
              <span className="text-sm text-neutral-900">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-neutral-600">Role:</span>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                profile?.role === 'facilitator'
                  ? 'bg-secondary/20 text-secondary'
                  : 'bg-primary/20 text-primary'
              }`}>
                {profile?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Device Access Section */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-secondary">
          <h2 className="font-heading text-xl text-primary mb-2">Device Access</h2>
          <p className="text-sm text-neutral-600 mb-6">
            Generate a QR code to quickly access your account on another device without typing your password.
            Token expires in 24 hours and can only be used once.
          </p>

          {/* Error Message */}
          {error && (
            <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {/* Generate Button */}
          {!qrCodeUrl && (
            <button
              onClick={generateAccessToken}
              disabled={loading}
              className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>
          )}

          {/* QR Code Display */}
          {qrCodeUrl && (
            <div className="space-y-4">
              {/* QR Code */}
              <div className="border-2 border-neutral-200 rounded-lg p-6 text-center">
                <p className="text-sm text-neutral-600 mb-4">
                  Scan this QR code on another device to access your account:
                </p>
                <img
                  src={qrCodeUrl}
                  alt="Access QR Code"
                  className="mx-auto rounded-lg shadow-sm"
                  style={{ width: 300, height: 300 }}
                />
                <p className="text-xs text-neutral-500 mt-4">
                  Expires: {expiresAt ? new Date(expiresAt).toLocaleString() : 'N/A'}
                </p>
              </div>

              {/* Copy Link Button */}
              <button
                onClick={copyTokenUrl}
                className="w-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                Copy Access Link
              </button>

              {/* Generate New */}
              <button
                onClick={() => {
                  setQrCodeUrl(null)
                  setAccessToken(null)
                  setExpiresAt(null)
                }}
                className="w-full bg-primary/10 hover:bg-primary/20 text-primary font-medium py-3 px-4 rounded-lg transition-colors"
              >
                Generate New QR Code
              </button>

              {/* Warning */}
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <p className="text-xs text-warning-dark">
                  <strong>Security Note:</strong> This QR code provides one-time access to your account.
                  Do not share it publicly. The token expires in 24 hours.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
