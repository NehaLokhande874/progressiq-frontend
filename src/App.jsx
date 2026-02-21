import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Imports small letters madhe kele aahet (Match with your filenames)
import Login from './pages/login'; 
import Signup from './pages/signup'; 
import MentorDashboard from './pages/mentordashboard';
import MemberDashboard from './pages/memberdashboard'; 
import LeaderDashboard from './pages/leaderdashboard'; 
import LeaderTask from './pages/leadertask'; 
import MemberDetailView from './pages/memberdetailview';

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