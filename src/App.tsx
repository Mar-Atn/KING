import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { QuickAccess } from './pages/QuickAccess'
import { Settings } from './pages/Settings'
import { SimulationWizard } from './pages/SimulationWizard'
import { EditScenario } from './pages/EditScenario'
import { ProtectedRoute } from './components/ProtectedRoute'
import { SystemCheck } from './components/SystemCheck'

// Landing Page Component
function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
      <div className="max-w-4xl px-6 py-12 text-center">
        {/* Crown Icon */}
        <div className="text-8xl mb-6">👑</div>

        {/* Title */}
        <h1 className="font-heading text-6xl text-primary mb-4">
          The New King SIM
        </h1>

        {/* Subtitle */}
        <p className="text-xl text-neutral-700 mb-8">
          An immersive simulation of leadership, politics, and power <br />
          in Ancient Cyprus
        </p>

        {/* Status Card */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-8 border-l-4 border-accent">
          <h2 className="font-heading text-2xl text-neutral-900 mb-4">
            🏗️ Foundation Complete
          </h2>
          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span className="text-sm">Vite + React + TypeScript</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span className="text-sm">Tailwind CSS + Design System</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span className="text-sm">Supabase Client</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span className="text-sm">State Management (Zustand)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span className="text-sm">Server State (TanStack Query)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span className="text-sm">Animations (Framer Motion)</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Check */}
        <SystemCheck />

        {/* Call to Action */}
        <div className="bg-primary-light rounded-lg p-6 mt-8">
          <h3 className="font-heading text-lg text-primary mb-3">
            Phase 1.3 Complete - Authentication Ready!
          </h3>
          <div className="flex gap-4 justify-center mt-4">
            <Link
              to="/login"
              className="bg-primary hover:bg-primary-hover text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="bg-secondary hover:bg-secondary/90 text-white font-medium py-3 px-6 rounded-lg transition-colors"
            >
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/quick-access" element={<QuickAccess />} />

      {/* Protected Routes */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />
      <Route
        path="/simulation/create"
        element={
          <ProtectedRoute>
            <SimulationWizard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/scenario/edit"
        element={
          <ProtectedRoute>
            <EditScenario />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
