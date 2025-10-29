import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { Dashboard } from './pages/Dashboard'
import { QuickAccess } from './pages/QuickAccess'
import { Settings } from './pages/Settings'
import { SimulationWizard } from './pages/SimulationWizard'
import { EditScenario } from './pages/EditScenario'
import { FacilitatorSimulation } from './pages/FacilitatorSimulation'
import { PrintableMaterials } from './pages/PrintableMaterials'
import { WaitingRoom } from './pages/WaitingRoom'
import { RoleReveal } from './pages/RoleReveal'
import { RoleBriefing } from './pages/RoleBriefing'
import { ParticipantDashboard } from './pages/ParticipantDashboard'
import { ParticipantRegistration } from './pages/ParticipantRegistration'
import { ProtectedRoute } from './components/ProtectedRoute'

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Navigate to="/login" replace />} />
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
        path="/simulation/edit/:runId"
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
      <Route
        path="/facilitator/simulation/:runId"
        element={
          <ProtectedRoute>
            <FacilitatorSimulation />
          </ProtectedRoute>
        }
      />
      <Route
        path="/facilitator/simulation/:runId/register"
        element={
          <ProtectedRoute>
            <ParticipantRegistration />
          </ProtectedRoute>
        }
      />
      <Route
        path="/simulation/:runId/print"
        element={
          <ProtectedRoute>
            <PrintableMaterials />
          </ProtectedRoute>
        }
      />
      <Route
        path="/waiting-room/:runId"
        element={
          <ProtectedRoute>
            <WaitingRoom />
          </ProtectedRoute>
        }
      />
      <Route
        path="/role-reveal/:runId"
        element={
          <ProtectedRoute>
            <RoleReveal />
          </ProtectedRoute>
        }
      />
      <Route
        path="/role-briefing/:runId"
        element={
          <ProtectedRoute>
            <RoleBriefing />
          </ProtectedRoute>
        }
      />
      <Route
        path="/participant-dashboard/:runId"
        element={
          <ProtectedRoute>
            <ParticipantDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/printable-materials/:runId/:roleId"
        element={
          <ProtectedRoute>
            <PrintableMaterials />
          </ProtectedRoute>
        }
      />

      {/* Catch-all redirect */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default App
