import { useAuth } from '../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'

export function Dashboard() {
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="font-heading text-3xl text-primary">The New King SIM</h1>
              <p className="text-sm text-neutral-600 mt-1">
                Welcome, {profile?.display_name}
              </p>
            </div>
            <button
              onClick={handleSignOut}
              className="px-4 py-2 bg-neutral-200 hover:bg-neutral-300 text-neutral-700 rounded-lg transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info Card */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-primary mb-6">
          <h2 className="font-heading text-xl text-primary mb-4">Your Profile</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-sm font-medium text-neutral-600">Email:</span>
              <span className="text-sm text-neutral-900">{user?.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-sm font-medium text-neutral-600">Display Name:</span>
              <span className="text-sm text-neutral-900">{profile?.display_name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-neutral-100">
              <span className="text-sm font-medium text-neutral-600">Role:</span>
              <span className="text-sm">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  profile?.role === 'facilitator'
                    ? 'bg-secondary/20 text-secondary'
                    : 'bg-primary/20 text-primary'
                }`}>
                  {profile?.role}
                </span>
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm font-medium text-neutral-600">Status:</span>
              <span className="text-sm">
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-success/20 text-success">
                  {profile?.status}
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-secondary">
          <h2 className="font-heading text-xl text-primary mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile?.role === 'facilitator' ? (
              <>
                <Link to="/simulation/create" className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left block">
                  <div className="font-medium text-neutral-900 mb-1">Create Simulation</div>
                  <div className="text-sm text-neutral-600">Set up a new simulation run</div>
                </Link>
                <Link to="/scenario/edit" className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left block">
                  <div className="font-medium text-neutral-900 mb-1">Edit Scenario</div>
                  <div className="text-sm text-neutral-600">Customize templates, clans & roles</div>
                </Link>
                <button className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
                  <div className="font-medium text-neutral-900 mb-1">Manage Participants</div>
                  <div className="text-sm text-neutral-600">Assign roles and permissions</div>
                </button>
              </>
            ) : (
              <>
                <button className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left">
                  <div className="font-medium text-neutral-900 mb-1">My Role</div>
                  <div className="text-sm text-neutral-600">View your character assignment</div>
                </button>
                <Link to="/settings" className="p-4 border-2 border-neutral-200 rounded-lg hover:border-primary hover:bg-primary/5 transition-colors text-left block">
                  <div className="font-medium text-neutral-900 mb-1">Device Access</div>
                  <div className="text-sm text-neutral-600">Generate QR code for quick login</div>
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Coming Soon */}
        <div className="mt-6 bg-primary/5 border border-primary/20 rounded-lg p-6 text-center">
          <p className="text-primary font-medium mb-2">Phase 1.3 - Authentication Complete</p>
          <p className="text-sm text-neutral-600">
            Next up: Phase 1.4 - Design System Components & Phase 2 - Core Simulation Engine
          </p>
        </div>
      </main>
    </div>
  )
}
