import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from './pages/Login'; 
import Signup from './pages/signup'; 
import MentorDashboard from './pages/MentorDashboard';
import MemberDashboard from './pages/MemberDashboard'; 
import LeaderDashboard from './pages/LeaderDashboard'; 
import LeaderTask from './pages/LeaderTask'; 
import MemberDetailView from './pages/MemberDetailView';
import AdminDashboard from './pages/AdminDashboard'; // Navin file import kara

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/mentor-dashboard" element={<MentorDashboard />} />
        <Route path="/leader-dashboard" element={<LeaderDashboard />} />
        <Route path="/leader-tasks" element={<LeaderTask />} />
        <Route path="/member-details/:email" element={<MemberDetailView />} />
        <Route path="/member-dashboard" element={<MemberDashboard />} />
        
        {/* ✅ Admin Route */}
        <Route path="/admin-dashboard" element={<AdminDashboard />} />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;