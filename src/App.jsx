import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/AdminDashboard';
import LeaderDashboard from './pages/LeaderDashboard';
import LeaderTask from './pages/LeaderTask';
import MentorDashboard from './pages/MentorDashboard';
import MemberDashboard from './pages/MemberDashboard';
import MemberDetailView from './pages/MemberDetailView';

// ── Simple auth guard ──────────────────────────────────────────────────────
const ProtectedRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const role  = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(role)) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public */}
        <Route path="/"       element={<Navigate to="/login" replace />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Admin */}
        <Route path="/admin-dashboard" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        {/* Leader */}
        <Route path="/leader-dashboard" element={
          <ProtectedRoute allowedRoles={['leader']}>
            <LeaderDashboard />
          </ProtectedRoute>
        } />
        <Route path="/leader-tasks" element={
          <ProtectedRoute allowedRoles={['leader']}>
            <LeaderTask />
          </ProtectedRoute>
        } />

        {/* Mentor */}
        <Route path="/mentor-dashboard" element={
          <ProtectedRoute allowedRoles={['mentor']}>
            <MentorDashboard />
          </ProtectedRoute>
        } />

        {/* Member */}
        <Route path="/member-dashboard" element={
          <ProtectedRoute allowedRoles={['member']}>
            <MemberDashboard />
          </ProtectedRoute>
        } />

        {/* Shared */}
        <Route path="/member-details/:email" element={
          <ProtectedRoute allowedRoles={['admin','leader','mentor']}>
            <MemberDetailView />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;