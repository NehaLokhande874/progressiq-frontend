import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Match kelele exact filenames (Sidebar pramane)
import Login from './pages/Login'; 
import Signup from './pages/signup'; 
import MentorDashboard from './pages/MentorDashboard';
import MemberDashboard from './pages/MemberDashboard'; 
import LeaderDashboard from './pages/LeaderDashboard'; 
import LeaderTask from './pages/LeaderTask'; 
import MemberDetailView from './pages/MemberDetailView';

function App() {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Mentor & Leader Routes */}
        <Route path="/mentor-dashboard" element={<MentorDashboard />} />
        <Route path="/leader-dashboard" element={<LeaderDashboard />} />
        <Route path="/leader-tasks" element={<LeaderTask />} />
        
        {/* Dynamic Route */}
        <Route path="/member-details/:email" element={<MemberDetailView />} />

        {/* Member Route */}
        <Route path="/member-dashboard" element={<MemberDashboard />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;